import raw from '../data/letters.json';

export const LETTERS = [...raw].sort((a, b) => (a.order || 0) - (b.order || 0));

export function findLetter(id) {
  return LETTERS.find((l) => l.id === id);
}