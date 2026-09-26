# Publication status — 2026-09-26

The owner requested formal review of the latest tested **1.0.4 (6)** build after internal publication. All three submissions are complete:

- iOS **1.0.4 (6): Waiting for Review**, submitted at 02:47:23 UTC. Public iOS remains **1.0.1 (2)**.
- Mac **1.0.4 (6): Waiting for Review**, submitted at 02:49:20 UTC. The earlier Mac 1.0.2 review was replaced.
- Google Play production **1.0.4 (6): Changes in review**. Google's automatic pre-review checks are running and will forward the submission when they pass. Full rollout is selected in all 172 previously configured eligible countries; managed publishing remains off.

Replacing the earlier submissions restarts their review timing. Apple releases are automatic after approval. No owner login, payment or approval action is currently required. Store acceptance is still pending; do not describe these builds as publicly available before the listings resolve. Submission receipts: [`artifacts/submission-1.0.4.json`](artifacts/submission-1.0.4.json).

Internal testing continues to offer **1.0.4 (6)** on Play and iOS/Mac TestFlight. The web reader is live at https://lachlan.lazying.art/Bunko/ . The 183-edition catalogue is independently downloadable. Android update migration and production web service-worker tests passed; no physical iPhone test was performed for this update. The original Mac runtime was tested on three Intel hosts; Apple silicon was compiled and signed.

Existing native installations must install the new binary before they can show future update prompts. Once a store release becomes public, verify availability, update `public/updates.json`, deploy Pages and verify the feed. It currently advertises only the verified public iOS 1.0.1 (2), with Android/Mac null. See [`../docs/app-updates.md`](../docs/app-updates.md).

Companion packs described in BRIEF.md remain a later product milestone and are not advertised in the store listing.
