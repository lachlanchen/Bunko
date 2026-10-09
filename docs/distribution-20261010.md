# Bunko distribution · 10 October 2026 HKT

| Platform | Public release | Latest update |
| --- | --- | --- |
| iOS / Watch | **1.0.11 (18)** | Released automatically after approval |
| Google Play | **1.0.11 (18)** | Active production, 100% rollout, 172 countries/regions |
| Mac | **1.0.8 (10)** | 1.0.11 (18) still IN_REVIEW; automatic release after approval |

Verified at `2026-10-09T21:33:10.375933+00:00`. Both mobile releases were already public; no manual
release request or store setting change was needed. The exact Apple build and
completed review match the US/Hong Kong public listings and iPhone page. All 175
configured Apple territories are available, with no iOS phased release. The US
Apple download price remains $0.99. Google shows no unpublished changes and
managed publishing off; both public Play listings return HTTP200.

Mac review status and the public `platform=mac` page were checked separately.
The latest Mac build is not yet public. Its active review remains intact.

[Exact provider state and identifiers](distribution-20261010.json) ·
[Previous submission and test qualifications](latest-review-20261009.md)

General subscription purchases remain disabled. This distribution check did not
change app code, authentication, content, pricing or subscriptions. No new native
build or device test is claimed; the previously qualified uploads were released.
Private raw responses and screenshots are retained in Bunko's
`.runtime/distribution-20261010/`.

## Update prompt deployment

The live release feed now advertises iOS/Android 1.0.11 (18) and retains Mac 1.0.8 (10).
Commit `9a6f94c50b9546093d987c28d858bf413b03864d` changes only
`public/updates.json` on the previously deployed main baseline. All 139 tests,
lint, renderer, TypeScript and the production build passed. A cache-disabled
readback of the live HTTPS JSON matched the exact committed feed. Native assets
and other feature-branch web changes were not included in this deployment.

[Pages deployment](https://github.com/lachlanchen/Bunko/actions/runs/37994100780)
