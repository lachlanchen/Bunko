# Bunko icon · September 2026

`bunko-vivid-master.png` is the approved-direction source artwork generated with
OpenAI's built-in image generation tool, editing Bunko's previous icon.
The owner requested a simple, vivid and energetic update to the existing mark.

## Generation prompt

Preserve Bunko's large cream-white 文 and its small coral ぶん reading above it.
Use an electric indigo/royal-blue background with a restrained gradient, confident
sweeping strokes and clear recognition at 48 px. Remove the enclosing border.
Keep a simple, polished, full-bleed opaque square. No extra symbols, slogans,
lighting effects, device mockup or decorative objects.

## Export

Run `node tools/export_icon.mjs` from the repository root. This resizes and packages
the source into web, store, iOS, macOS and Android assets without redrawing it.
Android adaptive layers reserve space for launcher masks; iOS/store masters remain
opaque square images. Splash screens share this artwork.

Updating these files prepares the next build; it does not change an already
uploaded store binary or a review in progress.
