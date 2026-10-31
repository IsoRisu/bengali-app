const KEY = 'bn.extra';

let current = null;
const listeners = new Set();

function notify() {
  for (const fn of listeners) {
    try { fn(current); } catch (e) { console.error(e); }
  }
}

function empty() {
  return { vocabLearned: [], dialoguesRead: [], sentenceCleared: [], extensionsLearned: [] };
}

function load() {
  if (current) return current;
  try {
    const raw = localStorage.getItem(KEY);
    if (raw) {
      const parsed = JSON.parse(raw);
      current = {
        vocabLearned: Array.isArray(parsed.vocabLearned) ? parsed.vocabLearned : [],
        dialoguesRead: Array.isArray(parsed.dialoguesRead) ? parsed.dialoguesRead : [],
        sentenceCleared: Array.isArray(parsed.sentenceCleared) ? parsed.sentenceCleared : [],
        extensionsLearned: Array.isArray(parsed.extensionsLearned) ? parsed.extensionsLearned : []
      };
      return current;
    }
  } catch (e) {}
  current = empty();
  return current;
}

export function setExtensionLearned(id, bool = true) {
  const cur = load();
  const set = new Set(cur.extensionsLearned || []);
  if (bool) set.add(id);
  else set.delete(id);
  save({ ...cur, extensionsLearned: Array.from(set) });
}

function save(next) {
  current = next;
  try {
    localStorage.setItem(KEY, JSON.stringify(current));
  } catch (e) {}
  notify();
}

export function getExtra() {
  return load();
}

export function subscribeExtra(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setVocabLearned(id, bool = true) {
  const cur = load();
  const set = new Set(cur.vocabLearned);
  if (bool) set.add(id);
  else set.delete(id);
  save({ ...cur, vocabLearned: Array.from(set) });
}

export function setDialogueRead(id, bool = true) {
  const cur = load();
  const set = new Set(cur.dialoguesRead);
  if (bool) set.add(id);
  else set.delete(id);
  save({ ...cur, dialoguesRead: Array.from(set) });
}

export function setLevelCleared(id, bool = true) {
  const cur = load();
  const set = new Set(cur.sentenceCleared);
  if (bool) set.add(id);
  else set.delete(id);
  save({ ...cur, sentenceCleared: Array.from(set) });
}

export function resetExtra() {
  save(empty());
}