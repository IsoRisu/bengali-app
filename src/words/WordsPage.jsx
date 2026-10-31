import { useEffect } from 'preact/hooks';
import { useWordsIndex } from './words.js';
import { WordsLoading } from './Loading.jsx';
import { getWordsLearned, subscribeWords } from './wordsProgress.js';
import { getSrs, subscribeSrs, dueIds, seedLearned, starredIds } from '../lib/srs.js';
import { useStore } from '../lib/useStore.js';

// List of decks, each with its own progress.
export function WordsPage() {
  useEffect(() => { seedLearned(); }, []);
  const learnedIds = useStore(getWordsLearned, subscribeWords);
  const srs = useStore(getSrs, subscribeSrs);
  const { data, error, retry } = useWordsIndex();
  if (!data) return <WordsLoading error={error} retry={retry} back="#/" backLabel="← Home" />;

  const learned = new Set(learnedIds);
  const dueSet = new Set(dueIds(srs));
  const rows = data.decks.map((d) => ({
    ...d,
    done: d.ids.filter((id) => learned.has(id)).length,
    due: d.ids.filter((id) => dueSet.has(id)).length,
  }));
  const dueTotal = rows.reduce((n, d) => n + d.due, 0);
  const total = data.total;
  const count = rows.reduce((n, d) => n + d.done, 0);
  const isNew = (id) => !srs.items[id] || srs.items[id].state === 'new';
  const next = rows.find((d) => d.ids.some(isNew));
  const starredTotal = starredIds(srs).length;

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

      <div class="actions">
        {dueTotal > 0 && (
          <a class="btn btn-primary" href="#/words/study/all">Review {dueTotal} due</a>
        )}
        {starredTotal > 0 && (
          <a class="btn" href="#/words/study/starred">Review ★ starred ({starredTotal})</a>
        )}
        {next && (
          <a class={`btn${dueTotal > 0 ? '' : ' btn-primary'}`} href={`#/words/study/${next.id}`}>
            {count === 0 && dueTotal === 0 ? 'Start learning' : 'Learn new words'}
          </a>
        )}
      </div>

      <ul class="llist">
        {rows.map((d) => (
          <li key={d.id} class="lrow-wrap">
            <a class="lrow" href={`#/words/deck/${d.id}`}>
              <span class="lrow-text">
                <span class="lrow-title">{d.title}</span>
                <span class="lrow-sub">
                  {d.done === d.count ? `All ${d.count} learned ✓` : `${d.done} of ${d.count} learned`}
                  {d.due > 0 && ` · ${d.due} due`}
                </span>
              </span>
            </a>
          </li>
        ))}
      </ul>
    </main>
  );
}
