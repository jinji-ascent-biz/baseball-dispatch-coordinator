# Deployment

## Current deployment readiness

- App type: static HTML/CSS/JavaScript
- Build command: `npm run build`
- Output directory: `dist`
- Smoke test: `npm test`

## Vercel

`vercel.json` is included.

Required auth before production deploy:

```bash
vercel login
# or set VERCEL_TOKEN
vercel deploy --prod --yes
```

## GitHub Pages

`.github/workflows/pages.yml` is included.

Required before public URL:

1. Add a GitHub remote.
2. Push `main`.
3. Enable GitHub Pages source: GitHub Actions.
4. The workflow will publish `dist/`.

## Local preview

```bash
npm run dev
# http://127.0.0.1:5173
```
