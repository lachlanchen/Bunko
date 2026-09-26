#!/usr/bin/env python3
"""Compare all 33 owner editions with their source figure placements."""
import json
import re
import subprocess
from collections import Counter
from pathlib import Path

from import_owner_books import OUT, ROOT
from owner_figures import CACHE, TIKZ
from repair_owner_figures import editions, source_body


def head_json(path):
    return json.loads(subprocess.check_output(['git', '-C', str(OUT.parent), 'show',
                                              'HEAD:' + str(path.relative_to(OUT.parent))]))


def main():
    expected = {}
    for folder, _, _, sources in editions():
        text = '\n'.join(source_body(source) for source in sources)
        text = re.sub(r'(?<!\\)%[^\n]*', '', text)
        expected[folder.name] = len(TIKZ.findall(text)) + len(re.findall(
            r'\\includegraphics(?:\[[^\]]*\])?\s*\{', TIKZ.sub('', text)))
    for city, location in [('xian', 'china/cities/xian'), ('hakone', 'japan/prefectures/kanagawa/hakone'),
                           ('lanzhou', 'china/cities/lanzhou')]:
        doc = json.loads((ROOT.parent / 'LazyTravel/data' / location / 'book.json').read_text())
        expected['travel-' + city] = sum(len(b.get('asset_ids', [])) for c in doc['chapters'] for b in c['blocks'])
    manifest = json.loads((ROOT.parent / 'HowYouGotRich/docs/data/web-edition.json').read_text())
    expected['how-you-got-rich'] = sum(entry.get('figures', 0) for entry in manifest['entries'])
    expected['finance-wealth-first-principles'] = 0  # Source contains cover artwork only.
    totals = Counter()
    rows, errors = [], []
    for slug, count in sorted(expected.items()):
        folder = OUT / slug
        meta = json.loads((folder / 'meta.json').read_text())
        old = head_json(folder / 'meta.json')
        old_rows = {row['n']: row for row in old['chapters']}
        figures, asset_paths, retained = 0, set(), 0
        for row in meta['chapters']:
            chapter = json.loads((folder / row['file']).read_text())
            by_id = {p['id']: p for p in chapter['p']}
            if len(by_id) != len(chapter['p']):
                errors.append(f'{slug}/{row["n"]}: duplicate passage IDs')
            for block in chapter['p']:
                if block.get('figure'):
                    figures += 1
                    asset = block['figure']['path']
                    asset_paths.add(asset)
                    if not (folder / asset).is_file():
                        errors.append(f'{slug}: missing {asset}')
            previous = json.loads((folder / old_rows[row['n']]['file']).read_text())
            for block in previous['p']:
                replacement = by_id.get(block['id'])
                if not replacement or replacement['src'] != block['src']:
                    errors.append(f'{slug}/{row["n"]}/{block["id"]}: old passage lost or reassigned: {block["src"][:90]}')
                else:
                    retained += 1
        if figures != count:
            errors.append(f'{slug}: imported {figures}, expected {count} source placements')
        if meta.get('cover') != old.get('cover'):
            errors.append(f'{slug}: original cover changed')
        totals[meta['cat']] += figures
        rows.append({'book': slug, 'expected': count, 'figures': figures, 'uniqueAssets': len(asset_paths),
                     'retainedPassages': retained, 'figureBytes': sum((folder / p).stat().st_size for p in asset_paths)})
    report = {'books': len(rows), 'figures': sum(totals.values()), 'categories': dict(totals), 'rows': rows, 'errors': errors}
    CACHE.mkdir(parents=True, exist_ok=True)
    (CACHE / 'audit.json').write_text(json.dumps(report, indent=2))
    print(json.dumps({k: v for k, v in report.items() if k != 'rows'}, indent=2))
    if errors:
        raise SystemExit(1)


if __name__ == '__main__':
    main()
