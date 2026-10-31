// Session planning for the Words module. Pure functions, no UI and no storage.
import { newItem, isDue, isStarred, stateRank } from '../lib/srsCore.js';

export const NEW_PER_SESSION = 8;   // new words mixed in with the due ones
export const SESSION_CAP = 25;      // most words in one session (the "target")
export const REQUEUE_GAP = 3;      // a missed word returns after this many other cards
export const STAR_REQUEUE_GAP = 1; // a starred word returns sooner
export const STAR_BOOST = 40;      // priority bonus: larger than any spread of tier, ease and overdue, so a star wins

export const requeueGap = (item) => (isStarred(item) ? STAR_REQUEUE_GAP : REQUEUE_GAP);

const itemOf = (items, id) => items[id] || newItem();

// How urgent a word is. Lower = sooner. Weak words come first, then low-ease
// (difficult) words, then the most overdue.
export function priority(item, now) {
  const overdueDays = item.due ? Math.max(0, (now - item.due) / 86400000) : 0;
  return stateRank(item.state === 'new' ? 'learning' : item.state) * 10
    + (item.state === 'new' ? 5 : 0)
    + (item.ease - 1.3) * 3
    - Math.min(overdueDays, 9)
    - (isStarred(item) ? STAR_BOOST : 0); // star = manual override, whatever the computed state
}

// Choose the words for a session: due words first (weakest first), then a few new ones.
// `words` are the candidates, in deck order. `learned` is the set of ids marked learned.
// Returns the ids to study. Words that are not yet due are held back.
export function planSession({ words, items, now, focusId = null, newLimit = NEW_PER_SESSION, cap = SESSION_CAP, starredOnly = false }) {
  if (starredOnly) {
    // Focused review: every starred word, due or not, hardest first. Nothing new is mixed in.
    const starred = words
      .filter((w) => isStarred(items[w.id]))
      .sort((a, b) => priority(itemOf(items, a.id), now) - priority(itemOf(items, b.id), now))
      .slice(0, cap)
      .map((w) => w.id);
    return { ids: starred, dueCount: starred.length, newCount: 0 };
  }
  const due = words
    .filter((w) => isDue(items[w.id], now))
    .sort((a, b) => priority(items[a.id], now) - priority(items[b.id], now));
  // New words: starred ones first, the rest in deck order.
  const fresh = words
    .filter((w) => !items[w.id] || items[w.id].state === 'new')
    .sort((a, b) => Number(isStarred(items[b.id])) - Number(isStarred(items[a.id])));

  const newCount = Math.min(newLimit, fresh.length, cap);
  const dueIds = due.slice(0, Math.max(0, cap - newCount)).map((w) => w.id);
  const newIds = fresh.slice(0, newCount).map((w) => w.id);
  // If there are fewer new words than the limit, give the room back to due words.
  const spare = cap - dueIds.length - newIds.length;
  const moreDue = due.slice(dueIds.length, dueIds.length + Math.max(0, spare)).map((w) => w.id);

  const ids = [...dueIds, ...moreDue, ...newIds];
  if (focusId && words.some((w) => w.id === focusId) && !ids.includes(focusId)) {
    ids.unshift(focusId);
  }
  return { ids, dueCount: dueIds.length + moreDue.length, newCount: newIds.length };
}

// Pick the next word. The order is rebuilt from the current state after every answer.
//   pool        ids still to clear
//   eligibleAt  id -> card count after which a requeued word may return
//   answered    cards answered so far this session
// Words that were missed come back first once their gap has passed. A word is never
// shown twice in a row unless it is the only one left.
export function pickNext({ pool, items, eligibleAt, answered, lastId, now, focusId = null, shuffle: shuffled = false, rand = Math.random }) {
  if (!pool.length) return null;
  if (focusId && pool.includes(focusId) && answered === 0) return focusId;
  const ready = pool.filter((id) => (eligibleAt[id] ?? 0) <= answered);
  const base = ready.length ? ready : [...pool].sort((a, b) => (eligibleAt[a] ?? 0) - (eligibleAt[b] ?? 0)).slice(0, 1);
  const options = base.length > 1 ? base.filter((id) => id !== lastId) : base;
  // Shuffle only changes the display order: the weakest-first ranking is replaced by a random
  // draw, but missed words still come back first. Nothing about the words themselves changes.
  const rank = (id) => (shuffled ? rand() * 100 : priority(itemOf(items, id), now));
  const score = (id) => (eligibleAt[id] !== undefined ? -1000 : 0) + rank(id);
  const scores = new Map(options.map((id) => [id, score(id)]));
  return [...options].sort((a, b) => scores.get(a) - scores.get(b))[0];
}

