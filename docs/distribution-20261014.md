# Bunko distribution · 14 October 2026 HKT

| Platform | Public release | Latest update |
| --- | --- | --- |
| iOS / paired Watch | **1.0.13 (23)** | Released automatically after approval |
| Google Play | **1.0.12 (22)** | 1.0.13 (23) still in review; automatic release after approval |
| macOS | **1.0.8 (10)** | 1.0.13 (23) IN_REVIEW; automatic release after approval |

Verified at `2026-10-13T22:12:22.873757+00:00`. No approved release was waiting for a manual publish action.
The exact Apple build and completed iOS review match the US/Hong Kong public
lookup and iPhone page. All 175 configured Apple storefronts are available,
with availability enabled for new territories and no iOS phased release.
The US Apple download price remains $0.99.

Google production and Publishing overview were checked in the signed-in Console.
Bunko targets 172 countries/regions with managed publishing off and no
unsent changes. Public Play pages return HTTP200. The public Play listing correctly retains the approved build22 while build23 is reviewed.

The separate public Mac page matches the older approved Mac release. The current
Mac review remains active. Apple public phone/tablet/Watch screenshot counts were
checked separately from the still-pending Mac update; see the exact receipt.

[Exact provider state and identifiers](distribution-20261014.json) ·
[Submitted builds and test boundaries](latest-review-20261013.md)

This release completion did not change binaries, content, authentication, prices,
subscriptions, territory selection or review candidates. General subscription
purchasing remains disabled. The already-qualified packages were reused; no new
purchase or native-device test is claimed. Private evidence remains in Bunko's
`.runtime/distribution-20261014/`.

## Update prompt deployment

The live release feed now advertises iOS **1.0.13 (23)**, Android **1.0.12 (22)**
and Mac **1.0.8 (10)**. Commit `925d01b49496a69652874bc6f4c8808a7df78740`
changes only `public/updates.json` on the published main baseline. The normal
CI checks and Pages deployment passed; an uncached HTTPS readback matched the
committed JSON. Pending Android23 and Mac23 are not advertised as public.

[Successful Pages deployment](https://github.com/lachlanchen/Bunko/actions/runs/38476064536)

The owned noVNC6190/CDP9490 desktop was stopped after evidence capture. Its
persistent authenticated profile remains available for the next release check.
No Mac desktop, device, emulator or peer runtime was used.
