"""Stream completed legacy bilingual chunks, optionally with English overlays.

The source checkout is read-only. Every manifest paragraph and requested overlay
must be present; an incomplete book never reaches the publication copy step.
"""
import json
from pathlib import Path


def inside(root, relative):
    path = (root / relative).resolve()
    if not path.is_relative_to(root.resolve()):
        raise ValueError("Source path escaped root")
    return path


def tokens(value):
    if isinstance(value, dict):
        return [value]
    if isinstance(value, list):
        return [token for item in value for token in tokens(item)]
    if isinstance(value, str):
        return [{"t": value}]
    return []


def open_book(root: Path, edition: dict):
    manifest = json.loads(inside(root, edition["source"]).read_text())
    items = manifest["chunks"]
    slug = manifest["book_id"]
    if not items or len(items) != manifest["chunk_count"]:
        raise ValueError(f"{slug}: incomplete manifest")
    plan = json.loads((root / "books" / slug / "book-plan.json").read_text())
    mapping = {lang: "zh" if lang == "wenyan" else lang for lang in edition["langs"]}
    title = {lang: [{"t": plan.get(f"book_title_{key}") or edition["title"]}]
             for lang, key in mapping.items()}
    tasks = {}
    if "en" in mapping:
        overlay_plan = json.loads((root / "data/source-plan/incremental-en-modern-ja" / slug / "manifest.json").read_text())
        tasks = {task["chunk_id"]: task for line in inside(root, overlay_plan["tasks_jsonl"]).read_text().splitlines()
                 if line.strip() for task in [json.loads(line)]}
        if set(tasks) != {item["chunk_id"] for item in items}:
            raise ValueError(f"{slug}: English overlay manifest differs from base")
    book = {"mode": "wenyan_ja_zh" if "wenyan" in mapping else "trilingual_standard",
            "title": title, "author": {"name": edition["author"], "reading_ja": plan.get("author_reading_ja", "")},
            "source": {"assembled_chunk_count": len(items), "total_chunk_count": len(items),
                       "missing_chunk_count": 0, "stale_chunk_count": 0}}

    def chapters():
        chapter, previous_key, number = None, None, 0
        for item in items:
            chunk_id = item["chunk_id"]
            chunk = json.loads((root / "data/interlinear" / slug / "chunks" / f"{chunk_id}.json").read_text())
            if chunk.get("chunk_id") != chunk_id or [p.get("id") for p in chunk.get("paragraphs", [])] != item["paragraph_ids"]:
                raise ValueError(f"{slug}/{chunk_id}: stale paragraphs")
            node = next((chunk[key] for key in ("story", "subsection", "section")
                         if chunk.get(key, {}).get("id") not in (None, "", "main")), {})
            key = node.get("id", "main")
            if key != previous_key:
                if chapter:
                    yield chapter
                number += 1
                chapter = {"id": key, "number": number,
                           "title": {lang: tokens(node.get(f"title_{source}")) or [{"t": key}]
                                     for lang, source in mapping.items()}, "paragraphs": []}
                previous_key = key
            overlays = {}
            if tasks:
                task = tasks[chunk_id]
                overlay = json.loads(inside(root, task.get("durable_overlay_path") or task["output_overlay_path"]).read_text())
                if overlay.get("chunk_id") != chunk_id:
                    raise ValueError(f"{slug}/{chunk_id}: stale English overlay")
                overlays = {(u["paragraph_id"], u["unit_index"]): u for u in overlay["units"]}
            for paragraph in chunk["paragraphs"]:
                units = []
                for index, unit in enumerate(paragraph.get("units", []), 1):
                    lines = {lang: tokens(unit.get(source)) for lang, source in mapping.items() if lang != "en"}
                    if tasks:
                        overlay = overlays.get((paragraph["id"], index), {})
                        if str(overlay.get("source_text", "")).strip() != str(unit.get("source_text", "")).strip():
                            raise ValueError(f"{slug}/{chunk_id}: English overlay source changed")
                        lines["en"] = tokens(overlay.get("en"))
                    # Legacy chunks include standalone footnote links/closing
                    # commentary with no source-language text. Preserve those
                    # notes in their available languages; never invent a gloss.
                    annotation = not unit.get("source_text", "").strip() and not tokens(unit.get("zh"))
                    if not any(lines.values()) or (not annotation and not all(lines.values())):
                        raise ValueError(f"{slug}/{chunk_id}: missing language")
                    units.append({**lines, "source_text": unit.get("source_text", ""), "annotation": annotation})
                chapter["paragraphs"].append({"id": paragraph["id"], "units": units})
        if chapter:
            yield chapter

    return book, chapters()
