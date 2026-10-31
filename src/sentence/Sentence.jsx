import { useState } from 'preact/hooks';
import { LEVELS, findLevel } from './sentence.js';
import { getExtra, subscribeExtra, setLevelCleared } from '../lib/extra.js';
import { useStore } from '../lib/useStore.js';

function shuffle(a) {
  const b = [...a];
  for (let i = b.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [b[i], b[j]] = [b[j], b[i]];
  }
  return b;
}

function LevelList() {
  const { sentenceCleared = [] } = useStore(getExtra, subscribeExtra);
  return (
    <main class="page">
      <a class="back" href="#/">← Home</a>
      <h1>Sentence builder</h1>
      <p class="muted">Tap the words in the right order to build a Bengali sentence.</p>
      <ul class="llist">
        {LEVELS.map((l, i) => {
          const done = sentenceCleared.includes(l.id);
          return (
            <li key={l.id} class="lrow-wrap">
              <a class={`lrow${done ? ' lrow-done' : ''}`} href={`#/sentence/${l.id}`}>
                <span class="lrow-num" aria-hidden="true">{i + 1}</span>
                <span class="lrow-text">
                  <span class="lrow-title">{l.title}</span>
                  <span class="lrow-sub">
                    {done && <span class="sr-only">Cleared. </span>}
                    {l.puzzles.length} puzzles
                  </span>
                </span>
                <span class="lrow-mark" aria-hidden="true">{done ? '✓' : ''}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function Puzzle({ puzzle, onNext, isLast }) {
  const [pool, setPool] = useState(() => shuffle(puzzle.answer));
  const [built, setBuilt] = useState([]);
  const [result, setResult] = useState(null);

  const pick = (i) => {
    if (result === 'right') return;
    setBuilt([...built, pool[i]]);
    setPool(pool.filter((_, j) => j !== i));
    setResult(null);
  };

  const undo = (i) => {
    if (result === 'right') return;
    setPool([...pool, built[i]]);
    setBuilt(built.filter((_, j) => j !== i));
    setResult(null);
  };

  const reset = () => {
    setPool(shuffle(puzzle.answer));
    setBuilt([]);
    setResult(null);
  };

  const check = () => {
    if (pool.length > 0) return;
    const right =
      built.length === puzzle.answer.length &&
      built.every((w, i) => w === puzzle.answer[i]);
    setResult(right ? 'right' : 'wrong');
  };

  return (
    <>
      <p class="muted">Build: {puzzle.english}</p>
      <div class="build-line" aria-label="Built sentence">
        {built.length === 0 && <span class="muted">Tap words below</span>}
        {built.map((w, i) => (
          <button type="button" key={`b${i}`} class="chip" onClick={() => undo(i)}>
            {w}
          </button>
        ))}
      </div>
      <div class="build-pool" aria-label="Available words">
        {pool.map((w, i) => (
          <button type="button" key={`p${i}`} class="chip" onClick={() => pick(i)}>
            {w}
          </button>
        ))}
      </div>

      {result === null && (
        <div class="actions">
          <button type="button" class="btn" onClick={reset} disabled={built.length === 0}>
            Reset
          </button>
          <button type="button" class="btn btn-primary" onClick={check} disabled={pool.length > 0}>
            Check
          </button>
        </div>
      )}

      {result === 'right' && (
        <div class="feedback" role="status">
          <p class="feedback-line">✓ Correct.</p>
          <p class="g-why">{puzzle.explanation}</p>
          <div class="actions">
            <button type="button" class="btn btn-primary" onClick={onNext}>
              {isLast ? 'Finish level' : 'Next puzzle'}
            </button>
          </div>
        </div>
      )}

      {result === 'wrong' && (
        <div class="feedback" role="status">
          <p class="feedback-line">✗ Not quite. Try again.</p>
          <p class="g-why">{puzzle.explanation}</p>
          <div class="actions">
            <button type="button" class="btn btn-primary" onClick={reset}>Try again</button>
          </div>
        </div>
      )}
    </>
  );
}

function LevelPlay({ level }) {
  const [idx, setIdx] = useState(0);
  const [done, setDone] = useState(false);

  const puzzles = level.puzzles || [];
  if (!puzzles.length) {
    return (
      <main class="page">
        <a class="back" href="#/sentence">← Sentence builder</a>
        <h1>No puzzles in this level</h1>
        <a class="btn btn-primary" href="#/sentence">Back to levels</a>
      </main>
    );
  }

  if (done) {
    return (
      <main class="page">
        <a class="back" href="#/sentence">← Sentence builder</a>
        <h1>Level cleared</h1>
        <p class="muted">
          You have completed all {puzzles.length} puzzles in “{level.title}”.
        </p>
        <div class="actions actions-col">
          <a class="btn btn-primary" href="#/sentence">Back to levels</a>
        </div>
      </main>
    );
  }

  const puzzle = puzzles[idx];
  const isLast = idx + 1 >= puzzles.length;
  const next = () => {
    if (isLast) {
      setLevelCleared(level.id, true);
      setDone(true);
    } else {
      setIdx(idx + 1);
    }
  };

  return (
    <main class="page">
      <a class="back" href="#/sentence">← Sentence builder</a>
      <p class="muted">
        {level.title} · puzzle {idx + 1} of {puzzles.length}
      </p>
      <Puzzle key={idx} puzzle={puzzle} onNext={next} isLast={isLast} />
    </main>
  );
}

export function Sentence({ rest }) {
  const [levelId] = rest;
  if (!levelId) return <LevelList />;
  const level = findLevel(levelId);
  if (!level) {
    return (
      <main class="page">
        <h1>Level not found</h1>
        <a class="btn btn-primary" href="#/sentence">Back to sentence builder</a>
      </main>
    );
  }
  return <LevelPlay level={level} />;
}