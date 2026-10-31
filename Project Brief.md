# Project Brief

## Goal

Lightweight static web app for learning Bengali, targeting **absolute beginners**. Static site, no backend, no accounts, no audio.

## Constraints

- Static only. Deploys to GitHub Pages, Netlify or Cloudflare Pages.
- Progress stored in localStorage.
- Mobile-first. Build under \~200KB gzipped.
- **Text only.** No audio, no TTS, no `speechSynthesis` anywhere.
- Words use spaced repetition (Entry 020, owner request): due dates, intervals, a four-level rating and a per-word mastery state, stored in localStorage. Letters, lessons and the other modules stay "Mark as learned" only.
- Romanization visible by default, with a global toggle to hide it.
- One concept per screen. Tap targets at least 44px. Noto Sans Bengali plus clean Latin.
- V1 excludes conjuncts (যুক্তাক্ষর) and vowel signs (কার).
- Letters in pedagogical order via an `order` field: 3 simplest independent vowels plus 8 highest-frequency simple consonants.
- Grammar glosses every technical term inline in plain English.
- All content lives in `src/data/*.json`.

## Progress shape

`{ lettersLearned: string[], wordsLearned: string[], lessonsCompleted: string[], lastVisit: string }`

## Non-goals

Accounts, sync, social, AI, handwriting, audio, SRS outside the Words module, conjuncts, vowel signs, multi-language UI.

## Decisions so far

- **Framework:** Preact with Vite, hash routing (Entry 001 in DECISIONS).
- **Content ordering, distractors, transliteration, schema:** Entries 002 to 004 in DECISIONS.
- **Vowel signs:** excluded from all content, including words and grammar (Entry 005).
- **Romanization toggle:** on by default, stored apart from progress (Entry 006).
- **Pending:** remaining content ordering, runtime distractor selection, quiz design, size check, consonant frequency check (Entry 007).
