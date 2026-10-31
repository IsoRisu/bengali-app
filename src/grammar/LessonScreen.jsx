import { useMemo, useState } from 'preact/hooks';
import { findLesson, parseExplanation, glossaryFor } from './grammar.js';
import { Blocks, Glossary } from './Md.jsx';
import { Exercise } from './Exercise.jsx';
import { getLessonsCompleted, subscribeLessons, setLessonCompleted } from './grammarProgress.js';
import { useStore } from '../lib/useStore.js';

// One lesson, one idea per screen: each `##` section is a reading screen, then one screen
// per exercise, then a finish screen with "Mark lesson complete". The step lives in
// component state, so a reload returns to the start of the lesson (as Words flashcards do).
// Exercises never gate completion: the learner decides when a lesson is done.
export function LessonScreen({ id }) {
  const lesson = findLesson(id);
  const completedIds = useStore(getLessonsCompleted, subscribeLessons);
  const sections = useMemo(() => parseExplanation(lesson ? lesson.explanation : ''), [id]);
  const [step, setStep] = useState(0);
  const [results, setResults] = useState({}); // exercise index -> { choice, correct }

  if (!lesson) {
    return (
      <main class="page">
        <a class="back" href="#/grammar">← Grammar</a>
        <h1>Lesson not found</h1>
        <p>There is no lesson called “{id}”.</p>
        <a class="btn btn-primary" href="#/grammar">Back to lessons</a>
      </main>
    );
  }

  const exercises = lesson.exercises || [];
  const S = sections.length;
  const E = exercises.length;
  const last = S + E; // finish screen
  const done = completedIds.includes(lesson.id);
  const answered = Object.keys(results).length;
  const correct = Object.values(results).filter((r) => r.correct).length;

  const go = (n) => setStep(Math.max(0, Math.min(last, n)));

  let body;
  let nextLabel = 'Next';
  let status;

  if (step < S) {
    const sec = sections[step];
    const text = `${sec.heading} ${sec.text}`;
    status = `${lesson.title} · part ${step + 1} of ${S}`;
    body = (
      <>
        {sec.heading ? <h1>{sec.heading}</h1> : <h1>{lesson.title}</h1>}
        <Blocks blocks={sec.blocks} />
        <Glossary items={glossaryFor(sections, step, text)} />
      </>
    );
    if (step === S - 1) nextLabel = E ? 'Start exercises' : 'Finish';
  } else if (step < last) {
    const i = step - S;
    const ex = exercises[i];
    status = lesson.title;
    body = (
      <Exercise
        key={i}
        ex={ex}
        number={i + 1}
        total={E}
        result={results[i]}
        onResult={(r) => setResults((prev) => ({ ...prev, [i]: r }))}
        glossary={glossaryFor(sections, S - 1, `${ex.prompt} ${ex.explanation || ''}`, false)}
      />
    );
    nextLabel = results[i] ? (i === E - 1 ? 'Finish' : 'Next') : 'Skip';
  } else {
    status = lesson.title;
    body = (
      <>
        <h1>{done ? 'Lesson completed' : 'End of lesson'}</h1>
        {E > 0 && (
          <p class="counter" aria-live="polite">
            {answered === 0 ? (
              <>No exercises answered yet.</>
            ) : (
              <><strong>{correct}</strong> of {E} exercises correct{answered < E ? ` (${E - answered} skipped)` : ''}</>
            )}
          </p>
        )}
        <p class="muted">Exercises are practice. Mark the lesson complete whenever you feel ready.</p>
        <div class="actions actions-col">
          <button
            type="button"
            class={`btn ${done ? 'btn-done' : 'btn-primary'}`}
            aria-pressed={done}
            onClick={() => setLessonCompleted(lesson.id, !done)}
          >
            {done ? '✓ Lesson completed (tap to undo)' : 'Mark lesson complete'}
          </button>
          <button type="button" class="btn" onClick={() => go(0)}>Read the lesson again</button>
          <a class="btn" href="#/grammar">Back to lessons</a>
        </div>
      </>
    );
  }

  return (
    <main class="page">
      <a class="back" href="#/grammar">← Grammar</a>
      <p class="muted g-status">{status}</p>
      {body}
      {step < last && (
        <div class="pager">
          {step > 0 ? (
            <button type="button" class="btn" onClick={() => go(step - 1)}>← Back</button>
          ) : (
            <span />
          )}
          <button type="button" class="btn btn-primary" onClick={() => go(step + 1)}>
            {nextLabel} →
          </button>
        </div>
      )}
      {step === last && (
        <div class="pager">
          <button type="button" class="btn" onClick={() => go(last - 1)}>← Back</button>
          <span />
        </div>
      )}
    </main>
  );
}
