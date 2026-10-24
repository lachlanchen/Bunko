# Historical places in reading maps

Bunko maps the places in the selected saved response. It does not load a fixed
itinerary for a book. Changing the response changes its places, connections and
map extent. Connections depict relationships between named stops; they do not
trace ancient roads, borders or shipping lanes.

The offline atlas includes modern country outlines and names for orientation.
Historical locations use a small, book-specific gazetteer, with a source link
and an approximate-location label. In *A Record of Buddhistic Kingdoms*, this
includes Chang'an near Xi'an, Khotan near Hotan, Pataliputra near Patna, and other
identifiable cities and sites. Modern city coordinates locate the general area,
not the exact site of an ancient building or port.

The map reports how many places and connections it can display. Unknown or
disputed locations remain listed and available in the story graph. It does not
substitute a modern capital for an ancient kingdom or island. Readers can make
an explicit location choice, remove it, or reset it to the current suggestion.

Parenthesized names such as 巴连弗邑（华氏城） are matched as aliases.
Sri Lanka is shaded as a region, with a square region label rather than a city pin.
Dotted links can summarize explicit journey connections across unlocated stops;
their named intermediate stops and original connection evidence remain available.
They never imply a direct journey or guessed intermediate coordinates. Nearby
markers are separated for touch selection, with leader lines to their map positions.

## Geographic sources

- [Faxian, translated and annotated by James Legge (1886)](https://www.gutenberg.org/cache/epub/64535/pg64535-images.html): historical names and identifications. Legge explicitly disputes identifying Faxian's Takshasila with the archaeological Taxila site; this remains unpinned, alongside Kapilavastu, Jiesha and Java-dvipa.
- [Archaeological Survey of India: Silk Road sites](https://whc.unesco.org/en/tentativelists/5492/): approximate site coordinates for Sravasti, Kushinagar and Vaishali.
- [UNESCO: Mahabodhi Temple](https://whc.unesco.org/en/list/1056/) and [Lumbini](https://whc.unesco.org/en/list/666/): reference coordinates for those named sites.
- [Purba Medinipur district history](https://purbamedinipur.gov.in/history/) and [Tamluk geographic reference](https://en.wikipedia.org/wiki/Tamluk): Tamralipti's approximate modern location. The map does not identify an ancient shoreline or dock.
- [Nalanda district: Rajgir](https://nalanda.nic.in/en/tourist-place/cyclopean-wall/) and [geolocated Cyclopean Wall photograph](https://commons.wikimedia.org/wiki/File:Cyclopean_Wall_of_Rajgir.jpg): approximate Rajgir-area reference.
- [UNESCO: Site of Yumen Pass](https://whc.unesco.org/en/list/1442/maps): coordinates for the historical pass, distinct from modern Yumen city.
- Natural Earth public-domain land, populated-place coordinates, and modern country outlines. Exact source revision and checksums are in [the atlas manifest](reading-atlas-provenance.json); `tools/build-reading-atlas.py` reproduces the data.

The gazetteer supplies name identifications, not evidence that a journey occurred.
Places and connections still come from the reading response. Passage citations,
background knowledge and uncertain identifications remain distinct. A verified
quotation does not independently verify every historical interpretation in an
answer.

## Verification and availability · 24 October 2026

The historical-name adapter is deployed. Both public service entrances passed
HTTPS health checks; configuration and stored messages were unchanged. Restoring
an existing guide can now supply its documented modern-name aliases without
regenerating it or charging for another guide.

The renderer passed 170 client and 152 server tests, lint/type checks, document
renderer checks and a production web build. Safari 15-targeted native web assets
also built. Four Chromium layouts covered 320px/390px phones, desktop and a
large-text tablet, including dark appearance, zoom/fit, selection, expansion and
restored results. An isolated live model request using the public book completed
with validated quotations. This does not certify every historical interpretation
in generated prose.

[Qualification record](../store/testflight/historical-maps-20261024.json) and
[component screenshot drafts](../store/screenshots/historical-maps-20261024/manifest.json)
record the evidence and limitations. Android 1.0.14 (38) is available to the
existing Google Play internal testers. The public PWA and current production
releases are unchanged.

### Internal build 38

The account-scoped reproduction confirmed that saved responses already contained
places and routes. Name matching and map coverage caused the missing display;
the saved conversation was preserved. The backend prompt now avoids claiming
that it can inspect a client screen or that existing visual data was omitted.
The follow-up backend passed an isolated live model request and both public
health probes.

The signed Android bundle passed release lint, signature and packaged-resource
checks. An installed debug upgrade passed companion-tab, reading-context,
bookmark-return, saved-scope and crash checks. Google Play confirmed build 38
available to internal testers on 24 October 2026, with release notes in English,
Simplified Chinese, Traditional Chinese and Japanese.

Bunko **1.0.15 (38)** is VALID / IN_BETA_TESTING for iOS/Watch and universal
Mac in the existing TestFlight internal group. Apple processed both packages;
archive and exported-payload checks verified the signatures, map resources,
embedded Watch identity/version, and both Mac architectures with a macOS 12
minimum. The complete Watch and shared reading source was included in the clean
build package. Beta notes in four languages and group membership were read back.

Apple uses version 1.0.15 because iOS 1.0.14 is already public; Android build 38
remains 1.0.14. No new physical Apple UI test or public review is claimed. Signing
state was restored and the build host released. See the [build 38 record](../store/testflight/historical-map38-20261024.json)
for the artifacts, delivery state and test coverage.
