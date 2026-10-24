# Mainland availability correction

Apple rejected Bunko Mac 1.0.14 (37) for generative-service availability and
provider references in metadata for mainland China. China distribution remains
selected. The Mac successor disables companion generation and uploads for a
mainland Apple storefront, device region or CN-registered network. An unresolved
Apple storefront keeps those features unavailable until confirmed.

The reader, downloads, dictionaries, discussions, accounts and stored history
remain available. Region is independent of book/UI language; no GPS permission
is requested. A short Settings notice explains availability. Required consent and
privacy disclosures remain in place; rejected provider names are removed from
Mac store descriptions.

The server uses an offline APNIC allocation list, refreshed with
`python3 tools/update-cn-networks.py`. It is a conservative registration signal,
not precise physical geolocation. StoreKit storefront and device-region checks
are separate. The ingress overwrites the client-address header; arbitrary
forwarded-country headers do not establish eligibility. Client country facts can
restrict service but cannot grant account or billing authority.

Qualification so far: 177 client tests and 156 server tests, lint, document
renderer and production/Mac web bundles pass. Both public API origins pass
CHN/USA/unknown-storefront checks and reject an injected client-address header.
The immutable backend release preserves config and message-state digests.

Native Mac build 39, actual runtime checks and formal resubmission are pending.
The iOS StoreKit adapter is prepared but is not a delivered iOS build.
