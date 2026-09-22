# Agent notes for Bunko

Read `BRIEF.md` first: it is the product contract agreed with the owner on 2026-09-22.

- Owner: Lachlan (Rongzhou Chen), LazyingArt LLC. Store accounts, the CDP/noVNC browser, the Mac build host and the App Store Connect key are the same as for `../L-And-N`; reuse its `store/operator-handoff.md`, its publishing runbook and `../Company` rather than re-deriving them.
- Book data comes from `../ZhJpBook` (`data/interlinear/<slug>/`). **Never commit a book payload here**: only cleared, public-domain books ship, and they ship as downloadable bundles, not as files in git.
- `../ZhJpBook` has a live Codex session, a diverged public remote and a thousand uncommitted files. Read it, do not push it, do not rebase it, and do not kill the process that owns its rollout.
- Secrets stay under `~/.config/<service>/` at mode 600. Tracked docs carry curated facts only.
- Other sessions share the store browser: LazyOracle and L & N each own their own tabs, Play apps and App Store Connect apps. Create your own tabs, record their ids, and coordinate with SendMessage before restarting the stack.
