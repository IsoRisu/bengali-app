import raw from '../data/vocab.json';

export const DECKS = raw.decks;
export const findDeck = (id) => DECKS.find((d) => d.id === id);
export const ALL_ITEMS = DECKS.flatMap((d) => d.items.map((i) => ({ ...i, deck: d.id })));
