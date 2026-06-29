# Screenly App Store

Screenly Apps for digital signage — a static site built with
[Hugo](https://gohugo.io/) (extended) and [Bun](https://bun.sh/) for JavaScript
dependency management, linting and tests.

## Requirements

* [Hugo extended](https://gohugo.io/installation/) `0.157.0+`
* [Bun](https://bun.sh/) `1.3+`

## Quickstart

Install the JavaScript dependencies and start the dev server with live reload:

```
bun install
bun run dev
```

The site is then available at http://127.0.0.1:8080

## Common tasks

| Command          | Description                                            |
| ---------------- | ------------------------------------------------------ |
| `bun run dev`    | Run the Hugo dev server with live reload (port 8080)   |
| `bun run build`  | Build the production site into `public/`               |
| `bun run lint`   | Lint the JavaScript with ESLint                        |
| `bun run test`   | Run the unit tests with `bun test`                     |

## How it fits together

* **Content** lives in `content/`; each app is a page bundle (e.g.
  `content/weather/index.html`). The homepage app list is generated from these
  pages, so adding or removing an app updates the listing automatically.
* **Templates** are in `layouts/` (Go templates / Hugo partials).
* **Styles** use [Tailwind CSS v4](https://tailwindcss.com/) (`assets/css/app.css`),
  compiled by Hugo via PostCSS and fingerprinted. Design tokens live in the
  `@theme` block; reusable patterns in `@layer components`.
* **JavaScript** is plain modern ESM in `assets/js/` — no jQuery. The only
  third-party libraries (clipboard.js, Sentry) are installed via Bun and bundled
  locally by Hugo's esbuild; nothing is loaded from a CDN. Pure logic is unit
  tested with `bun test`.
* **Images** are processed through Hugo's image pipeline (responsive WebP,
  `srcset`, lazy-loading, intrinsic dimensions).
* **Fonts** (Space Grotesk, Space Mono, Open Sans) are self-hosted from the
  Bun-managed `@fontsource/*` packages — no remote font requests.

## Deployment

Pushes to `master` deploy to the staging Cloudflare Pages project and pushes to
`production` deploy to production, via the workflows in `.github/workflows/`.
Both run lint and tests before building.

## Docker

To preview a production build locally with nginx:

```
docker-compose up --build
```

…then open http://127.0.0.1:8080

## License

Copyright © Screenly, Inc.

This project is licensed under the **GNU Affero General Public License v3.0
only** (AGPL-3.0-only). See the [LICENSE](LICENSE) file for the full text.
