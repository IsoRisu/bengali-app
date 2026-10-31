import { masteryFill, STATE_LABEL } from '../lib/srsCore.js';

// Progress indicator for one word. The fill grows with correct answers and drops after
// a miss. The tier name is always written out, so colour is never the only cue.
export function MasteryBar({ item, compact = false }) {
  const state = item ? item.state : 'new';
  const pct = Math.round(masteryFill(item) * 100);
  return (
    <span class={`mastery mastery-${state}${compact ? ' mastery-compact' : ''}`}>
      <span
        class="mastery-track"
        role="progressbar"
        aria-label={`Mastery: ${STATE_LABEL[state]}`}
        aria-valuemin="0"
        aria-valuemax="100"
        aria-valuenow={pct}
      >
        <span class="mastery-fill" style={{ width: `${pct}%` }} />
      </span>
      <span class="mastery-label">{STATE_LABEL[state]}</span>
    </span>
  );
}
