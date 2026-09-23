#!/usr/bin/env python3
"""Turn PocketPolyglot assembled JSON into the compact reader payload Bunko downloads.

The pipeline in ../ZhJpBook writes one big assembled file per book, in one of
three modes that share the same container: chapters -> paragraphs -> units ->
tokens, where a token is {"t": text, "r": reading, "g": grammar role}.

The reader needs three things the assembled file does not give it: small files
(a 385 MB book cannot be downloaded to a phone in one piece), compact tokens,
and a manifest it can show before downloading anything. So each cleared book
becomes:

    books/<id>/meta.json     titles, author, languages, chapter list, sizes
    books/<id>/cNNN.json     one chapter, compacted
    reader-index.json        every published book, with bytes and checksums

Token compaction, which is where the size goes:

    {"t": "道", "r": "dào", "g": "subject"}   ->  ["道", "dào", "s"]
    {"t": "の"}                               ->  "の"

usage:
    build_reader.py --slug daodejing --out ../LinguaLeaf/reader
    build_reader.py --all-cleared --out ../LinguaLeaf/reader
"""
from __future__ import annotations

import argparse
import hashlib
import json
import re
import sys
from pathlib import Path

SOURCE_ROOT = Path("/home/lachlan/ProjectsLFS/ZhJpBook/data/interlinear")
SCHEMA = 1

# One letter per grammar role, so the role costs three bytes instead of fifteen.
ROLES = {
    "subject": "s", "predicate": "p", "object": "o", "attributive": "a",
    "adverbial": "d", "complement": "c", "topic": "t", "function": "f",
}

# Which language keys each mode carries, and which one the pipeline treated as
# the source. `trilingual_standard` always carries `source_en`, but a Japanese or
# Chinese original also carries `source_ja` or `source_zh`, and for those books
# English is the translation, not the text. Which line leads is decided per book.
MODES = {
    "trilingual_standard": {"langs": ["en", "zh", "ja"], "primary": "en"},
    "quadrilingual_wenyan_main": {"langs": ["wenyan", "zh_modern", "ja_modern", "en"], "primary": "wenyan"},
    "wenyan_ja_zh": {"langs": ["wenyan", "ja", "zh"], "primary": "wenyan"},
}

# The section each slug sits under in docs/catalogue-candidates.md decides which
# language a reader should meet first: the one the author wrote in.
ORIGIN_BY_SECTION = {"Chinese canon": "zh", "Japanese classics": "ja", "World literature": "en"}


def origin_language(slug: str, unit: dict, default: str) -> str:
    """The language this book was written in, if the data actually carries it."""
    section = _sections().get(slug)
    wanted = ORIGIN_BY_SECTION.get(section or "", default)
    if wanted != default and f"source_{wanted}" in unit and unit.get(wanted):
        return wanted
    return default


_SECTION_CACHE: dict[str, str] = {}


def _sections() -> dict[str, str]:
    if _SECTION_CACHE:
        return _SECTION_CACHE
    path = Path(__file__).resolve().parent.parent / "docs" / "catalogue-candidates.md"
    if not path.exists():
        return _SECTION_CACHE
    section = ""
    for line in path.read_text().splitlines():
        if line.startswith("## "):
            section = line[3:].split(" (")[0].strip()
        match = re.match(r"- \[[ x]\] `([^`]+)`", line)
        if match:
            _SECTION_CACHE[match.group(1)] = section
    return _SECTION_CACHE


def compact_token(token: dict) -> object:
    """A token as a bare string, or [text, reading] , or [text, reading, role]."""
    text = token.get("t", "")
    reading = token.get("r") or ""
    role = ROLES.get(token.get("g") or "", "")
    if role:
        return [text, reading, role]
    if reading:
        return [text, reading]
    return text


def compact_line(tokens) -> list:
    return [compact_token(t) for t in tokens or [] if isinstance(t, dict)]


def compact_titles(title, langs) -> dict:
    if not isinstance(title, dict):
        return {}
    return {lang: compact_line(title[lang]) for lang in langs if title.get(lang)}


def plain_text(tokens) -> str:
    return "".join(t.get("t", "") for t in tokens or [] if isinstance(t, dict))


