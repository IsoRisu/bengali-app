import { useState } from 'preact/hooks';
import { LETTERS, findLetter, typeLabel } from './letters.js';
import { Roman } from '../components/Roman.jsx';
import { getProgress, subscribeProgress, setWordLearned, toggleLetterLearned } from '../lib/progress.js';
import { useStore } from '../lib/useStore.js';

function buildLetterQueue(startId) {
  const { lettersLearned = [] } = getProgress();
  const unlearned = LETTERS.filter((l) => !lettersLearned.includes(l.id)).map((l) => l.id);
  const queue = unlearned.length > 0 ? unlearned : LETTERS.map((l) => l.id);
  const at = queue.indexOf(startId);
  return at > 0 ? [...queue.slice(at), ...queue.slice(0, at)] : queue;
}

export function LetterStudy({ startId }) {
  const { lettersLearned = [] } = useStore(getProgress, subscribeProgress);
  const [queue, setQueue] = useState(() => buildLetterQueue(startId));
  const [pos, setPos] = useState(0);
  const [revealed, setRevealed] = useState(false);

  if (startId && !findLetter(startId)) {
    return (
      <main class="page">
        <h1>Letter not found</h1>
        <a class="btn btn-primary" href="#/letters">Back to letters</a>
      </main>
    );
  }

  const advance = () => {
    setRevealed(false);
    setPos(pos + 1);
  };

  const total = LETTERS.length;
  const count = LETTERS.filter((l) => lettersLearned.includes(l.id)).length;

  if (pos >= queue.length) {
    const unlearned = LETTERS.filter((l) => !lettersLearned.includes(l.id));
    return (
      <main class="page">
        <a class="back" href="#/letters">← Letters</a>
        <h1>{unlearned.length === 0 ? `All ${total} letters learned!` : 'End of this study pass'}</h1>
        <p class="counter"><strong>{count}</strong> of {total} letters learned</p>
        <div class="bar" aria-hidden="true">
          <div class="bar-fill" style={{ width: `${(count / total) * 100}%` }} />
        </div>
        <div class="actions actions-col">
          {unlearned.length > 0 && (
            <button
              type="button"
              class="btn btn-primary"
              onClick={() => {
                setQueue(unlearned.map((l) => l.id));
                setPos(0);
                setRevealed(false);
              }}
            >
              Study remaining {unlearned.length} unlearned {unlearned.length === 1 ? 'letter' : 'letters'}
            </button>
          )}
          <a class="btn" href="#/letters/extensions">Explore letter extensions (কার)</a>
          <a class="btn" href="#/letters">Back to letters grid</a>
        </div>
      </main>
    );
  }

  const letter = findLetter(queue[pos]);
  if (!letter) {
    advance();
    return null;
  }

  const isLearned = lettersLearned.includes(letter.id);

  return (
    <main class="page">
      <a class="back" href="#/letters">← Letters</a>
      <p class="muted">
        Letter flashcards · {pos + 1} of {queue.length}
        <span class="chip-mini">{typeLabel(letter.type)}</span>
      </p>

      <button
        type="button"
        class={`flash flash-letter${revealed ? ' flash-open' : ''}`}
        aria-expanded={revealed}
        onClick={() => setRevealed(!revealed)}
      >
        <span class="bn flash-bn" lang="bn">{letter.glyph}</span>

        {!revealed ? (
          <span class="flash-hint">Tap to flip & reveal sound</span>
        ) : (
          <div class="flash-details">
            <p class="sound" style={{ margin: '8px 0 4px' }}>
              {letter.transliteration
                ? <>Sounds like <Roman class="sound-roman">{letter.transliteration}</Roman></>
                : 'A silent mark: no sound of its own'}
            </p>
            <Roman as="p" class="muted" style={{ margin: '0 0 12px' }}>
              Letter name: “{letter.name}”
            </Roman>
            {letter.exampleWord && (
              <div class="flash-example">
                <span class="muted" style={{ fontSize: '0.85rem' }}>Example: </span>
                <strong class="bn" lang="bn" style={{ fontSize: '1.4rem' }}>{letter.exampleWord}</strong>
                {' '}
                {letter.exampleTransliteration && <Roman class="muted">({letter.exampleTransliteration})</Roman>}
                {letter.exampleTransliteration && <span class="sep"> · </span>}
                <span>{letter.exampleTranslation}</span>
              </div>
            )}
          </div>
        )}
      </button>

      <div class="actions">
        <button type="button" class="btn" onClick={advance}>Skip</button>
        <button
          type="button"
          class={`btn ${isLearned ? 'btn-done' : 'btn-primary'}`}
          onClick={() => {
            if (!isLearned) toggleLetterLearned(letter.id);
            advance();
          }}
        >
          {isLearned ? '✓ Keep learned & Next' : 'Mark as learned'}
        </button>
      </div>

      <nav class="pager">
        <a class="btn btn-quiet" href="#/letters/extensions">
          Letter extensions guide →
        </a>
      </nav>
    </main>
  );
}