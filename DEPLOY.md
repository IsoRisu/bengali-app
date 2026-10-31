# Deploy: GitHub + Render

## 1. GitHub

1. Create an empty repo on github.com (no README, no .gitignore). Name it e.g. `bengali-first-steps`.
2. In this folder (`package.json` must be at the top level):

```bash
npm install                 # creates package-lock.json (commit it)
git init
git add .
git commit -m "Initial commit"
git branch -M main
git remote add origin https://github.com/<you>/bengali-first-steps.git
git push -u origin main
```

The `CI` workflow runs on every push: build, static check, size budget.

## 2. Render (Static Site, free)

**Option A: Blueprint (uses `render.yaml`)**

1. Sign in at render.com with GitHub.
2. **New > Blueprint**, pick the repo, click **Apply**.
3. Wait for the build. Your URL is `https://bengali-first-steps.onrender.com` (or similar).

**Option B: manual**

1. **New > Static Site**, connect the repo.
2. Build command: `npm install && npm run build`
3. Publish directory: `dist`
4. Environment variable: `NODE_VERSION` = `20`
5. **Create Static Site**.

No rewrite rules are needed: routing uses the URL hash (`#/letters/ma`).

Every push to `main` redeploys automatically.

### Custom domain
Render dashboard > your site > **Settings > Custom Domains > Add**, then add the CNAME record Render shows at your DNS provider. HTTPS is automatic. Learner progress is stored per domain, so it does not carry over from the `onrender.com` address.

## 3. Optional: GitHub Pages
Repo **Settings > Pages > Source: GitHub Actions**, then **Actions > Deploy to GitHub Pages > Run workflow**.

## Troubleshooting
- Build fails on Node version: set `NODE_VERSION=20` in Render.
- Blank page: confirm publish directory is `dist`, not `build` or `.`.
- Bengali looks wrong on some devices: do the font step in README ("One-time setup").
