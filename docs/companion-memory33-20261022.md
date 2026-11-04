# Reading companion: book knowledge and saved guides

The companion can answer whole-book questions using broader knowledge of the
identified work alongside the current reading passages. Background claims are
labelled separately from passage evidence. Every quotation is still checked
against the supplied edition. Whole-book questions may include spoilers;
ordinary passage questions retain their reading boundary.

Conversations belong to the reader and the book, so changing chapters or reading
languages no longer starts an empty chat. Existing passage conversations are
recovered within their original account. Six recent completed responses provide
bounded conversational memory; private questions never enter the shared guide
cache. Clearing the account's assistant history still removes those messages.

Saved relationship graphs, maps, routes and timelines have a compact selector.
Opening a guide from an older message selects that exact guide. Public guide
artifacts remain available offline; a cache miss at a new passage does not erase
them. Source links continue to open the original chapter and paragraph.

Long chapter names use two-line previews with a separate expansion control.
The reference picker abbreviates long options and offers the full title. Reader
headings can expand without navigating away.

## Validation

- 148 client tests and 141 server tests pass, with lint, renderer and production
  web build checks.
- Actual DeepSeek calls generated a whole-book Romance of the Three Kingdoms
  guide (22 people, 25 relationships, nine places, four routes, 12 events) and a
  separately verified whole-book answer from a current-passage context. The
  answer completed in one call. Public guide reuse made no second provider call.
- The live test exposed overlong guide output and guide arrays in plain answers.
  Compact guide instructions, format-specific answers and actionable bounded
  repair feedback address those failures; original failed evidence is retained.
- Seven browser layouts passed: phone, 320px, desktop, keyboard-height, dark,
  Japanese and enlarged text. Captures use labelled synthetic content. A separate
  320px long-title check confirmed two-line collapse, full expansion and no
  unintended navigation.
- The Bunko-owned backend update is live with its previous release and consistent
  SQLite backup retained. Identity configuration, subscriptions and rewards are
  unchanged. Build33 (1.0.14) is VALID / IN_BETA_TESTING for iOS/Watch and Mac
  in the existing internal group; Android33 is available on the internal track.
- Installed Android33 smoke checks passed for the public book index, saved-guide
  selector, background labels, graph/map/timeline tabs and horizontal containment.
  No new iOS/Mac device GUI session ran; both actual signed bundles passed their
  resource, identity, Watch, universal-Mac and minimum-OS checks.

This is internal-test evidence, not a new public-store release announcement.
