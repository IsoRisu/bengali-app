# DECISIONS

## Entry 001: Framework choice (Round 0)

**Decision:** Preact (with Vite as the build tool), written as function components with hooks. Routing is hash-based (`#/letters/ka`), and TypeScript is optional.

**Justification:** The brief has three pressures: a hard size budget (~200KB gzipped), a tiny, strictly client-side state model, and a build carried out by several agents working in parallel. Preact fits all three. Its runtime is about 4KB gzipped, so nearly the whole budget is left for content and the Bengali font, which is the real size risk. Subsetting Noto Sans Bengali to only the glyphs in `src/data/*.json` (V1 has no conjuncts or vowel signs anywhere in content, see Entry 005) will cost more than any framework choice. The subset is expected to be small, but it has not been measured yet (see Pending decisions). The app is a small set of screens, each showing one concept. Several pieces of state, such as the romanization toggle, the learned lists, and the current screen, need to stay in sync across them. Components plus a single state store handle this with far less defensive code than hand-written DOM updates. Vanilla JS meets the size target trivially but is the riskiest choice for a multi-agent build. Each agent would have to invent its own rendering and update pattern, and the global romanization toggle would end up as scattered manual DOM updates. Svelte also fits the budget, but it adds a compiler-specific syntax and a rapidly changing API (runes), which adds coordination risk. Preact's JSX and hooks are the most widely known and most predictable conventions across agents. Hash routing keeps GitHub Pages, Netlify, and Cloudflare Pages behaving identically with no rewrite rules. `src/data/*.json` is imported at build time, so there are no runtime fetches and no backend. The progress object (`{ lettersLearned, wordsLearned, lessonsCompleted, lastVisit }`) lives in localStorage behind one small module. Nothing in the stack touches audio or `speechSynthesis`, and no SRS or scheduling dependencies are added.

**Consequences:**

- A build step is required (Vite). Output is a static `dist/` folder.
- Preact dependencies are limited to `preact` only. Add no router, state, or UI libraries without logging a decision.
- Font handling is a follow-up: self-host a subsetted Noto Sans Bengali (WOFF2) with `font-display: swap`.
- Bundle size is checked in CI or at build time against the ~200KB gzipped budget.

## Entry 002: Content ordering (Round 2)

**Decision:** Letters are sequenced by `order` (unique integers 1 to 11, no gaps), never by alphabet order. The 3 starter vowels come first, as the brief says: আ (1), ই (2), উ (3). The 8 consonants follow: ম (4), ন (5), ক (6), র (7), ত (8), ব (9), স (10), দ (11). Words are displayed in array order, most useful first. There is one grammar lesson so far, `sentence-sov`.

**Justification:** The vowels come first because every consonant is read with a vowel, and these three have the clearest shapes and example words. Among the consonants, the order mixes three things: how common the letter is, how simple its shape is, and how soon it lets the learner read a real word. ম comes first because it makes আম ("mango") readable at step 4, and ন follows because it makes মন ("mind, heart") readable. Every example word on a letter screen uses no vowel signs and no conjuncts. The frequency ranking is approximate and was not checked against a corpus, so treat it as a reasonable starting point rather than a measured result. Words in the "First words" deck use only the 11 taught letters (see Entry 005) and are ordered by how reusable they are (all, less, mind, price, breath, forest, then rarer words), so the learner can read each one as soon as it is opened.

**Consequences:**

- The UI sorts letters by `order` only and groups by `type` where needed.
- Changing the order means shifting `order` values and logging a new entry.
- Sequencing across multiple lessons is still open (see Pending decisions).

## Entry 003: Distractor principle (Round 2)

**Decision:** Wrong options are written by one principle: each distractor is wrong for exactly one nameable reason, and the exercise `explanation` names that reason. This applies to every distractor authored in `src/data/*.json`.

**Rules:**

- Never leave two defensible answers.
- Keep options the same kind of thing (all words, or all orderings), so format gives nothing away.
- Options must differ by whole words, not by a single look-alike glyph. V1 does not teach telling similar shapes apart, so a test on that would be unfair.
- Use 3 options for beginners.
- For grammar, each distractor stands for one common mistake: confusing the subject with the object, or copying English word order.

**Consequences:** This settles how distractors are authored. How the app picks distractors at runtime for letter and word recognition exercises is still open (see Pending decisions).

## Entry 004: Transliteration scheme and exercise schema (Round 2)

**Decision:**

- Transliteration uses simple English letters. The inherent vowel is written `o` (কল = `kol`), স is `sh`, and `ṭ` is the only diacritic, used where a word needs the retroflex ট.
- Exercise options are objects `{ text, transliteration? }`, so every Bengali option has a transliteration sibling.
- Exercises may carry `promptTransliteration` for Bengali in the prompt.
- Fill exercises may carry `acceptedAnswers`, compared trimmed and case-insensitive.
- Lesson explanations use only a small markdown subset (`##`, paragraphs, bold, italic, bullets, quotes), with one concept per `##` section.

**Consequences:** The renderer can stay tiny. Any new field or markdown feature needs a new entry.

## Entry 005: Vowel signs stay out of all content (Round 2.5)

**Decision:** The brief's exclusion of vowel signs (কার) holds for every file, not just letters. `words.json` and `grammar.json` are sign-free. The words deck is now "First words": 9 words written only with the 11 taught letters. The grammar lesson has no Bengali script. It shows Bengali word order with English words ("I rice eat").

**Justification:** The Round 2 seed put signs in 11 of 12 words and in every Bengali sentence, and left the choice open. The brief lists vowel signs as a non-goal, so the owner's written constraint wins over convenience. The cost is that greetings and real Bengali sentences are not possible in V1.

**Consequences:**

- Greetings, pronouns, family words and real sentences are deferred to a later version that teaches vowel signs first.
- The font subset only needs the glyphs of the 11 letters and the 9 words.
- Example words on letter screens may contain letters not taught yet (আম has ম, ইট has ট, উপর has প, নখ has খ, কল and তরল have ল, রস has স). This is accepted: the word is shown whole as a reading target, and the extra glyphs are not introduced. Revisit this if testing shows it confuses learners.

