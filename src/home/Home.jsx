import { useState } from 'preact/hooks';
import { LETTERS } from '../letters/letters.js';
import { WORDS } from '../words/words.js';
import { LESSONS } from '../grammar/grammar.js';
import { ProgressRing } from '../components/ProgressRing.jsx';
import { ConfirmDialog } from '../components/ConfirmDialog.jsx';
import { getProgress, getStreak, subscribeProgress, resetCategory, resetAll } from '../lib/progress.js';
import { useStore } from '../lib/useStore.js';
import { DECKS } from '../vocab/vocab.js';
import { DIALOGUES } from '../dialogues/Dialogues.jsx';
import { getExtra, subscribeExtra, resetExtra } from '../lib/extra.js';

const VOCAB_TOTAL = DECKS.reduce((n, d) => n + d.items.length, 0);

// One row per section. `field` is the progress array, `items` the content it counts against.
// Counts only include ids that exist in the content, so stale ids in storage cannot exceed Y.
const SECTIONS = [
  { key: 'letters', title: 'Letters', href: '#/letters', field: 'lettersLearned', items: LETTERS,
    noun: 'letters', verb: 'learned' },
  { key: 'words', title: 'Words', href: '#/words', field: 'wordsLearned', items: WORDS,
    noun: 'words', verb: 'learned' },
  { key: 'lessons', title: 'Lessons', href: '#/grammar', field: 'lessonsCompleted', items: LESSONS,
    noun: 'lessons', verb: 'completed' },
];

const countOf = (progress, s) => s.items.filter((x) => progress[s.field].includes(x.id)).length;

export function Home() {
  const progress = useStore(getProgress, subscribeProgress);
  const streak = useStore(getStreak, subscribeProgress);
  const extra = useStore(getExtra, subscribeExtra);
  const vCount = DECKS.reduce((n, d) => n + d.items.filter((i) => extra.vocabLearned.includes(i.id)).length, 0);
  const dCount = DIALOGUES.filter((d) => extra.dialoguesRead.includes(d.id)).length;
  const [pending, setPending] = useState(null); // 'letters' | 'words' | 'lessons' | 'all' | null
  const [status, setStatus] = useState('');

  const rows = SECTIONS.map((s) => ({ ...s, count: countOf(progress, s), total: s.items.length }));

  let dialog = null; // what the confirmation says, for the section being reset
  if (pending === 'all') {
    dialog = {
      title: 'Reset all progress?',
      body: 'This clears every learned letter, word and vocabulary card, every completed lesson and every read dialogue, and restarts your day streak at 1. Your romanization setting is kept. This cannot be undone.',
      confirmLabel: 'Reset everything',
      done: 'All progress was reset.',
    };
  } else if (pending === 'extra') {
    dialog = {
      title: 'Reset vocabulary and dialogues?',
      body: `This marks all ${VOCAB_TOTAL} vocabulary cards as not learned (${vCount} learned now) and all ${DIALOGUES.length} dialogues as not read. Letters, words and lessons are not affected. This cannot be undone.`,
      confirmLabel: 'Reset vocabulary and dialogues',
      done: 'Vocabulary and dialogue progress was reset.',
    };
  } else if (pending) {
    const r = rows.find((x) => x.key === pending);
    dialog = {
      title: `Reset ${r.noun}?`,
      body: `This marks all ${r.total} ${r.noun} as not ${r.verb} (${r.count} ${r.verb} now). The other sections and your streak are not affected. This cannot be undone.`,
      confirmLabel: `Reset ${r.noun}`,
      done: `${r.title} progress was reset.`,
    };
  }

  const confirm = () => {
    if (pending === 'all') {
      resetAll();
      resetExtra();
    } else if (pending === 'extra') resetExtra();
    else resetCategory(pending);
    setStatus(dialog.done);
    setPending(null);
  };
  const ask = (which) => {
    setStatus('');
    setPending(which);
  };

  return (
    <main class="page">
      <h1>Bengali First Steps</h1>
      <p class="lead">Learn your first Bengali letters and words, plus one grammar lesson.</p>

      <p class="streak">
        <strong>{streak}</strong>-day streak
      </p>

      <h2 class="sr-only">Your progress</h2>
      <ul class="stats">
        {rows.map((r) => {
          const done = r.total > 0 && r.count === r.total;
          return (
            <li key={r.key}>
              <a class={`stat${done ? ' stat-done' : ''}`} href={r.href}>
                <ProgressRing value={r.count} max={r.total} />
                <span class="stat-text">
                  <span class="stat-title">{r.title}</span>
                  <span class="stat-count">
                    <span class="sr-only">{r.count} of {r.total} {r.verb}</span>
                    <span aria-hidden="true"><strong>{r.count}/{r.total}</strong> {r.verb}</span>
                  </span>
                  <span class="stat-cta">
                    {r.count === 0
                      ? `No ${r.noun} ${r.verb} yet — start here `
                      : done
                        ? `All ${r.noun} ${r.verb} — open `
                        : 'Continue '}
                    <span aria-hidden="true">→</span>
                  </span>
                </span>
              </a>
            </li>
          );
        })}
      </ul>

      <h2>More to practise</h2>
      <ul class="llist">
        <li class="lrow-wrap"><a class="lrow" href="#/vocab"><span class="lrow-text"><span class="lrow-title">Vocabulary</span><span class="lrow-sub">{vCount} of {VOCAB_TOTAL} learned</span></span></a></li>
        <li class="lrow-wrap"><a class="lrow" href="#/dialogues"><span class="lrow-text"><span class="lrow-title">Dialogues</span><span class="lrow-sub">{dCount} of {DIALOGUES.length} read</span></span></a></li>
        <li class="lrow-wrap"><a class="lrow" href="#/practice"><span class="lrow-text"><span class="lrow-title">Practice quiz</span><span class="lrow-sub">10 quick questions, nothing saved</span></span></a></li>
      </ul>

      <details class="reset">
        <summary>Reset progress</summary>
        <p class="muted">
          Clears learned marks on this device only. You will be asked to confirm each reset.
        </p>
        <div class="reset-grid">
          {rows.map((r) => (
            <button key={r.key} type="button" class="btn" onClick={() => ask(r.key)}>
              Reset {r.noun}
            </button>
          ))}
          <button type="button" class="btn" onClick={() => ask('extra')}>
            Reset vocabulary and dialogues
          </button>
          <button type="button" class="btn btn-danger" onClick={() => ask('all')}>
            Reset all progress
          </button>
        </div>
      </details>

      <p class="reset-status" role="status">{status}</p>

      <ConfirmDialog
        open={pending !== null}
        title={dialog ? dialog.title : ''}
        body={dialog ? dialog.body : ''}
        confirmLabel={dialog ? dialog.confirmLabel : 'Reset'}
        onConfirm={confirm}
        onClose={() => setPending(null)}
      />
    </main>
  );
}
