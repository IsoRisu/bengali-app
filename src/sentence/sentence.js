import raw from '../data/sentence-puzzles.json';

export const LEVELS = raw.levels || [];

export function findLevel(id) {
  return LEVELS.find((l) => l.id === id);
}