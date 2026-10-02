# florinworks.dev

The main landing page for [florinworks.dev](https://florinworks.dev), the hub that links to each project's own page (for example `folio.florinworks.dev`).

## Source and preview

A buildless static site. The files in `dist/` are the maintained source.

```sh
python3 -m http.server 4174 --bind 127.0.0.1 --directory dist
```

Open `http://127.0.0.1:4174`.

## Deployment

Every push to `main` publishes `dist/` to GitHub Pages through `.github/workflows/pages.yml`. The custom domain `florinworks.dev` is set in the repository's Pages settings.

## How it is built

- `liquid.js` renders the hero's liquid glass ribbon with a single WebGL fragment shader. No libraries. It follows the cursor, pauses when off screen or in a background tab, and draws one still frame when the visitor prefers reduced motion. Without WebGL, a CSS gradient stands in.
- `app.js` runs scroll reveals, the kinetic band (drifts, then speeds up and skews with scroll velocity) and the cursor follower (fine pointers only).
- Fonts are self-hosted in `dist/assets/fonts`: Instrument Serif, Geist, Geist Mono and Big Shoulders Display (all SIL Open Font License). The page makes no third-party requests.

## Adding a project

Copy a `<li class="project">` block into the right group (Free tools or Apps) in `dist/index.html`, set its number, name, label (`p-kind`), description, tags, link and `--tint` colour, and add a strip image to `dist/assets/work/` (about 1200 px wide, WebP).
