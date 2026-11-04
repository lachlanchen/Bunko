#!/usr/bin/env python3
"""Refresh the offline APNIC allocation list; never request per-reader geolocation."""
import datetime, hashlib, ipaddress, json, pathlib, urllib.request
url = 'https://ftp.apnic.net/stats/apnic/delegated-apnic-latest'
with urllib.request.urlopen(url, timeout=30) as response:
    raw = response.read(20_000_000)
networks = []
for line in raw.decode('ascii').splitlines():
    fields = line.split('|')
    if len(fields) < 7 or fields[1] != 'CN' or fields[6] not in ('allocated', 'assigned'):
        continue
    if fields[2] == 'ipv4':
        first = ipaddress.IPv4Address(fields[3])
        networks.extend(str(n) for n in ipaddress.summarize_address_range(first, first + int(fields[4]) - 1))
    elif fields[2] == 'ipv6':
        networks.append(str(ipaddress.ip_network(fields[3] + '/' + fields[4])))
assert len(networks) > 5000, 'Incomplete allocation list; keep the previous file'
out = pathlib.Path(__file__).resolve().parents[1] / 'server/regions/cn-networks.json'
data = {'source': url, 'sourceSha256': hashlib.sha256(raw).hexdigest(), 'retrievedAt': datetime.datetime.now(datetime.timezone.utc).isoformat(), 'purpose': 'Conservative CN-registered network restriction, not precise geolocation. Apple storefront is checked separately.', 'networks': sorted(set(networks))}
out.write_text(json.dumps(data, ensure_ascii=False, indent=2) + '\n')
print(f'{len(data["networks"])} network prefixes; {out}')