## Entry 006: Romanization toggle default and storage (Round 2.5)

**Decision:** Romanization is visible by default. The toggle is stored as `{ showRomanization: true }` under its own localStorage key (`bn.prefs`), separate from the progress object, whose shape stays as the brief fixes it.

**Consequences:** All transliteration is rendered from structured fields (`transliteration`, `exampleTransliteration`, `promptTransliteration`), so the toggle can hide all of it. Do not embed romanization inside markdown or explanation text. Lesson content is currently all English, so this holds today.

## Entry 007: Consonant frequency is unverified (Round 2.5)

**Decision:** The consonant order stays as in Entry 002. The brief asks for the 8 highest-frequency simple consonants, but that was never checked against a corpus, so the requirement is not shown to be met. ল and প may rank above দ.

**Consequences:** A later round should check against a Bengali letter frequency list and either confirm the set or log a change under the shifting rule in `src/data/README.md`.

## Entry 008: Round 1 scaffold and Letters UI contracts (Round 3)

**Decision:** The Round 1 pieces did not exist in the workspace, so they were written from Entries 001, 004 and 006 and are recorded here as the contract other modules build against.

- **Progress store** (`src/lib/progress.js`): localStorage key `bn.progress`, shape exactly as the brief fixes it. Exports `getProgress()`, `subscribeProgress(fn)` (returns an unsubscribe function), `isLetterLearned(id)`, `toggleLetterLearned(id)` and `touchLastVisit()`. Updates are immutable, and every change notifies subscribers. "Mark as learned" is a plain toggle, so a learned letter can be un-learned.
- **Preferences** (`src/lib/prefs.js`): key `bn.prefs`, `{ showRomanization }`, default `true`. The toggle works through one class, `hide-roman`, on `<html>`.
- **Romanization rule:** every piece of romanization (`transliteration`, `exampleTransliteration`, `name`, and the "·" separator next to a transliteration) is wrapped in `<Roman>`, which adds the `roman` class. CSS hides `.roman` when `html.hide-roman` is set. New modules must wrap their romanization the same way.
- **Hooks:** `useStore(get, subscribe)` binds a component to either store. `useHashRoute()` returns the hash split into segments.
- **Routes:** `#/letters` (list, grouped Vowels then Consonants, with an "X of Y learned" counter and progress bar) and `#/letters/:id` (one letter per screen, with previous and next by `order`). Unknown ids show a "Letter not found" screen.
- **Counter:** X counts only ids in `lettersLearned` that exist in `letters.json`, so stale ids in storage cannot push it above Y.

**Consequences:** The `name` field ("mo", "short i") is treated as romanization and hides with the toggle. Revisit if the toggle is meant to keep letter names visible.

## Entry 009: Letters module UX calls (Round 3, Worker C)

**Decision:** The Letters module lives in `src/letters/` and is built on the Entry 008 contracts.

- **Routes:** `#/letters` (grid), `#/letters/learn` (learn mode), `#/letters/:id` (one letter). `learn` is a reserved word, so no letter id may be `learn`.
- **Learn mode** shows the first unlearned letter by `order`, computed live from the progress store, with one "Mark as learned" button and no other control except a back link. Marking a letter advances the flow because the next unlearned letter becomes the first one. When none are left it shows an "All N letters learned" screen. There are no ratings, skips or scheduling. If a learner un-learns an earlier letter on the grid, it comes back first in the learn path, which keeps `order` as the only sequence.
- **Grid taps:** a learned card is a button, and one tap un-learns it, with no confirm dialog (re-learning is one tap, and a confirm adds friction for a low-cost action). An unlearned card is a link to its own letter screen (`#/letters/:id`), where "Mark as learned" can be pressed. The grid carries a one-line hint about un-learning.
- **Learned look:** tinted background, thicker accent border and a ✓ mark, so state does not depend on colour alone. Cards show only the glyph and its transliteration.
- **Entry button:** the grid shows "Start learning" (nothing learned) or "Continue learning", and hides it when all letters are learned.
- **Counter:** "X of Y letters learned" with a progress bar on the grid and on the all-done screen. In learn mode the top line shows position ("4 of 11"), not the learned count.
- **Romanization:** `name`, the "sounds like" line, `transliteration`, `exampleTransliteration` and the "·" separator are all inside `<Roman>`. With romanization off, a letter screen shows the glyph, the example word and its English meaning only.
- **Files written because they were missing:** the workspace held no `src/` code, so `src/lib/progress.js`, `src/lib/prefs.js`, `src/lib/hooks.js`, `src/components/Roman.jsx`, `src/App.jsx`, `src/main.jsx` and `src/styles.css` were written to the Entry 008 contract. The brief said not to touch `progress.js`, but it did not exist, so it was created to match the contract exactly. If a Round 1 version exists elsewhere, prefer it, as long as it exports the same five functions. `App.jsx` also holds a small romanization toggle button, because the toggle needs a control somewhere. Words and Grammar routes are not added.
- **Font:** the CSS names `Noto Sans Bengali` first with a system fallback. The self-hosted subset is still pending (Entry 001).

**Consequences:** Words and Grammar modules mount in `App.jsx` by adding a section branch. Any new UI that shows romanization must use `<Roman>`.

## Entry 010: Words module (Round 4, Worker D)

**Decision:** The Words module lives in `src/words/` and is built on the Entry 008 contracts. Routes: `#/words` (deck list), `#/words/study` and `#/words/study/:id` (flashcards), `#/words/quiz` (optional quiz). Letters, Grammar, `src/data` and `src/lib/progress.js` are unchanged.

