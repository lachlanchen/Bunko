#!/usr/bin/env python3
"""Exercise published Bunko code with local bundles or the live catalogue."""
import argparse
from pathlib import Path
import json
import mimetypes
from urllib.parse import urlparse
from playwright.sync_api import sync_playwright

ROOT = Path(__file__).resolve().parents[1]
BOOKS = ROOT.parent / 'bunko-books'
EVIDENCE = ROOT / '.runtime/polished-reader'


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--live', action='store_true')
    parser.add_argument('--book', default='physics-higgs-boson')
    args = parser.parse_args()
    evidence = EVIDENCE / args.book / ('live' if args.live else 'local')
    evidence.mkdir(parents=True, exist_ok=True)
    results = []
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        try:
            for name, width, height in [('desktop', 1280, 900), ('mobile', 390, 844)]:
                context = browser.new_context(service_workers='block', viewport={'width': width, 'height': height})
                def route(request):
                    url = urlparse(request.request.url)
                    prefix = '/lachlanchen/bunko-books/main/'
                    if url.hostname == 'raw.githubusercontent.com' and url.path.startswith(prefix):
                        path = (BOOKS / url.path[len(prefix):]).resolve()
                        if path.is_relative_to(BOOKS) and path.is_file():
                            request.fulfill(path=str(path), content_type=mimetypes.guess_type(path)[0] or 'application/octet-stream',
                                            headers={'Access-Control-Allow-Origin': '*'})
                            return
                    request.continue_()
                if not args.live:
                    context.route('**/*', route)
                context.add_init_script('localStorage.setItem("CapacitorStorage.bunko.settings.v1", JSON.stringify({langs:["en","ja","zh"],layout:"paired",theme:"light"}));')
                page = context.new_page()
                page.goto('https://lachlan.lazying.art/Bunko/?book=' + args.book, wait_until='networkidle')
                page.screenshot(path=str(evidence / f'{name}-book.png'))
                page.get_by_role('button', name='Start reading', exact=True).click()
                page.wait_for_selector('article [data-reading][data-lang="ja"]')
                counts = {lang: page.locator(f'article [data-reading][data-lang="{lang}"]').count() for lang in ('en', 'ja', 'zh')}
                assert all(counts.values()) and len(set(counts.values())) == 1, counts
                assert page.locator('.katex-error,.math-error').count() == 0
                article = page.locator('article').inner_text()
                assert all(title in article for title in ('About These Notes', '本ノートについて', '关于本讲义'))
                if args.book == 'physics-higgs-boson':
                    assert all(title in article for title in ('Overview:', '概観', '概述'))
                assert page.evaluate('document.documentElement.scrollWidth <= innerWidth + 2')
                page.screenshot(path=str(evidence / f'{name}-reader.png'))
                figure = page.locator('article figure').first
                figure.scroll_into_view_if_needed()
                page.wait_for_function('document.querySelector("article figure img")?.naturalWidth > 0')
                page.screenshot(path=str(evidence / f'{name}-figure.png'))
                results.append({'viewport': name, 'languageBlocks': counts, 'mathErrors': 0, 'pageOverflow': False, 'figureLoaded': True})
                context.close()
        finally:
            browser.close()
    (evidence / 'audit.json').write_text(json.dumps(results, indent=2) + '\n')
    print(json.dumps(results))


if __name__ == '__main__':
    main()
