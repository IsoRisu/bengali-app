import { LESSONS, parseExplanation } from './grammar.js';
import { getLessonsCompleted, subscribeLessons, setLessonCompleted } from './grammarProgress.js';
import { useStore } from '../lib/useStore.js';

// Lesson list. Tapping a row opens the lesson. A completed lesson also has its own
// "Undo" button, so un-completing is one tap from the list (and also on the lesson's last screen).
export function GrammarPage() {
  const completedIds = useStore(getLessonsCompleted, subscribeLessons);
  const total = LESSONS.length;
  const count = LESSONS.filter((l) => completedIds.includes(l.id)).length; // ignores stale ids

  return (
    <main class="page">
      <a class="back" href="#/">← Home</a>
      <h1>Grammar</h1>
      <p class="muted">Short lessons. Every technical term is explained in plain English.</p>

      <p class="counter" aria-live="polite">
        <strong>{count}</strong> of {total} lessons completed
      </p>
      <div
        class="bar"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax={total}
        aria-valuenow={count}
        aria-label="Lessons completed"
      >
        <div class="bar-fill" style={{ width: total ? `${(count / total) * 100}%` : '0%' }} />
      </div>

      <ul class="llist">
        {LESSONS.map((l, i) => {
          const done = completedIds.includes(l.id);
          const parts = parseExplanation(l.explanation).length;
          const exCount = (l.exercises || []).length;
          return (
            <li key={l.id} class="lrow-wrap">
              <a class={`lrow${done ? ' lrow-done' : ''}`} href={`#/grammar/${l.id}`}>
                <span class="lrow-num" aria-hidden="true">{i + 1}</span>
                <span class="lrow-text">
                  <span class="lrow-title">{l.title}</span>
                  <span class="lrow-sub">
                    {done && <span class="sr-only">Completed. </span>}
                    {parts} {parts === 1 ? 'part' : 'parts'} · {exCount} {exCount === 1 ? 'exercise' : 'exercises'}
                  </span>
                </span>
                <span class="lrow-mark" aria-hidden="true">{done ? '✓' : ''}</span>
              </a>
              {done && (
                <button
                  type="button"
                  class="btn lrow-undo"
                  aria-label={`Mark “${l.title}” as not completed`}
                  onClick={() => setLessonCompleted(l.id, false)}
                >
                  Undo
                </button>
              )}
            </li>
          );
        })}
      </ul>
      <p class="muted">Tap a lesson to open it. Tap Undo on a completed lesson to un-complete it.</p>
    </main>
  );
}