- **Flashcards:** one word per screen. The front is the Bengali word. Tapping the card shows the English meaning. The queue is fixed when a pass starts: the unlearned words in deck order, rotated to start at the tapped word if one was chosen. "Mark as learned" writes and advances. "Skip" advances and writes nothing. When the queue ends, the screen shows "End of this pass" with a button to go through the words still unlearned, or "All N words learned". The position in the queue is not stored, so a reload restarts at the first unlearned word.
- **Romanization:** the transliteration is wrapped in `<Roman>`. With the toggle on, it is always visible. With the toggle off, it stays hidden until the learner taps the card, then shows for that card only (the `.flash-open` rule in `styles.css`). This is how "revealed on tap" and "toggle respected" are both met: off means hidden by default, and a tap is an explicit request. To make off mean always hidden, delete that one CSS rule. The deck list and quiz hide it fully when off.
- **Deck list:** a learned word is a button with a ✓ and a tinted, thicker border, and one tap un-learns it (no confirm, as in Entry 009). An unlearned word is a link that opens the flashcards at that word. The counter counts only ids that exist in `words.json`.
- **Quiz:** optional, Bengali to English, 4 options, one question per word in random order (9 questions). Distractors are the English meanings of other words in the same deck, so every option is the same kind of thing (Entry 003). Feedback is instant and does not depend on colour alone (✓ on the right option, ✗ on a wrong pick, the answer is stated). After a correct answer, "Mark as learned" is offered as a shortcut. The quiz never writes anything else, never blocks anything, and has a leave link on every question. This settles the Words part of the pending "Quiz design" item. A wrong answer does not un-learn a word. Letters and grammar quizzes are still open.
- **Words write path (workaround):** `src/lib/progress.js` has no word functions, and the brief says not to touch it. `src/words/wordsProgress.js` therefore writes `wordsLearned` itself. It changes the `wordsLearned` array of the same in-memory object that `progress.js` holds (via `getProgress()`), then saves the whole object to `bn.progress`. Writing only to localStorage would lose the word change the next time a letter is toggled, because `progress.js` rewrites its stale copy. This was tested both ways (word then letter, letter then word). It does break the "immutable updates" rule of Entry 008 for that one array. **Follow-up for the owner:** add `toggleWordLearned(id)` to `progress.js` the same way as `toggleLetterLearned`, then reduce `wordsProgress.js` to a re-export. The change touches only that file.
- **Mark is idempotent:** flashcards and the quiz shortcut only add a word. Only the list and the quiz "undo" button remove one.
- **Files outside `src/words/`:** `src/app.jsx` gained the `words` route and a Words button on Home. `src/styles.css` gained an appended Words block and two colour variables (`--bad`, `--bad-bg`). Nothing existing was edited.
- **Repo state found:** the zip holds two copies of the code. `index.html` builds `src/main.jsx`, so the `src/` tree is the live one. The flat files at the zip root (`App.jsx`, `Letters.jsx`, `LearnMode.jsx`, `LetterGrid.jsx`, `LetterDetail.jsx`, `parts.jsx`, `hooks.js`, `useLetters.js`, `prefs.js`, `progress.js`, `Roman.jsx`, `main.jsx`, `styles.css`, `words.json`, `letters.json`, `grammar.json`, `README.md`) are an older duplicate that nothing imports. The duplicates were left in place. Delete them before merging. This also means Entries 008 and 009 describe the flat layout (`hooks.js`, `Letters.jsx`) while the live code uses `router.js`, `useStore.js`, `LettersPage.jsx` and `LetterScreen.jsx`, with the same behaviour.
- **Verification:** `npm install` failed again (no route to `registry.npmjs.org`), so `vite build` and the size check have not run. Instead the `src/` tree was bundled with esbuild, with Preact swapped for React, and driven in Chromium at 390px wide. It passed: skip does not write, mark writes and advances, reload persists, un-learn from the list, a letter toggle does not erase words and the reverse, romanization on and off, end of pass, quiz right and wrong paths with no writes, the shortcut, the unknown-id screen, and every tap target at least 44px. React is not Preact, so a real `npm run build` and a manual pass are still needed.

**Consequences:** Grammar mounts the same way, by adding a branch in `app.jsx`. Any later module that writes progress should use `progress.js` once it has the matching function.

## Entry 011: Grammar module (Round 5, Worker E)

**Decision:** The Grammar module lives in `src/grammar/` and is built on the Entry 008 contracts. Routes: `#/grammar` (lesson list) and `#/grammar/:id` (one lesson). Letters, Words, `src/data` and `src/lib/progress.js` are unchanged.

