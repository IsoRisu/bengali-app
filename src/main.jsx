import { render } from 'preact';
import { App } from './app.jsx';
import { initPrefs } from './lib/prefs.js';
import { touchLastVisit } from './lib/progress.js';
import './styles.css';

initPrefs();
touchLastVisit(); // updates lastVisit and the daily streak (DECISIONS Entry 013)

// A tab left open past midnight should count the new day when the learner comes back to it.
document.addEventListener('visibilitychange', () => {
  if (document.visibilityState === 'visible') touchLastVisit();
});

render(<App />, document.getElementById('app'));