// How the learner answers: 'mcq' (pick one), 'type' (write it) or 'intro' (new word, flip + rate).
//   auto    New and Learning words use multiple choice; Familiar and Known well use typing.
//   choose  always multiple choice.   type  always typing.
// `override` is the learner's switch on this one card ('mcq' | 'type' | null).
export function answerFormat({ state, preference = 'auto', override = null, canChoose = true }) {
  if (state === 'new') return 'intro';
  let f = override || (preference === 'choose' ? 'mcq' : preference === 'type' ? 'type'
    : (state === 'learning' ? 'mcq' : 'type'));
  if (f === 'mcq' && !canChoose) f = 'type';
  return f;
}

// Which ratings the learner may pick after a correct answer. A correct multiple-choice
// answer cannot be rated Easy (a guess is easier than typing), and neither can a typed
// answer that needed a forgiven slip. Intro cards are self-rated, so all four stay.
export function ratingsAfterCorrect({ format, close = false }) {
  if (format === 'mcq' || close) return ['again', 'hard', 'good'];
  return ['again', 'hard', 'good', 'easy'];
}

// What kind of question a word gets. It gets harder as the word is mastered.
//   new       'intro'   show the word, reveal the meaning, rate yourself
//   learning  'b2e'     Bengali -> English, 3 options
//   familiar  'b2e'     Bengali -> English, 4 options, look-alike wrong answers
//   known     'e2b'     English -> Bengali, 4 options, look-alike wrong answers
export function questionKind(state) {
  if (state === 'new') return { type: 'intro', options: 0 };
  if (state === 'learning') return { type: 'b2e', options: 3 };
  if (state === 'familiar') return { type: 'b2e', options: 4 };
  return { type: 'e2b', options: 4 };
}

function similarity(a, b) {
  const la = new Set(a.usesLetters || []);
  const shared = (b.usesLetters || []).filter((l) => la.has(l)).length;
  const first = a.bengali[0] === b.bengali[0] ? 2 : 0;
  const len = Math.abs(a.bengali.length - b.bengali.length) <= 1 ? 1 : 0;
  return shared + first + len;
}

export function shuffle(list, rand = Math.random) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(rand() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// Build the question for `word`. `options` is null when there are not enough different
// wrong answers to fill a multiple-choice list; the card is then typed only.
export function makeQuestion(word, state, allWords, rand = Math.random) {
  const kind = questionKind(state);
  if (kind.type === 'intro') return { type: 'intro', word };
  const wrongNeeded = kind.options - 1;
  const usable = allWords.filter((w) => w.id !== word.id && w.english !== word.english && w.bengali !== word.bengali);
  // Harder words (familiar, known) get look-alike wrong answers; learning gets random ones.
  const pool = kind.options === 3
    ? shuffle(usable, rand)
    : shuffle(usable, rand)
        .map((w) => ({ w, s: similarity(word, w) + rand() * 0.5 }))
        .sort((a, b) => b.s - a.s)
        .slice(0, 12)
        .map((x) => x.w);
  const seen = new Set([word.english, word.bengali]);
  const wrong = [];
  for (const w of shuffle(pool, rand)) {
    const key = kind.type === 'b2e' ? w.english : w.bengali;
    if (seen.has(key)) continue;
    seen.add(key);
    wrong.push(w);
    if (wrong.length === wrongNeeded) break;
  }
  // Too few different wrong answers: the card can still be typed, just not chosen.
  const canChoose = wrong.length >= wrongNeeded;
  // Other words with the same English meaning are also right when the answer is typed.
  const accept = kind.type === 'e2b' ? allWords.filter((w) => w.id !== word.id && w.english === word.english) : [];
  return { type: kind.type, word, accept, options: canChoose ? shuffle([word, ...wrong], rand) : null };
}
