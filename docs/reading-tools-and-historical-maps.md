# Reading tools and historical maps

The reading assistant can look up places, inspect available historical map layers
and search the authorized book selection before producing a guide. Follow-up
questions keep the selected conversation branch and its prior visual results.

## Map behavior

Historical provinces are colored areas with selectable labels and details. Cities
remain point locations. The map supports zoom, pan and fit; labels avoid each other
at compact widths. A province overview does not draw adjacency lines unless the
reader chooses to show the returned connections.

The Eastern Han layer depicts approximate provincial geography around **140 CE**.
It is a reference for reading later Han passages, including 191 CE; it does not
establish exact later borders or military control. Western areas outside the
source map's extent are cropped. The layer's year, attribution and license remain
visible in the map. Unknown or ambiguous places stay unresolved until qualified.

The source is [Zunkir's map, using Kanguole's base](https://commons.wikimedia.org/wiki/File:Han_orientaux_140.svg),
licensed CC BY-SA 4.0. `tools/build-han-atlas.py` reproduces the simplified region
geometry from the pinned SVG. Build-only dependencies are `shapely==2.1.2` and
`svg.path==7.0`. See `public/reading-atlas-NOTICES.txt` for attribution and changes.
The adapted layer retains its license; it does not change the application's code
license. The modern place atlas is shared by the server and client without a
second payload copy.

## Execution and validation

- `lookup_places` returns known location identifiers, dates and source references.
- `list_map_layers` returns the actual available layer years and region sets.
- `search_passages` searches only the already authorized selection. It cannot
  extend a passage request into later chapters or another account's files.
- AgInTiLite runs at most four model steps and six tool calls per attempt, with
  the final step reserved for synthesis. The existing total request deadline and
  single repair attempt remain in force.
- Bunko validates source quotations, required visual groups, known location IDs,
  period selection and requested Han-province coverage before saving the result.
  An incomplete map produces specific repair feedback for the capable route.
- Tools have no shell, arbitrary URL fetch, account selection or write access.
  Existing provider consent, routing, quotas and private conversation boundaries
  remain in the application layer.

Older saved maps receive location identifiers at read time when their names and
period match. Their stored messages are not rewritten. This preserves the
original conversation while enabling the new renderer.

## Qualification · 26 October 2026

`npm run check` passed: 181 client tests, 169 server tests, lint, document renderer
checks and the PWA resource build. Additional server tests exercise tool dispatch,
multi-step transcripts, unknown tools, source scope, dated regions, incomplete
coverage, legacy read-time enrichment and the final-step budget.

A real DeepSeek run against an isolated database created the 13-region map and
then retained it while adding Luoyang, Chang'an and Xiangyang. Both turns completed
in 18.6 seconds with four model calls; all 16 place identifiers resolved. The
second account saw no messages, and the first saved result remained intact.

The qualified backend is deployed. A separate real HTTPS check completed a new
13-region map in 10.16 seconds and read it back from saved history. Its synthetic
demo message was removed separately; reader history was preserved.

Chromium checks at 320, 390, 768 and 1280 pixels passed selection, restored views,
zoom/fit and horizontal-overflow checks. All 13 region labels were present without
overlap, including dark theme and enlarged interface text. These component checks
are distinct from installed-device tests. `tools/build-reading-map-fixture.mjs`
also prepares a synthetic fixture for the isolated Mac Debug WebKit harness;
those fixture files are excluded from release resources.

Internal build41 carries the client update. Its delivery receipt will record
actual Apple/Google availability after processing. Mac40's formal review and the
public PWA remain unchanged during this internal round.
