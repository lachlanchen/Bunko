#!/usr/bin/env python3
"""Import complete, attributed editions into the existing schema-1 library.

Source downloads stay in an ignored cache; no payloads belong in this repo.
The adjacent ZhJpBook checkout is read only and only supplies optional ruby.
"""
import argparse
from collections import OrderedDict
from difflib import SequenceMatcher
import hashlib
import io
import json
from pathlib import Path
import re
import sqlite3
import urllib.request
import xml.etree.ElementTree as ET
import zipfile

from book_source import chapters

ROOT = Path(__file__).resolve().parents[1]
DATE = '2026-09-30'
CANON = '''GEN EXO LEV NUM DEU JOS JDG RUT 1SA 2SA 1KI 2KI 1CH 2CH EZR
NEH EST JOB PSA PRO ECC SNG ISA JER LAM EZK DAN HOS JOL AMO OBA JON MIC
NAM HAB ZEP HAG ZEC MAL MAT MRK LUK JHN ACT ROM 1CO 2CO GAL EPH PHP COL
1TH 2TH 1TI 2TI TIT PHM HEB JAS 1PE 2PE 1JN 2JN 3JN JUD REV'''.split()
TRANSLATIONS = {'en': 'english_rwwad', 'zh': 'chinese_makin', 'ja': 'japanese_saeedsato'}
WEB_URL = 'https://ebible.org/Scriptures/engwebp_usfx.zip'
ARABIC_URL = 'https://tanzil.net/pub/download/index.php?quranType=uthmani&outType=txt-2&marks=true&sajdah=true&alef=true&tatweel=true&agree=true'


def encode(value):
    return json.dumps(value, ensure_ascii=False, separators=(',', ':')).encode()


def sha(value):
    return hashlib.sha256(value).hexdigest()


def plain(line):
    return ''.join(t if isinstance(t, str) else t[0] for t in line)


def download(url, dest):
    request = urllib.request.Request(url, headers={'User-Agent': 'Bunko-library/1.0'})
    with urllib.request.urlopen(request, timeout=60) as response:
        value = response.read(40_000_001)
    if len(value) > 40_000_000:
        raise ValueError('Unexpected download size')
    dest.write_bytes(value)


def fetch(cache):
    cache.mkdir(parents=True, exist_ok=True)
    for key in ['engwebp', 'cmn-cu89t', 'jpnm']:
        download(f'https://ebible.org/Scriptures/{key}_usfx.zip', cache / f'{key}_usfx.zip')
    download(ARABIC_URL, cache / 'quran-uthmani.txt')
    download('https://ebible.org/Scriptures/engwebp_vpl.zip', cache / 'engwebp_vpl.zip')
    for lang, key in TRANSLATIONS.items():
        download(f'https://quranenc.com/api/v1/translations/list/{lang}', cache / f'quran-list-{lang}.json')
        download(f'https://quranenc.com/downloads/sqlite/{key}.sqlite', cache / f'{key}.sqlite')


def exact_ruby(text, tokens):
    """Carry readings only across unchanged spans; never alter publisher text."""
    old = ''.join(t.get('t', '') for t in tokens)
    spans = SequenceMatcher(None, old, text, autojunk=False).get_matching_blocks()
    readings, offset = [], 0
    for token in tokens:
        value, reading = token.get('t', ''), token.get('r', '')
        if value and reading:
            for block in spans:
                if block.a <= offset and offset + len(value) <= block.a + block.size:
                    readings.append((block.b + offset - block.a, value, reading))
                    break
        offset += len(value)
    line, cursor = [], 0
    for start, value, reading in sorted(readings):
        if start > cursor:
            line.append(text[cursor:start])
        line.append([value, reading])
        cursor = start + len(value)
    if cursor < len(text):
        line.append(text[cursor:])
    if plain(line) != text or not text:
        raise ValueError('Text integrity failed')
    return line


def paragraph(id_, lines, annotation=False):
    unit = {**lines, 'src': '' if annotation else plain(lines.get('en', next(iter(lines.values()))))}
    if annotation:
        unit['annotation'] = True
    return {'id': id_, 'src': unit['src'], 'u': [unit]}


def heading_text(node):
    text, notes = [], []

    def walk(part):
        if part.text:
            text.append(part.text)
        for child in part:
            if child.tag in {'f', 'x'}:
                notes.append(re.sub(r'\s+', ' ', ''.join(child.itertext())).strip())
            else:
                walk(child)
            if child.tail:
                text.append(child.tail)

    walk(node)
    return re.sub(r'\s+', ' ', ''.join(text)).strip(), notes


