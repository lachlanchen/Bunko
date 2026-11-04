# Reading response recovery

## Cause and correction

Some DeepSeek JSON-mode answers contained literal Markdown line breaks inside
quoted JSON strings. The answers were complete, but strict JSON parsing rejected
them. A second provider call could repeat the same formatting defect. Ordinary
questions then received a misleading reading-guide error.

The reading adapter now escapes control characters only inside JSON strings,
preserving the answer text and all evidence fields. It does not complete truncated
JSON, invent fields, discard citations, or accept extra trailing content. Normal
schema, entity-reference and exact-quotation checks still apply. Structural repair
receives bounded field-specific diagnostics; answer repair requests only answer
fields rather than guide arrays.

Source `5b2f54025dfd516f7e26d099d71f49f636be3f6c` also removes the second
display of an error already visible in chat. Guide-view failures remain visible.
That client change is tested and staged for the next cumulative app build; it is
not in the existing build35 binaries or deployed PWA.

## Qualification

- Full check passed: 155 client tests, 146 server tests, lint, document renderer
  and production web build.
- Both captured malformed provider responses recovered with their text intact.
- A fresh Chinese whole-book relationship answer completed in one DeepSeek call
  in 8.0 seconds, using an isolated local database.
- A fresh whole-book guide completed in one call in 25.8 seconds: 20 people,
  18 relationships, eight places and 12 events. These are provider qualification
  results, not a claim of exhaustive literary or historical accuracy.
- Tests retain rejection of fabricated quotations, truncation, bad escapes,
  invalid fields and extra JSON; preserve account-bound history; and verify that
  formatting recovery uses one allowance while rejected evidence releases the
  cloud reservation.
- Actual component browser checks at 320, 390 and 1280 pixels showed one error,
  with no horizontal page overflow. Light and dark captures use synthetic content
  and are engineering evidence, not store screenshots. Browser and local fixture
  server were closed afterward.

## Deployment

The two backend modules were promoted on 22 October 2026 at 21:25 UTC
(23 October HKT), with a consistent database backup and unchanged configuration.
Both public HTTPS health endpoints returned 200/ready; anonymous agent calls
remained denied with 401. A further test using the deployed modules, service
identity and configured provider completed the reported request in one call in
8.2 seconds. It used an isolated database and did not alter customer history.

Two earlier promotion checks restored the prior release: the service's loopback
listener expects its canonical legacy Host, and the dedicated public hostname
was unreachable from that server while reachable externally. The final checks
used the canonical loopback route and verified both public routes from outside.
No ingress, DNS or firewall setting changed. These network observations do not
establish their underlying cause.

The server fix applies to installed clients immediately. Failed historical
messages remain unchanged; readers can resend their question. Native internal
availability remains build35; no new binary or public review was submitted for
this server repair.

Curated deployment hashes are in
[the recovery receipt](../store/testflight/reading-response-recovery-20261023.json).