- **Lesson flow:** one idea per screen (brief, `src/data/README.md`). The `explanation` is split at each `##` heading into reading screens, so the lesson shows as "part 3 of 7" with Back and Next. After the last part come the exercises, one per screen, then a finish screen. The step is component state, so a reload returns to the start of the lesson (as Words flashcards do). The explanation is never shown as one long page.
- **Markdown:** a small renderer for the Entry 004 subset (`##`, paragraphs, bold, italic, bullets, quotes). No markdown library was added.
- **Glosses (inline and block):** the content writes a term in bold followed by its gloss in brackets, for example `**verb** (the action word, what someone does)`. The parser lifts every such pair out of paragraphs and bullets. On screen the bold term is shown in the accent colour and its gloss follows it in a tinted chip, and a "Key terms" block under the text lists term and gloss. The block lists terms defined in this section plus any earlier term that this section's text or heading uses again (case-insensitive, plain plurals), so a term such as "verb" still has its gloss on later screens. Exercise screens show the same block for terms used in the prompt only. Options and answers are never searched, so a fill answer cannot leak. In quotes the bracket after a bold word labels a worked example (`I rice **eat** (verb)`), so quotes are not parsed for glosses. A gloss that itself contains a bracket would not parse. The content has none.
- **Exercises:** `mcq` shows button options with instant feedback (✓ on the right option, ✗ on a wrong pick, never colour alone). On a wrong choice the exercise `explanation` is shown with the correct answer. `fill` is a text input with a Check button (Enter also submits). Matching lowercases, removes all whitespace and removes `. , ! ? ; : " '` and curly quotes before comparing against `answer` and `acceptedAnswers`, so "  The  Subject. " matches. It is not a typo-tolerant match. There is no retry: the first answer counts. The score ("X of Y exercises correct", with skipped ones counted) is shown on the finish screen and is not stored.
- **Exercises never gate completion:** every exercise has a Skip, and "Mark lesson complete" is always available on the finish screen. This matches the Words quiz (Entry 010). This settles the grammar part of the pending "Quiz design" item. Letters are still open.
- **Completion UX:** "Mark lesson complete" on the finish screen writes the lesson id to `lessonsCompleted`. Once completed the same button becomes "✓ Lesson completed (tap to undo)" and a tap removes the id. On the list, a row is always a link to its lesson (the task asks for tapping to navigate), and a completed row also has a separate "Undo" button, so un-completing is one tap there too. A completed row has a ✓, a tinted background and a thicker border, and screen readers get "Completed.".
- **Counter:** "X of Y lessons completed" with a progress bar. X counts only ids that exist in `grammar.json`, so stale ids in storage cannot push it above Y.
- **Lessons write path (workaround, same as Entry 010):** `progress.js` has no lesson functions and must not be touched. `src/grammar/grammarProgress.js` changes the `lessonsCompleted` array of the in-memory object that `progress.js` holds, then saves the whole object to `bn.progress`. Writing only to localStorage would be overwritten by the next letter toggle. Tested in both orders (letter then lesson, lesson then letter). **Follow-up for the owner:** add `toggleLessonCompleted(id)` to `progress.js` the same way as `toggleLetterLearned`, then reduce `grammarProgress.js` to a re-export (and do the same for `wordsProgress.js`).
- **Data shape:** `grammar.json` is one lesson object. `grammar.js` also accepts an array or `{ lessons: [...] }`, so adding lessons needs no code change. Array order is lesson order.
- **Romanization:** the lesson has no Bengali script (Entry 005), so there is nothing to hide. If an option has `transliteration` or an exercise has `promptTransliteration`, it is rendered inside `<Roman>` as Entry 008 requires.
- **Files outside `src/grammar/`:** `src/app.jsx` gained the `grammar` route and a Grammar button on Home. `src/styles.css` gained an appended Grammar block. Nothing existing was edited, and the option and feedback styles of the Words quiz are reused.
- **Verification:** `vite build` could not run (no route to `registry.npmjs.org`). The `src/` tree was bundled with esbuild, with Preact swapped for React, and driven in Chromium at 390px wide. It passed: list counter, open lesson, 7 reading screens with visible glosses and glossary, no gloss chips inside quotes, mcq wrong (explanation shown) and right (no explanation), second tap ignored, fill with odd whitespace and case, fill with `acceptedAnswers`, skip, score on the finish screen, nothing written before the button, mark complete, reload keeps it, un-complete from the list and from the lesson (both survive reload), letter write does not erase the lesson and the reverse, unknown lesson id, every tap target at least 44px, and no console errors. React is not Preact, so a real `npm run build` and a manual pass are still needed.
- **Not touched:** the stale flat duplicates at the zip root are still there (Entry 010). Delete them before merging.

**Consequences:** Adding a lesson means adding an object to `grammar.json` (as an array) with `##` sections that each teach one idea and bold-plus-bracket glosses for every technical term. A term needs its gloss in the section that first uses it.

## Entry 012: Owner calls on Round 5 open items (Round 5.1)

**Decision:** The three open items from Round 5 are settled.

- **Grammar exercises stay skippable and never gate completion (Entry 011 stands).** Reason: the brief allows "Mark as learned" only, with no mastery gate, and a beginner who is stuck on one fill question should not be locked out of the next lesson. The score is shown on the finish screen and is not stored. It matches the Words quiz (Entry 010).
- **`progress.js` now owns words and lessons.** It gained `isWordLearned`, `isLessonCompleted`, `setWordLearned(id, bool)`, `setLessonCompleted(id, bool)`, `toggleWordLearned` and `toggleLessonCompleted`. They use the same immutable update and subscriber notification as `toggleLetterLearned`, so the Entry 008 rule holds for all three arrays. The setters are idempotent, so "Mark" can never un-mark by accident. `src/words/wordsProgress.js` and `src/grammar/grammarProgress.js` are now thin re-exports with unchanged export names, so no component changed. The in-place mutation workaround of Entries 010 and 011 is removed. The five original `progress.js` exports are untouched.
- **Stale flat duplicates deleted.** Removed from the zip root: `App.jsx`, `Letters.jsx`, `LearnMode.jsx`, `LetterGrid.jsx`, `LetterDetail.jsx`, `parts.jsx`, `hooks.js`, `useLetters.js`, `prefs.js`, `progress.js`, `Roman.jsx`, `main.jsx`, `styles.css`, `README.md`, `words.json`, `letters.json`, `grammar.json`. Before deleting, the four data and README copies were confirmed byte-identical to their `src/` versions, and nothing imported any of the files (`index.html` builds `src/main.jsx`). The root now holds only `index.html`, `package.json`, `vite.config.js`, `src/`, `MANIFEST.md`, `DECISIONS.md` and `Project Brief.md`. Entries 008 and 009 describe the old flat layout; the live equivalents are `router.js`, `useStore.js`, `LettersPage.jsx` and `LetterScreen.jsx`, with the same behaviour.

**Consequences:** Words, Grammar and Letters write through one store. A write in one module can no longer be lost by another (tested in every order). Words behaviour is unchanged; only its adapter file changed.

**Verification:** the same esbuild and Chromium method as Entries 010 and 011 (Preact aliased to React, 390px). The Grammar walkthrough passed again, and a Words walkthrough passed: mark, skip writes nothing, un-learn from the list, quiz shortcut and undo, reload persists, and letter, word and lesson writes in mixed order never erase each other. `vite build` is still not run (no route to `registry.npmjs.org`).

## Entry 013: Home screen, daily streak, resets, accessibility and motion (Round 6, Worker F)

**Decision:** Home becomes the progress screen. The streak, the resets, the accessibility pass and the size check are settled as below. Letters, Words, Grammar and `src/data` are unchanged apart from the shared CSS and the one `progress.js` file.

