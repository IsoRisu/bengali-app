import { useDeck } from './words.js';
import { WordsLoading } from './Loading.jsx';
import { Roman } from '../components/Roman.jsx';
import { getWordsLearned, subscribeWords, setWordLearned } from './wordsProgress.js';
import { useStore } from '../lib/useStore.js';

// The words of one deck. A learned word is a button: one tap un-learns it. An
// unlearned word is a link that opens the flashcards at that word.
export function DeckPage({ deckId }) {
  const learnedIds = useStore(getWordsLearned, subscribeWords);
  const { data: deck, error, retry } = useDeck(deckId);
  if (!deck) return <WordsLoading error={error} retry={retry} />;

  const words = deck.items;
  const total = words.length;
  const count = words.filter((w) => learnedIds.includes(w.id)).length;
  const allDone = count === total;

  return (
    <main class="page">
      <a class="back" href="#/words">← Words</a>
      <h1>{deck.title}</h1>

      <p class="counter" aria-live="polite">
        <strong>{count}</strong> of {total} learned
      </p>
      <div
        class="bar"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax={total}
        aria-valuenow={count}
        aria-label="Words learned in this deck"
      >
        <div class="bar-fill" style={{ width: `${(count / total) * 100}%` }} />
      </div>

      <div class="actions">
        {!allDone && (
          <a class="btn btn-primary" href={`#/words/study/${deckId}`}>
            {count === 0 ? 'Start learning' : 'Continue learning'}
          </a>
        )}
        <a class="btn" href={`#/words/quiz/${deckId}`}>Quiz (optional)</a>
      </div>

      <ul class="wlist">
        {words.map((w) => {
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
                <a class="wrow" href={`#/words/study/${deckId}/${w.id}`}>{body}</a>
              )}
            </li>
          );
        })}
      </ul>
      <p class="muted">Tap a ✓ word to un-learn it. Tap any other word to study it.</p>
    </main>
  );
}
