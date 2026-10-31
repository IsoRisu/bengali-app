import { useEffect } from 'preact/hooks';
import { useDeck } from './words.js';
import { WordsLoading } from './Loading.jsx';
import { Roman } from '../components/Roman.jsx';
import { MasteryBar } from './MasteryBar.jsx';
import { getWordsLearned, subscribeWords } from './wordsProgress.js';
import { getSrs, subscribeSrs, forgetWord, seedLearned } from '../lib/srs.js';
import { isDue } from '../lib/srsCore.js';
import { useStore } from '../lib/useStore.js';

// The words of one deck. A learned word is a button: one tap un-learns it. An
// unlearned word is a link that opens the flashcards at that word.
export function DeckPage({ deckId }) {
  useEffect(() => { seedLearned(); }, []);
  const learnedIds = useStore(getWordsLearned, subscribeWords);
  const srs = useStore(getSrs, subscribeSrs);
  const { data: deck, error, retry } = useDeck(deckId);
  if (!deck) return <WordsLoading error={error} retry={retry} />;

  const words = deck.items;
  const total = words.length;
  const count = words.filter((w) => learnedIds.includes(w.id)).length;
  const now = Date.now();
  const dueCount = words.filter((w) => isDue(srs.items[w.id], now)).length;
  const newCount = words.filter((w) => !srs.items[w.id] || srs.items[w.id].state === 'new').length;
  const known = words.filter((w) => srs.items[w.id]?.state === 'known').length;

  return (
    <main class="page">
      <a class="back" href="#/words">← Words</a>
      <h1>{deck.title}</h1>

      <p class="counter" aria-live="polite">
        <strong>{count}</strong> of {total} learned · {known} known well
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
        {dueCount + newCount > 0 ? (
          <a class="btn btn-primary" href={`#/words/study/${deckId}`}>
            {dueCount > 0 ? `Study (${dueCount} due${newCount ? `, ${Math.min(newCount, 8)} new` : ''})` : 'Learn new words'}
          </a>
        ) : (
          <span class="btn btn-done" aria-disabled="true">Nothing due right now</span>
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
                <MasteryBar item={srs.items[w.id]} compact />
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
                  onClick={() => forgetWord(w.id)}
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
      <p class="muted">Tap a ✓ word to reset it to New. Tap any other word to study it first. Words come back for review when they are due.</p>
    </main>
  );
}
