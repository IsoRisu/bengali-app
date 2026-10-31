import { useState } from 'preact/hooks';
import { Roman } from '../components/Roman.jsx';
import { Glossary } from './Md.jsx';
import { isFillCorrect, isMcqCorrect } from './grammar.js';

// One exercise per screen. `result` is { choice, correct } once answered, else undefined.
// The first answer counts: there is no retry, so the score cannot be gamed and nothing
// here blocks the learner (Next is always available as "Skip").

function Feedback({ ex, result }) {
  return (
    <div class="feedback" role="status">
      <p class="feedback-line">
        {result.correct ? '✓ Correct.' : <>✗ Not quite. The answer is “{ex.answer}”.</>}
      </p>
      {!result.correct && <p class="g-why">{ex.explanation}</p>}
    </div>
  );
}

function Mcq({ ex, result, onResult }) {
  const answered = !!result;
  return (
    <>
      <ul class="opts">
        {ex.options.map((o) => {
          const isRight = isMcqCorrect(ex, o.text);
          const isPicked = answered && result.choice === o.text;
          let state = '';
          let mark = '';
          if (answered && isRight) { state = ' opt-right'; mark = '✓ '; }
          else if (isPicked) { state = ' opt-wrong'; mark = '✗ '; }
          return (
            <li key={o.text}>
              <button
                type="button"
                class={`btn opt${state}`}
                aria-disabled={answered}
                onClick={() => {
                  if (answered) return;
                  onResult({ choice: o.text, correct: isRight });
                }}
              >
                {mark}{o.text}
                {o.transliteration && <> <Roman>· {o.transliteration}</Roman></>}
              </button>
            </li>
          );
        })}
      </ul>
      {answered && <Feedback ex={ex} result={result} />}
    </>
  );
}

function Fill({ ex, result, onResult }) {
  const [draft, setDraft] = useState('');
  const answered = !!result;
  const submit = (e) => {
    e.preventDefault();
    if (answered || !draft.trim()) return;
    onResult({ choice: draft, correct: isFillCorrect(ex, draft) });
  };
  return (
    <>
      <form class="fill" onSubmit={submit}>
        <input
          type="text"
          class={`g-input${answered ? (result.correct ? ' g-input-right' : ' g-input-wrong') : ''}`}
          aria-label="Your answer"
          value={answered ? result.choice : draft}
          readOnly={answered}
          autoComplete="off"
          autoCapitalize="off"
          spellCheck={false}
          onInput={(e) => setDraft(e.currentTarget.value)}
        />
        {!answered && (
          <button type="submit" class="btn btn-primary" aria-disabled={!draft.trim()}>
            Check
          </button>
        )}
      </form>
      {answered && <Feedback ex={ex} result={result} />}
    </>
  );
}

export function Exercise({ ex, number, total, result, onResult, glossary }) {
  return (
    <>
      <p class="muted">Exercise {number} of {total}</p>
      <h1 class="g-prompt">{ex.prompt}</h1>
      {ex.promptTransliteration && (
        <Roman as="p" class="muted">{ex.promptTransliteration}</Roman>
      )}
      {ex.type === 'fill' ? (
        <Fill ex={ex} result={result} onResult={onResult} />
      ) : (
        <Mcq ex={ex} result={result} onResult={onResult} />
      )}
      <Glossary items={glossary} />
    </>
  );
}