- **Home content** (`src/home/Home.jsx`): a day streak line, then one row each for Letters, Words and Lessons. Each row is a single link to its section (`#/letters`, `#/words`, `#/grammar`) with a small progress ring, "X/Y learned" (or "completed" for lessons) and a call to action. The brief asked for a ring on letters; the same ring is used on all three rows so they look alike. It costs one tiny component and the ring is decorative (`aria-hidden`), with the numbers also written for screen readers as "X of Y". Counts only include ids that exist in the content, so stale ids in storage cannot push X above Y (same rule as Entries 008, 010, 011). The old "Start with letters / Words / Grammar" buttons are gone because the rows do that job.
- **Empty states:** a section with nothing done shows "No letters learned yet — start here →" (and the same for words and lessons) as the row's call to action. A section in progress shows "Continue →". A finished one shows "All letters learned — open →", with a tinted row and thicker border so it does not rely on colour alone.
- **Streak storage:** the count lives under its own key, `bn.streak` = `{ count }`, not in `bn.progress`. Reason: the brief fixes the progress shape as four fields, Entry 006 already set the precedent of keeping extra state in a separate key, and `lastVisit` alone cannot hold a count. `lastVisit` is still written back to `bn.progress` on load, as asked. **Owner call:** if the streak should sit inside the progress object, the change is local to `progress.js` (add `streak` to `empty()`, `load()` and `touchLastVisit()`, drop `bn.streak`), but it changes the shape the brief fixes.
- **Streak rule** (`nextStreak(prev, lastVisit, today)`, pure and exported): same day keeps the count, exactly the next day adds 1, a gap of 2 or more days restarts at 1, a missing or invalid `lastVisit` gives 1, and a `lastVisit` in the future (clock moved back) keeps the count so the learner is never punished. A stored `bn.streak` that is missing or corrupt counts as 1 when `lastVisit` is yesterday, so a learner who visited before this round gets 2, not 1.
- **Days are local, not UTC.** The old `touchLastVisit` used `toISOString()`, which is the UTC date, so a visit at 01:00 in Finland counted as the day before. It now uses `localDay()`. The stored format is unchanged (`YYYY-MM-DD`). Day differences go through UTC arithmetic on the date parts, so daylight-saving changes cannot make a day 23 or 25 hours. Tested across 29 Mar 2026 (EU clocks forward), a year end and a leap day.
- **When the streak updates:** on page load, and again when the tab becomes visible (`visibilitychange` in `main.jsx`), so a tab left open past midnight counts the new day when the learner returns. Calling it more than once a day changes nothing and notifies nobody.
- **To test by hand:** in DevTools, edit `lastVisit` in `bn.progress` to yesterday's date and reload; the streak goes up by one. Set it to three days ago and reload; it goes back to 1.
- **Resets:** `resetCategory('letters' | 'words' | 'lessons')` clears one list and nothing else. `resetAll()` clears all three lists, restarts the streak at 1 (today counts) and keeps preferences (the romanization setting). A per-category reset does not touch the streak or `lastVisit`. All five are behind one confirmation, so there is no way to reset without it.
- **Confirmation UX:** the reset buttons sit in a "Reset progress" `<details>` at the bottom of Home, so they are not in a beginner's way. Each opens a native `<dialog>` (`showModal()`), which gives a focus trap, Escape to cancel, an inert page behind it, and focus back on the opening button. The dialog names what will be cleared and how many items are marked now, and says it cannot be undone. Cancel is first in tab order and takes the initial focus, so Enter on open does the safe thing. Clicking the backdrop cancels. After a reset a visible `role="status"` line says what happened ("Words progress was reset."). Browsers without `showModal()` (before 2022) fall back to `window.confirm`, so a reset is never unconfirmed. The letters grid, deck list and lesson list keep their one-tap un-learn without a dialog (Entries 009, 010, 011): that is one item, this is bulk.
- **Loading states: none needed, none added.** All content is imported from `src/data/*.json` at build time (Entry 001) and progress is read synchronously from localStorage, so nothing on Home is asynchronous. When the self-hosted font arrives, it should use `font-display: swap` (Entry 001), so text never waits on it.
- **Accessibility pass:**
  - Focus ring: the old ring was yellow `#f2b705`, about 1.8:1 against the page background, which fails the 3:1 minimum for focus indicators. It is now one global `:focus-visible` rule using `--focus` (`#1d1d1b`, about 16:1) at 3px with a 2px offset, and the four older per-component rules use the same variable. `<main>` has no ring because it is only focused by script.
  - Tab order is the visual order and was checked on Home: skip link, brand, romanization toggle, the three rows, the Reset summary.
  - Skip link ("Skip to content") is first. Hash routing owns the URL hash, so it is handled in JS and does not change the route.
  - Focus after navigation: hash links do not move focus and the focused link is usually gone after the screen changes, so a keyboard user would restart from the top. `app.jsx` now focuses `<main>` after every route change (not on first load) and sets `document.title` per section.
  - Icon-only buttons: the audit found none. Every button and link has visible text. The "✓" and "→" marks and the ring are `aria-hidden` and always have a text equivalent next to them ("learned", "Continue"). Nothing needed an `aria-label` added.
  - Tap targets: every visible Home control measured at least 44px (the dialog buttons use the same `.btn` minimum but were not measured separately).
  - Not done: a pass with a real screen reader (VoiceOver, TalkBack, NVDA), and Safari and Firefox. Only Chromium was tested.
