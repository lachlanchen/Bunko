# Web and PWA store access · 1 October 2026

Store opening is an explicit link tap. The web reader stays available, and links
open a new browsing context so reading state is retained. iPhone/iPad detection
includes iPadOS desktop user agents. Installed PWAs may also show the optional
suggestion; dismissing it lasts 30 days. Native app shells omit these promotions.
Desktop and mobile users can always revisit the permanent store section.

Store destinations are compiled HTTPS links for the exact app IDs. Network
responses only control availability; they cannot supply a redirect destination.
Unavailable stores show a pending state instead of sending readers to a 404.
Failed or offline checks retain the last bundled known availability.

Bunko keeps store links in **Settings → Take Bunko with you**. Its iPhone/iPad
suggestion now also works in installed PWAs, and Safari has the Apple smart
banner metadata. iOS and Mac are publicly released. Google Play returned 404
on this check, so its button stays hidden and the review message remains.
After confirming a public Google release, update `public/updates.json` with its
actual release. The store section and Android suggestion then enable Google
Play on next opening; no separate hard-coded boolean needs editing.

Validation: 69 client tests, 35 server tests, renderer, lint, TypeScript and build;
real-browser PWA dismissal/permanent Settings access, Android pending/public
routing, actual popup destinations and narrow-screen overflow checks.
