# off.gaelaguiar.net

Professional website generated with Hugo.

Repository engineering rules are defined in `AGENTS.md`.

CI configuration in `.github/workflows/ci.yml` is the source of truth for executable run, lint, and build commands.

## GitHub Pages deployment

1. Push to `main`.
2. In GitHub repository settings, set Pages source to `GitHub Actions`.
3. The workflow `.github/workflows/deploy-pages.yml` builds the site and deploys `docs/`.
4. Custom domain is set via `static/CNAME` (`off.gaelaguiar.net`).
