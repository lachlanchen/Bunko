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
    download(WEB_URL, cache / 'engwebp_usfx.zip')
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


def bible(cache):
    raw = (cache / 'engwebp_usfx.zip').read_bytes()
    archive = zipfile.ZipFile(io.BytesIO(raw))
    root = ET.fromstring(archive.read('engwebp_usfx.xml'))
    names = {b.get('code'): b.get('short') for b in ET.fromstring(archive.read('BookNames.xml'))}
    result = []
    front = 'World English Bible (WEB), 66-book edition. Source: eBible.org. Public domain. “World English Bible” is a trademark of eBible.org and identifies the unmodified English translation. Source: https://ebible.org/engwebp/ . Translation notes and cross references follow their verse. Download checked: ' + DATE + '.'
    result.append({'id': 'bible-edition', 'n': 0, 'title': {'en': ['Edition and sources']},
                   'p': [paragraph('bible-edition', {'en': [front]})]})
    source_books = {b.get('id'): b for b in root.findall('book')}
    # The USFX archive also contains deuterocanonical books, despite its engwebp
    # filename. Select the declared 66-book edition explicitly, without silently
    # interleaving a different canon.
    if any(code not in source_books for code in CANON):
        raise ValueError('Incomplete Bible canon')
    chapter_count = verse_count = note_count = 0
    for code in CANON:
        for number, rows in parse_usfx_book(source_books[code]).items():
            chapter_count += 1
            payload = []
            for index, row in enumerate(rows):
                if 'heading' in row:
                    anchor = f'bible-{code.lower()}-{number}-heading-{index}'
                    payload.append(paragraph(anchor, {'en': [row['heading']]}))
                    if row.get('notes'):
                        note_count += len(row['notes'])
                        payload.append(paragraph(anchor + '-notes', {'en': ['\n'.join(row['notes'])]}, True))
                    continue
                verse_count += 1
                anchor = f'bible-{code.lower()}-{number}-{row["verse"]}'
                payload.append(paragraph(anchor, {'en': [row['verse'] + '  ', row['text']]}))
                if row['notes']:
                    note_count += len(row['notes'])
                    payload.append(paragraph(anchor + '-notes', {'en': ['\n'.join(row['notes'])]}, True))
            result.append({'id': f'bible-{code.lower()}-{number}', 'n': chapter_count,
                           'title': {'en': [f'{names[code]} {number}']}, 'p': payload})
    if (chapter_count, verse_count) != (1189, 31103):
        raise ValueError(f'Unexpected Bible coverage: {chapter_count} chapters, {verse_count} verses')
    rights = {
        'basis': 'World English Bible, 66-book English edition; eBible.org explicitly dedicates the translation to the public domain and permits redistribution. Text preserved, with notes and cross references retained. This is not the incomplete local KJV-based export.',
        'references': ['https://ebible.org/engwebp/copyright.htm', WEB_URL],
        'sourceFiles': [{'url': WEB_URL, 'sha256': sha(raw)}],
        'coverage': {'books': 66, 'chapters': chapter_count, 'verses': verse_count, 'notes': note_count},
    }
    return {'en': ['The Holy Bible — World English Bible']}, result, rights


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
    keys = set(translations['en'])
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
        'en': 'Translations of the meanings of the Quran, aligned by verse. All 114 surahs and 6,236 numbered verses are included. Translation notes follow each verse. This edition contains English, Chinese and Japanese; Arabic is not a selectable layer in this edition.',
        'zh': '本版按经节对照《古兰经》的英语、中文和日语译文，收录全部114章、6,236节。译注紧随对应经节。本版不包含可选择的阿拉伯语正文层。',
        'ja': 'クルアーンの意味の英語・中国語・日本語訳を節ごとに対照します。全114章・6,236節を収録し、訳注は該当する節の後に掲載しています。本版には選択可能なアラビア語本文のレイヤーは含まれません。',
    }
    result = [{'id': 'quran-edition', 'n': 0, 'title': {'en': ['Edition and sources'], 'zh': ['版本与来源'], 'ja': ['版と出典']},
               'p': [paragraph('quran-edition-intro', {l: [t] for l, t in intro.items()}),
                     paragraph('quran-edition-credits', {l: [credits] for l in TRANSLATIONS}),
                     paragraph('quran-edition-terms', {l: [terms] for l in TRANSLATIONS})]}]
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
            payload.append(paragraph(anchor, lines))
            notes = {lang: [translations[lang][key][1]] for lang in TRANSLATIONS if translations[lang][key][1]}
            if notes:
                payload.append(paragraph(anchor + '-notes', notes, True))
        title = {l: [''.join(t['t'] for t in old_chapter['title'][l])] for l in TRANSLATIONS}
        result.append({'id': f'quran-sura-{number:03}', 'n': number, 'title': title, 'p': payload})
    rights = {
        'basis': 'Translations redistributed with permission under QuranEnc.com Terms and Policies. These are credited publisher translations, not public-domain or generated translations. Full translation text, markers, footnotes, translator information and versions are preserved. Matching Chinese pinyin is an optional display aid; unaudited Japanese readings from the old export are not reused.',
        'references': ['https://quranenc.com/en/home', 'https://quranenc.com/en/home/api'],
        'translations': {lang: {k: metadata[lang][k] for k in ['key', 'title', 'description', 'version', 'last_update']} for lang in TRANSLATIONS},
        'terms': terms,
        'sourceFiles': hashes,
        'coverage': {'surahs': 114, 'versesPerLanguage': 6236,
                     'versesWithNotes': {lang: sum(bool(row[1]) for row in data.values()) for lang, data in translations.items()}},
        'display': 'English, Chinese and Japanese meanings; no Arabic layer. No advertisements.',
    }
    return {'en': ['The Quran — Translations'], 'zh': ['古兰经译文'], 'ja': ['クルアーン訳']}, result, rights


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
    meta = {'schema': 1, 'id': slug, 'mode': 'trilingual_standard', 'langs': langs, 'primary': 'en',
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
    parser.add_argument('--fetch', action='store_true', help='Refresh publisher downloads before importing')
    args = parser.parse_args()
    if args.fetch:
        fetch(args.cache)
    for slug, build in [('bible', lambda: bible(args.cache)), ('quran', lambda: quran(args.cache, args.source_root))]:
        title, content, rights = build()
        write_bundle(args.out, slug, title, content, rights, args.source_root)


if __name__ == '__main__':
    main()
