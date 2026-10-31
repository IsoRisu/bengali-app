import raw from '../data/vocab.json';

export const DECKS = raw.decks || [];

export function findDeck(id) {
  return DECKS.find((d) => d.id === id);
}

export const ALL_ITEMS = DECKS.flatMap((d) =>
  d.items.map((item) => ({ ...item, deck: d.id }))
);