# Federal Digital Banking

Static bank website scaffold with a landing page, feature sections, and a signup form interaction.

## Development

Install dependencies:

```bash
npm install
```

Run locally:

```bash
npm run dev
```

Build for production:

```bash
npm run build
```

Preview the production build:

```bash
npm run preview
```

---

Deployment (GitHub Pages)

- This repository's GitHub Actions deploy uses a Personal Access Token (PAT) to
	push the `dist/` build to the `gh-pages` branch. Create a PAT with the `repo`
	scope and add it as a repository secret named `DEPLOY_PAT` under
	Settings → Secrets → Actions.

- After adding `DEPLOY_PAT`, push to `main` to trigger the `deploy.yml` workflow.

Example PAT creation steps:

1. Go to https://github.com/settings/tokens -> Generate new token.
2. Select `repo` scope (write access to repositories).
3. Copy the token and add it to this repo's Settings → Secrets → Actions as
	 `DEPLOY_PAT`.

Note: You can remove the custom domain from Pages settings or `gh-pages` branch
if you want the site to be available at the github.io URL instead of redirecting.
