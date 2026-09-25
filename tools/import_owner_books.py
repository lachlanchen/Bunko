#!/usr/bin/env python3
"""Build reviewed owner editions from adjacent source repositories.

The source checkouts are read only. Run from Bunko; output goes to bunko-books.
"""
import hashlib
import json
import re
import shutil
import subprocess
import sys
import tempfile
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT.parent / 'bunko-books' / 'books'
DATE = '2026-09-25'


def dump(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()


def digest(value):
    return hashlib.sha256(value).hexdigest()


def make_cover(folder, source, original_design=False):
    if not source or not source.exists():
        return None, None
    from PIL import Image
    import io
    image = Image.open(source).convert('RGB')
    image.thumbnail((900, 1200))
    buffer = io.BytesIO()
    image.save(buffer, 'WEBP', quality=83, method=5)
    data = buffer.getvalue()
    name = f'cover-{digest(data)[:12]}.webp'
    (folder / name).write_bytes(data)
    return name, {'textFree': not original_design, 'originalDesign': original_design,
                  'basis': 'Author project cover artwork, adapted from the published source edition.',
                  'sourceAsset': str(source.relative_to(ROOT.parent))}


def publish(slug, title, langs, primary, category, author, chapters, source_repo, basis, cover=None, original_cover=False, license=None):
    folder = OUT / slug
    folder.mkdir(parents=True, exist_ok=True)
    rows = []
    total = 0
    paras = 0
    for i, (chapter_title, blocks, assets) in enumerate(chapters, 1):
        if not blocks:
            continue
        for path, source in assets.items():
            target = folder / path
            target.parent.mkdir(parents=True, exist_ok=True)
            from PIL import Image
            if source.suffix.lower() == '.svg':
                import io
                import cairosvg
                image = Image.open(io.BytesIO(cairosvg.svg2png(url=str(source)))).convert('RGB')
            else:
                image = Image.open(source).convert('RGB')
            image.thumbnail((1500, 1500))
            image.save(target, 'WEBP', quality=76, method=5)
        chapter = {'id': f'{slug}-c{i:03d}', 'n': i,
                   'title': {lang: [chapter_title.get(lang) or chapter_title[primary]] for lang in langs}, 'p': blocks}
        raw = dump(chapter)
        name = f'c{i:04d}-{digest(raw)[:12]}.json'
        (folder / name).write_bytes(raw)
        rows.append({'n': i, 'file': name, 'bytes': len(raw), 'paras': len(blocks),
                     'title': chapter_title, 'sha256': digest(raw)})
        total += len(raw)
        paras += len(blocks)
    cover_name, cover_rights = make_cover(folder, cover, original_cover)
    meta = {'schema': 1, 'id': slug, 'mode': 'owner-edition', 'langs': langs, 'primary': primary,
            'title': {lang: [title.get(lang) or title[primary]] for lang in langs},
            'titleText': title, 'author': {'name': author}, 'chapters': rows,
            'bytes': total, 'paras': paras, 'cat': category,
            'edition': 'multilingual' if len(langs) > 1 else 'original-only'}
    if cover_name:
        meta['cover'] = cover_name
    (folder / 'meta.json').write_bytes(dump(meta))
    rights = {'id': slug, 'status': 'ship', 'edition': meta['edition'], 'langs': langs,
              'basis': basis, 'references': [source_repo], 'checked': DATE}
    if cover_rights:
        rights['cover'] = cover_rights
    if license:
        rights['license'] = license
        rights['licenseFile'] = 'licenses/GPL-3.0.txt'
    (folder / 'rights.json').write_text(json.dumps(rights, ensure_ascii=False, indent=2) + '\n')
    print(slug, len(rows), paras, f'{total / 1e6:.1f} MB')


def travel():
    root = ROOT.parent / 'LazyTravel'
    for city, path in [('xian', 'china/cities/xian'), ('hakone', 'japan/prefectures/kanagawa/hakone'),
                       ('lanzhou', 'china/cities/lanzhou')]:
        doc = json.loads((root / 'data' / path / 'book.json').read_text())
        assets_by_id = {a['id']: a for a in doc['assets']}
        chapters = []
        for chapter in doc['chapters']:
            blocks, assets = [], {}
            for block in chapter['blocks']:
                unit = {'src': block['text']['en']}
                for lang in ('en', 'zh', 'ja'):
                    tokens = block.get('readings', {}).get(lang, {}).get('tokens')
                    if tokens and ''.join(t['text'] for t in tokens) == block['text'][lang]:
                        unit[lang] = [[t['text'], t['reading']] if t.get('reading') else t['text'] for t in tokens]
                    else:
                        unit[lang] = [block['text'][lang]]
                row = {'id': block['id'], 'src': block['text']['en'], 'u': [unit]}
                for asset_id in block.get('asset_ids', []):
                    asset = assets_by_id[asset_id]
                    candidate = root / (asset.get('variants', {}).get('web') or asset['path'])
                    if candidate.exists():
                        dest = f'assets/{asset_id}.webp'
                        assets[dest] = candidate
                        row['figure'] = {'path': dest, 'caption': asset.get('captions', {})}
                        row['kind'] = 'figure'
                        break
                blocks.append(row)
            chapters.append((chapter['titles'], blocks, assets))
        publish('travel-' + city, doc['book']['titles'], ['en', 'zh', 'ja'], 'en', 'travel',
                'LazyTravel · LazyingArt LLC', chapters,
                f'https://github.com/lachlanchen/LazyTravel/tree/main/data/{path}',
                'Original LazyingArt travel-guide text and generated illustrations; accepted multilingual edition with source and asset provenance in the source repository.',
                root / f'assets/images/{city}/{city}-cover-underlay.png')


def markdown_rich(markdown):
    parts = []
    for piece in re.split(r'(\$\$[\s\S]*?\$\$|(?<!\\)\$[^$\n]+(?<!\\)\$)', markdown):
        if not piece:
            continue
        if piece.startswith('$$') and piece.endswith('$$'):
            parts.append({'math': piece[2:-2].strip(), 'display': True})
        elif piece.startswith('$') and piece.endswith('$'):
            parts.append({'math': piece[1:-1].strip()})
        else:
            parts.append({'text': piece})
    return parts


def wealth_book():
    root = ROOT.parent / 'HowYouGotRich'
    manifest = json.loads((root / 'docs/data/web-edition.json').read_text())
    chapters = []
    for entry in manifest['entries']:
        path = root / 'multilingual/entries' / (Path(entry['output']).stem + '.json')
        doc = json.loads(path.read_text())
        blocks = []
        for block in doc['blocks']:
            unit = {'src': block['en']['markdown']}
            for lang in ('en', 'ja', 'zh'):
                layer = block[lang]
                rich = markdown_rich(layer['markdown'])
                tokens = layer.get('tokens', [])
                line = [[t.get('t', ''), t['r']] if t.get('r') else t.get('t', '') for t in tokens if t.get('t')]
                unit[lang] = line or [layer['markdown']]
                if any('math' in part for part in rich):
                    unit.setdefault('rich', {})[lang] = rich
            blocks.append({'id': block['id'], 'src': unit['src'], 'u': [unit],
                           'kind': 'heading' if block['kind'] == 'Header' else 'text'})
        chapters.append((doc['metadata']['title'], blocks, {}))
    publish('how-you-got-rich', {'en': 'How You Got Rich', 'ja': '豊かさをどう築いたか', 'zh': '你是如何富起来的'},
            ['en', 'ja', 'zh'], 'en', 'finance', 'LazyingArt LLC', chapters,
            'https://github.com/lachlanchen/HowYouGotRich/tree/main/multilingual/entries',
            'Author-owned V3 original book and reviewed Japanese and Chinese editions, supplied by the owner for Bunko.',
            root / 'assets/cover-page-1.png', True)


def pandoc_text(nodes):
    output = []
    for node in nodes:
        if not isinstance(node, dict):
            continue
        tag = node.get('t')
        value = node.get('c')
        if tag == 'Str': output.append(value)
        elif tag in ('Space', 'SoftBreak', 'LineBreak'): output.append(' ')
        elif tag == 'Math': output.append('$' + value[1] + '$')
        elif tag in ('Emph', 'Strong', 'Span', 'Link', 'Quoted'):
            nested = value[-1] if isinstance(value, list) and value and isinstance(value[-1], list) else value
            output.append(pandoc_text(nested if isinstance(nested, list) else []))
        elif tag == 'Code': output.append(value[-1])
    return ''.join(output).strip()


def pandoc_rich(nodes):
    parts = []
    for node in nodes:
        if not isinstance(node, dict):
            continue
        tag, value = node.get('t'), node.get('c')
        if tag == 'Math':
            tex = re.sub(r'\\label\{[^}]+\}', '', value[1]).strip()
            # KaTeX requires split in display mode and does not support TeX
            # inter-column @{...} spacing in array specifications.
            tex = re.sub(r'(@\{[^}]*\})', '', tex)
            parts.append({'math': tex, 'display': value[0]['t'] == 'DisplayMath' or '\\begin{split}' in tex})
        elif tag == 'Str': parts.append({'text': value})
        elif tag in ('Space', 'SoftBreak', 'LineBreak'): parts.append({'text': ' '})
        elif tag in ('Emph', 'Strong', 'Span', 'Link', 'Quoted'):
            nested = value[-1] if isinstance(value, list) and value and isinstance(value[-1], list) else value
            parts.extend(pandoc_rich(nested if isinstance(nested, list) else []))
        elif tag == 'Code': parts.append({'text': value[-1]})
    return parts


def tex_blocks(source, figure_root=None):
    doc = json.loads(subprocess.check_output(['pandoc', '-f', 'latex', '-t', 'json', str(source)]))
    blocks, assets = [], {}
    def add(nodes, kind='text'):
        rich = pandoc_rich(nodes)
        if not rich: return
        plain = ''.join(item['text'] if 'text' in item else '$' + item['math'] + '$' for item in rich).strip()
        if not plain: return
        if re.fullmatch(r'\[(?:fig|eq|sec|tab):[^\]]+\]', plain): return
        unit = {'src': plain, 'en': [plain]}
        if any('math' in item for item in rich): unit['rich'] = {'en': rich}
        blocks.append({'id': f'b{len(blocks)+1:04d}', 'src': plain, 'kind': kind, 'u': [unit]})
    def walk(items):
        for block in items:
            tag, value = block['t'], block.get('c')
            if tag in ('Para', 'Plain'):
                images = [n for n in value if isinstance(n, dict) and n.get('t') == 'Image']
                if images and figure_root:
                    for image in images:
                        path = Path(image['c'][2][0]).name
                        candidate = figure_root / path
                        if candidate.exists():
                            dest = f'assets/{Path(path).stem}.webp'
                            assets[dest] = candidate
                            caption = pandoc_text(image['c'][1])
                            add([{'t': 'Str', 'c': caption or 'Figure'}], 'figure')
                            blocks[-1]['figure'] = {'path': dest, 'caption': {'en': caption}}
                            # The image and its figcaption already present this text.
                            # Retain a passage anchor without printing the caption twice.
                            blocks[-1]['u'][0]['en'] = ['']
                else:
                    meaningful = [n for n in value if isinstance(n, dict) and n.get('t') not in ('Space', 'SoftBreak', 'LineBreak')]
                    standalone = bool(meaningful) and all(n.get('t') == 'Math' and n['c'][0]['t'] == 'DisplayMath' for n in meaningful)
                    add(value, 'equation' if standalone else 'text')
            elif tag == 'Header': add(value[2], 'heading')
            elif tag == 'Div': walk(value[1])
            elif tag == 'BlockQuote': walk(value)
            elif tag in ('BulletList', 'OrderedList'):
                for item in (value if tag == 'BulletList' else value[1]): walk(item)
    walk(doc['blocks'])
    return blocks, assets


def physics_and_learning():
    root = ROOT.parent / 'leonardsusskind' / 'generated_course_notes' / 'core'
    courses = [
        ('classical-mechanics', 'classical_mechanics/2011_fall_theoretical_minimum', 'Classical Mechanics', 'classical_mechanics_theoretical_minimum.png'),
        ('quantum-mechanics', 'quantum_mechanics/2012_winter_theoretical_minimum_alt_title', 'Quantum Mechanics', 'quantum_mechanics_theoretical_minimum.png'),
        ('special-relativity', 'special_relativity/2012_spring_theoretical_minimum', 'Special Relativity', 'special_relativity_theoretical_minimum.png'),
        ('general-relativity', 'general_relativity/2012_fall_theoretical_minimum', 'General Relativity', 'general_relativity_theoretical_minimum.png'),
        ('statistical-mechanics', 'statistical_mechanics/2013_spring_theoretical_minimum', 'Statistical Mechanics', 'statistical_mechanics_theoretical_minimum_first_page.png'),
        ('cosmology', 'cosmology/2013_winter_theoretical_minimum', 'Cosmology', 'cosmology_theoretical_minimum_first_page.png'),
    ]
    for short, location, title, cover_file in courses:
        path = root / location
        chapters = []
        for source in sorted((path / 'chapters').glob('lecture_*/content.tex')):
            blocks, assets = tex_blocks(source, path / 'figures')
            heading = next((b['src'] for b in blocks if b['kind'] == 'heading'), source.parent.name.replace('_', ' ').title())
            chapters.append(({'en': heading}, blocks, assets))
        publish('physics-' + short, {'en': title + ' · Theoretical Minimum'}, ['en'], 'en', 'physics',
                'LazyingArt LLC · companion notes to Leonard Susskind lectures', chapters,
                f'https://github.com/lachlanchen/leonardsusskind/tree/main/generated_course_notes/core/{location}',
                'Independent edited AI-assisted companion notes by the owner, adapted from public lectures; not a transcript, Susskind manuscript or endorsed edition. Original source repo is GPL-3.0; preserve attribution and GPL terms.',
                ROOT.parent / 'leonardsusskind' / 'figs/readme-covers' / cover_file, True, 'GPL-3.0-only')
    path = ROOT.parent / 'LazyLearn' / 'generated_course_notes/lazylearn/how-you-speak-and-write'
    chapters = []
    for source in sorted((path / 'chapters').glob('*/content.tex')):
        blocks, assets = tex_blocks(source, path / 'figures')
        heading = next((b['src'] for b in blocks if b['kind'] == 'heading'), source.parent.name)
        chapters.append(({'en': heading}, blocks, assets))
    publish('learning-speak-and-write', {'en': 'How to Speak and Write'}, ['en'], 'en', 'learning',
            'LazyingArt LLC · companion notes', chapters,
            'https://github.com/lachlanchen/LazyLearn/tree/main/generated_course_notes/lazylearn/how-you-speak-and-write',
            'Owner-authored edited learning notes, supplied by the owner for Bunko. This is a companion edition, not a verbatim lecture transcript.',
            path / 'how-to-speak-and-write/assets/cover-art.png')


def finance_notes():
    root = ROOT.parent / 'LazyEarn'
    source = root / 'investment_pdfs/wealth-from-first-principles/wealth-from-first-principles.tex'
    blocks, assets = tex_blocks(source)
    # Split at chapter headings so the large book remains quick to download.
    chapters = []
    current, title = [], 'Introduction'
    for block in blocks:
        if block['kind'] == 'heading' and current:
            chapters.append(({'en': title}, current, {}))
            current, title = [], block['src']
        current.append(block)
    if current: chapters.append(({'en': title}, current, assets))
    publish('finance-wealth-first-principles', {'en': 'Wealth From First Principles'}, ['en'], 'en',
            'finance', 'LazyingArt LLC', chapters,
            'https://github.com/lachlanchen/LazyEarn/tree/main/investment_pdfs/wealth-from-first-principles',
            'Original LazyingArt LLC field guide, supplied by the owner for Bunko.',
            root / 'docs/publications/wealth-from-first-principles/cover-art.png')


def chapter_sources(path):
    """Read the edited chapter manuscripts, never the raw transcripts."""
    chapters = []
    for source in sorted((path / 'chapters').glob('*/content.tex')):
        blocks, assets = tex_blocks(source, path / 'figures')
        heading = next((b['src'] for b in blocks if b['kind'] == 'heading'),
                       source.parent.name.replace('_', ' ').title())
        chapters.append(({'en': heading}, blocks, assets))
    if not chapters:
        raise ValueError(f'No edited chapters: {path}')
    return chapters


def split_long_tex(source, figure_root=None):
    """Keep the author's chapter structure when a book uses one TeX file."""
    manuscript = source.read_text()
    sections = re.split(r'(?=\\chapter\{)', manuscript)
    chapters = []
    with tempfile.TemporaryDirectory(prefix='bunko-tex-') as scratch:
        temp = Path(scratch) / 'chapter.tex'
        for section in sections[1:]:
            temp.write_text(section.split('\\end{document}', 1)[0])
            blocks, assets = tex_blocks(temp, figure_root)
            if blocks:
                title = next((b['src'] for b in blocks if b['kind'] == 'heading'), 'Chapter')
                chapters.append(({'en': title}, blocks, assets))
    if not chapters:
        raise ValueError(f'Empty manuscript: {source}')
    return chapters


def remaining_physics():
    root = ROOT.parent / 'leonardsusskind'
    specs = [
        ('core', 'classical_mechanics/2011_fall_modern_physics_stanford_partial', 'classical-mechanics-stanford', 'Classical Mechanics · Stanford Partial Run', 'classical_mechanics_stanford_partial.png'),
        ('core', 'quantum_mechanics/2012_winter_modern_physics_stanford', 'quantum-mechanics-stanford', 'Quantum Mechanics · Stanford Modern Physics', 'quantum_mechanics_modern_physics_stanford_first_page.png'),
        ('core', 'general_relativity/2008_fall_einsteins_general_theory_of_relativity', 'general-relativity-2008', 'General Relativity · Einstein 2008', 'general_relativity_2008_fall_einsteins_general_theory_of_relativity_first_page.png'),
        ('core', 'cosmology/2009_winter_legacy_cosmology', 'cosmology-legacy', 'Cosmology · Legacy Course', 'cosmology_legacy.png'),
        ('supplementary', 'advanced_quantum_mechanics/2013_fall', 'advanced-quantum-mechanics', 'Advanced Quantum Mechanics · Supplementary', 'advanced_quantum_mechanics.png'),
        ('supplementary', 'particle_physics_1_basic_concepts/2009_fall', 'particle-physics-1', 'Particle Physics 1 · Basic Concepts', 'particle_physics_1_basic_concepts.png'),
        ('supplementary', 'particle_physics_2_standard_model/2010_winter', 'particle-physics-2', 'Particle Physics 2 · Standard Model', 'particle_physics_2_standard_model.png'),
        ('supplementary', 'particle_physics_3_supersymmetry_and_grand_unification/2010_spring', 'particle-physics-3', 'Particle Physics 3 · Supersymmetry', 'particle_physics_3_supersymmetry_and_grand_unification.png'),
        ('supplementary', 'quantum_entanglement/2006_fall_part_1', 'quantum-entanglement-1', 'Quantum Entanglement · Part 1', 'quantum_entanglement_part_1.png'),
        ('supplementary', 'quantum_entanglement/2006_fall_part_3', 'quantum-entanglement-3', 'Quantum Entanglement · Part 3', 'quantum_entanglement_part_3.png'),
        ('supplementary', 'cosmology_and_black_holes/2011_winter_topics_in_string_theory', 'cosmology-and-black-holes', 'Topics in String Theory · Cosmology and Black Holes', 'topics_in_string_theory.png'),
        ('supplementary', 'string_theory/2010_fall_string_theory_and_m_theory', 'string-theory-and-m-theory', 'String Theory and M-Theory · Supplementary', 'string_theory_and_m_theory.png'),
        ('supplementary', 'higgs_boson/2012_summer', 'higgs-boson', 'Demystifying the Higgs Boson', 'demystifying_the_higgs_boson.png'),
    ]
    for shelf, location, slug, title, cover in specs:
        path = root / 'generated_course_notes' / shelf / location
        publish('physics-' + slug, {'en': title}, ['en'], 'en', 'physics',
                'LazyingArt LLC · companion notes to Leonard Susskind lectures',
                chapter_sources(path),
                f'https://github.com/lachlanchen/leonardsusskind/tree/main/generated_course_notes/{shelf}/{location}',
                'Independent edited AI-assisted companion notes by the owner, adapted from public lectures; not a transcript, Susskind manuscript or endorsed edition. Source repo GPL-3.0.',
                root / 'figs/readme-covers' / cover, True, 'GPL-3.0-only')


def remaining_learning():
    root = ROOT.parent / 'LazyLearn'
    path = root / 'generated_course_notes/lazylearn/justice-with-michael-sandel'
    publish('learning-justice-sandel', {'en': 'Justice with Michael Sandel'}, ['en'],
            'en', 'learning', 'LazyingArt LLC · companion notes', chapter_sources(path),
            'https://github.com/lachlanchen/LazyLearn/tree/main/generated_course_notes/lazylearn/justice-with-michael-sandel',
            'Owner-edited course companion notes based on the published Justice lectures; not an original Sandel book or endorsed edition.',
            root / 'docs/justice-with-michael-sandel-cover.png', True)


def remaining_earn():
    root = ROOT.parent / 'LazyEarn'
    base = root / 'generated_course_notes/lazyearn'
    specs = [
        ('earn-happiness', 'How You Got Happiness?', 'jiddu-krishnamurti/how-you-got-happiness', 'how-you-got-happiness', 'J. Krishnamurti lectures'),
        ('earn-millionaire-questions', '10 Questions With a Millionaire', 'school-of-hard-knocks/10-questions-with-a-millionaire', '10-questions-with-a-millionaire', 'School of Hard Knocks interviews'),
        ('earn-yale-financial-markets', 'Yale Financial Markets Notes', 'yale-financial-markets', 'yale-financial-markets', 'Robert J. Shiller lectures'),
        ('earn-mit-new-ventures', 'MIT Nuts and Bolts of New Ventures', 'mit-nuts-and-bolts-of-new-ventures', 'mit-nuts-and-bolts-of-new-ventures', 'Joseph Hadzima lectures'),
        ('earn-entrepreneurship', 'Entrepreneurship', 'school-of-hard-knocks/entrepreneurship', 'entrepreneurship', 'School of Hard Knocks interviews'),
        ('earn-wealth-freedom', 'The Way to Wealth Freedom', 'the-way-to-wealth-freedom-notes', 'the-way-to-wealth-freedom-notes', 'owner source notes'),
    ]
    for slug, title, location, cover, subject in specs:
        path = base / location
        publish(slug, {'en': title}, ['en'], 'en', 'finance',
                'LazyingArt LLC · edited study notes', chapter_sources(path),
                f'https://github.com/lachlanchen/LazyEarn/tree/main/generated_course_notes/lazyearn/{location}',
                f'Owner-edited companion notes based on {subject}; not a transcript or an endorsed edition. Interview claims are source claims, not independently verified financial advice.',
                root / 'docs/publications' / cover / 'cover-page-1.png', True)
    source = base / 'school-of-hard-knocks/entrepreneurship/dynamic_book/how-you-build-a-business.tex'
    publish('earn-build-a-business', {'en': 'How You Build a Business?'}, ['en'],
            'en', 'finance', 'LazyingArt LLC', split_long_tex(source),
            'https://github.com/lachlanchen/LazyEarn/tree/main/generated_course_notes/lazyearn/school-of-hard-knocks/entrepreneurship/dynamic_book',
            'Owner-curated thematic synthesis from the interview corpus; interview claims remain attributed source claims, not independently verified financial advice.',
            root / 'docs/publications/how-you-build-a-business/cover-art.png', True)


if __name__ == '__main__':
    if sys.argv[1:] == ['remaining']:
        remaining_physics()
        remaining_learning()
        remaining_earn()
    else:
        travel()
        wealth_book()
        physics_and_learning()
        finance_notes()
