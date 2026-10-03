# Optional cloud plans

Implementation status, 3 October 2026: disabled server catalog deployed; web UI
qualified and prepared for publication.
The production service has not enabled Bunko subscriptions. Native purchase
controls, product registration and app-specific store transaction tests remain
release gates. This document describes the implemented server contract, not a
claim that plans are available to buy.

Settings and the document companion now have a Cloud plans entry in all four
interface languages. The page shows the included reading features, planned
prices, available usage, renewal/cancellation information and account sign-in.
Web Checkout/restore/management require fresh server permission. Native apps
never use Stripe as a fallback; their store bridges are still to be added.
Account changes discard pending responses, and cloud writes do not retry
automatically after an unknown network result. The server retains its explicit
idempotent recovery path for a deliberate retry.

Current source check: 81 client and 58 server tests, lint, renderer and production
build passed. A browser fixture verified all three disabled plan cards at 390px
without horizontal overflow and a 1280px dark layout. This is staged UI evidence,
not a payment receipt. The live catalog now returns all three plans with sales,
providers and quotas disabled; existing sessions, comments, documents, chats and
the book cache were preserved. Private evidence: `.runtime/cloud-plans-20261003/`.

## Scope

The owner approved US$2.99 / $14.99 / $29.99 monthly for optional private PDF
conversion and AI companion use. Books, downloaded editions, dictionaries and
offline reading remain included with the app purchase. Their code does not
consult billing. Shared OnlyIdeas plans, discounts and unified-account linking
remain proposals in [shared-account.md](shared-account.md).

| Plan | Target monthly USD | New PDF pages / billing period | AI replies / UTC day |
| --- | ---: | ---: | ---: |
| Reader | 2.99 | 200 | 40 |
| Researcher | 14.99 | 1,200 | 80 |
| Studio | 29.99 | 2,600 | 160 |

These page and reply allowances follow the corresponding OnlyIdeas levels.
An eligible seven-day trial includes 50 pages and 10 replies per UTC day.
The proposed free cloud allowance is 30 pages per calendar month and 10 replies
per UTC day. Quotas have their own disabled-by-default activation flag; current
reader behavior is preserved until the app-specific pilot is qualified.
Existing host-wide spending, file-size and storage limits remain independent.
Their production values must be checked against paid-plan capacity before sale.

## Identity and provider boundaries

- Cloud identity derives from the existing Bunko sign-in's stable numeric ID;
  provider purchases use an independent, opaque UUID account token.
- Apple bundle `art.lazying.bunko`, app record `6815137919`; products
  `art.lazying.bunko.<reader|researcher|studio>.monthly`.
- Google package `art.lazying.bunko`; products
  `bunko_<reader|researcher|studio>_monthly`.
- Stripe subscription metadata must name `bunko`; price IDs are private config.
  OnlyIdeas/EchoMind products and accounts cannot grant a Bunko allowance.
- Apple signed data is verified and rechecked with Apple's API. Google orders
  must match the verified purchase token; acknowledgement follows durable
  delivery. Reconciliation sources are encrypted using Bunko's existing key.
- Stripe uses the qualified full-price cash contract: matching subscription,
  invoice, captured charge, customer, currency and period. A marked-paid invoice
  without matching cash is insufficient. Discounts, prorated upgrades and
  customer-balance funding need a separately qualified contract before offering.
- Native pending or paused subscriptions block another purchase independently
  of whether their current entitlement grants usage. Catalog eligibility is
  affirmative authorization; empty local purchase history cannot grant it.
- Unknown Stripe Checkout creation is retried with its saved request and
  idempotency key. A later native purchase causes that Checkout to expire.

## Usage and failure handling

SQLite transactions bind receipts, subscriptions and reservations to one owner.
Receipt replay/restore cannot replenish spent allowance. Verified renewal opens
the next period, while daily AI usage remains tied to the UTC date. Revoked
receipts remain revoked even if an older active notification arrives later.

PDF pages are reserved immediately before Mathpix submission. Allowance or
storage rejection before the request leaves the document retryable and rolls
back its reservation. An ambiguous submission stays reserved; a known provider
job resumes without submitting or charging again. A successfully converted
document consumes its reservation. Failed AI replies release their cloud
reservation. Deleting files or conversations does not erase billed usage.

## HTTP contract and deployment

`POST /bunko/v1/cloud/{catalog,purchase,checkout,portal,restore}` uses Bunko's
normal origin/header checks. Catalog can describe signed-out availability;
other actions require a current session. Purchase accepts `platform` plus
`signedTransaction` (Apple) or `purchaseToken` (Google). Checkout accepts `plan`.

Provider notifications use separate bounded POST paths under
`/bunko/v1/cloud/notifications/{apple,google,stripe}`. They require provider
signature/identity verification, not an app session. Stripe verifies the exact
raw request bytes. The owned Caddy snippet defines only these explicit routes.

Optional private `billing` config contains `enabled`, `salesEnabled`,
`quotasEnabled`, an optional `accounts` pilot allowlist, `allowSandbox`,
`sandboxAccounts`, and provider settings. Never commit account hashes, private
keys, tokens or webhook secrets. Provider credential files must be regular,
owner-only files; symlinks are rejected. Both root and server lockfiles are
installed in CI. Server deployment requires `npm ci --omit=dev` in `server/`.

## Evidence boundaries

Local tests cover account/app isolation, duplicate delivery, renewal, trial
reuse, pending-payment blocking, quota rollback, resume, deletion, stale refund
replay, raw signatures, captured-cash lineage, lost Checkout recovery and
disabled-sale routes. Fixtures are not actual store purchase evidence.

Before public sale: complete native UI and account-switch tests, verify
app-specific Apple/Google purchase/restore/renewal/cancellation with real sandbox
transactions, qualify Stripe Checkout/webhooks, check account deletion and
linked-account behavior, and submit the products with the matching app build.
