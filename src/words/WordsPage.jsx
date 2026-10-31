import { useWordsIndex } from './words.js';
import { WordsLoading } from './Loading.jsx';
import { getWordsLearned, subscribeWords } from './wordsProgress.js';
import { useStore } from '../lib/useStore.js';

// List of decks, each with its own progress.
export function WordsPage() {
  const learnedIds = useStore(getWordsLearned, subscribeWords);
  const { data, error, retry } = useWordsIndex();
  if (!data) return <WordsLoading error={error} retry={retry} back="#/" backLabel="← Home" />;

  const learned = new Set(learnedIds);
  const rows = data.decks.map((d) => ({ ...d, done: d.ids.filter((id) => learned.has(id)).length }));
  const total = data.total;
  const count = rows.reduce((n, d) => n + d.done, 0);
  const next = rows.find((d) => d.done < d.count);

  return (
    <main class="page">
      <a class="back" href="#/">← Home</a>
      <h1>Words</h1>
      <p class="muted">{rows.length} decks</p>

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

      {next && (
        <div class="actions">
          <a class="btn btn-primary" href={`#/words/study/${next.id}`}>
            {count === 0 ? 'Start learning' : 'Continue learning'}
          </a>
        </div>
      )}

      <ul class="llist">
        {rows.map((d) => (
          <li key={d.id} class="lrow-wrap">
            <a class="lrow" href={`#/words/deck/${d.id}`}>
              <span class="lrow-text">
                <span class="lrow-title">{d.title}</span>
                <span class="lrow-sub">
                  {d.done === d.count ? `All ${d.count} learned ✓` : `${d.done} of ${d.count} learned`}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