def build_book(slug: str, out_root: Path) -> dict:
    assembled = sorted((SOURCE_ROOT / slug / "assembled").glob("*.json"))
    if not assembled:
        raise SystemExit(f"{slug}: no assembled JSON; run the pipeline first")
    book = json.loads(assembled[0].read_text())
    mode = book.get("mode", "")
    if mode not in MODES:
        raise SystemExit(f"{slug}: unknown mode {mode!r}")
    langs = MODES[mode]["langs"]
    primary = MODES[mode]["primary"]
    first_unit = next(
        (unit for chapter in book.get("chapters", []) for paragraph in chapter.get("paragraphs", [])
         for unit in (paragraph.get("units") or [])),
        {},
    )
    primary = origin_language(slug, first_unit, primary)
    # the original leads, the rest follow in their usual order
    langs = [primary] + [lang for lang in langs if lang != primary]
    source_key = f"source_{primary}"

    book_dir = out_root / "books" / slug
    book_dir.mkdir(parents=True, exist_ok=True)
    for stale in book_dir.glob("c*.json"):
        stale.unlink()

    chapters_meta = []
    total_bytes = 0
    total_paragraphs = 0
    for index, chapter in enumerate(book.get("chapters", []), start=1):
        paragraphs = []
        for paragraph in chapter.get("paragraphs", []):
            units = []
            for unit in paragraph.get("units", []) or []:
                line = {lang: compact_line(unit[lang]) for lang in langs if unit.get(lang)}
                if not line:
                    continue
                line["src"] = unit.get(source_key) or unit.get("source_text") or ""
                units.append(line)
            if not units:
                continue
            paragraphs.append({
                "id": paragraph.get("id", ""),
                "src": paragraph.get(source_key) or paragraph.get("source_text") or "",
                "u": units,
            })
        if not paragraphs:
            continue
        name = f"c{index:04d}.json"
        payload = {
            "id": chapter.get("id", f"{slug}-{index}"),
            "n": chapter.get("number", index),
            "title": compact_titles(chapter.get("title"), langs),
            "p": paragraphs,
        }
        text = json.dumps(payload, ensure_ascii=False, separators=(",", ":"))
        (book_dir / name).write_text(text)
        size = len(text.encode())
        total_bytes += size
        total_paragraphs += len(paragraphs)
        chapters_meta.append({
            "n": payload["n"],
            "file": name,
            "bytes": size,
            "paras": len(paragraphs),
            "title": {lang: plain_text(chapter.get("title", {}).get(lang)) for lang in langs
                      if isinstance(chapter.get("title"), dict) and chapter.get("title", {}).get(lang)},
        })

    if not chapters_meta:
        raise SystemExit(f"{slug}: no readable chapters")

    author = book.get("author") or {}
    meta = {
        "schema": SCHEMA,
        "id": slug,
        "mode": mode,
        "langs": langs,
        "primary": primary,
        "title": compact_titles(book.get("title"), langs),
        "titleText": {lang: plain_text((book.get("title") or {}).get(lang)) for lang in langs
                      if isinstance(book.get("title"), dict) and (book.get("title") or {}).get(lang)},
        "author": {k: v for k, v in author.items() if k in {"name", "reading_zh", "reading_ja", "reading_en"}},
        "chapters": chapters_meta,
        "bytes": total_bytes,
        "paras": total_paragraphs,
    }
    meta_text = json.dumps(meta, ensure_ascii=False, separators=(",", ":"))
    (book_dir / "meta.json").write_text(meta_text)

    return {
        "id": slug,
        "mode": mode,
        "langs": langs,
        "primary": primary,
        "title": meta["titleText"],
        "author": author.get("name", ""),
        "chapters": len(chapters_meta),
        "paras": total_paragraphs,
        "bytes": total_bytes + len(meta_text.encode()),
        "sha256": hashlib.sha256(meta_text.encode()).hexdigest()[:16],
    }


def cleared_slugs(catalogue: Path) -> list[str]:
    """Slugs whose catalogue row says `ship`."""
    if not catalogue.exists():
        raise SystemExit(f"missing {catalogue}; write the rights audit first")
    slugs = []
    for line in catalogue.read_text().splitlines():
        match = re.match(r"\|\s*`([a-z0-9-]+)`\s*\|.*?\|\s*ship\s*\|", line)
        if match:
            slugs.append(match.group(1))
    return slugs


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--slug", action="append", default=[])
    parser.add_argument("--all-cleared", action="store_true")
    parser.add_argument("--catalogue", default=str(Path(__file__).resolve().parent.parent / "docs" / "catalogue.md"))
    parser.add_argument("--out", required=True)
    parser.add_argument("--limit", type=int, default=0)
    args = parser.parse_args()

    out_root = Path(args.out).resolve()
    out_root.mkdir(parents=True, exist_ok=True)
    slugs = list(args.slug)
    if args.all_cleared:
        slugs += cleared_slugs(Path(args.catalogue))
    if args.limit:
        slugs = slugs[: args.limit]
    if not slugs:
        raise SystemExit("nothing to build: pass --slug or --all-cleared")
    allowed = set(cleared_slugs(Path(args.catalogue)))
    refused = set(slugs) - allowed
    if refused:
        raise SystemExit("Uncleared books refused: " + ", ".join(sorted(refused)))

    index_path = out_root / "reader-index.json"
    existing = {}
    if index_path.exists():
        for row in json.loads(index_path.read_text()).get("books", []):
            existing[row["id"]] = row

    for slug in slugs:
        try:
            row = build_book(slug, out_root)
        except SystemExit as error:
            raise SystemExit(f"Publication stopped: {slug}: {error}") from error
        existing[slug] = row
        print(f"{slug:38s} {row['chapters']:4d} ch  {row['bytes']/1e6:7.1f} MB  {row['title'].get(row['primary'],'')[:30]}")

    books = sorted(existing.values(), key=lambda r: r["id"])
    index_path.write_text(json.dumps(
        {"schema": SCHEMA, "books": books,
         "bytes": sum(b["bytes"] for b in books), "count": len(books)},
        ensure_ascii=False, separators=(",", ":")))
    print(f"\n{len(books)} books, {sum(b['bytes'] for b in books)/1e6:.1f} MB -> {index_path}")


if __name__ == "__main__":
    raise SystemExit("This legacy publisher is retired. Use tools/publish_library.py --out ../bunko-books; then validate with bunko-books/tools/catalogue.py --write.")
