# Bunko store status · 17 October 2026

| Platform | Latest uploaded build | Current status |
| --- | --- | --- |
| iOS and paired Watch | 1.0.13 (23) | Ready for Distribution |
| Google Play | 1.0.13 (23) | Available on Google Play, 172 countries |
| Universal Mac | 1.0.13 (23) | In Review; automatic release after approval |

Build 23 is still the latest uploaded Bunko candidate. No duplicate review or new
binary was created. The active Mac review is preserved. Subsequent optional
shared-account and earned-points work remains staged and disabled.

The update feed advances Android from build 22 to the approved build 23. iOS
remains at 23 and Mac at its public 1.0.8 (10). This feed change is applied to the
deployed web baseline independently of the staged shared-account branch.
Main commit `106988a3c0ac3284987b431c5147a7fb658f52ae` deployed successfully
in Pages run `38972663675`; an uncached live JSON read matched all three versions.

OnlyIdeas' newer 1.0.8 (34) test builds were submitted separately for iOS/Watch,
Mac and Google Play review. Its exact submission and qualification receipt is in
the OnlyIdeasApp repository, `docs/latest-review-20261017.md`.

Store accounts, pricing, billing and user data are unchanged. App Store Connect
and the existing isolated store browser supplied the status evidence; no Mac
desktop or native device was used.
