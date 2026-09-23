#!/usr/bin/env python3
"""Prepare only approved reader editions; never push or modify the source repo.

The reviewable output is committed in bunko-books after its validator passes.
The edition registry pins the file, allowed language layers and rights evidence.
"""
import argparse
import hashlib
import json
import shutil
import tempfile
from pathlib import Path

from book_source import header, chapters, complete
from bilingual_source import open_book
from build_reader import compact_line, compact_titles, plain_text, MODES

ROOT = Path(__file__).resolve().parents[1]


def encoded(data):
    return json.dumps(data, ensure_ascii=False, separators=(",", ":")).encode()


def digest(data):
    return hashlib.sha256(data).hexdigest()


def original_paragraph(paragraph, primary):
    """Keep source exactly; retain ruby only where tokens match that source."""
    source_key = f"source_{primary}"
    units = []
    for unit in paragraph.get("units") or []:
        source = unit.get(source_key) or unit.get("source_text")
        if not isinstance(source, str) or not source.strip():
            raise ValueError(f"Missing original text in {paragraph.get('id')}")
        tokens = unit.get(primary, [])
        line = compact_line(tokens) if plain_text(tokens) == source else [source]
        units.append({primary: line, "src": source})
    source = paragraph.get(source_key) or paragraph.get("source_text")
    if source and "".join(source.split()) != "".join("".join(u["src"] for u in units).split()):
        # A translation pipeline can lose a unit while retaining its source paragraph.
        # Preserve the complete original paragraph, rather than silently omitting it.
        units = [{primary: [source], "src": source}]
    if not units:
        raise ValueError(f"Empty paragraph {paragraph.get('id')}")
    return {"id": paragraph.get("id", ""), "src": source or "", "u": units}


