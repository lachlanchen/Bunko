# Reading companion runtime

Bunko uses DeepSeek Flash for reading questions and cited visual guides. The
backend runs on Bunko's server; it does not depend on a desktop Codex session.
Books, dictionaries and offline reading keep their existing access.

## Models and administration

The companion's More menu offers **Assistant models** to configured administrators.
The server checks the authenticated account against a numeric ID allowlist.
Ordinary readers and demo/reviewer accounts cannot change models.

The catalog includes:

| Choice | Intended use |
| --- | --- |
| DeepSeek 4.1 Flash | Default reading questions and guides |
| DeepSeek Pro compatibility alias | Currently routes to Flash |
| GPT-6 Luna, low reasoning | Optional economical OpenAI route |
| GPT-6.1 Sol, low reasoning | Optional balanced OpenAI route |
| GPT-6 Astra, low reasoning | Optional higher-cost route for difficult questions |

Model names and capabilities were checked on 20 October 2026. DeepSeek documents
that `deepseek-v4-pro` currently routes to Flash; its label reflects that.
See [DeepSeek's migration notice](https://api-docs.deepseek.com/news/news260910/),
[GPT-6 Luna](https://developers.openai.com/api/docs/models/gpt-6-luna),
[GPT-6.1 Sol](https://developers.openai.com/api/docs/models/gpt-6.1-sol), and
[GPT-6 Astra](https://developers.openai.com/api/docs/models/gpt-6-astra).

Only routes with server credentials and an explicit qualified-model entry can
be selected. Credentials never appear in the app or administration response.
The deployed default remains Flash, with no automatic fallback selected.
DeepSeek Flash and the Pro alias passed actual Bunko-credential requests.
OpenAI routes are implemented and covered by transport tests but remain disabled:
no Bunko OpenAI API credential or live account qualification is recorded.

Settings use the existing authenticated `POST /bunko/v1/agent/state` route with
`adminModels: true`; a save requires the current settings revision. Endpoint
addresses, credentials and permission lists cannot be supplied through this UI.
Protected server configuration uses `agent.models.adminUserIds` and
`agent.models.providers.<provider>.{token,qualifiedModels}`. Qualify a provider's
actual model access and the public privacy notice before adding it to that list.
Keep the existing `agent.model` route during a staged transition.

A configured fallback is used only for explicit temporary provider statuses
429/502/503/504, within the same request deadline. Cancellation, authentication
failure, malformed output and failed citation checks do not silently switch
providers. A reader sees a new consent notice before text can be sent to an
additional provider.

## AgInTiLite

Bunko vendors the seven-file, dependency-free source package
`@lazyingart/agintilite@0.1.0-preview.1`, commit
`78a6c925b55792761994c1881bd909f6c0ce97dd`. The exact package and source hashes
are recorded in [its provenance manifest](../server/vendor/agintilite/provenance.json).
Apache-2.0 license and attribution files accompany the source.

The package supplies bounded execution, cancellation and closed JSON-schema
validation. Bunko currently retrieves the authorized reading range
deterministically, then uses Lite for structured book answers and guides.
This avoids spending a model turn deciding which account or book it may read.
The generic read-only tool loop is available for separately qualified tools.

Bunko retains authentication, provider consent, account-scoped history, source
retrieval, citation validation, durable requests and quota commits. No shell,
browser, plugins, ambient credentials or desktop agent are exposed to the model.
General companion and private-document requests use the same model router.
This integration does not activate another app's providers or share its data.

## Reading references

Open the companion from a book to keep its current bookmark. Use **@** to choose
a book, chapter, paragraph or sentence. The general companion also offers @;
its draft carries into the selected book conversation. References and drafts
survive a detour to the source text. Returning to the companion restores the
chat, while returning to the original reader keeps its bookmark.

Selected sentences are checked against the canonical edition. Source links
carry the book, chapter file, paragraph and language. A temporary source view
shows that language without changing the reader's saved language preference.
Right-swipe navigation ignores selection and horizontal content scrollers and
suppresses accidental button clicks after a completed swipe.

Whole-chapter and whole-book scopes are explicit because they can reveal later
events. Long-book overviews use at most eight evenly distributed chapter
excerpts, with a bounded text budget and an incomplete-coverage indication.
They never claim full coverage when only excerpts were used.

Fixed public-book guides reuse the existing edition/range cache across readers.
Questions, drafts and private conversations remain account-scoped. The service
checks every quotation and locator before accepting a guide. Matching a quote
does not prove every interpretation; source links, uncertainty labels and report
controls remain part of the reading experience.
