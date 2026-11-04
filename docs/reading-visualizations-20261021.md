# Interactive reading guides — 21 October 2026

## Implemented

The reading companion now renders relationships with Dagre, including labelled
edges, arrows for supported directional relationships, full-name wrapping,
search, focused neighborhoods, complete overview, graph/tree layouts, pan/zoom
and an expanded view. Independent groups are packed together. Compact screens
start with a vertical layout. Every returned entry and its passage evidence
remains accessible; a generated guide is not guaranteed exhaustive.

Places use an offline D3 geographic map with Natural Earth 1:50m land and 7,342
populated places. Multilingual exact-name matches remain suggestions; ambiguous
and fictional places are not assigned invented coordinates. Readers can confirm,
change or remove a pin locally. The map does not send geocoding queries. Pin
labels stay readable when the map is zoomed; a story graph remains available.

The timeline offers narrative and calendar order. Its date parser accepts only
an exact time phrase occurring in a cited quotation, retains year/month/day
precision and separates unknown or approximate dates. Events sharing a date
occupy separate selectable lanes. Year intervals show their stated precision.
This is a reading reference, not an assertion about historical calendar systems.

Guide generation now permits 32 people, 64 relationships, 24 places, 32 routes
and 48 events within the existing bounded model operation. Short-paragraph
chapters can include up to 800 passages under the unchanged 48,000-character
budget. Whole-book sampling remains bounded; actual chapter/partial coverage is
visible. One repair receives all identified invalid quotations together, while
exact source validation remains mandatory. Shared public guides, private
questions, account isolation and quota settlement retain their existing rules.

## Verification

- Final `npm run check`: 138 client tests, 116 server tests, ESLint, TypeScript,
  equation/table/figure/escaping renderer checks and PWA build passed.
- Regressions include independent graph groups/exact edge identity, 48
  simultaneous timeline events, and graph layout with `Object.hasOwn` and
  `structuredClone` removed. Conditional shims preserve native implementations.
  Native/Mac web builds passed.
- Thirty browser captures/checks covered 320px and 390px phones, desktop, night
  theme, Japanese and 150% body/control text. Actual pointer taps, relationship
  evidence, pan, zoom, expansion/Escape, focus containment, offline pin choices,
  story-map switching and horizontal overflow checks passed. These are browser
  results, not installed-device or physical Monterey runtime results. Five more
  browser captures/checks passed with both modern builtins deliberately absent.
- Actual DeepSeek through pinned AgInTiLite generated a guide from the public
  Three Kingdoms preface and answered a passage question. Exact quotation
  validation passed; a second isolated account reused the guide without another
  generation. Three model calls, 30.985 seconds, isolated in-memory data only.
- Atlas inputs/outputs are pinned in `reading-atlas-provenance.json`; the local
  reproduction check passed. New Dagre/D3 packages had no advisories in the
  captured dependency audit; this is not a claim that the entire existing
  dependency tree has no advisories.

[Reviewed screenshot drafts](../store/screenshots/reading-guides-20261021/manifest.json)
are genuine component captures. Map/calendar journey data is explicitly synthetic;
these drafts are not storefront uploads. Public listings must use current
qualified app captures when this feature is formally released.

## Delivery update

The cumulative visualization work is now included in internal build31 on
iOS/Watch, Mac and Android. See the [verified delivery receipt](signin-guides31-20261021.md).
The earlier source-only checkpoint below is retained as dated evidence.

## Original delivery and dependencies

This is successor source after internal build29. No new native upload, public
review, production deployment, identity activation or billing change is claimed
by this receipt. Build29 remains available in the existing Apple/Google internal
groups; its shared Mac operation is closed and cannot be reused.

AgInTi's existing local image primitive is not an authenticated multi-user job
service. Its owner has prepared an isolated offline worker candidate with scoped
ownership, idempotent dispatch, bounded verified images and explicit unknown
outcomes; its reported 23 worker tests passed. It is not a live app service.
Bunko illustrations remain disabled until that worker and the app adapter are
qualified. Factual coordinates, relationship labels and event dates continue to
come from validated data, independent of a future generated visual layer.

Google, Apple, GitHub and LazyingArt sign-in can retain GitHub book/discussion
storage. [The account audit](identity-and-github-storage.md) records the existing
link-only adapter, the required session/authorship/native-return work and the
unchanged legacy account boundaries. That audit did not activate new login paths.
