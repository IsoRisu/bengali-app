import raw from '../data/letters.json';

// Pedagogical order only (DECISIONS Entry 002): sort by `order`, never by alphabet.
export const LETTERS = [...raw].sort((a, b) => a.order - b.order);

export const findLetter = (id) => LETTERS.find((l) => l.id === id);
