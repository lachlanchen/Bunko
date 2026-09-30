#!/usr/bin/env python3
"""Cache audited verse IDs and optional readings from a read-only source edition.

This imports pronunciation aids only. import_scripture.py obtains the complete
text from publishers and transfers readings only across unchanged token spans.
"""
import argparse
import hashlib
import json
from pathlib import Path
import sqlite3
import tempfile

from book_source import chapters
from import_scripture import CANON


def prepare(source_root, out):
    chunks = source_root / 'books/bible/work/trilingual/chunks/chunks.jsonl'
    source = source_root / 'data/interlinear/bible/quality-repair/bible.trilingual.quality-repair.json'
    manifest = {}
    with chunks.open() as stream:
        for line in stream:
            for p in json.loads(line)['paragraphs']:
                if p['id'] in manifest: raise ValueError('Duplicate source paragraph')
                manifest[p['id']] = p['units']
    out.parent.mkdir(parents=True, exist_ok=True)
    with tempfile.TemporaryDirectory(dir=out.parent) as temporary:
        database = Path(temporary) / 'ruby.sqlite'
        db = sqlite3.connect(database)
        db.execute('CREATE TABLE verses(book TEXT, chapter INT, verse INT, tokens TEXT, PRIMARY KEY(book,chapter,verse))')
        db.execute('CREATE TABLE provenance(source TEXT, sha256 TEXT)')
        count = 0
        try:
            for c in chapters(source):
                for p in c['paragraphs']:
                    old, new = manifest[p['id']], p['units']
                    if len(old) != len(new): raise ValueError('Source units do not align')
                    for original, unit in zip(old, new):
                        book, chapter, verse = map(int, original['unit_id'].split('-'))
                        if ''.join(original['en'].split()) != ''.join(unit['source_en'].split()):
                            raise ValueError('Source verse text does not align')
                        if not 1 <= book <= len(CANON): raise ValueError('Unknown book')
                        db.execute('INSERT INTO verses VALUES(?,?,?,?)', (CANON[book - 1], chapter, verse,
                                   json.dumps({lang: unit[lang] for lang in ['zh', 'ja']}, ensure_ascii=False)))
                        count += 1
            for path in [chunks, source]:
                with path.open('rb') as stream: digest = hashlib.file_digest(stream, 'sha256').hexdigest()
                db.execute('INSERT INTO provenance VALUES(?,?)', (str(path.relative_to(source_root)), digest))
            db.commit()
        finally:
            db.close()
        database.replace(out)
    print(f'Audited {count} verse references; source checkout unchanged.')


if __name__ == '__main__':
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-root', type=Path, required=True)
    parser.add_argument('--out', type=Path, required=True)
    args = parser.parse_args()
    prepare(args.source_root, args.out)
