# Bengali First Steps

A small web app for absolute beginners learning Bengali: letters, a first word deck and one grammar lesson. Text only, no audio, no accounts.

**The app is fully static.** `npm run build` produces a `dist/` folder of plain HTML, JS and CSS. There is no server, no API and no database, and nothing is fetched at runtime (all content in `src/data/*.json` is compiled into the bundle). Routing uses the URL hash (`#/letters/ma`), so the host needs no rewrite rules and no `404.html` trick.

**Progress survives visits.** Your progress is saved in your own browser's `localStorage` (keys `bn.progress`, `bn.prefs`, `bn.streak`), so it is still there when you come back to the page. Three things to know:

- It lives in one browser on one device. There is no sync between devices.
- It is tied to the site's address. Moving to a new domain (including adding a custom domain) starts with empty progress, because browsers keep storage per origin.
- Clearing site data, or using a private window, removes it.

## Requirements

- Node.js 18 or newer (the deploy workflow uses Node 20)
- npm

## Local development

```bash
npm install
npm run dev
```

Vite prints a local address (usually `http://localhost:5173`). Edits reload automatically.

## Build

```bash
npm run build     # writes the static site to dist/
npm run preview   # serves dist/ locally to check the real build
npm run size      # gzipped size of every file in dist/ against the 200 KB budget
```

`npm run size` exits with an error above 200 KB gzipped and warns above 80%. The deploy workflow runs it too.

### Check that the build is static

After `npm run build`:

- `dist/index.html` exists, and `dist/assets/` holds the JS and CSS.
- Every URL in `dist/index.html` starts with `./`, not `/`. (`vite.config.js` sets `base: './'` so the site works under `https://user.github.io/repo/`.)
- Open `dist/` with any plain file server, for example `npx serve dist` or `python3 -m http.server -d dist`. The app works with no backend.

The deploy workflow runs the first two checks and fails the build if they break.

> Render and GitHub quick start: see `DEPLOY.md`.

## Deploy to GitHub Pages from scratch

The workflow is `.github/workflows/deploy-pages.yml (manual trigger)`. It installs, builds, checks the output, checks the size, then uploads `dist/` as a Pages artifact and deploys it.

1. **Create the repository.** On GitHub, create a new repository (public repositories can use Pages on the free plan). Do not add a README or other files.
2. **Put the project files at the repository root.** `package.json`, `index.html`, `vite.config.js`, `src/` and `.github/` must sit at the top level. If you unzipped `Bengali_app.zip`, copy the contents of the inner folder, not the folder itself.
3. **Push to `main`.**

   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git branch -M main
   git remote add origin https://github.com/<user>/<repo>.git
   git push -u origin main
   ```

   The first workflow run will build but fail to deploy until step 4 is done. That is expected.
4. **Turn on Pages.** In the repository go to **Settings > Pages**. Under **Build and deployment > Source**, choose **GitHub Actions**.
5. **Run the workflow.** Open the **Actions** tab, pick **Deploy to GitHub Pages**, and choose **Run workflow** (or push any commit to `main`).
6. **Open the site.** When the `deploy` job is green, the site is at `https://<user>.github.io/<repo>/`. The URL also appears on the job and under Settings > Pages.

Every later push to `main` redeploys automatically.

### Optional: commit a lockfile

The repository has no `package-lock.json` yet, so the workflow falls back to `npm install`. For repeatable builds, run `npm install` once locally, commit `package-lock.json`, then add `cache: npm` under `with:` in the "Set up Node" step. The workflow then uses `npm ci` on its own.

## Custom domain

Because the site is deployed with a GitHub Actions workflow, GitHub ignores any `CNAME` file in the repository. You set the domain in the settings instead, and no code change is needed (`base: './'` works on any path).

1. Go to **Settings > Pages > Custom domain**, enter your domain (for example `learn.example.com`), and click **Save**. Do this before changing DNS, so nobody else can claim the name. GitHub also recommends verifying the domain first (account **Settings > Pages > Add a domain**).
2. At your DNS provider, add the records:
   - **Subdomain** (`learn.example.com`, `www.example.com`): a `CNAME` record pointing to `<user>.github.io`. Do not point it at the `*.pages.github.io` address shown in settings.
   - **Apex domain** (`example.com`): four `A` records for `@` pointing to `185.199.108.153`, `185.199.109.153`, `185.199.110.153` and `185.199.111.153`. Optionally add `AAAA` records for `2606:50c0:8000::153`, `2606:50c0:8001::153`, `2606:50c0:8002::153` and `2606:50c0:8003::153`. Avoid wildcard records.
   - If you use an apex domain, also set up `www`. GitHub then redirects between the two.
3. Wait for DNS to propagate (up to 24 hours). Check with `dig learn.example.com +noall +answer`.
4. When GitHub offers it, tick **Enforce HTTPS**. The certificate can take a little while to appear.

These values come from GitHub's custom domain documentation. Check it if something looks different in your settings.

Remember that learners' saved progress does not move to the new address (see the note at the top).

## One-time setup: lockfile and font

Two files cannot be generated without internet access, so create them once on your machine.

**Lockfile** (repeatable builds):

```bash
npm install
git add package-lock.json
```

Then add `cache: npm` under `with:` in the "Set up Node" step of `.github/workflows/deploy-pages.yml (manual trigger)`.

**Bengali font** (Noto Sans Bengali, self-hosted, only the glyphs the content uses):

1. Download Noto Sans Bengali from Google Fonts (SIL Open Font License) and unzip it.
2. Run from the project root:

   ```bash
   pip install fonttools brotli
   python3 scripts/make-font-subset.py path/to/NotoSansBengali-Regular.ttf
   ```

   This writes `src/fonts/NotoSansBengali-subset.woff2` (about 15 letters, so a few KB). Re-run it whenever `src/data/*.json` changes. A warning for `U+1E6D` (ṭ) is normal: that is a Latin letter, and the system font draws it.
3. Add this to the top of `src/styles.css`:

   ```css
   @font-face {
     font-family: 'Noto Sans Bengali';
     src: url('./fonts/NotoSansBengali-subset.woff2') format('woff2');
     font-weight: 400 700;
     font-display: swap;
   }
   ```

   Add the `@font-face` rule only after the `.woff2` file exists, or the build fails on the missing file. If you use a single static weight, set `font-weight: 400` and bold text will be synthesised by the browser.
4. Run `npm run build && npm run size`.

## Other static hosts

The same build works unchanged on Netlify and Cloudflare Pages: build command `npm run build`, publish directory `dist`. No redirects or rewrite rules are needed.

## Where things are

- `src/data/*.json`: all content. See `src/data/README.md` before adding any.
- `DECISIONS.md`: why things are the way they are. `MANIFEST.md`: file index and open items.
