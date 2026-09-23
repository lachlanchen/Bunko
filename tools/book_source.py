"""Read large assembled books one chapter at a time, without changing sources."""
import json
import re
from pathlib import Path


def header(path: Path) -> dict:
    with path.open(encoding="utf-8") as stream:
        text = ""
        while len(text) < 4_000_000:
            part = stream.read(65536)
            text += part
            match = re.search(r'"chapters"\s*:\s*\[', text)
            if match:
                return json.loads(text[:match.start()].rstrip().rstrip(",") + "}")
            if not part:
                break
    raise ValueError(f"Missing chapters in {path.name}")


def chapters(path: Path):
    decoder = json.JSONDecoder()
    with path.open(encoding="utf-8") as stream:
        buffer = ""
        while True:
            part = stream.read(65536)
            if not part:
                raise ValueError("Missing chapters")
            buffer += part
            match = re.search(r'"chapters"\s*:\s*\[', buffer)
            if match:
                buffer = buffer[match.end():]
                break
        while True:
            buffer = buffer.lstrip()
            if buffer.startswith("]"):
                return
            try:
                value, end = decoder.raw_decode(buffer)
            except json.JSONDecodeError:
                part = stream.read(1_048_576)
                if not part:
                    raise ValueError(f"Truncated chapter in {path.name}") from None
                buffer += part
                continue
            if not isinstance(value, dict):
                raise ValueError("Chapter must be an object")
            yield value
            buffer = buffer[end:].lstrip()
            while not buffer:
                buffer = stream.read(65536).lstrip()
                if not buffer:
                    raise ValueError("Truncated chapter array")
            if buffer.startswith(","):
                buffer = buffer[1:]
            elif not buffer.startswith("]"):
                raise ValueError("Invalid chapter separator")


def complete(source: dict) -> bool:
    total = source.get("total_chunk_count")
    return (isinstance(total, int) and total > 0
            and source.get("assembled_chunk_count") == total
            and not source.get("missing_chunk_count", 0)
            and not source.get("stale_chunk_count", 0))


def inventory(root: Path) -> dict:
    selected = {}
    paths = set(root.glob("data/interlinear/*/assembled/*.json"))
    paths |= set(root.glob("books/*/work/*/preview/*.json"))
    for path in sorted(paths):
        try:
            data = header(path)
        except (ValueError, OSError):
            continue
        rel = path.relative_to(root)
        slug = rel.parts[2] if rel.parts[0] == "data" else rel.parts[1]
        score = (complete(data.get("source", {})), rel.parts[0] == "data",
                 path.name.endswith(".partial.json"), path.stat().st_size)
        if slug not in selected or score > selected[slug][0]:
            selected[slug] = (score, {"path": str(rel), **data})
    return {slug: row for slug, (_, row) in selected.items()}
