#!/usr/bin/env python3
"""Build optional offline dictionary packs from licensed upstream downloads.

Usage: python tools/build_dictionary_packs.py --sources /tmp/bunko-dict-sources --output ../bunko-books/dictionaries
The upstream archives are never committed; generated packs belong in bunko-books.
"""
from __future__ import annotations

import argparse
import gzip
import hashlib
import json
import re
import xml.etree.ElementTree as ET
import zipfile
from collections import defaultdict
from pathlib import Path

VERSION = "2026-09-25"
SHARDS = 16


def add(rows: dict, word: str, reading: str, pos: str, meaning: str) -> None:
    word = word.strip().replace("_", " ")
    meaning = meaning.strip()
    if not word or not meaning or len(word) > 80 or len(meaning) > 500:
        return
    entries = rows[word]
    row = [reading.strip(), pos.strip(), meaning]
    if row not in entries and len(entries) < 12:
        entries.append(row)


def chinese(path: Path) -> dict:
    rows = defaultdict(list)
    pattern = re.compile(r"^(\S+) (\S+) \[([^]]+)\] /(.+)/$")
    with gzip.open(path, "rt", encoding="utf-8") as source:
        for line in source:
            match = pattern.match(line.strip())
            if not match:
                continue
            traditional, simplified, pinyin, glosses = match.groups()
            meaning = "; ".join(gloss for gloss in glosses.split("/") if gloss)[:500]
            for word in {traditional, simplified}:
                add(rows, word, pinyin, "", meaning)
    return rows


def japanese(path: Path) -> dict:
    rows = defaultdict(list)
    with gzip.open(path, "rb") as source:
        for _, entry in ET.iterparse(source, events=("end",)):
            if entry.tag != "entry":
                continue
            readings = [node.text or "" for node in entry.findall("r_ele/reb")]
            kanji = [node.text or "" for node in entry.findall("k_ele/keb")]
            glosses = []
            for sense in entry.findall("sense"):
                pos = (sense.findtext("pos") or "")[:40]
                for gloss in sense.findall("gloss"):
                    if gloss.get("{http://www.w3.org/XML/1998/namespace}lang", "eng") == "eng" and gloss.text:
                        glosses.append((pos, gloss.text))
            if glosses:
                for word in kanji + readings:
                    reading = "" if word in readings else (readings[0] if readings else "")
                    for pos, meaning in glosses[:5]:
                        add(rows, word, reading, pos, meaning)
            entry.clear()
    return rows


def english(path: Path) -> dict:
    rows = defaultdict(list)
    with zipfile.ZipFile(path) as archive:
        for name in archive.namelist():
            if not name.endswith(".json") or name.startswith(("entries-", "frames")):
                continue
            data = json.loads(archive.read(name))
            for synset in data.values():
                pos = {"n": "noun", "v": "verb", "a": "adjective", "s": "adjective", "r": "adverb"}.get(synset.get("partOfSpeech", ""), "")
                meanings = synset.get("definition", [])
                for word in synset.get("members", []):
                    for meaning in meanings:
                        add(rows, word.lower(), "", pos, meaning)
    return rows


def shard(word: str) -> str:
    return f"{hashlib.sha256(word.encode()).digest()[0] >> 4:x}"


def main() -> None:
    parser = argparse.ArgumentParser()
    parser.add_argument("--sources", type=Path, required=True)
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    args.output.mkdir(parents=True, exist_ok=True)
    sources = {
        "zh": ("CC-CEDICT", "CC BY-SA 4.0", "https://www.mdbg.net/chinese/dictionary?page=cc-cedict", "cedict.txt.gz", chinese),
        "ja": ("JMdict/EDRDG", "CC BY-SA 4.0", "https://www.edrdg.org/edrdg/licence.html", "JMdict_e.gz", japanese),
        "en": ("Open English WordNet 2025", "CC BY 4.0", "https://en-word.net/downloads", "english-wordnet-2025-json.zip", english),
    }
    manifest = {"schema": 1, "version": VERSION, "shards": SHARDS, "languages": {}}
    for lang, (name, license_name, url, archive_name, builder) in sources.items():
        print(f"Building {lang} from {archive_name}", flush=True)
        words = builder(args.sources / archive_name)
        buckets = {f"{n:x}": {} for n in range(SHARDS)}
        for word, entries in words.items():
            buckets[shard(word)][word] = entries
        files = {}
        for code, bucket in buckets.items():
            filename = f"{lang}-{VERSION}-{code}.json.gz"
            data = json.dumps(bucket, ensure_ascii=False, separators=(",", ":"), sort_keys=True).encode("utf-8")
            packed = gzip.compress(data, compresslevel=9, mtime=0)
            (args.output / filename).write_bytes(packed)
            files[code] = {"file": filename, "bytes": len(packed), "sha256": hashlib.sha256(packed).hexdigest()}
        manifest["languages"][lang] = {"name": name, "license": license_name, "source": url, "entries": len(words), "bytes": sum(item["bytes"] for item in files.values()), "files": files, "source_sha256": hashlib.sha256((args.sources / archive_name).read_bytes()).hexdigest()}
        print(f"  {len(words):,} words, {manifest['languages'][lang]['bytes'] / 1_000_000:.1f} MB", flush=True)
    (args.output / "manifest.json").write_text(json.dumps(manifest, ensure_ascii=False, indent=2) + "\n")


if __name__ == "__main__":
    main()
