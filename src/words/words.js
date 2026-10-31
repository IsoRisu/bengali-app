import { useState, useEffect } from 'preact/hooks';

// Word decks are static JSON in public/data/words/. They are fetched on demand, not
// bundled, so the dictionary does not count towards the JS size budget.
const BASE = `${import.meta.env.BASE_URL}data/words/`;
const cache = new Map();

function load(file) {
  if (!cache.has(file)) {
    const p = fetch(BASE + file).then((r) => {
      if (!r.ok) throw new Error(`Could not load ${file} (${r.status})`);
      return r.json();
    });
    // Do not cache failures, so "Try again" really retries.
    p.catch(() => cache.delete(file));
    cache.set(file, p);
  }
  return cache.get(file);
}

// { total, decks: [{ id, title, count, ids }] }
export const loadIndex = () => load('index.json');
// { id, title, items: [{ id, bengali, transliteration, english, usesLetters }] }
export const loadDeck = (deckId) => load(`${deckId}.json`);

// Small hook: { data, error, retry }. `data` is null while loading.
export function useLoaded(loader, key) {
  const [state, setState] = useState({ data: null, error: null });
  const [attempt, setAttempt] = useState(0);
  useEffect(() => {
    let live = true;
    setState({ data: null, error: null });
    loader().then(
      (data) => live && setState({ data, error: null }),
      (error) => live && setState({ data: null, error }),
    );
    return () => { live = false; };
  }, [key, attempt]);
  return { ...state, retry: () => setAttempt((n) => n + 1) };
}

export const useWordsIndex = () => useLoaded(loadIndex, 'index');
export const useDeck = (deckId) => useLoaded(() => loadDeck(deckId), deckId);