def parse_usfx_book(book):
    """Keep verse text, poetry headings, footnotes and cross references separate."""
    output, current, verse, text, notes = OrderedDict(), None, None, [], []

    def flush():
        nonlocal verse, text, notes
        if verse is not None:
            value = re.sub(r'\s+', ' ', ''.join(text)).strip()
            if not value and not notes:
                raise ValueError(f'Empty verse {book.get("id")} {current}:{verse}')
            output[current].append({'verse': verse, 'text': value, 'notes': notes})
        verse, text, notes = None, [], []

    def walk(node):
        nonlocal current, verse
        if node.tag == 'c':
            flush()
            current = int(node.get('id'))
            if current in output:
                raise ValueError('Duplicate chapter')
            output[current] = []
        elif node.tag == 'v':
            flush()
            if current is None:
                raise ValueError('Verse before chapter')
            verse = node.get('id')
        elif node.tag == 've':
            flush()
        elif node.tag in {'f', 'x'}:
            if verse is not None:
                notes.append(re.sub(r'\s+', ' ', ''.join(node.itertext())).strip())
        elif node.tag in {'d', 's'} and current is not None:
            flush()
            heading, heading_notes = heading_text(node)
            output[current].append({'heading': heading, **({'notes': heading_notes} if heading_notes else {})})
        elif node.tag not in {'id', 'ide', 'h', 'toc', 'cl', 'cp'}:
            if verse is not None and node.tag in {'p', 'q', 'b'}:
                text.append('\n')
            if verse is not None and node.text:
                text.append(node.text)
            for child in node:
                walk(child)
                if verse is not None and child.tail:
                    text.append(child.tail)
            if verse is not None and node.tag in {'p', 'q', 'b'}:
                text.append('\n')

    walk(book)
    flush()
    expected = [node.get('id') for node in book.iter('v')]
    actual = [row['verse'] for rows in output.values() for row in rows if 'verse' in row]
    if actual != expected:
        raise ValueError('Verse coverage differs from source XML')
    return output


def bible_source(cache, key):
    raw = (cache / f'{key}_usfx.zip').read_bytes()
    archive = zipfile.ZipFile(io.BytesIO(raw))
    root = ET.fromstring(archive.read(f'{key}_usfx.xml'))
    names = {b.get('code'): b.get('short') for b in ET.fromstring(archive.read('BookNames.xml'))}
    books = {b.get('id'): parse_usfx_book(b) for b in root.findall('book') if b.get('id') in CANON}
    if set(books) != set(CANON) or sum(len(cs) for cs in books.values()) != 1189:
        raise ValueError(f'{key}: incomplete Bible canon')
    return books, names, {'url': f'https://ebible.org/Scriptures/{key}_usfx.zip', 'sha256': sha(raw)}


def verse_range(value):
    if not re.fullmatch(r'[0-9]+(?:-[0-9]+)?', value):
        raise ValueError('Unexpected verse label')
    bounds = list(map(int, value.split('-')))
    if bounds[-1] < bounds[0]:
        raise ValueError('Reversed verse range')
    return set(range(bounds[0], bounds[-1] + 1))


def aligned_bible_rows(by_language):
    """Union overlapping verse ranges, retaining each publisher row exactly once.

    A publisher can omit a numbered verse, put its variant in a footnote, or
    number a passage differently. Never invent a translation to fill that gap.
    """
    groups = []
    for lang, rows in by_language.items():
        for row in rows:
            if 'verse' not in row:
                continue
            numbers = verse_range(row['verse'])
            touched = [g for g in groups if g['numbers'] & numbers]
            merged = {'numbers': set(numbers), 'rows': {lang: [row]}}
            for old in touched:
                merged['numbers'].update(old['numbers'])
                for key, values in old['rows'].items():
                    merged['rows'].setdefault(key, []).extend(values)
                groups.remove(old)
            groups.append(merged)
    for group in sorted(groups, key=lambda g: min(g['numbers'])):
        for rows in group['rows'].values():
            rows.sort(key=lambda row: min(verse_range(row['verse'])))
        yield group