- **Reduced motion:** the only motion in the app is the width transition on `.bar-fill` and the new ring transition. One `@media (prefers-reduced-motion: reduce)` block reduces all transitions and animations to 0.01ms and sets `scroll-behavior: auto`. There is no JavaScript animation, and `scrollTo(0, 0)` on route change is already instant. Tested with Chromium's reduced-motion emulation (0.00001s) and with it off (0.3s).
- **Size:** `scripts/check-size.mjs` (`npm run size`) sums the gzipped size of every file in `dist/`, prints them largest first, warns above 80% and exits 1 above 200KB. It was tested against a stand-in `dist/` (passes, fails, missing folder), not against a real Vite build. **Measured instead:** the real source bundled and minified with esbuild, Preact left external, gives 10.7KB JS and 2.4KB CSS gzipped. Preact itself is about 5KB, so the estimate is about 18KB, roughly a tenth of the budget. No code offenders were found and nothing needed fixing. The one real risk is the Noto Sans Bengali font, which is not in the repo (see Pending decisions).
- **Files:** new `src/home/Home.jsx`, `src/components/ProgressRing.jsx`, `src/components/ConfirmDialog.jsx`, `scripts/check-size.mjs`. Changed `src/lib/progress.js` (new exports only; the existing exports and the shape of `bn.progress` are unchanged), `src/app.jsx`, `src/main.jsx`, `src/styles.css` (focus colour in four existing rules, everything else appended) and `package.json` (the `size` script).
- **Verification:** the `src/` tree was bundled with esbuild with Preact aliased to React and driven in Chromium at 390px (the method of Entries 010 to 012), plus the streak and reset logic in plain Node. 64 browser checks passed. They cover: fresh Home with all three empty states and links; streak 1, then 2, then 3 across two simulated consecutive-day visits by editing `lastVisit`, unchanged on a same-day reload, back to 1 after a 3-day gap, with `lastVisit` and the count written back; the progress shape still four keys; Letters, Words and Grammar progress made through their own screens and shown on Home; each category reset alone, reset-all, Cancel, Escape, focus on Cancel and back on the opener, the `window.confirm` fallback; keyboard order, focus rings, skip link, focus on `<main>` after navigation, focus kept inside the dialog; 44px targets; reduced motion; every route still renders, the romanization toggle still works, and no console errors. The Node tests cover `nextStreak` edge cases (DST, year end, leap day, clock moved back, corrupt storage). **Not run:** `vite build`, real Preact (React is not Preact), other browsers, a real screen reader.

**Consequences:** Any new module that shows progress should count only ids present in its content, as Home does. Any new bulk or irreversible action should use `ConfirmDialog`. Any new motion must be covered by the reduced-motion block (it is, if it uses CSS transitions or animations). A streak that should survive a "Reset all" would need a change to `resetAll()`.

## Entry 014: Deployment to GitHub Pages (Round 7, Worker G)

**Decision:** The site deploys to GitHub Pages with a GitHub Actions workflow, `.github/workflows/deploy.yml`, using the framework chosen in Entry 001 (Preact with Vite), so the build command is `npm run build` (`vite build`) and the output folder is `dist/`. Scope was deployment only. No file in `src/` (routes, components, `src/data`, `src/lib`), no `index.html`, `vite.config.js`, `package.json` or `scripts/` was changed.

