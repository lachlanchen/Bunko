# Publication status — 2026-09-27

Latest **1.0.6 (8)** has been submitted on all three platforms:

- **iOS: Waiting for Review**, automatic release after approval.
- **Mac: Waiting for Review**, automatic release after approval.
- **Google Play: Changes in review**, build 8, 100% rollout across 172 eligible countries; managed publishing off. Console confirms automated checks completed and the changes are in review.

Apple iOS and Mac **1.0.4 (6)** are already public. Latest8 is available through iOS/Mac internal TestFlight and Play internal testing. No new invitation is needed for the existing owner tester. Google public production availability remains pending. Exact IDs and receipts: [submission-1.0.6.json](artifacts/submission-1.0.6.json).

The formal submission work is complete; approval depends on the stores. No owner login or confirmation is currently required. Keep the submitted candidates intact. When a newer release becomes public, verify it and update the public version feed. The live feed currently advertises Apple 1.0.4 (6), Android null.

## Verification limits

44 client and 8 server tests plus lint/type/build passed. Live signed iOS simulator OAuth/Keychain/process-restart/draft/sign-out checks passed, as did a separate ordinary web reader account. Earlier live Android persistence evidence remains valid. No public test comment was sent; write retry/receipt behavior has fixture coverage. Mac native authorization was not separately live-tested in this follow-up. Physical iPhone/Apple silicon runtime coverage is not claimed; prior Intel Mac reader tests cover 3040, 7050 and KVM.

## Next product work

Shared LazyingArt login is a separate successor milestone, not part of build 8. The owner requested invitation-free general registration with an optional EchoMind-only access gate, verified account linking, and comments for non-GitHub users. Coordination packets are delivered; the active EchoMind owner has the central identity request. See [shared account follow-up](../docs/shared-account.md). Do not claim this integration is live before implementation and native/provider checks.

Companion packs remain a later milestone and are not advertised in the store listing.
