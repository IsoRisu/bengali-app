# MANIFEST

Bengali learning web app for absolute beginners. Static site, text only, no backend.

## Status

- Round: 9 added 11 grammar lessons (Entry 016). Round 8 (see DECISIONS Entry 015: warnings fixed, Letters entry button, Render config). Earlier: Round 7, Worker G (deployment only: GitHub Pages workflow, README, `.gitignore`; no feature code changed, see DECISIONS.md Entry 014). The workflow has never run: the sandbox has no route to `registry.npmjs.org`, so the first real `vite build` will be the first CI run. Round 6 (Worker F) added Home, streak, resets and the accessibility pass (Entry 013).
- Open warnings from the Round 6 review are in `warnings.txt` and were not in scope for Round 7. The Letters learn-mode gap was closed in Entry 015.
- Review blockers from Round 2.5 (vowel signs in content, multi-item grammar screen) are resolved, see DECISIONS.md Entry 005.
- Framework: Preact + Vite (see DECISIONS.md, Entry 001)

## Files

| Path | Purpose | Status |
| --- | --- | --- |
| `DECISIONS.md` | Running log of architectural decisions | Entries 001 to 014 written |
| `MANIFEST.md` | This file: index of project files | Updated in Round 7 |
| `src/data/letters.json` | 11 letters: 3 vowels, 8 consonants, with `order` 1 to 11 | Written |
| `src/data/words.json` | Deck "First words", 9 sign-free words | Rewritten in Round 2.5 |
| `src/data/grammar.json` | Lesson `sentence-sov` (7 sections, English only), 4 mcq + 4 fill exercises | Rewritten in Round 2.5 |
| `src/data/README.md` | How to add content, ordering rule, one concept per screen | Written |
| `src/main.jsx` | Entry point. Round 6: also re-runs `touchLastVisit()` when the tab becomes visible again | Changed (Round 6) |
| `src/app.jsx` | Shell and routes. Round 6: Home moved out to `src/home/`, skip link, focus moves to `<main>` after each route change, `document.title` per section | Changed (Round 6) |
| `src/styles.css` | Styles. Round 6: focus colour variable and one global `:focus-visible` rule (old yellow ring replaced), Home, reset and dialog styles, `prefers-reduced-motion` block | Changed (Round 6) |
| `src/home/Home.jsx` | Home screen: streak, letters/words/lessons progress rows with rings and empty states, reset controls behind confirmation | Written (Round 6) |
| `src/components/ProgressRing.jsx` | Small decorative SVG progress ring | Written (Round 6) |
| `src/components/ConfirmDialog.jsx` | Confirmation built on native `<dialog>`, `window.confirm` fallback | Written (Round 6) |
| `scripts/check-size.mjs` | `npm run size`: gzipped size of every file in `dist/` against the 200KB budget, exits 1 if over | Written (Round 6) |
| `package.json` | Round 6 added the `size` script only | Changed (Round 6) |
| `src/lib/progress.js` | Progress store (`bn.progress`) for letters, words and lessons (Entry 012). Round 6: daily streak (`bn.streak`), `getStreak`, `nextStreak`, `localDay`, `resetCategory`, `resetAll` (Entry 013) | Written (Round 3), extended (Round 5.1, Round 6) |
| `src/lib/prefs.js` | Preferences store (`bn.prefs`), `hide-roman` class | Written (Round 3) |
| `src/lib/useStore.js`, `src/lib/router.js` | `useStore`, `useHashRoute` | Written (Round 3) |
| `src/components/Roman.jsx` | Wrapper for all romanization | Written (Round 3) |
| `src/letters/` | `LettersPage.jsx`, `LetterScreen.jsx`, `letters.js` | Written (Round 3), unbuilt, untouched in Round 4 |
| `src/words/` | `Words.jsx` (sub-router), `WordsPage.jsx` (deck list), `StudyScreen.jsx` (flashcards), `QuizScreen.jsx` (optional quiz), `words.js` (data), `wordsProgress.js` (re-export of the store, Entry 012) | Written (Round 4), smoke-tested |
| `src/grammar/` | `Grammar.jsx` (sub-router), `GrammarPage.jsx` (lesson list), `LessonScreen.jsx` (reading screens, exercises, finish screen), `Exercise.jsx` (mcq and fill runner), `Md.jsx` (markdown subset renderer, inline glosses, glossary block), `grammar.js` (data, parser, glossary lookup, answer matching), `grammarProgress.js` (re-export of the store, Entry 012) | Written (Round 5), smoke-tested |
| Flat duplicates at zip root | Deleted in Round 5.1 (Entry 012) | Done |
| `.github/workflows/deploy.yml` | GitHub Pages deploy: on push to `main` or manual run, `npm install`/`npm ci`, `npm run build`, static-output check, `npm run size`, then `upload-pages-artifact` and `deploy-pages` (Entry 014) | Written (Round 7), never run |
| `README.md` | Root README: static-site and localStorage note, local dev, build, static check, deploy from scratch, custom domain, other hosts | Written (Round 7) |
| `scripts/make-font-subset.py` | Builds `src/fonts/NotoSansBengali-subset.woff2` from a Noto Sans Bengali `.ttf`, keeping only characters found in `src/data/*.json`. Pipeline tested with a stand-in font; not tested with the real font | Written (Round 7), not run on the real font |
| `.gitignore` | Ignores `node_modules/`, `dist/`, `.DS_Store`, `*.log` | Written (Round 7) |
| `warnings.txt` | Round 6 review findings, kept for the next rounds | Present, not edited |
| `dist/` | Static build output (Vite). Not committed (in `.gitignore`); produced by `npm run build` locally and in CI | Never built yet |

