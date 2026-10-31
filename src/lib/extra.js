// Progress for the Vocabulary and Dialogues modules. Kept under its own key, like bn.streak,
// so the bn.progress shape from the brief stays exactly as it was (DECISIONS Entry 018).
const KEY = 'bn.extra';
const empty = () => ({ vocabLearned: [], dialoguesRead: [] });
const list = (v) => (Array.isArray(v) ? v.filter((x) => typeof x === 'string') : []);

function load() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { vocabLearned: list(p.vocabLearned), dialoguesRead: list(p.dialoguesRead) };
  } catch {
    return empty();
  }
}

let state = load();
const listeners = new Set();

function save(next) {
  state = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // Storage blocked: keep working in memory.
  }
  listeners.forEach((fn) => fn());
}

function setIn(field, id, on) {
  if (state[field].includes(id) === on) return;
  save({ ...state, [field]: on ? [...state[field], id] : state[field].filter((x) => x !== id) });
}

export const getExtra = () => state;
export const subscribeExtra = (fn) => {
  listeners.add(fn);
  return () => listeners.delete(fn);
};
export const setVocabLearned = (id, on) => setIn('vocabLearned', id, on);
export const setDialogueRead = (id, on) => setIn('dialoguesRead', id, on);
export const resetExtra = () => save(empty());
