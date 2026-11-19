# Sunset Cover Studio

[![make.fun · gta6-cover-art-01](https://make.fun/badge/gta6-cover-art-01.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![rank](https://make.fun/badge/gta6-cover-art-01/Morenoo-del/makefun-gta6-cover-art/rank.svg)](https://make.fun/bounty/gta6-cover-art-01/leaderboard?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)
[![reward](https://make.fun/badge/gta6-cover-art-01/Morenoo-del/makefun-gta6-cover-art/reward.svg)](https://make.fun/bounty/gta6-cover-art-01?utm_source=github&utm_medium=readme&utm_campaign=gta6-cover-art-01)

Turn your own photos into bold, multi-panel cover art in the style of a Vice City sunset poster — right in your browser, with nothing uploaded anywhere.

## What it does

- **Six layouts** — four-panel grid, hero + three, full-bleed single photo, nine-panel cover with a title block, tilted snapshot collage, and a story/portrait layout. Each one frames your photos with thin white gutters and a big title block.
- **Five colour grades** — Vice Sunset, Neon Nights, Palm Dusk, Golden Hour and Teal Noir, applied as canvas gradient maps and overlays.
- **Your photos, your crop** — add photos from your device (file picker or drag-and-drop), put one photo in every panel or a different photo in each, then click a panel to drag it into place and scroll to zoom. Four sample photos are built in so you can try it straight away.
- **Lettering you can edit** — the title is set in Anton with a sunset-gradient fill and dark outline, the subtitle in Pacifico script. Both are editable, live, in the preview.
- **One-click PNG export** — 1920 × 1080, 1080 × 1350 and 1080 × 1080, straight to your downloads. Pick the size in the top bar, hit Export PNG, done — three clicks from a loaded photo to a shareable cover.
- **Polish** — film grain, vignette, halftone title block, a ribbon badge, undo/redo, and a randomise button that shuffles layout + grade.

## Run it

Serve the `app/` folder with any static server and open `index.html`:

```sh
cd app
python3 -m http.server 8080
# open http://localhost:8080 in desktop Chrome
```

No build step, no network requests at runtime: every script, font and sample photo is a file under `app/`. Your photos are read on your own machine and never leave it.

## How it works

- `app/src/cover.js` — the rendering engine: `layoutFourPanel`, `layoutHeroThree`, `layoutFullBleed`, `layoutNineGrid`, `layoutTiltedCollage`, `layoutStoryPortrait`, `applyGrade`, `drawTitleLettering`, `drawFilmGrain`, `drawVignette`, `renderCover` and `exportCoverPng`.
- `app/src/main.js` — the editor: photo tray, pickers, panel crop/position, undo/redo, randomise, and the `?shot=` scenes the screenshots were taken from.
- `app/fonts/` — Anton and Pacifico, both under the SIL Open Font License (licence texts beside them).
- `main.ts` — hands the entry in: copies `app/` and `screenshots/` to the output directory and writes `dossier.json`.

All artwork, lettering and names are original — no Rockstar Games logos, artwork, characters or fonts.

Made for the make.fun bounty [gta6-cover-art-01](https://make.fun/bounty/gta6-cover-art-01). If you enter too, my referral link is https://make.fun/r/w6xj1ecj.

## License

MIT — see [LICENSE](LICENSE).
