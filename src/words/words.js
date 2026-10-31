import raw from '../data/words.json';

export const DECK_TITLE = raw.deck || 'First words';
export const WORDS = raw.items || [];

export function findWord(id) {
  return WORDS.find((w) => w.id === id);
}