def bible(cache, ruby_database=None):
    editions = {'en': 'engwebp', 'zh': 'cmn-cu89t', 'ja': 'jpnm'}
    sources, names, files = {}, {}, []
    for lang, key in editions.items():
        sources[lang], names[lang], source_file = bible_source(cache, key)
        files.append(source_file)
    ruby = sqlite3.connect(ruby_database.resolve().as_uri() + '?mode=ro', uri=True) if ruby_database else None
    intro = {
        'en': 'The Holy Bible, 66 books in English, Chinese and Japanese. English: World English Bible (WEB). Chinese: Chinese Union Version, traditional script (CUVt). Japanese: Japanese Freedom Bible (publisher draft). All three are public-domain editions from eBible.org. Verse numbers and translation notes are retained. Combined verses stay together; differing numbering and manuscript variants can mean a passage appears in only one or two editions. These differences are not filled with invented translations. Matching readings from the earlier Bunko edition are optional pronunciation aids.',
        'zh': '《圣经》66卷，英语、中文、日语对照。英语：世界英语圣经（WEB）；中文：繁体新标点和合本（CUVt）；日语：自由圣经（出版方标注为草稿）。三个译本均由eBible.org以公有领域版本发布。保留节号与译注，合并的经节一并显示。各译本的编号或底本异文不同，个别段落只在部分译本中出现，不以臆造译文补齐。与旧版正文一致的注音作为可关闭的阅读辅助。',
        'ja': '聖書全66巻を英語・中国語・日本語で対照します。英語はWorld English Bible、中国語は繁体字の新標點和合本、日本語はフリーダム・バイブル（配布元による草稿）です。いずれもeBible.org配布のパブリックドメイン版です。節番号と訳注を保持し、結合された節はまとめて表示します。節番号や底本の違いにより、一部の箇所は特定の訳だけに現れます。欠落を創作訳で補うことはしません。旧版と一致する語の読みは、切り替え可能な補助表示です。',
    }
    credits = 'Sources: https://ebible.org/engwebp/ ; https://ebible.org/cmn-cu89t/ ; https://ebible.org/jpnm/ . World English Bible is a trademark of eBible.org and identifies the unchanged English translation. Japanese Freedom Bible is a draft: https://ebible.org/jpnm/copyright.htm . Downloads checked: ' + DATE + '.'
    result = [{'id': 'bible-edition', 'n': 0, 'title': {'en': ['Edition and sources'], 'zh': ['版本与来源'], 'ja': ['版と出典']},
               'p': [paragraph('bible-edition', {l: [t] for l, t in intro.items()}),
                     paragraph('bible-edition-credits', {l: [credits] for l in editions})]}]
    counts = {l: {'chapters': 0, 'verseEntries': 0, 'notes': 0, 'headings': 0} for l in editions}
    differences = []
    chapter_count = 0
    try:
        for code in CANON:
            if any(set(sources[l][code]) != set(sources['en'][code]) for l in editions):
                raise ValueError(f'{code}: chapter alignment differs')
            for number, en_rows in sources['en'][code].items():
                chapter_count += 1
                rows = {l: sources[l][code][number] for l in editions}
                payload, headings = [], []
                for l in editions:
                    counts[l]['chapters'] += 1
                    counts[l]['verseEntries'] += sum('verse' in row for row in rows[l])
                    counts[l]['notes'] += sum(len(row.get('notes', [])) for row in rows[l])
                    # Preserve section headings at their original verse boundary.
                    for i, row in enumerate(rows[l]):
                        if 'heading' in row:
                            counts[l]['headings'] += 1
                            following = next((r for r in rows[l][i + 1:] if 'verse' in r), None)
                            position = min(verse_range(following['verse'])) if following else float('inf')
                            anchor = f'bible-{code.lower()}-{number}-heading-{l}-{i}'
                            parts = [paragraph(anchor, {l: [row['heading']]}, True)]
                            if row.get('notes'):
                                parts.append(paragraph(anchor + '-notes', {l: ['\n'.join(row['notes'])]}, True))
                            headings.append((position, parts))
                headings.sort(key=lambda item: item[0])
                for group in aligned_bible_rows(rows):
                    while headings and headings[0][0] <= max(group['numbers']):
                        payload.extend(headings.pop(0)[1])
                    anchor = f'bible-{code.lower()}-{number}-{min(group["numbers"])}'
                    lines, notes = {}, {}
                    for l, entries in group['rows'].items():
                        lines[l] = []
                        for row in entries:
                            old = None
                            if ruby and l in ('zh', 'ja') and row['verse'].isdigit():
                                old = ruby.execute('SELECT tokens FROM verses WHERE book=? AND chapter=? AND verse=?', (code, number, int(row['verse']))).fetchone()
                            tokens = json.loads(old[0]).get(l, []) if old else []
                            if lines[l]: lines[l].append(' ')
                            lines[l].extend([row['verse'] + '  '] + (exact_ruby(row['text'], tokens) if row['text'] else []))
                            if row.get('notes'):
                                notes.setdefault(l, []).extend(row['notes'])
                    partial = len(lines) != len(editions)
                    if partial:
                        differences.append({'book': code, 'chapter': number, 'verses': sorted(group['numbers']), 'languages': list(lines)})
                    payload.append(paragraph(anchor, lines, partial))
                    if notes:
                        payload.append(paragraph(anchor + '-notes', {l: ['\n'.join(ns)] for l, ns in notes.items()}, True))
                for _, parts in headings: payload.extend(parts)
                result.append({'id': f'bible-{code.lower()}-{number}', 'n': chapter_count,
                               'title': {l: [f'{names[l][code]} {number}'] for l in editions}, 'p': payload})
    finally:
        if ruby: ruby.close()
    expected = {'en': 31103, 'zh': 31021, 'ja': 31103}
    if chapter_count != 1189 or any(counts[l]['verseEntries'] != expected[l] for l in editions):
        raise ValueError(f'Unexpected Bible coverage: {counts}')
    rights = {
        'basis': 'Complete 66-book English WEB, Chinese Union Version (traditional), and Japanese Freedom Bible (publisher draft), each explicitly public domain at eBible.org. Publisher text, combined verse ranges, notes and source numbering retained; textual variants are not fabricated. Optional matching pronunciation aids from the owner-authorized earlier edition.',
        'references': ['https://ebible.org/engwebp/copyright.htm', 'https://ebible.org/cmn-cu89t/copyright.htm', 'https://ebible.org/jpnm/copyright.htm'],
        'sourceFiles': files,
        'translations': {'en': 'World English Bible', 'zh': 'Chinese Union Version (traditional)', 'ja': 'Japanese Freedom Bible — publisher draft'},
        'coverage': {'books': 66, 'chapters': chapter_count, 'perLanguage': counts, 'numberingDifferences': differences},
    }
    return {'en': ['The Holy Bible'], 'zh': ['聖經'], 'ja': ['聖書']}, result, rights


