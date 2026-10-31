import { useState } from 'preact/hooks';
import { ALL_ITEMS } from '../vocab/vocab.js';

const ROUND = 10;
const shuffle = (a) => {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
};

// Wrong options come from the same deck, so they are the same kind of word (DECISIONS Entry 003).
function makeRound() {
  return shuffle(ALL_ITEMS).slice(0, ROUND).map((q) => {
    const others = shuffle(ALL_ITEMS.filter((x) => x.deck === q.deck && x.english !== q.english)).slice(0, 2);
    return { q, options: shuffle([q, ...others]) };
  });
}

// Nothing is saved: practice is a quick check, not progress.
export function Practice() {
  const [round, setRound] = useState(makeRound);
  const [idx, setIdx] = useState(0);
  const [pick, setPick] = useState(null);
  const [score, setScore] = useState(0);

  if (idx >= round.length) {
    return (
      <main class="page">
        <a class="back" href="#/">← Home</a>
        <h1>Practice done</h1>
        <p class="counter"><strong>{score}</strong> of {round.length} correct</p>
        <div class="actions actions-col">
          <button type="button" class="btn btn-primary" onClick={() => { setRound(makeRound()); setIdx(0); setPick(null); setScore(0); }}>
            Play again
          </button>
          <a class="btn" href="#/vocab">Back to vocabulary</a>
        </div>
      </main>
    );
  }

  const { q, options } = round[idx];
  const answered = pick !== null;
  const choose = (o) => {
    if (answered) return;
    setPick(o.id);
    if (o.id === q.id) setScore(score + 1);
  };

  return (
    <main class="page">
      <a class="back" href="#/">← Home</a>
      <p class="muted">Question {idx + 1} of {round.length}</p>
      <div class="quiz-q">
        <p class="muted">What does this mean?</p>
        <p class="quiz-roman">{q.text}</p>
      </div>
      <ul class="opts">
        {options.map((o) => {
          const state = !answered ? '' : o.id === q.id ? ' opt-right' : o.id === pick ? ' opt-wrong' : '';
          return (
            <li key={o.id}>
              <button type="button" class={`btn opt${state}`} disabled={answered && !state} onClick={() => choose(o)}>
                {o.english}{answered && o.id === q.id ? ' ✓' : ''}{state === ' opt-wrong' ? ' ✗' : ''}
              </button>
            </li>
          );
        })}
      </ul>
      {answered && (
        <div class="feedback" role="status">
          <p class="feedback-line">{pick === q.id ? '✓ Correct.' : `✗ Not quite. ${q.text} means “${q.english}”.`}</p>
          <button type="button" class="btn btn-primary" onClick={() => { setIdx(idx + 1); setPick(null); }}>
            {idx + 1 === round.length ? 'See score' : 'Next'}
          </button>
        </div>
      )}
    </main>
  );
}
