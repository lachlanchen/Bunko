#!/usr/bin/env python3
"""Add reviewed JA/ZH layers to existing Bunko physics books, without LLM calls."""
import argparse
from collections import Counter
from copy import deepcopy
import hashlib
import json
from pathlib import Path
import sys
import re
import tempfile
import subprocess
from pylatexenc.latex2text import LatexNodes2Text

import import_owner_books as owner

ROOT = Path(__file__).resolve().parents[1]
SOURCE = ROOT.parent / 'leonardsusskind'
DEST = ROOT.parent / 'bunko-books'
sys.path.insert(0, str(SOURCE / 'scripts'))
import polished_translation as translation

NOTICES = {
    'en': 'Sixteen final polished physics companion books now include aligned **English, 日本語 and 中文**. Equations, tables, figures and introductory paragraphs are retained. Select the languages in Bunko; the app downloads the updated chapters without a new installation. These are AI-assisted community editions, not lecturer-endorsed translations.',
    'ja': '最終推敲済みの物理講義補助書16冊に、対応する**English・日本語・中文**の本文を収録しました。数式、表、図、導入段落を保持しています。Bunkoで言語を選ぶと更新済みの章を取得でき、アプリの再インストールは不要です。AI支援によるコミュニティ版であり、原講師が公認した翻訳ではありません。',
    'zh-Hans': '16册最终润色的物理讲义辅助书现已提供对齐的**English、日本語和中文**。保留公式、表格、图版及导入段落。在Bunko中选择语言即可下载更新后的章节，无需重新安装应用。这些是AI辅助制作的社区版本，并非原讲师认可的译本。',
    'zh-Hant': '16冊最終潤色的物理講義輔助書現已提供對齊的**English、日本語和中文**。保留公式、表格、圖版及導入段落。在Bunko中選擇語言即可下載更新後的章節，無需重新安裝應用。這些是AI輔助製作的社群版本，並非原講師認可的譯本。',
    'de': 'Sechzehn abschließend redigierte Physik-Begleitbücher bieten jetzt ausgerichtete Texte auf **English, 日本語 und 中文**. Formeln, Tabellen, Abbildungen und Einleitungen bleiben erhalten. Die Sprachauswahl in Bunko lädt aktualisierte Kapitel ohne Neuinstallation. Dies sind KI-unterstützte Community-Ausgaben, keine vom Dozenten anerkannten Übersetzungen.',
    'es': 'Dieciséis libros complementarios de física revisados ofrecen textos alineados en **English, 日本語 y 中文**. Se conservan ecuaciones, tablas, figuras e introducciones. Selecciona idiomas en Bunko para descargar los capítulos actualizados sin reinstalar la aplicación. Son ediciones comunitarias asistidas por IA, no traducciones avaladas por el profesor.',
    'fr': 'Seize livres complémentaires de physique révisés proposent des textes alignés en **English, 日本語 et 中文**. Équations, tableaux, figures et introductions sont conservés. Choisissez les langues dans Bunko pour télécharger les chapitres mis à jour sans réinstaller l’application. Ces éditions communautaires assistées par IA ne sont pas des traductions approuvées par le professeur.',
    'ko': '최종 교정된 물리학 강의 보조서 16권에 정렬된 **English·日本語·中文** 본문을 제공합니다. 수식, 표, 그림과 도입 단락을 보존했습니다. Bunko에서 언어를 선택하면 재설치 없이 갱신된 장을 받을 수 있습니다. AI 지원 커뮤니티 판본이며 강사가 공인한 번역은 아닙니다.',
    'ru': 'Шестнадцать отредактированных пособий по физике теперь содержат выровненные тексты на **English, 日本語 и 中文**. Сохранены формулы, таблицы, рисунки и вводные абзацы. Выберите языки в Bunko: главы обновляются без переустановки. Это издания сообщества с помощью ИИ, не переводы, одобренные лектором.',
    'vi': 'Mười sáu sách đồng hành vật lý đã hiệu đính có văn bản đối chiếu **English, 日本語 và 中文**. Giữ nguyên công thức, bảng, hình và đoạn dẫn nhập. Chọn ngôn ngữ trong Bunko để tải chương cập nhật mà không cần cài lại ứng dụng. Đây là bản cộng đồng có AI hỗ trợ, không phải bản dịch được giảng viên phê duyệt.',
    'ar': 'تضم ستة عشر كتاباً مساعداً منقحاً في الفيزياء نصوصاً متقابلة باللغات **English و日本語 و中文**، مع حفظ المعادلات والجداول والرسوم والمقدمات. اختر اللغات في Bunko لتنزيل الفصول المحدثة دون إعادة تثبيت التطبيق. هذه طبعات مجتمعية بمساعدة الذكاء الاصطناعي، وليست ترجمات معتمدة من المحاضر.',
}


