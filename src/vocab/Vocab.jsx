import { useState } from 'preact/hooks';
import { DECKS, findDeck } from './vocab.js';
import { getExtra, subscribeExtra, setVocabLearned } from '../lib/extra.js';
import { useStore } from '../lib/useStore.js';

const countIn = (deck, learned) => deck.items.filter((i) => learned.includes(i.id)).length;

function DeckList() {
  const { vocabLearned } = useStore(getExtra, subscribeExtra);
  return (
    <main class="page">
      <a class="back" href="#/">← Home</a>
      <h1>Vocabulary</h1>
      <p class="muted">Word and phrase decks. Bengali is written in Latin letters here.</p>
      <ul class="llist">
        {DECKS.map((d, i) => {
          const n = countIn(d, vocabLearned);
          const done = n === d.items.length;
          return (
            <li key={d.id} class="lrow-wrap">
              <a class={`lrow${done ? ' lrow-done' : ''}`} href={`#/vocab/${d.id}`}>
                <span class="lrow-num" aria-hidden="true">{i + 1}</span>
                <span class="lrow-text">
                  <span class="lrow-title">{d.title}</span>
                  <span class="lrow-sub">{done && <span class="sr-only">Complete. </span>}{n} of {d.items.length} learned</span>
                </span>
                <span class="lrow-mark" aria-hidden="true">{done ? '✓' : ''}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function DeckPage({ deck }) {
  const { vocabLearned } = useStore(getExtra, subscribeExtra);
  const n = countIn(deck, vocabLearned);
  return (
    <main class="page">
      <a class="back" href="#/vocab">← Vocabulary</a>
      <h1>{deck.title}</h1>
      <p class="counter" aria-live="polite"><strong>{n}</strong> of {deck.items.length} learned</p>
      <div class="bar" aria-hidden="true">
        <div class="bar-fill" style={{ width: `${(n / deck.items.length) * 100}%` }} />
      </div>
      <div class="actions">
        <a class="btn btn-primary" href={`#/vocab/${deck.id}/study`}>Study cards</a>
      </div>
      <p class="muted">Tap a row to mark it learned or not learned.</p>
      <ul class="llist">
        {deck.items.map((it) => {
          const on = vocabLearned.includes(it.id);
          return (
            <li key={it.id}>
              <button type="button" class={`wrow${on ? ' wrow-learned' : ''}`} aria-pressed={on}
                onClick={() => setVocabLearned(it.id, !on)}>
                <span class="wrow-text">
                  <span class="wrow-roman">{it.text}</span>
                  <span class="wrow-en">{it.english}</span>
                </span>
                <span class="wrow-mark" aria-hidden="true">{on ? '✓' : ''}</span>
              </button>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function Study({ deck }) {
  const { vocabLearned } = useStore(getExtra, subscribeExtra);
  const [queue] = useState(() => deck.items.filter((i) => !getExtra().vocabLearned.includes(i.id)));
  const [pos, setPos] = useState(0);
  const [open, setOpen] = useState(false);
  const next = () => {
    setOpen(false);
    setPos(pos + 1);
  };

  if (pos >= queue.length) {
    const n = countIn(deck, vocabLearned);
    return (
      <main class="page">
        <a class="back" href={`#/vocab/${deck.id}`}>← {deck.title}</a>
        <h1>{n === deck.items.length ? 'All cards learned' : 'End of this pass'}</h1>
        <p class="counter"><strong>{n}</strong> of {deck.items.length} learned</p>
        <div class="actions actions-col">
          <a class="btn btn-primary" href={`#/vocab/${deck.id}`}>Back to deck</a>
          <a class="btn" href="#/practice">Practice quiz</a>
        </div>
      </main>
    );
  }

  const it = queue[pos];
  return (
    <main class="page">
      <a class="back" href={`#/vocab/${deck.id}`}>← {deck.title}</a>
      <p class="muted">{pos + 1} of {queue.length}</p>
      <button type="button" class={`flash${open ? ' flash-open' : ''}`} aria-expanded={open} onClick={() => setOpen(true)}>
        <span class="flash-big">{it.text}</span>
        {open ? <span class="flash-en">{it.english}</span> : <span class="flash-hint">Tap to reveal</span>}
      </button>
      <div class="actions">
        <button type="button" class="btn" onClick={next}>Skip</button>
        <button type="button" class="btn btn-primary" onClick={() => { setVocabLearned(it.id, true); next(); }}>
          Mark as learned
        </button>
      </div>
    </main>
  );
}

// Routes after "#/vocab": (none) deck list, :deck deck page, :deck/study flashcards.
export function Vocab({ rest }) {
  const [deckId, sub] = rest;
  if (!deckId) return <DeckList />;
  const deck = findDeck(deckId);
  if (!deck) {
    return (
      <main class="page">
        <h1>Deck not found</h1>
        <a class="btn btn-primary" href="#/vocab">Back to vocabulary</a>
      </main>
    );
  }
  return sub === 'study' ? <Study key={deckId} deck={deck} /> : <DeckPage deck={deck} />;
}
