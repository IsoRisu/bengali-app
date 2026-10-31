import { LETTERS, findLetter, typeLabel } from './letters.js';
import { Roman } from '../components/Roman.jsx';
import { getProgress, subscribeProgress, toggleLetterLearned } from '../lib/progress.js';
import { useStore } from '../lib/useStore.js';

// One letter per screen: the glyph, how it sounds, one example word, one action.
export function LetterScreen({ id }) {
  const { lettersLearned } = useStore(getProgress, subscribeProgress);
  const letter = findLetter(id);

  if (!letter) {
    return (
      <main class="page">
        <h1>Letter not found</h1>
        <a class="btn btn-primary" href="#/letters">Back to letters</a>
      </main>
    );
  }

  const index = LETTERS.indexOf(letter);
  const prev = LETTERS[index - 1];
  const next = LETTERS[index + 1];
  const learned = lettersLearned.includes(letter.id);

  return (
    <main class="page">
      <a class="back" href="#/letters">← All letters</a>
      <p class="muted">Letter {index + 1} of {LETTERS.length} · {typeLabel(letter.type)}</p>

      <div class="hero bn" lang="bn" role="img" aria-label={`Bengali letter ${letter.name}`}>
        {letter.glyph}
      </div>

      {letter.transliteration ? (
        <p class="sound">
          Sounds like <Roman class="sound-roman">{letter.transliteration}</Roman>
        </p>
      ) : (
        <p class="sound">A silent mark: it has no sound of its own</p>
      )}
      <Roman as="p" class="muted">Called “{letter.name}”</Roman>

      <section class="example" aria-label="Example word">
        <p class="muted">Example word</p>
        <p class="bn example-word" lang="bn">{letter.exampleWord}</p>
        <p>
          {letter.exampleTransliteration && <Roman>{letter.exampleTransliteration}</Roman>}
          {letter.exampleTransliteration && <Roman class="sep"> · </Roman>}
          {letter.exampleTranslation}
        </p>
      </section>

      <button
        type="button"
        class={`btn ${learned ? 'btn-done' : 'btn-primary'}`}
        aria-pressed={learned}
        onClick={() => toggleLetterLearned(letter.id)}
      >
        {learned ? '✓ Learned (tap to undo)' : 'Mark as learned'}
      </button>

      <nav class="pager" aria-label="Letter navigation">
        {prev ? <a class="btn" href={`#/letters/${prev.id}`}>← Previous</a> : <span />}
        {next ? <a class="btn" href={`#/letters/${next.id}`}>Next →</a> : <a class="btn" href="#/letters">Done</a>}
      </nav>
    </main>
  );
}
