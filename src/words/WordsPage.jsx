import { DECK_TITLE, WORDS } from './words.js';
import { Roman } from '../components/Roman.jsx';
import { getWordsLearned, subscribeWords, setWordLearned } from './wordsProgress.js';
import { useStore } from '../lib/useStore.js';

// Deck list. A learned word is a button: one tap un-learns it. An unlearned word is
// a link that opens the flashcards at that word.
export function WordsPage() {
  const learnedIds = useStore(getWordsLearned, subscribeWords);
  const total = WORDS.length;
  const count = WORDS.filter((w) => learnedIds.includes(w.id)).length;
  const allDone = count === total;

  return (
    <main class="page">
      <a class="back" href="#/">← Home</a>
      <h1>Words</h1>
      <p class="muted">Deck: {DECK_TITLE}</p>

      <p class="counter" aria-live="polite">
        <strong>{count}</strong> of {total} learned
      </p>
      <div
        class="bar"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax={total}
        aria-valuenow={count}
        aria-label="Words learned"
      >
        <div class="bar-fill" style={{ width: `${(count / total) * 100}%` }} />
      </div>

      <div class="actions">
        {!allDone && (
          <a class="btn btn-primary" href="#/words/study">
            {count === 0 ? 'Start learning' : 'Continue learning'}
          </a>
        )}
        <a class="btn" href="#/words/quiz">Quiz (optional)</a>
      </div>

      <ul class="wlist">
        {WORDS.map((w) => {
          const learned = learnedIds.includes(w.id);
          const body = (
            <>
              <span class="bn wrow-bn" lang="bn">{w.bengali}</span>
              <span class="wrow-text">
                <Roman class="wrow-roman">{w.transliteration}</Roman>
                <span class="wrow-en">{w.english}</span>
              </span>
              <span class="wrow-mark" aria-hidden="true">{learned ? '✓' : ''}</span>
            </>
          );
          return (
            <li key={w.id}>
              {learned ? (
                <button
                  type="button"
                  class="wrow wrow-learned"
                  aria-pressed="true"
                  aria-label={`${w.english}, learned. Tap to un-learn.`}
                  onClick={() => setWordLearned(w.id, false)}
                >
                  {body}
                </button>
              ) : (
                <a class="wrow" href={`#/words/study/${w.id}`}>{body}</a>
              )}
            </li>
          );
        })}
      </ul>
      <p class="muted">Tap a ✓ word to un-learn it. Tap any other word to study it.</p>
    </main>
  );
}
