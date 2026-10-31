import { LETTERS } from './letters.js';
import { Roman } from '../components/Roman.jsx';
import { getProgress, subscribeProgress } from '../lib/progress.js';
import { useStore } from '../lib/useStore.js';

const GROUPS = [
  { type: 'vowel', title: 'Vowels' },
  { type: 'consonant', title: 'Consonants' },
  { type: 'sign', title: 'Signs & modifiers' },
];

export function LettersPage() {
  const { lettersLearned = [] } = useStore(getProgress, subscribeProgress);
  const total = LETTERS.length;
  const count = LETTERS.filter((l) => lettersLearned.includes(l.id)).length;
  const next = LETTERS.find((l) => !lettersLearned.includes(l.id));

  return (
    <main class="page">
      <h1>Letters</h1>

      <p class="counter" aria-live="polite">
        <strong>{count}</strong> of {total} learned
      </p>
      <div
        class="bar"
        role="progressbar"
        aria-valuemin="0"
        aria-valuemax={total}
        aria-valuenow={count}
        aria-label="Letters learned"
      >
        <div class="bar-fill" style={{ width: `${(count / total) * 100}%` }} />
      </div>

      {next && (
        <p>
          <a class="btn btn-primary" href={`#/letters/${next.id}`}>
            {count === 0 ? 'Start learning' : 'Continue learning'}
          </a>
        </p>
      )}

      {GROUPS.map(({ type, title }) => {
        const groupLetters = LETTERS.filter((l) => l.type === type);
        if (groupLetters.length === 0) return null;
        return (
          <section key={type}>
            <h2>{title}</h2>
            <ul class="grid">
              {groupLetters.map((l) => {
                const learned = lettersLearned.includes(l.id);
                return (
                  <li key={l.id}>
                    <a class={`tile${learned ? ' tile-learned' : ''}`} href={`#/letters/${l.id}`}>
                      <span class="bn tile-glyph" lang="bn">{l.glyph}</span>
                      <Roman class="tile-sub">{l.transliteration}</Roman>
                      {learned && <span class="tile-check" aria-hidden="true">✓</span>}
                      <span class="sr-only">{learned ? ', learned' : ', not learned yet'}</span>
                    </a>
                  </li>
                );
              })}
            </ul>
          </section>
        );
      })}
    </main>
  );
}