def update_notice():
    for path in [DEST / 'README.md', *sorted((DEST / 'i18n').glob('README.*.md'))]:
        locale = 'en' if path.parent == DEST else path.name[7:-3]
        text = re.sub(r'\n*<!-- polished-physics:start -->.*?<!-- polished-physics:end -->\n*', '\n\n', path.read_text(), flags=re.S)
        block = ('\n<!-- polished-physics:start -->\n' + NOTICES[locale]
                 + '\n\n[English · 日本語 · 中文](https://github.com/lachlanchen/leonardsusskind#read-in-english-japanese-and-chinese)\n<!-- polished-physics:end -->\n')
        text = re.sub(r'(^# [^\n]+\n)', lambda m: m[0] + block, text, count=1, flags=re.M)
        path.write_text(text)


def read(path):
    return json.loads(path.read_text())


def math_inventory(block):
    return Counter(part['math'] for unit in block['u'] for part in unit.get('rich', {}).get('en', [])
                   if 'math' in part and not part['math'].startswith(r'\begin{array}'))


def align(layers):
    """Same source AST must yield the same ordered blocks, figures and math."""
    original = layers['en']
    for lang in ('ja', 'zh'):
        target = layers[lang]
        if len(target) != len(original):
            raise ValueError(f'{lang}: block count mismatch {len(target)}/{len(original)}')
        for index, (a, b) in enumerate(zip(original, target)):
            if a['kind'] != b['kind'] or math_inventory(a) != math_inventory(b):
                raise ValueError(f'{lang}: structural/math alignment mismatch at block {index}')
            if a.get('figure', {}).get('path') != b.get('figure', {}).get('path'):
                raise ValueError(f'{lang}: figure alignment mismatch at block {index}')
    merged = deepcopy(original)
    for index, block in enumerate(merged):
        for lang in ('ja', 'zh'):
            other = layers[lang][index]
            if len(block['u']) != len(other['u']):
                raise ValueError('Unit count mismatch')
            for unit, target in zip(block['u'], other['u']):
                unit[lang] = target['en']
                if target.get('rich'):
                    unit.setdefault('rich', {})[lang] = target['rich']['en']
            if 'figure' in block:
                block['figure']['caption'][lang] = other['figure']['caption']['en']
    return merged


def reconcile_source_groups(layers):
    """Only coalesce inside the same source-bound chunk, never by text similarity."""
    from collections import OrderedDict
    grouped = {}
    for lang, blocks in layers.items():
        grouped[lang] = OrderedDict()
        for block in blocks:
            key = block.pop('_sourceSegment', None)
            grouped[lang].setdefault(key, []).append(block)
    if any(list(groups) != list(grouped['en']) for groups in grouped.values()):
        raise ValueError('Source segment boundary mismatch')
    output = {lang: [] for lang in layers}
    for key in grouped['en']:
        pieces = {lang: groups[key] for lang, groups in grouped.items()}
        if any([(b['kind'], math_inventory(b)) for b in rows] !=
               [(b['kind'], math_inventory(b)) for b in pieces['en']] for rows in pieces.values()):
            # Layout macros can finish a sentence before Japanese trailing prose.
            # Coalesce adjacent prose within this exact source segment only.
            for lang, rows in pieces.items():
                joined = []
                for block in rows:
                    if joined and block['kind'] in {'text', 'equation'} and joined[-1]['kind'] in {'text', 'equation'}:
                        previous = joined[-1]
                        a, b = previous['u'][0], block['u'][0]
                        rich = a.get('rich', {}).get('en', [{'text': a['src']}]) + [{'text': ' '}] + b.get('rich', {}).get('en', [{'text': b['src']}])
                        previous['src'] += ' ' + block['src']
                        previous['kind'] = 'text'
                        a.update(src=previous['src'], en=[previous['src']], rich={'en': rich})
                    else:
                        joined.append(deepcopy(block))
                pieces[lang] = joined
        try:
            align(pieces)
        except ValueError as exc:
            raise ValueError(f'{key}: {exc}; kinds: ' + str({lang: [b['kind'] for b in rows] for lang, rows in pieces.items()})) from exc
        for lang, rows in pieces.items():
            output[lang].extend(rows)
    return output


