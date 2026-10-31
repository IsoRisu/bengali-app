import { useState } from 'preact/hooks';
import { useDeck } from './words.js';
import { WordsLoading } from './Loading.jsx';
import { Roman } from '../components/Roman.jsx';
import { getWordsLearned, subscribeWords, setWordLearned } from './wordsProgress.js';
import { useStore } from '../lib/useStore.js';

// The queue is fixed when the session starts: the unlearned words in deck order,
// rotated so that `startId` (if given) comes first.
function buildQueue(WORDS, startId) {
  const learned = getWordsLearned();
  const open = WORDS.filter((w) => !learned.includes(w.id)).map((w) => w.id);
  const at = open.indexOf(startId);
  return at > 0 ? [...open.slice(at), ...open.slice(0, at)] : open;
}

export function StudyScreen({ deckId, startId }) {
  const { data: deck, error, retry } = useDeck(deckId);
  const back = `#/words/deck/${deckId}`;
  if (!deck) return <WordsLoading error={error} retry={retry} back={back} backLabel="← Deck" />;
  return <Study deck={deck} deckId={deckId} startId={startId} back={back} />;
}

function Study({ deck, deckId, startId, back }) {
  const WORDS = deck.items;
  const DECK_TITLE = deck.title;
  const findWord = (id) => WORDS.find((w) => w.id === id);
  const learnedIds = useStore(getWordsLearned, subscribeWords);
  const [queue, setQueue] = useState(() => buildQueue(WORDS, startId));
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (startId && !findWord(startId)) {
    return (
      <main class="page">
        <h1>Word not found</h1>
        <a class="btn btn-primary" href={back}>Back to deck</a>
      </main>
    );
  }

  const advance = () => {
    setRevealed(false);
    setPos(pos + 1);
  };

  const total = WORDS.length;
  const count = WORDS.filter((w) => learnedIds.includes(w.id)).length;

  // Nothing left in the queue: either everything is learned or the pass is finished.
  if (pos >= queue.length) {
    const skipped = WORDS.filter((w) => !learnedIds.includes(w.id));
    return (
      <main class="page">
        <a class="back" href={back}>← {DECK_TITLE}</a>
        <h1>{skipped.length === 0 ? `All ${total} words in this deck learned` : 'End of this pass'}</h1>
        <p class="counter"><strong>{count}</strong> of {total} learned</p>
        <div class="bar" aria-hidden="true">
          <div class="bar-fill" style={{ width: `${(count / total) * 100}%` }} />
        </div>
        <div class="actions actions-col">
          {skipped.length > 0 && (
            <button
              type="button"
              class="btn btn-primary"
              onClick={() => {
                setQueue(buildQueue(WORDS));
                setPos(0);
                setRevealed(false);
              }}
            >
              Go through {skipped.length} unlearned {skipped.length === 1 ? 'word' : 'words'}
            </button>
          )}
          <a class="btn" href={`#/words/quiz/${deckId}`}>Quiz (optional)</a>
          <a class="btn" href={back}>Back to deck</a>
        </div>
      </main>
    );
  }

  const word = findWord(queue[pos]);

  return (
    <main class="page">
      <a class="back" href={back}>← {DECK_TITLE}</a>
      <p class="muted">{DECK_TITLE} · {pos + 1} of {queue.length}</p>

      <button
        type="button"
        class={`flash${revealed ? ' flash-open' : ''}`}
        aria-expanded={revealed}
        onClick={() => setRevealed(true)}
      >
        <span class="bn flash-bn" lang="bn">{word.bengali}</span>
        {/* Romanization on: always visible. Off: hidden until the card is tapped. */}
        <Roman class="flash-roman">{word.transliteration}</Roman>
        {revealed ? (
          <span class="flash-en">{word.english}</span>
        ) : (
          <span class="flash-hint">Tap to reveal</span>
        )}
      </button>

      <div class="actions">
        <button type="button" class="btn" onClick={advance}>Skip</button>
        <button
          type="button"
          class="btn btn-primary"
          onClick={() => {
            setWordLearned(word.id, true);
            advance();
          }}
        >
          Mark as learned
        </button>
      </div>
    </main>
  );
}