def build(slug, edition, source_root, out):
    path = (source_root / edition["source"]).resolve()
    if not path.is_relative_to(source_root.resolve()):
        raise ValueError("Source escaped book root")
    if edition.get("kind") == "bilingual-chunks":
        book, chapter_stream = open_book(source_root, edition)
    else:
        book, chapter_stream = header(path), chapters(path)
    if edition.get("kind") == "pei-commentary":
        source = book["source"]
        base_path = (source_root / source["source_paths"]["base_chenshou_current_json"]).resolve()
        if not base_path.is_relative_to(source_root.resolve()) or not complete(header(base_path).get("source", {})):
            raise ValueError("Incomplete base text for Pei commentary")
        total = source["pei_total_chunk_count"]
        book["source"] = {"total_chunk_count": total, "assembled_chunk_count": source["pei_used_paragraph_count"],
                          "missing_chunk_count": source["pei_missing_chunk_count"], "stale_chunk_count": source["pei_stale_chunk_count"]}
    if not complete(book.get("source", {})):
        raise ValueError(f"{slug}: incomplete/stale source; publication refused")
    mode = book["mode"]
    primary = edition.get("primary", MODES[mode]["primary"])
    langs = edition.get("langs", MODES[mode]["langs"])
    if primary not in langs:
        raise ValueError("Primary language must be published")
    dest = out / "books" / slug
    dest.mkdir(parents=True, exist_ok=True)
    rows = []
    with tempfile.TemporaryDirectory(prefix="bunko-book-") as temp:
        staging = Path(temp)
        for index, chapter in enumerate(chapter_stream, 1):
            paragraphs = []
            for paragraph in chapter.get("paragraphs", []):
                if edition["edition"] == "original-only":
                    paragraphs.append(original_paragraph(paragraph, primary))
                else:
                    units = []
                    for unit in paragraph.get("units") or []:
                        lines = {lang: compact_line(unit.get(lang)) for lang in langs}
                        annotation = unit.get("annotation") is True and not unit.get("source_text", "").strip()
                        if not any(lines.values()) or (not annotation and any(not line for line in lines.values())):
                            raise ValueError(f"{slug}: missing language in {paragraph.get('id')}")
                        units.append({**{lang: line for lang, line in lines.items() if line},
                                      "src": unit.get(f"source_{primary}") or unit.get("source_text") or "",
                                      **({"annotation": True} if annotation else {})})
                    if not units:
                        raise ValueError(f"{slug}: empty paragraph")
                    paragraphs.append({"id": paragraph.get("id", ""), "src": paragraph.get(f"source_{primary}", ""), "u": units})
            if not paragraphs:
                raise ValueError(f"{slug}: empty chapter {index}")
            parts, part, size = [], [], 0
            for paragraph in paragraphs:
                paragraph_size = len(encoded(paragraph))
                if part and size + paragraph_size > 4_000_000:
                    parts.append(part)
                    part, size = [], 0
                part.append(paragraph)
                size += paragraph_size
            if part:
                parts.append(part)
            for part_index, part in enumerate(parts, 1):
                titles = compact_titles(chapter.get("title"), langs)
                if len(parts) > 1:
                    titles = {lang: line + [f" ({part_index}/{len(parts)})"] for lang, line in titles.items()}
                payload = {"id": chapter.get("id", f"{slug}-{index}") + f"-p{part_index}",
                           "n": chapter.get("number", index), "title": titles, "p": part}
                content = encoded(payload)
                if len(content) >= 20_000_000:
                    raise ValueError(f"{slug}: individual paragraph exceeds CDN limit")
                sha = digest(content)
                filename = f"c{index:04d}p{part_index:02d}-{sha[:12]}.json"
                (staging / filename).write_bytes(content)
                rows.append({"n": payload["n"], "file": filename, "bytes": len(content), "paras": len(part),
                             "sha256": sha, "title": {lang: ''.join(t if isinstance(t, str) else t[0] for t in line) for lang, line in titles.items()}})
        author = book.get("author") or {}
        meta = {"schema": 1, "id": slug, "mode": mode, "langs": langs, "primary": primary,
                "title": compact_titles(book.get("title"), langs),
                "titleText": {lang: plain_text(book.get("title", {}).get(lang)) for lang in langs},
                "author": {k: v for k, v in author.items() if k in {"name", "reading_zh", "reading_ja", "reading_en"}},
                "chapters": rows, "bytes": sum(r["bytes"] for r in rows), "paras": sum(r["paras"] for r in rows),
                "edition": edition["edition"], "cat": edition["cat"]}
        rights = {k: edition[k] for k in ["status", "edition", "langs", "basis", "references", "checked"]}
        rights.update(id=slug, sourceCoverage={k: book["source"].get(k, 0) for k in ["assembled_chunk_count", "total_chunk_count", "missing_chunk_count", "stale_chunk_count"]})
        (staging / "meta.json").write_bytes(encoded(meta))
        (staging / "rights.json").write_text(json.dumps(rights, ensure_ascii=False, indent=2) + "\n")
        # New content-addressed chapters first, metadata last. Existing chapters
        # remain available to installed clients with a cached previous metadata file.
        for file in staging.iterdir():
            if file.name != "meta.json":
                shutil.copyfile(file, dest / file.name)
        shutil.copyfile(staging / "meta.json", dest / "meta.json")
    return meta


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--source-root", type=Path, default=ROOT.parent / "ZhJpBook")
    parser.add_argument("--registry", type=Path, default=ROOT / "docs/library-editions.json")
    parser.add_argument("--out", type=Path, required=True)
    parser.add_argument("--slug", action="append")
    args = parser.parse_args()
    registry = json.loads(args.registry.read_text())
    selected = args.slug or [s for s, e in registry.items() if e["status"] == "ship" and e.get("build")]
    for slug in selected:
        edition = registry.get(slug)
        if not edition or edition["status"] != "ship":
            raise SystemExit(f"{slug}: no clearance; refused")
        meta = build(slug, edition, args.source_root, args.out)
        print(f"{slug}: {len(meta['chapters'])} chapters, {meta['paras']} paragraphs, {meta['bytes']/1e6:.1f} MB", flush=True)


if __name__ == "__main__":
    main()