def frontmatter(book, original):
    """Retain translated provenance without renumbering existing reader chapters."""
    prepared = translation.read(translation.WORK / 'prepared' / book['id'] / 'course.tex.json')
    layers = {}
    for lang in ('en', 'ja', 'zh'):
        accepted = translation.load_results(book, lang, 'course.tex', prepared)['accepted'] if lang != 'en' else {}
        pieces = []
        for i, part in enumerate(prepared['parts']):
            if translation.needs_translation(part):
                pieces.append(f'BUNKOUNIT{i:06d}TOKEN\n' + (part if lang == 'en' else accepted[str(i)]))
        text = translation.restore('\n\n'.join(pieces), prepared['protected'])
        nodes, _, _ = translation.lw.LatexWalker(text).get_latex_nodes()
        end = next((node.pos for node in nodes if isinstance(node, translation.lw.LatexMacroNode)
                    and node.macroname in {'tableofcontents', 'mainmatter'}), len(text))
        text = text[:end]
        with tempfile.TemporaryDirectory(prefix='bunko-frontmatter-') as temp:
            path = Path(temp) / 'frontmatter.tex'
            path.write_text(text)
            blocks, figures = owner.tex_blocks(path, origin=original / 'course.tex', strict=True, language=lang)
        if figures:
            raise ValueError('Unexpected front-matter figure needs explicit handling')
        expected = {f'BUNKOUNIT{i:06d}TOKEN' for i, part in enumerate(prepared['parts']) if translation.needs_translation(part)}
        if expected != {b.get('_sourceSegment') for b in blocks} - {None}:
            raise ValueError('Missing front-matter segment')
        layers[lang] = blocks
    return reconcile_source_groups(layers)


