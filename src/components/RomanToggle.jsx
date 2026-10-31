import { getPrefs, setShowRomanization, subscribePrefs } from '../lib/prefs.js';
import { useStore } from '../lib/useStore.js';

export function RomanToggle() {
  const { showRomanization } = useStore(getPrefs, subscribePrefs);
  return (
    <button
      type="button"
      class="btn btn-quiet"
      aria-pressed={showRomanization}
      onClick={() => setShowRomanization(!showRomanization)}
    >
      Romanization: {showRomanization ? 'on' : 'off'}
    </button>
  );
}
