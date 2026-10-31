# src/data: how to add content

All app content lives in this folder as JSON. It is imported at build time, so there are no runtime fetches. Nothing here may contain an audio field, a spaced-repetition field (intervals, due dates, ease, and so on), or any UI code.

## Two rules for every addition

### 1. Pedagogical ordering, not alphabet order

Content is sequenced for a beginner, never in dictionary order.

- Letters: `order` is a unique integer, 1 to N with no gaps. The app sorts by `order` only.
- The 3 starter vowels come first. The consonants then follow by a mix of three things: how common the letter is, how simple the shape is, and how soon it lets the learner read a real word. Frequency is approximate and has not been checked against a corpus.
- Prefer a letter that unlocks a word the learner can already read over one that does not.
- Words: array order is display order. Put the most useful, most reusable words first.
- Do not renumber existing letters. Insert by shifting later `order` values, and log the change in `DECISIONS.md`.

### 2. One concept per screen

Every item is shown on its own screen, so each item must teach one thing.

- A letter item teaches one letter, with one example word.
- A word item is one word or one fixed phrase, with one meaning.
- A grammar lesson `explanation` is split with `## ` headings, and each section teaches exactly one idea. The UI shows one section per screen, so do not put two ideas under one heading.
- An exercise asks one question with one correct answer.

## Scope

- V1 teaches independent vowels and consonants with their inherent vowel only. Do not add vowel signs (কার) or conjuncts (যুক্তাক্ষর) as teachable content. Do not add a field for either.
- Every Bengali string has a Latin transliteration sibling next to it (see below).
- Text only. No `audio` field and no mention of speech or TTS.

## Transliteration scheme

Simple English-letter spelling, with no diacritics except `ṭ` where a word needs the retroflex ট (the sound made with the tongue curled back).

- The inherent vowel is written `o` (কল = `kol`).
- স is written `sh`.
- Keep spellings identical across all files.

## Files

### letters.json

An array of:

```json
{ "id": "ma", "glyph": "ম", "name": "mo", "transliteration": "m",
  "type": "consonant", "exampleWord": "মন", "exampleTransliteration": "mon",
  "exampleTranslation": "mind, heart", "order": 4 }
```

- `id`: unique, lower-case Latin, used in routes (`#/letters/ma`) and in `lettersLearned`.
- `type`: `"vowel"` or `"consonant"`.
- `exampleWord` must be a real word. For letter examples, use words with no vowel signs and no conjuncts.

### words.json

```json
{ "deck": "First words",
  "items": [ { "id": "shob", "bengali": "সব", "transliteration": "shob",
               "english": "all, everything", "usesLetters": ["sha", "ba"] } ] }
```

- `id` is unique and is used in `wordsLearned`.
- Words use no vowel signs and no conjuncts. Prefer words made only of already-taught letters.
- Grammar lessons contain no Bengali script in V1. Show Bengali word order with English words.
- Keep romanization in structured fields only, never inside markdown or explanation text, so the global toggle can hide it.
- `usesLetters` is best effort. List the ids of seeded letters that appear in the word, and use `[]` when none do.

### grammar.json

One lesson object:

```json
{ "id": "sentence-sov", "title": "...", "explanation": "markdown",
  "exercises": [ { "type": "mcq", "prompt": "...", "options": [ { "text": "..." } ],
                   "answer": "...", "explanation": "..." } ] }
```

- `id` is unique and is used in `lessonsCompleted`.
- **Gloss rule:** the first time a technical term appears, put a plain-English gloss in parentheses straight after it, for example `**verb** (the action word)`.
- **Markdown subset:** `##` headings, paragraphs, `**bold**`, `*italic*`, `-` bullets and `>` quotes. Do not use tables, images, or HTML, so the app can keep a tiny renderer.
- Exercise `type` is `"mcq"` or `"fill"`.
- `options` (mcq only) is an array of `{ "text", "transliteration"? }`. Add `transliteration` to every option whose text is Bengali.
- `promptTransliteration` (optional) holds the transliteration of any Bengali in the prompt, in the order it appears.
- `answer` is the exact `text` of the correct option (mcq) or the expected typed answer (fill).
- `acceptedAnswers` (fill only, optional) lists other accepted spellings. The app compares answers trimmed and case-insensitive.
- `explanation` is shown when the learner answers wrongly. It says why the right answer is right and why the tempting wrong one is not.

## Writing distractors (wrong options)

- Each wrong option must be wrong for exactly one nameable reason, and the `explanation` names it.
- Never leave two defensible answers.
- Make options the same kind of thing (all words, or all orderings) so format gives nothing away.
- Options must differ by whole words, not by one look-alike glyph. V1 does not teach telling similar shapes apart.
- Use 3 options for beginners.

## Checklist before committing

- [ ] JSON parses.
- [ ] Ids are unique, and `usesLetters` ids exist in `letters.json`.
- [ ] Every Bengali string has a transliteration sibling.
- [ ] No conjuncts, no audio, no SRS fields.
- [ ] One concept per screen.
