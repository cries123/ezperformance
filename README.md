# EZ Performance

Website for EZ Performance, a shop and mobile auto repair business serving the Central Coast of California (Lompoc to Paso Robles).

Built with React, Vite and Tailwind CSS. Hosted on Netlify. Booking requests are sent to a Discord channel by a Netlify Function.

## Pages

| URL         | Page                      |
| ----------- | ------------------------- |
| `/`         | Home                      |
| `/services` | Service catalog & pricing |
| `/gallery`  | Gallery (coming soon)     |
| `/contact`  | Contact & booking         |

Page titles and descriptions live in `src/seo.ts`. Service names and prices live in `CATALOG` in `src/App.tsx`, which feeds both the Services page and the booking form.

## Run locally

Requires Node.js.

1. `npm install`
2. Copy `.env.example` to `.env` and fill in `DISCORD_WEBHOOK_URL` (and optionally `VITE_SITE_URL`).
3. `npm run dev`, then open http://localhost:3000

## Deploy

Pushing to `main` deploys on Netlify (`netlify.toml`). In Netlify's environment variables, set:

- `DISCORD_WEBHOOK_URL`: required for booking notifications.
- `VITE_SITE_URL`: optional. Defaults to the Netlify site's primary domain.

The build also writes `services.html`, `contact.html`, `gallery.html`, `robots.txt` and `sitemap.xml` into `dist/`.