- **Trigger and permissions:** runs on push to `main` and on manual `workflow_dispatch`. Permissions are the minimum Pages needs: `contents: read`, `pages: write`, `id-token: write`. A `pages` concurrency group with `cancel-in-progress: false` means a deploy in progress is never cancelled by a newer push.
- **Jobs:** `build` (checkout, Node 20, install, build, static check, size check, `configure-pages`, `upload-pages-artifact` with `path: dist`) and `deploy` (needs `build`, environment `github-pages`, `deploy-pages`, page URL output). Action versions: `checkout@v4`, `setup-node@v4`, `configure-pages@v5`, `upload-pages-artifact@v3`, `deploy-pages@v4`.
- **Lockfile:** the repo has no `package-lock.json`, so the install step runs `npm ci` when a lockfile exists and `npm install` when it does not. `cache: npm` is left out on purpose, because `setup-node` fails when caching is requested without a lockfile. **Follow-up for the owner:** run `npm install` once, commit `package-lock.json`, then add `cache: npm`. Until then dependency versions float within the `^` ranges in `package.json`.
- **Static-output check (a workflow step, and the README's manual check):** the build fails if `dist/index.html` or `dist/assets/` is missing, if `dist/index.html` has any root-absolute `src="/..."` or `href="/..."` (which would break under `https://user.github.io/repo/`), or if `dist/` holds `.php`, `.py` or `.cgi` files. The step's shell logic was run against a stand-in `dist/`: it passes with `./assets/...` and fails with `/assets/...`.
- **Size gate:** `npm run size` (Entry 013) runs in CI, so a build over the 200KB gzipped budget cannot be deployed. This is deliberate: the Noto Sans Bengali subset (Entry 001, still not in the repo) is the one real size risk, and this makes it visible the moment the font is added.
- **Why the output is static, checked in the source:** `vite.config.js` has `base: './'`. `index.html` has one root-absolute reference, `/src/main.jsx`, which is Vite's entry and is rewritten to a relative `./assets/...` URL at build time. A search of `src/`, `index.html` and `vite.config.js` found no `fetch(`, `XMLHttpRequest`, `WebSocket`, `EventSource`, `import.meta.env`, `process.env`, service worker, or `http(s)://` URL, and no `speechSynthesis`, `<audio>` or `new Audio`. Routing is hash-based (Entry 001), so no rewrite rules or `404.html` are needed.
- **Custom domain:** no code or repo file is needed. With a workflow-based deploy, GitHub ignores a `CNAME` file, so the domain is set in Settings > Pages, plus DNS records. The README gives the steps. The A and AAAA addresses were checked against GitHub's documentation on 31 Oct 2026; the README says to recheck if the settings page differs. No `public/` folder or `CNAME` file was added.
- **localStorage note:** the README states that the app is fully static and that progress survives visits, with three limits that were not stated before: storage is per browser and device, it is per origin (so adding a custom domain, or moving hosts, starts the learner at zero), and clearing site data or using a private window removes it. This is a consequence of the brief's localStorage constraint, not a change to it.
- **Repo layout:** the zip's project sits in a subfolder named `Bengali app`. The README tells the owner to push the contents of that folder, so `package.json` is at the repository root, which is where the workflow expects it.
- **`.gitignore`:** new, ignores `node_modules/`, `dist/`, `.DS_Store` and `*.log`. `dist/` is not committed; CI builds it.
- **README:** a new root `README.md` (separate from `src/data/README.md`, which is unchanged).

**Consequences:**

- Pages must be switched to Source: "GitHub Actions" once, in the repository settings. The first run before that builds but cannot deploy. The README says so.
- Netlify and Cloudflare Pages need no change: build `npm run build`, publish `dist`.
- Any later change that adds a root-absolute URL, a runtime fetch, or a server-side file will either fail the static check or break the "no backend" constraint, and should be logged as its own decision.

**Addendum (Round 7, follow-up):** `package-lock.json` and the Noto Sans Bengali subset were requested but could not be produced: the sandbox has no route to the npm registry and no Bengali font, and a lockfile needs real integrity hashes, so none was written by hand. Instead `scripts/make-font-subset.py` was added. It reads every non-ASCII character from `src/data/*.json`, subsets a downloaded Noto Sans Bengali `.ttf` to those glyphs plus space, ZWNJ, ZWJ and the dotted circle, and writes `src/fonts/NotoSansBengali-subset.woff2` with licence name strings kept. It found 15 Bengali letters and `ṭ` in the current data. The `@font-face` rule (`font-display: swap`, per Entry 001) is documented in the README but **not** added to `src/styles.css`, because Vite fails the build on a `url()` to a missing file. Add it together with the font file.

**Not verified:** the workflow has never run on GitHub, and `vite build` has never run anywhere (the sandbox cannot reach `registry.npmjs.org`). Verified here: the YAML parses and has the expected triggers, permissions, jobs and steps, and the static-check step behaves as described on a stand-in `dist/`. Not verified: that the action versions resolve and the deploy succeeds, that the real build output passes the static check, and the real gzipped size.

**Not touched (out of scope for this round):** the items in `warnings.txt` (flashcard `aria-label`, the romanization reveal-on-tap override, the streak versus "no due dates" question, the missing Letters learn mode and the stale Entry 009 text, the missing font file, the grammar glossary built from the prompt only, the glyph `aria-label`, and the unverified consonant frequency). The font and the first real build remain the top two items.

## Pending decisions

These will be logged by later rounds as numbered entries. They are not decided here.

- *(Settled in Entry 012: progress.js owns words and lessons, and the stale flat duplicates are deleted.)*
- *(Round 7: a CI build, static check and size check now run on every push to `main` through `.github/workflows/deploy.yml`, Entry 014. The first real run is still to be done and its result recorded.)*
- **Verified build (Round 3):** the Round 3 sandboxes could not reach `registry.npmjs.org`, so `npm install`, `vite build` and the ~200KB gzip check have not been run. Only the data files and the stores were checked, in plain Node. The Letters components (JSX) have never been compiled or rendered in a browser. Run `npm install && npm run build`, then walk the Letters flow by hand, before merging.

- **Size check:** *(script written in Entry 013: `npm run size`.)* Still open: run it against a real `vite build`, and measure the subsetted Noto Sans Bengali WOFF2 once it exists.
- **Letters learn mode:** Entry 009 describes `#/letters/learn` and a "Start learning" button, but the live `src/letters/` has neither. Decide whether to rebuild it. Noticed in Round 6, not touched.
- **Content ordering (remaining):** how multiple lessons and further word decks are sequenced after this seed.
- **Distractor selection (runtime):** how wrong options are picked for letter and word recognition exercises, within Entry 003's principle.
- **Quiz design (letters):** the words quiz is settled in Entry 010 and grammar exercises in Entry 011. Still open for letters: question types, length, feedback, and how outcomes relate to "Mark as learned". Spaced repetition, intervals, and due dates are excluded by the brief.

## Entry 015: Round 8 improvements (owner delegated all calls)

**Decisions:**

- **Letters learn mode:** instead of a separate `#/letters/learn` route, the grid shows "Start learning" or "Continue learning", linking straight to the first unlearned letter (by `order`) at `#/letters/:id`. This supersedes the route and learn-mode screens in Entry 009; the existing Previous/Next pager carries the learner on. Entry 009 file names are stale: `hooks.js` is `useStore.js` and `App.jsx` is `app.jsx`.
- **Flashcard romanization:** with romanization off, tapping a card still reveals that card's transliteration (Entry 010). Accepted: "off" means "hidden until asked for" on flashcards, and it is the learner's own tap.
- **Streak:** kept as a passive counter, not scheduling. The "come back tomorrow" copy was removed, so nothing nudges a return date.
- **Accessibility:** flashcard name comes from its content (the `aria-label` was removed); the letter glyph has `role="img"`; exercise glossaries now cover the explanation text as well as the prompt.
- **Deployment:** added Render (`render.yaml`, `DEPLOY.md`) and a CI build check. The GitHub Pages workflow is now manual-only (`deploy-pages.yml`).

**Still open:** self-hosted font subset (needs the font file), first real `npm run build` / `npm run size`, and the consonant frequency check (Entry 007).

## Entry 016: Grammar expanded from 1 to 12 lessons (Round 9)

**Decision:** `grammar.json` is now `{ "lessons": [...] }` (the loader already accepted this; no code change). Eleven lessons were added after `sentence-sov`: nouns and adjectives, no articles or gender, three ways to say you, verb endings by person, no word for am/is/are, negation with na, question words, possessives, plurals and counting, past/present/future, and a mixed review. That is 77 exercises in total (mcq with 3 options, plus fill).

**Justification:** The grammar points that matter most for a beginner, and that differ most from English, are formality in you, verb endings, the missing "to be", and post-verb negation. Each lesson teaches one idea per `##` section and glosses its technical terms inline.

**Consequences:**

- **Bengali is written in Latin letters inside lessons, not in script.** Real sentences need vowel signs, which Entry 005 keeps out of V1 script content. Latin spellings follow Entry 004 (`o` for the inherent vowel, `sh` for স).
- **The romanization toggle does not hide lesson text.** In a lesson the Latin spelling is the only form of the Bengali, so hiding it would remove the lesson. The toggle still hides romanization everywhere in letters and words.
- All new content is plain ASCII, so the font subset script is unaffected.
- Spellings are standard colloquial Bengali (Kolkata and Dhaka usage agree on these forms). A native speaker should review them before release.

## Entry 017: Grammar expanded from 12 to 27 lessons (Round 10)

**Decision:** Fifteen lessons added after "Review 1": numbers, greetings, polite words, family, go/come/see/do, the -e location ending, postpositions, and/or/but, degree words, time words, want and can, saying I have (achhe/nei), food, colours, and "Review 2". The lesson list is now 27 lessons and 151 exercises. Same rules as Entry 016: Latin spelling only, ASCII only, 3-option mcq, one idea per `##` section, terms glossed inline.

**Notes:** Kal means both yesterday and tomorrow, so its exercises name the tense. Dada and didi are listed as older brother and sister, with the polite use for older people noted. Nomoshkar and assalamu alaikum are both given as hello, with no claim about who uses which. As in Entry 016, a native speaker should review spellings before release.

## Entry 018: Vocabulary, Dialogues and Practice modules; 35 lessons (Round 11)

**Decision:** Three modules were added, and grammar grew to 35 lessons (185 exercises) (eight more, ending with "Review 3").

- **Vocabulary** (`#/vocab`): 12 decks, 120 cards (phrases, numbers, food, family, days, colours, body, animals, nature, home, verbs, describing words). Each deck has a list where a row tap toggles learned, and flashcards (tap to reveal, mark as learned or skip). Content in `src/data/vocab.json`.
- **Dialogues** (`#/dialogues`): 6 short conversations. English is hidden until "Show English"; "Mark as read" toggles. Content in `src/data/dialogues.json`.
- **Practice** (`#/practice`): a 10-question multiple-choice round drawn from all vocabulary. Wrong options come from the same deck (Entry 003). Nothing is saved.
- **Storage:** vocabulary and dialogue progress live under a new key, `bn.extra`, handled by `src/lib/extra.js`. The `bn.progress` shape from the brief is unchanged (same approach as `bn.streak`). Home has "Reset vocabulary and dialogues", and "Reset all progress" clears `bn.extra` too.
- **Latin spelling again** (Entry 016): Bengali in these modules is in Latin letters, ASCII only, and the romanization toggle does not hide it.

**Pending:** native-speaker review of all spellings and phrases. The `bn.extra` key adds a fourth localStorage key (after `bn.progress`, `bn.prefs`, `bn.streak`).


## Entry 019: Word list moved out of the bundle and split into 45 decks

**Decision:** The word list (`content/words.source.json`, 2.5 MB) is no longer imported by the app. `scripts/build-word-decks.mjs` writes `public/data/words/` (`index.json` plus `d01.json` ... `d45.json`, 200 words each, in the original order). The app fetches the index and decks at runtime. Routes are now `#/words` (deck list), `#/words/deck/:deckId`, `#/words/study/:deckId[/:wordId]` and `#/words/quiz/:deckId`. The quiz draws its wrong options from the same deck.

**Why:** Bundling the file made the JS 480 KB gzipped against a 200 KB budget. `scripts/check-size.mjs` now holds only the app shell to the budget and reports `data/` separately. Render's `/data/*` is served with `must-revalidate` so a redeploy is picked up.

**Content notes:** The source holds 11,867 entries. 2,986 are exact copies of earlier entries (same id, same content, in blocks starting at entry 4,625). They are written once, so the decks hold 8,881 words, and every distinct word in the source is present. 14 different words shared an id with an earlier word (for example সব and শব are both `shob`); the later ones became `shob_2` and so on, so marking one learned no longer marks the other. The first word of each id keeps its id, so saved progress stays valid. The source file is unchanged.


## Entry 020: Spaced repetition for Words (owner request; replaces "Mark as learned only" for this module)

**Decision:** Words are now studied in adaptive spaced-repetition sessions. The brief's "no spaced repetition, intervals or due dates" rule and the SRS non-goal no longer apply to Words. Letters, lessons, vocabulary, dialogues and the sentence builder are unchanged. Content files still hold no SRS fields: all state is the learner's, stored in `bn.srs` (a fifth localStorage key).

**How it works**

- **Per-word item:** `state` (new, learning, familiar, known), `ease` (1.3 to 3.0, start 2.5), `interval` (days), `due`, `streak`, `lapses`, `lastWrong`.
- **Rating:** Again, Hard, Good, Easy after every answer, each showing its next delay. Again: due in 5 min, ease -0.2, streak 0. Hard: ease -0.15, interval x1.2. Good: interval x ease. Easy: ease +0.15, interval x ease x1.3. The first pass is 6 h, 1 d or 3 d for Hard, Good, Easy. Intervals are capped at 365 days.
- **States:** new to learning on the first answer; learning to Familiar at 2 correct in a row; Familiar to Known well at 4 in a row, interval of at least 7 days, and no miss in the last 7 days. Again drops one tier (known to familiar, familiar to learning).
- **Learned tick:** a word counts as learned (`wordsLearned`, the ring on Home) from Familiar up, and drops out if a miss sends it back to Learning. Tapping a learned word in the deck list resets it to New. "Reset words" also clears `bn.srs`. Words already learned before this change are seeded as Familiar, due within the next few days.
- **Sessions:** due words (weakest and most overdue first) plus up to 8 new words, at most 25 per session. Words not yet due are held back. `#/words/study/all` reviews due words from every deck; a deck's Study button reviews that deck.
- **Next card:** chosen again after every answer. Missed words come back after 3 other cards, ahead of everything else, and the session ends when every word in it has been answered correctly.
- **Question type rises with mastery:** new = flashcard with self-rating; learning = pick the meaning (3 options); familiar = pick the meaning among look-alike words (4); known = pick the Bengali word for an English meaning (4). A wrong answer is recorded as Again and no rating is asked.
- **Indicator:** a bar with the tier name written out, in the session and in the deck list.

**Consequences:** The optional quiz is unchanged and still has its "Mark as learned" shortcut; a word marked that way is seeded as Familiar the next time the Words screens open. The thresholds are constants at the top of `srsCore.js`.
