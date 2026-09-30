# Bunko icon · September 2026

## Current icon: sky blue and salmon · 30 September 2026

The owner approved `concepts/sky-salmon-20260930/bunko-sky-salmon-preview.png`:
a mostly white background, cyan/azure 文 and border, and a salmon ぶん reading.
It is the export source for web, iOS, Watch, Mac, Android and store assets.

`icon-variants.json` records the active design and every retained alternative:
classic, vivid, jade, light-gradient and sky-salmon. Nothing is deleted when a
new design is selected. The original `bunko-classic-master.png` was recovered
unchanged from `95a2e4c^:assets/icon-foreground.png`.

## Previous electric-blue direction

`bunko-vivid-master.png` is the previous source artwork generated with
OpenAI's built-in image generation tool, editing Bunko's previous icon.
The owner requested a simple, vivid and energetic update to the existing mark.

### Previous generation prompt

Preserve Bunko's large cream-white 文 and its small coral ぶん reading above it.
Use an electric indigo/royal-blue background with a restrained gradient, confident
sweeping strokes and clear recognition at 48 px. Remove the enclosing border.
Keep a simple, polished, full-bleed opaque square. No extra symbols, slogans,
lighting effects, device mockup or decorative objects.

## Export

Run `node tools/export_icon.mjs` from the repository root. To package a retained
variant explicitly, pass its registry ID (for example `classic`). Change the
registry’s `active` value when selecting a future default. This resizes and packages
the source into web, store, iOS, macOS and Android assets without redrawing it.
Android adaptive layers reserve space for launcher masks; iOS/store masters remain
opaque square images. Splash screens share this artwork.

Updating these files prepares the next build; it does not change an already
uploaded store binary or a review in progress.