def bundle(book, dry_run=False, preflight=False):
    if preflight and not dry_run:
        raise ValueError('Text preflight cannot publish')
    for lang in translation.LANGS:
        if not translation.language_complete(book, lang):
            raise ValueError(f'{book["id"]}/{lang}: incomplete translation')
        if not preflight and not translation.validated_output(book, lang):
            raise ValueError(f'{book["id"]}/{lang}: final PDF/text quality gate not passed')
    translation.verify_sources(book)
    original = SOURCE / 'generated_course_notes' / book['course']
    suffix = '/generated_course_notes/' + book['course']
    candidates = [path.parent for path in (DEST / 'books').glob('physics-*/rights.json')
                  if any(ref.endswith(suffix) for ref in read(path).get('references', []))]
    if len(candidates) != 1:
        raise ValueError(f'Expected one existing Bunko identity for {suffix}, got {candidates}')
    folder = candidates[0]
    old_meta, rights = read(folder / 'meta.json'), read(folder / 'rights.json')
    chapters, evidence = [], []
    intro = frontmatter(book, original)
    for number, rel in enumerate((p for p in book['source_files'] if p.endswith('content.tex')), 1):
        layers, assets = {}, None
        titles = {}
        for lang in ('en', 'ja', 'zh'):
            source = original / rel if lang == 'en' else SOURCE / 'translations' / book['id'] / lang / rel
            prepared = translation.read(translation.WORK / 'prepared' / book['id'] / (rel + '.json'))
            if lang != 'en':
                result = translation.load_results(book, lang, rel, prepared)
            parts = []
            for i, part in enumerate(prepared['parts']):
                if translation.needs_translation(part):
                    parts.append(f'BUNKOUNIT{i:06d}TOKEN\n')
                    parts.append(part if lang == 'en' else re.sub(r'\n\s*\n', '\n', result['accepted'][str(i)]))
                else:
                    parts.append(part)
            text = translation.restore_layout_arguments((original / rel).read_text(), translation.restore(''.join(parts), prepared['protected']))
            with tempfile.TemporaryDirectory(prefix='bunko-polished-') as temp:
                source = Path(temp) / 'chapter.tex'
                source.write_text(text)
                blocks, figures = owner.tex_blocks(source, original / 'figures', origin=original / rel,
                                                   strict=True, language=lang)
            expected = {f'BUNKOUNIT{i:06d}TOKEN' for i, part in enumerate(prepared['parts'])
                        if translation.needs_translation(part)}
            recovered = {block.get('_sourceSegment') for block in blocks} - {None}
            if expected != recovered:
                raise ValueError(f'{book["id"]}/{rel}/{lang}: missing source segments: '
                                 f'{sorted(expected - recovered)}; unexpected: {sorted(recovered - expected)}')
            if assets is not None and assets != figures:
                raise ValueError('Translated edition changed figure assets')
            assets = figures
            title = next(b['src'] for b in blocks if b['kind'] == 'heading')
            titles[lang] = LatexNodes2Text().latex_to_text(title)
            layers[lang] = blocks
        layers = reconcile_source_groups(layers)
        if number == 1:
            for lang in layers:
                layers[lang] = intro[lang] + layers[lang]
        for lang, blocks in layers.items():
            for index, block in enumerate(blocks, 1):
                block['id'] = f'b{index:04d}'
        previous_row = next(r for r in old_meta['chapters'] if r['n'] == number)
        previous = read(folder / previous_row['file'])['p']
        # Match existing English content before adding languages. Unchanged passages
        # retain their IDs; newly recovered overview/notes receive distinct IDs.
        owner.preserve_passage_ids(layers['en'], previous)
        merged = align(layers)
        evidence.append({'source': rel, 'paragraphs': len(merged),
                         'figures': sum('figure' in b for b in merged),
                         'retainedPassageIds': len({b['id'] for b in merged} & {b['id'] for b in previous})})
        chapters.append((titles, merged, assets))
    math_rows = [{**part, 'location': f'{number}/{block["id"]}/{lang}'}
                 for number, (_, blocks, _) in enumerate(chapters, 1)
                 for block in blocks for unit in block['u']
                 for lang, parts in unit.get('rich', {}).items() for part in parts if 'math' in part]
    check = subprocess.run(['node', str(ROOT / 'tools/check_polished_math.mjs')],
                           input=json.dumps(math_rows), capture_output=True, text=True, timeout=120)
    if check.returncode:
        raise ValueError('Reader math validation failed: ' + (check.stdout or check.stderr)[:6000])
    report = {'id': folder.name, 'sourceEdition': book['id'], 'languages': ['en', 'ja', 'zh'],
              'mathExpressionsChecked': len(math_rows),
              'chapters': evidence, 'sourceHashes': book['source_files'],
              'translationQuality': {lang: hashlib.sha256((SOURCE / 'translations' / book['id'] / lang / 'quality.json').read_bytes()).hexdigest()
                                     for lang in ('ja', 'zh')}}
    if not dry_run:
        cover = ROOT.parent / rights['cover']['sourceAsset']
        owner.publish(folder.name, book['titles'], ['en', 'ja', 'zh'], 'en', 'physics',
                      old_meta['author']['name'], chapters, rights['references'][0],
                      rights['basis'].split(' Japanese and Simplified Chinese are complete AI-assisted translations')[0]
                      + ' Japanese and Simplified Chinese are complete AI-assisted translations of the final edited TeX, with deterministic protection and sampled semantic review. Figures retain source labels.',
                      cover, True, rights.get('license'), aligned_ids=True)
        new_rights = read(folder / 'rights.json')
        new_rights['checked'] = '2026-10-12'
        new_rights['references'] = list(dict.fromkeys(rights['references'] + [
            'https://github.com/lachlanchen/leonardsusskind/tree/main/translations/' + book['id']]))
        (folder / 'rights.json').write_text(json.dumps(new_rights, ensure_ascii=False, indent=2) + '\n')
        (folder / 'translation-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2) + '\n')
    return report


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--book')
    parser.add_argument('--dry-run', action='store_true')
    parser.add_argument('--preflight', action='store_true', help='Read-only content checks while PDFs rebuild; cannot publish')
    args = parser.parse_args()
    books = read(SOURCE / 'references/polished_translation_queue.json')['books']
    if args.book:
        books = [b for b in books if b['id'] == args.book]
        if not books:
            parser.error('Unknown book id')
    for book in books:
        report = bundle(book, args.dry_run or args.preflight, args.preflight)
        print(json.dumps({'book': report['id'], 'chapters': len(report['chapters']),
                          'blocks': sum(c['paragraphs'] for c in report['chapters']),
                          'figures': sum(c['figures'] for c in report['chapters'])}), flush=True)
    if not (args.book or args.dry_run or args.preflight):
        update_notice()


if __name__ == '__main__':
    main()