def quran(cache, source_root):
    translations, metadata, hashes = {}, {}, []
    for lang, key in TRANSLATIONS.items():
        path = cache / f'{key}.sqlite'
        connection = sqlite3.connect(path.resolve().as_uri() + '?mode=ro', uri=True)
        try:
            rows = connection.execute('SELECT sura, aya, translation, footnotes FROM translations ORDER BY sura, aya').fetchall()
        finally:
            connection.close()
        translations[lang] = {(s, a): (text, footnotes or '') for s, a, text, footnotes in rows}
        if len(rows) != 6236 or len(translations[lang]) != 6236 or any(not text for _, _, text, _ in rows):
            raise ValueError(f'{key}: incomplete or duplicate verses')
        listing = json.loads((cache / f'quran-list-{lang}.json').read_text())['translations']
        metadata[lang] = next(x for x in listing if x['key'] == key)
        hashes.append({'url': f'https://quranenc.com/downloads/sqlite/{key}.sqlite',
                       'sha256': sha(path.read_bytes()), 'version': metadata[lang]['version']})
    arabic_file = cache / 'quran-uthmani.txt'
    arabic_raw = arabic_file.read_text()
    arabic = {}
    for row in arabic_raw.splitlines():
        if re.match(r'^\d+\|\d+\|', row):
            sura, aya, text = row.split('|', 2)
            key = (int(sura), int(aya))
            if key in arabic or not text: raise ValueError('Invalid Arabic source')
            arabic[key] = text
    copyright_block = arabic_raw[arabic_raw.index('# PLEASE DO NOT REMOVE'):].strip()
    if 'Version 1.1' not in copyright_block: raise ValueError('Review updated Tanzil edition')
    hashes.insert(0, {'url': ARABIC_URL, 'sha256': sha(arabic_file.read_bytes()), 'version': '1.1'})
    keys = set(translations['en'])
    if set(arabic) != keys: raise ValueError('Arabic verse coverage differs')
    if any(set(t) != keys for t in translations.values()):
        raise ValueError('Quran translation alignment differs')
    source = source_root / 'books/quran/work/arabic-quadrilingual/preview/quran.full.json'
    old_chapters = list(chapters(source))
    old_units = {tuple(map(int, u['verse_key'].split(':'))): u
                 for c in old_chapters for p in c['paragraphs'] for u in p['units'] if u.get('ayah', 0) > 0}
    if len(old_chapters) != 114 or set(old_units) != keys:
        raise ValueError('Quran source coverage differs')
    credits = '\n'.join(metadata[lang]['title'] + ' — ' + metadata[lang]['description'] +
                        ' Version ' + metadata[lang]['version'] + '.' for lang in TRANSLATIONS)
    credits += '\nPublisher and source: QuranEnc.com — https://quranenc.com/en/home . Checked: ' + DATE + '.'
    terms = ('QuranEnc.com permits downloading and republication subject to its terms: preserve the contents without modification, addition or deletion; clearly credit the publisher and source; state the version; retain translation information; notify QuranEnc.com of translation concerns; update from the latest source version; and display no inappropriate advertisements. See https://quranenc.com/en/home/api .')
    intro = {
        'en': 'Translations of the meanings of the Quran, aligned by verse. All 114 surahs and 6,236 numbered verses are included. Translation notes follow each verse. Arabic: Tanzil Uthmani text, version 1.1, https://tanzil.net . Its unnumbered opening basmalahs remain at the beginning of each applicable surah, exactly as supplied. Select Arabic, English, Chinese and Japanese independently.',
        'zh': '本版按经节对照《古兰经》的英语、中文和日语译文，收录全部114章、6,236节。译注紧随对应经节。阿拉伯语采用Tanzil Uthmani正文1.1版（https://tanzil.net），完整保留各章开头的未编号开端词。阿拉伯语、英语、中文和日语均可独立选择。',
        'ja': 'クルアーンの意味の英語・中国語・日本語訳を節ごとに対照します。全114章・6,236節を収録し、訳注は該当する節の後に掲載しています。アラビア語はTanzil Uthmani本文1.1版（https://tanzil.net）を使用し、各章の冒頭句も原文どおり保持します。アラビア語・英語・中国語・日本語を個別に選べます。',
    }
    intro = {'ar': 'القرآن الكريم بنص تنزيل العثماني، الإصدار 1.1، مع ترجمات المعاني إلى الإنجليزية والصينية واليابانية. يشمل جميع السور الـ114 والآيات المرقمة الـ6236 مع حواشي الترجمات. المصدر: https://tanzil.net و https://quranenc.com .', **intro}
    result = [{'id': 'quran-edition', 'n': 0, 'title': {'ar': ['النسخة والمصادر'], 'en': ['Edition and sources'], 'zh': ['版本与来源'], 'ja': ['版と出典']},
               'p': [paragraph('quran-edition-intro', {l: [t] for l, t in intro.items()}),
                     paragraph('quran-edition-credits', {l: [credits] for l in TRANSLATIONS}, True),
                     paragraph('quran-arabic-copyright', {'en': [copyright_block]}, True),
                     paragraph('quran-edition-terms', {l: [terms] for l in TRANSLATIONS}, True)]}]
    for number, old_chapter in enumerate(old_chapters, 1):
        verse_keys = sorted(k for k in keys if k[0] == number)
        if [v for _, v in verse_keys] != list(range(1, len(verse_keys) + 1)):
            raise ValueError('Quran verse gap')
        payload = []
        for key in verse_keys:
            anchor = f'quran-{key[0]:03}-{key[1]:03}'
            # The old Japanese export assigns isolated-kanji readings that are
            # wrong for words such as 御名. Keep the publisher's Japanese text
            # without those unaudited readings; retain matching Chinese pinyin.
            lines = {lang: [f'{key[0]}:{key[1]}  '] + exact_ruby(translations[lang][key][0], old_units[key].get(lang, []) if lang == 'zh' else [])
                     for lang in TRANSLATIONS}
            lines = {'ar': [f'{key[0]}:{key[1]}  ', arabic[key]], **lines}
            payload.append(paragraph(anchor, lines))
            notes = {lang: [translations[lang][key][1]] for lang in TRANSLATIONS if translations[lang][key][1]}
            if notes:
                payload.append(paragraph(anchor + '-notes', notes, True))
        title = {l: [''.join(t['t'] for t in old_chapter['title'][l])] for l in ['ar', *TRANSLATIONS]}
        result.append({'id': f'quran-sura-{number:03}', 'n': number, 'title': title, 'p': payload, 'sourceNotice': copyright_block})
    rights = {
        'basis': 'Arabic text: Tanzil Uthmani 1.1, CC BY 3.0 with verbatim reproduction terms; full text, basmalahs and source notice retained. Translations redistributed with permission under QuranEnc.com Terms and Policies. These are credited publisher translations, not public-domain or generated translations. Full translation text, markers, footnotes, translator information and versions are preserved. Matching Chinese pinyin is an optional display aid; unaudited Japanese readings from the old export are not reused.',
        'references': ['https://tanzil.net', 'https://tanzil.net/docs/Text_License', 'https://quranenc.com/en/home', 'https://quranenc.com/en/home/api'],
        'translations': {lang: {k: metadata[lang][k] for k in ['key', 'title', 'description', 'version', 'last_update']} for lang in TRANSLATIONS},
        'terms': terms, 'arabicNotice': copyright_block,
        'sourceFiles': hashes,
        'coverage': {'surahs': 114, 'versesPerLanguage': 6236,
                     'versesWithNotes': {lang: sum(bool(row[1]) for row in data.values()) for lang, data in translations.items()}},
        'display': 'Arabic original (RTL), English, Chinese and Japanese meanings. Basmalahs retained verbatim in the Tanzil opening verses. No advertisements.',
    }
    return {'ar': ['القرآن الكريم'], 'en': ['The Quran'], 'zh': ['古兰经'], 'ja': ['クルアーン']}, result, rights


