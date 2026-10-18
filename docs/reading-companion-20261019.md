# Reading-companion layout update

Bunko's companion now starts with books and passages. Its header contains the
reading title and a More menu for Reading plans, privacy information and sign-out.
The document toolbar puts the reading conversation, refresh and deletion controls
on one row. Deletion still requires confirmation.

Messages scroll above a compact composer. Attachment, text and send controls
share one row; the input expands as a draft grows. File-limit and privacy details
remain available in More and in the existing consent dialog. The composer has no
persistent helper paragraphs below it.

The latest message remains visible while Markdown finishes rendering. A deliberate
scroll into older messages is retained, with a button to return to the latest.
Reduced viewport height keeps the composer reachable and hides the document shelf
on short phone layouts. Opening Reading plans and returning preserves the draft.

Reading plans uses Reader, Creator and Entrepreneur display labels. Books,
dictionaries and offline reading stay included. Product IDs, quotas, prices and
purchase gates are unchanged. Unavailable purchases remain unavailable.

The general assistant prompt also describes book reading. If interpretation fails,
an ordinary reading question no longer becomes a research-paper search. Explicit
academic-paper requests retain the existing search path. The latest question is
included when a caller supplies an empty conversation history.

## Qualification

- `npm run check`: lint, 119 UI/unit tests, 95 server tests, renderer validation,
  TypeScript and web/PWA build. Existing large-chunk warning remains.
- Eight browser captures exercise 320/390/1280-pixel widths, short viewport,
  light/dark appearance, Japanese, empty conversation and Reading plans.
- Browser checks cover late Markdown rendering, manual scroll/jump, composer
  bounds, same-row toolbar, draft retention through plans, consent/send, menu
  dismissal and no horizontal page overflow.
- Two UI regressions cover rendering versus manual scroll and draft retention.
  A server regression covers reading-question fallback and explicit paper search.

`store/screenshots/companion-20261019/manifest.json` records reviewed screenshot
hashes. These use the real React/CSS/Markdown components with synthetic local data
and a disabled purchase catalog. They are QA drafts, not public listing assets,
installed-native evidence or actual model/provider interaction.

No production deployment, store upload/review, subscription activation or remote
Mac operation is included in this checkpoint. Native packages still need their
normal accumulated build qualification. Frozen earlier artifacts are preserved.