## Data contract (summary; full detail in `src/data/README.md`)

- Letters: `{ id, glyph, name, transliteration, type, exampleWord, exampleTransliteration, exampleTranslation, order }`
- Words: `{ deck, items: [ { id, bengali, transliteration, english, usesLetters } ] }`
- Lesson: `{ id, title, explanation, exercises: [ { type, prompt, promptTransliteration?, options?, answer, acceptedAnswers?, explanation } ] }`, where `options` are `{ text, transliteration? }`
- Ids are used in progress: letter id in `lettersLearned`, word id in `wordsLearned`, lesson id in `lessonsCompleted`.

## Constraints (from the brief)

- Static only; deploys to GitHub Pages, Netlify or Cloudflare Pages (GitHub Pages workflow written in Round 7; Netlify and Cloudflare need only build `npm run build`, publish `dist`)
- Progress in localStorage: `{ lettersLearned, wordsLearned, lessonsCompleted, lastVisit }`
- Mobile-first, under ~200KB gzipped, tap targets at least 44px
- Text only: no audio, no TTS, no `speechSynthesis`
- "Mark as learned" only: no spaced repetition, intervals or due dates
- Romanization visible by default, with a global toggle to hide it
- One concept per screen; Noto Sans Bengali plus clean Latin
- V1 excludes conjuncts and vowel signs
- Letters ordered via an `order` field: 3 simplest independent vowels, then 8 highest-frequency simple consonants
- Grammar glosses every technical term inline in plain English

## Storage keys

- `bn.progress`: `{ lettersLearned, wordsLearned, lessonsCompleted, lastVisit }`, exactly the brief's shape. `lastVisit` is a local-calendar `YYYY-MM-DD`.
- `bn.prefs`: `{ showRomanization }` (Entry 006).
- `bn.streak`: `{ count }`, the current daily streak (Entry 013). Kept apart so the progress shape stays as the brief fixes it.

## Routes

- `#/` Home (progress summary, streak, resets)
- `#/letters` grid, `#/letters/:id` one letter
- `#/words` deck list, `#/words/study` flashcards, `#/words/study/:id` flashcards from one word, `#/words/quiz` optional quiz
- `#/grammar` lesson list, `#/grammar/:id` one lesson (reading screens, then exercises, then finish screen; the step is component state, not part of the route)

## Pending decisions

- Real `npm install && npm run build` with real Preact, then `npm run size`, and a manual browser walk-through (the sandbox has no route to `registry.npmjs.org`, so no round has built with Vite). Round 7's workflow runs build, static check and size on every push to `main`, so the first CI run is the first real build. If it fails, fix it before anything else.
- Still to create by hand (no internet in the sandbox): `package-lock.json` (`npm install`) and `src/fonts/NotoSansBengali-subset.woff2` plus the `@font-face` rule in `src/styles.css`. Steps are in the README under "One-time setup".
- No `package-lock.json` in the repo. The workflow falls back to `npm install`. Generate and commit a lockfile, then add `cache: npm` to the workflow (Entry 014). Round 6 measured the app's own code with esbuild instead: about 11KB JS and 2.4KB CSS gzipped, so about 18KB with Preact.
- Measured font subset: Noto Sans Bengali is still not in the repo and is the one real size risk (Entry 001). Run `npm run size` once it is added.
- Letters learn mode: Entry 009 describes `#/letters/learn` and a "Start learning" button, but the live `src/letters/` has neither (an unknown id such as `learn` shows "Letter not found"). Decide whether to rebuild it. Not touched in Round 6.
- Screen-reader pass with a real screen reader, and Safari and Firefox passes (Round 6 tested Chromium only).
- Consonant frequency check against a corpus (Entry 007)
- Content ordering across multiple lessons and decks
- Distractor selection at runtime
- Quiz design for letters (Words quiz settled in Entry 010, grammar exercises in Entry 011)
