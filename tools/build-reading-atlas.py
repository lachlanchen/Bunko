#!/usr/bin/env python3
"""Reproduce Bunko's small offline atlas from pinned public-domain source data."""
import argparse
import hashlib
import json
from pathlib import Path
from urllib.request import urlopen

REVISION = 'ca96624a56bd078437bca8184e78163e5039ad19'
BASE = f'https://raw.githubusercontent.com/nvkelso/natural-earth-vector/{REVISION}/geojson/'
ROOT = Path(__file__).resolve().parents[1]
SOURCE_HASHES = {
    'ne_50m_land.geojson': 'e874b27a51d146452be360cafb3cc50c86001074a67d534113e6534682f9826b',
    'ne_10m_populated_places.geojson': '9b8e3de09048ef00dfc70357dbb9fa324493f214b5e0ae4daf1aa79a8d10116b',
}


def rounded(value):
    if isinstance(value, list):
        return [rounded(item) for item in value]
    return round(value, 3) if isinstance(value, (int, float)) else value


def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--source-directory', type=Path, help='Use previously downloaded exact source files.')
    args = parser.parse_args()
    manifest = {'sourceRevision': REVISION, 'license': 'Public domain / CC0 names', 'sources': [], 'outputs': []}
    sources = {}
    for name in ['ne_50m_land.geojson', 'ne_10m_populated_places.geojson']:
        if args.source_directory:
            raw = (args.source_directory / name).read_bytes()
        else:
            with urlopen(BASE + name, timeout=30) as response:
                raw = response.read(25_000_001)
        if len(raw) > 25_000_000:
            raise ValueError('Atlas source exceeds its size limit')
        if hashlib.sha256(raw).hexdigest() != SOURCE_HASHES[name]:
            raise ValueError('Atlas source does not match the reviewed revision')
        sources[name] = json.loads(raw)
        manifest['sources'].append({'url': BASE + name, 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)})
    rows = []
    for feature in sources['ne_10m_populated_places.geojson']['features']:
        p = feature['properties']
        names = list(dict.fromkeys(str(p[k]).strip() for k in p if (k.startswith('NAME') or k == 'LS_NAME') and p[k] and p[k] != '-99'))
        rows.append([str(p['NE_ID']), p['NAME'], p['ADM0NAME'], p['ADM1NAME'] or '', round(p['LONGITUDE'], 4), round(p['LATITUDE'], 4), names])
    land = sources['ne_50m_land.geojson']
    for feature in land['features']:
        feature['properties'] = {}
        feature['geometry']['coordinates'] = rounded(feature['geometry']['coordinates'])
    for name, data in [('atlas-places.json', rows), ('atlas-land.json', land)]:
        path = ROOT / 'src/data' / name
        raw = (json.dumps(data, ensure_ascii=False, separators=(',', ':')) + '\n').encode()
        path.write_bytes(raw)
        manifest['outputs'].append({'path': f'src/data/{name}', 'sha256': hashlib.sha256(raw).hexdigest(), 'bytes': len(raw)})
    (ROOT / 'docs/reading-atlas-provenance.json').write_text(json.dumps(manifest, indent=2) + '\n')
    print(json.dumps({'places': len(rows), 'outputs': manifest['outputs']}))


if __name__ == '__main__':
    main()
