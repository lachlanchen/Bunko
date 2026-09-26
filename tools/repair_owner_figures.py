#!/usr/bin/env python3
"""Audit/render owner-edition diagrams and repair published figure omissions.

Sources remain read only. Run --render first; --write updates bunko-books.
The private audit/cache lives under .runtime/owner-figures.
"""
import argparse
import json
from pathlib import Path

from import_owner_books import OUT, ROOT, chapter_sources, publish, split_long_tex, wealth_book
from owner_figures import CACHE, TIKZ, render_tikz


def editions():
    for folder in sorted(OUT.iterdir()):
        rights = json.loads((folder / 'rights.json').read_text())
        references = rights.get('references', [])
        if not references or '/tree/main/' not in references[0]:
            continue
        repo, relative = references[0].split('/tree/main/', 1)
        if repo.split('/')[-1] not in ('leonardsusskind', 'LazyEarn', 'LazyLearn'):
            continue
        root = ROOT.parent / repo.split('/')[-1] / relative
        sources = sorted((root / 'chapters').glob('*/content.tex'))
        if folder.name == 'earn-build-a-business':
            sources = [root / 'how-you-build-a-business.tex']
        if sources:
            yield folder, rights, root, sources


def source_body(source):
    text = source.read_text()
    if source.name == 'how-you-build-a-business.tex':
        text = text[text.index('\\chapter{'):]
    return text


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--render', action='store_true')
    parser.add_argument('--write', action='store_true')
    parser.add_argument('--only', nargs='*')
    args = parser.parse_args()
    CACHE.mkdir(parents=True, exist_ok=True)
    failures, report = [], []
    for folder, rights, root, sources in editions():
        if args.only and folder.name not in args.only:
            continue
        diagrams = [(source, match[0]) for source in sources for match in TIKZ.finditer(source_body(source))]
        if args.render:
            for source, diagram in diagrams:
                try:
                    render_tikz(diagram, source)
                except Exception as error:
                    failures.append(str(error))
                    print(str(error), flush=True)
        meta = json.loads((folder / 'meta.json').read_text())
        old = [json.loads((folder / row['file']).read_text()) for row in meta['chapters']]
        count = sum(bool(p.get('figure')) for chapter in old for p in chapter['p'])
        row = {'book': folder.name, 'before': count, 'sourceDiagrams': len(diagrams)}
        if args.write:
            backup = CACHE / 'before' / folder.name
            backup.mkdir(parents=True, exist_ok=True)
            if not (backup / 'meta.json').exists():
                (backup / 'meta.json').write_bytes((folder / 'meta.json').read_bytes())
            # Retain the published chapter segmentation during this figure-only
            # migration so existing passage links keep their chapter identity.
            chapters = split_long_tex(sources[0], legacy_boundaries=True) if folder.name == 'earn-build-a-business' else chapter_sources(root)
            if len(chapters) != len(meta['chapters']):
                raise ValueError(f'Chapter structure changed: {folder.name}')
            cover = ROOT.parent / rights['cover']['sourceAsset']
            publish(folder.name, meta['titleText'], meta['langs'], meta['primary'], meta['cat'],
                    meta['author']['name'], chapters, rights['references'][0], rights['basis'],
                    cover, rights['cover'].get('originalDesign', False), rights.get('license'))
            row['after'] = sum(bool(p.get('figure')) for _, blocks, _ in chapters for p in blocks)
        report.append(row)
        print(json.dumps(row), flush=True)
    if args.write and (not args.only or 'how-you-got-rich' in args.only):
        wealth_book()
    (CACHE / ('repair-report.json' if args.write else 'render-report.json')).write_text(json.dumps(report, indent=2))
    (CACHE / 'failures.json').write_text(json.dumps(failures, indent=2))
    if failures:
        raise SystemExit(f'{len(failures)} diagrams failed; nothing may be published until resolved.')


if __name__ == '__main__':
    main()