def write_bundle(out, slug, title, content, rights, source_root):
    folder = out / 'books' / slug
    folder.mkdir(parents=True, exist_ok=True)
    rows = []
    for index, chapter in enumerate(content):
        raw = encode(chapter)
        if len(raw) >= 20_000_000:
            raise ValueError('Chapter exceeds CDN limit')
        digest = sha(raw)
        name = f'c{index:04}p01-{digest[:12]}.json'
        (folder / name).write_bytes(raw)
        rows.append({'n': chapter['n'], 'file': name, 'bytes': len(raw), 'paras': len(chapter['p']),
                     'sha256': digest, 'title': {l: plain(t) for l, t in chapter['title'].items()}})
    langs = list(title)
    meta = {'schema': 1, 'id': slug, 'mode': 'multilingual', 'langs': langs, 'primary': langs[0],
            'title': title, 'titleText': {l: plain(t) for l, t in title.items()}, 'author': {'name': ''},
            'chapters': rows, 'bytes': sum(r['bytes'] for r in rows), 'paras': sum(r['paras'] for r in rows),
            'edition': 'multilingual' if len(langs) > 1 else 'original-only', 'cat': 'world'}
    rights = {**rights, 'id': slug, 'status': 'ship', 'edition': meta['edition'], 'langs': langs, 'checked': DATE}
    if slug == 'bible':
        # Existing reviewed text-free artwork; resizing is export, not new art.
        from PIL import Image
        cover_source = source_root / 'assets/covers/bible/background.png'
        artwork = Image.open(cover_source).convert('RGB')
        artwork.thumbnail((640, 960))
        stream = io.BytesIO()
        artwork.save(stream, format='WEBP', quality=88)
        raw = stream.getvalue()
        name = f'cover-{sha(raw)[:12]}.webp'
        (folder / name).write_bytes(raw)
        meta['cover'] = name
        rights['cover'] = {'textFree': True, 'basis': 'Existing project artwork, reviewed without title typography.',
                           'sourceAsset': 'ZhJpBook/assets/covers/bible/background.png'}
    (folder / 'rights.json').write_text(json.dumps(rights, ensure_ascii=False, indent=2) + '\n')
    (folder / 'meta.json').write_bytes(encode(meta))
    print(f'{slug}: {len(rows)} entries, {meta["bytes"] / 1e6:.2f} MB; {rights["coverage"]}', flush=True)


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--cache', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    parser.add_argument('--source-root', type=Path, default=ROOT.parent / 'ZhJpBook')
    parser.add_argument('--bible-ruby', type=Path, help='Optional read-only audited verse/token SQLite database')
    parser.add_argument('--fetch', action='store_true', help='Refresh publisher downloads before importing')
    args = parser.parse_args()
    if args.fetch:
        fetch(args.cache)
    for slug, build in [('bible', lambda: bible(args.cache, args.bible_ruby)), ('quran', lambda: quran(args.cache, args.source_root))]:
        title, content, rights = build()
        write_bundle(args.out, slug, title, content, rights, args.source_root)


if __name__ == '__main__':
    main()
