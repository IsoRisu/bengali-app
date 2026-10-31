import raw from '../data/words.json';

// Array order is display order (src/data/README.md): most useful words first.
export const DECK_TITLE = raw.deck;
export const WORDS = raw.items;

export const findWord = (id) => WORDS.find((w) => w.id === id);
