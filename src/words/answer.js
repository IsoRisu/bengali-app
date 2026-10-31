// Checking a typed answer. Pure functions, no UI and no storage.
//
//   b2e  the learner sees the Bengali word and types the English meaning
//   e2b  the learner sees the English meaning and types the Bengali word, either in
//        Bengali script or romanized (the transliteration shown in the deck)
//
// The result is { ok, close }. `close` means a one-letter slip was forgiven; the
// session treats a forgiven answer as correct but does not allow "Easy" for it.

const strip = (s) => s.normalize('NFD').replace(/[\u0300-\u036f]/g, '');

// English: lower case, no accents, no punctuation, no leading "to " / "a " / "the ".
export function normEnglish(s) {
  return strip(String(s || '').toLowerCase())
    .replace(/\([^)]*\)/g, ' ')
    .replace(/[^a-z0-9\s'-]/g, ' ')
    .replace(/['-]/g, '')
    .replace(/\s+/g, ' ')
    .trim()
    .replace(/^(to|a|an|the)\s+/, '');
}

// Romanized Bengali: letters only. Spaces, hyphens and the digit/underscore marks used
// in the deck data to tell look-alike spellings apart are ignored.
export const normRoman = (s) => strip(String(s || '').toLowerCase()).replace(/[^a-z]/g, '');

// Bengali script: NFC, no spaces or zero-width joiners.
export const normBengali = (s) => String(s || '').normalize('NFC').replace(/[\s\u200c\u200d]/g, '');

export function editDistance(a, b) {
  if (a === b) return 0;
  if (!a.length) return b.length;
  if (!b.length) return a.length;
  let prev = Array.from({ length: b.length + 1 }, (_, i) => i);
  for (let i = 1; i <= a.length; i++) {
    const cur = [i];
    for (let j = 1; j <= b.length; j++) {
      cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
    }
    prev = cur;
  }
  return prev[b.length];
}

// "all, everything" -> ["all everything", "all", "everything"]. Meanings are separated by
// commas, semicolons and slashes; any one of them is a correct answer, and so is the whole line.
export function englishAnswers(english) {
  const out = new Set();
  const whole = normEnglish(english);
  if (whole) out.add(whole);
  for (const part of String(english || '').split(/[,;/]/)) {
    const n = normEnglish(part);
    if (n) out.add(n);
  }
  return [...out];
}

// How many slips are forgiven for an answer of this length.
const slack = (len) => (len >= 10 ? 2 : len >= 5 ? 1 : 0);

function closest(typed, answers) {
  let best = Infinity;
  for (const a of answers) best = Math.min(best, editDistance(typed, a));
  return best;
}

// `question` is { type: 'b2e' | 'e2b', word, accept? }. For e2b, `accept` lists other
// words that share the English meaning, so a different but valid word is not marked wrong.
export function checkAnswer(typed, question) {
  const raw = String(typed || '').trim();
  if (!raw) return { ok: false, close: false, empty: true };
  const { word } = question;

  if (question.type === 'b2e') {
    const typedN = normEnglish(raw);
    if (!typedN) return { ok: false, close: false };
    const answers = englishAnswers(word.english);
    if (answers.includes(typedN)) return { ok: true, close: false };
    const d = closest(typedN, answers);
    return d <= slack(typedN.length) && d <= slack(Math.max(...answers.map((a) => a.length)))
      ? { ok: true, close: true }
      : { ok: false, close: false };
  }

  // e2b: Bengali script or romanization, for this word or any word with the same meaning.
  const words = [word, ...(question.accept || [])];
  if (/[\u0980-\u09FF]/.test(raw)) {
    const t = normBengali(raw);
    return { ok: words.some((w) => normBengali(w.bengali) === t), close: false };
  }
  const t = normRoman(raw);
  if (!t) return { ok: false, close: false };
  const answers = words.map((w) => normRoman(w.transliteration)).filter(Boolean);
  if (answers.includes(t)) return { ok: true, close: false };
  const d = closest(t, answers);
  return d <= slack(t.length) ? { ok: true, close: true } : { ok: false, close: false };
}
