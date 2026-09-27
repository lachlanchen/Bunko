# Private document companion · candidate

The successor to Bunko 1.0.6 adds a private document workspace. Build 8's store
reviews do not contain this feature. Cloud deployment and successor native
acceptance remain release gates; the shared LazyingArt adapter stays disabled.

## Reader experience

Attach PDF, DOCX, Markdown/MMD, UTF-8 text or TeX from the chat composer. A document
has its own conversation, flowing reader, figures, equations and adjustable text.
General conversations can search open research indexes and import a chosen PDF.
Uploads stay private; there is no automatic publication to `bunko-books`.

PDF: up to 20 MB / 30 pages, converted through Mathpix with a durable receipt.
Word/TeX: restricted Pandoc 3.11 with `--sandbox`, fixed arguments, bounded time
and heap. Originals are removed when conversion succeeds. Missing referenced
figures fail conversion rather than disappearing silently. Scanned equations and
text can still contain OCR errors; the reader must verify important details.

Long documents use selected, numbered passages for questions. Answers say when
context is incomplete and distinguish source claims from interpretation.
Documents and AI answers are separate. Remove a document to remove its conversation,
or use Delete companion data for the whole private workspace. Reporting an answer
sends that answer and the reader's reason to the operator.

## Service and limits

`server/agent/` uses the existing encrypted database and authenticated Bunko
sessions. Ownership is derived from verified GitHub numeric IDs. Secrets and
provider tokens stay on the cloud service. Downloads require public HTTPS, pin
vetted DNS addresses and revalidate redirects. Local/private network access is
rejected. PDF/ZIP/DOCX sizes and expansion are bounded.

A single converter runs at a time. Imports and questions have durable request IDs;
ambiguous Mathpix submissions are not automatically repeated. Deletion guards
prevent a late conversion/answer recreating deleted data. Per-user and shared daily
limits bound provider usage. Minimal hashed usage records expire after 30 days.

Paper search coalesces requests, caches bounded results for ten minutes, and backs
off failing providers. OpenAlex, arXiv and Europe PMC are metadata sources; only
open-access PDF locations are shown. Open access does not grant republication
rights. No access restriction is bypassed. Direct PDF links are also supported.

Configure `agent.enabled`, `agent.pandoc`, `agent.mathpix`, `agent.model` and optional
`agent.openAlexKey` in the private service config. Keep this disabled until the
service, privacy disclosures, live authentication and native file selection pass.
`server/package-lock.json` installs service dependencies separately from the web
build. Deploy the complete `agent/` directory, not the older four-file package.

## Rendering and dependency review

`tools/build-document-renderer.mjs` builds Mathpix from its installed sources. Its
prebuilt upstream bundle embeds older dependencies and must not be copied into a
release. Overrides pin Markdown-it 12.3.2, Linkify-it 5.0.2, PostCSS 8.5.28 and UUID
11.1.1. Markdown-it's remaining smartquotes advisory is mitigated by always setting
`typographer:false`; automatic linkification is also disabled. Low-severity
webpack polyfill dependency advisories remain in the package tree; that webpack
plugin is not used by our esbuild pipeline. A clean audit is not claimed.

The browser renderer disables raw HTML, sanitizes HTML/SVG/MathML, removes external
figure requests and uses only document-owned image blobs. Assistive MathML remains
available to screen readers without duplicating visible equations. The compiled
bundle test covers startup, equations, a table, a figure and raw-HTML escaping.

## Verification recorded 2026-09-27

- 44 frontend tests and 27 server tests passed, plus the production web build.
- Compiled renderer test passed after replacing the old embedded dependencies.
- Visible 390 px QA: original Word upload → conversion → reader → live Q&A;
  equation, table and figure preserved, answer cited numbered passages.
- Original one-page PDF → live Mathpix → flowing reader: two equations and one
  figure, fitting the phone width. The screenshot exposed and led to fixes for
  duplicate accessible math and Word image dimensions.
- Provider fallback returned real open-access paper metadata. Visible chat search → Convert & read → Mathpix → mobile reader passed for
  an open Wootters paper, rendering 243 math expressions at 390 px. The source
  has no figures; separate PDF and Word fixtures verify figure preservation.

QA uses an isolated fixture identity and private runtime data. This does not
qualify production OAuth or physical iOS/Android file selection.

### Additional real-paper acceptance

The visible chat → PDF download → Mathpix conversion → flowing reader path was
checked at a 390 × 844 viewport with these freely accessible arXiv papers:

| Paper | Source | Preserved content |
| --- | --- | --- |
| Attention Is All You Need | [1706.03762](https://arxiv.org/abs/1706.03762) | All 5 figures loaded; 4 tables and rendered equations |
| Deep Residual Learning for Image Recognition | [1512.03385](https://arxiv.org/abs/1512.03385) | All 7 figures loaded; 15 table elements and rendered equations |
| Entanglement of Formation of an Arbitrary State of Two Qubits | [quant-ph/9709029](https://arxiv.org/abs/quant-ph/9709029) | Inline and display equations; source has no figures |

Inspection found and corrected page-wide overflow from long equations, unwanted
inline equation scrollbars, and run-together author affiliations. Wide display
equations scroll independently; the reader's measured content and scroll widths
are both 375 px (the remaining viewport width is its vertical scrollbar).
Exact modern arXiv IDs now bypass keyword search; the live agent returned the
requested PDF for `1706.03762` after the fix. An automated regression also checks
that this path downloads and validates the PDF without calling broad search.

These are layout and preservation checks, not a line-by-line OCR accuracy audit.
Converted papers and screenshots remain private runtime evidence, outside Git
and the public catalogue. The new icon and companion still require a successor
native release; the existing build 8 review is unchanged.

## iOS 1.0.7 verification (27 September 2026)
The native picker uploaded a DOCX through ordinary GitHub authorization to the live
cloud service. Its figure and equation rendered successfully. The app agent found
and imported arXiv quant-ph/9709029, rendered 243 math elements within a 402 px
viewport and answered with passage citations. Account, documents and conversation
returned after process restart. These checks used a private Debug simulator driver
with the production JavaScript bundle; the driver is absent from the signed IPA.
The shared cloud stores at most 256 MB of companion content and refuses additional
growth before disk headroom falls below 350 MB. Deletion and reading stay available.
