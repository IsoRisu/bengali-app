import { useState } from 'preact/hooks';
import { WORDS } from './words.js';
import { Roman } from '../components/Roman.jsx';
import { getWordsLearned, subscribeWords, setWordLearned } from './wordsProgress.js';
import { useStore } from '../lib/useStore.js';

const OPTIONS = 4;

function shuffle(list) {
  const a = [...list];
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [a[i], a[j]] = [a[j], a[i]];
  }
  return a;
}

// One question per word, in random order. Wrong options are the English meanings of
// other words in the deck, so every option is the same kind of thing (DECISIONS Entry 003).
function buildQuestions() {
  return shuffle(WORDS).map((word) => {
    const others = shuffle(WORDS.filter((w) => w.id !== word.id)).slice(0, OPTIONS - 1);
    return { word, options: shuffle([word, ...others]) };
  });
}

// Optional reinforcement. Nothing here blocks anything: the back link is always
// there, and the only write is the optional "Mark as learned" shortcut.
export function QuizScreen() {
  const learnedIds = useStore(getWordsLearned, subscribeWords);
  const [questions, setQuestions] = useState(buildQuestions);
  const [qi, setQi] = useState(0);
  const [picked, setPicked] = useState(null); // id of the chosen option
  const [score, setScore] = useState(0);

  if (WORDS.length < 2) {
    return (
      <main class="page">
        <a class="back" href="#/words">← Words</a>
        <h1>Quiz</h1>
        <p>The deck needs at least 2 words for a quiz.</p>
      </main>
    );
  }

  if (qi >= questions.length) {
    return (
      <main class="page">
        <a class="back" href="#/words">← Words</a>
        <h1>Quiz done</h1>
        <p class="counter"><strong>{score}</strong> of {questions.length} correct</p>
        <div class="actions actions-col">
          <button
            type="button"
            class="btn btn-primary"
            onClick={() => {
              setQuestions(buildQuestions());
              setQi(0);
              setPicked(null);
              setScore(0);
            }}
          >
            Try again
          </button>
          <a class="btn" href="#/words">Back to deck</a>
        </div>
      </main>
    );
  }

  const { word, options } = questions[qi];
  const answered = picked !== null;
  const correct = picked === word.id;
  const learned = learnedIds.includes(word.id);

  const pick = (id) => {
    if (answered) return;
    setPicked(id);
    if (id === word.id) setScore(score + 1);
  };

  return (
    <main class="page">
      <a class="back" href="#/words">← Words (leave quiz)</a>
      <p class="muted">Quiz · question {qi + 1} of {questions.length}</p>

      <div class="quiz-q">
        <p class="muted">What does this word mean?</p>
        <p class="bn quiz-bn" lang="bn">{word.bengali}</p>
        <Roman as="p" class="quiz-roman">{word.transliteration}</Roman>
      </div>

      <ul class="opts">
        {options.map((o) => {
          const isRight = o.id === word.id;
          const isPicked = o.id === picked;
          let state = '';
          let mark = '';
          if (answered && isRight) { state = ' opt-right'; mark = '✓ '; }
          else if (answered && isPicked) { state = ' opt-wrong'; mark = '✗ '; }
          return (
            <li key={o.id}>
              <button type="button" class={`btn opt${state}`} aria-disabled={answered} onClick={() => pick(o.id)}>
                {mark}{o.english}
              </button>
            </li>
          );
        })}
      </ul>

      {answered && (
        <div class="feedback" role="status">
          <p class="feedback-line">
            {correct ? '✓ Correct.' : <>✗ Not quite. The answer is “{word.english}”.</>}
          </p>
          {correct && (
            learned ? (
              <button type="button" class="btn btn-done" onClick={() => setWordLearned(word.id, false)}>
                ✓ Learned (tap to undo)
              </button>
            ) : (
              <button type="button" class="btn" onClick={() => setWordLearned(word.id, true)}>
                Mark as learned
              </button>
            )
          )}
          <button
            type="button"
            class="btn btn-primary"
            onClick={() => {
              setQi(qi + 1);
              setPicked(null);
            }}
          >
            {qi + 1 === questions.length ? 'See result' : 'Next'}
          </button>
        </div>
      )}
    </main>
  );
}
