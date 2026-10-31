import { useEffect, useRef } from 'preact/hooks';
import { useHashRoute } from './lib/router.js';
import { RomanToggle } from './components/RomanToggle.jsx';
import { Home } from './home/Home.jsx';
import { LettersPage } from './letters/LettersPage.jsx';
import { LetterScreen } from './letters/LetterScreen.jsx';
import { Words } from './words/Words.jsx';
import { Grammar } from './grammar/Grammar.jsx';

const TITLES = { letters: 'Letters', words: 'Words', grammar: 'Grammar' };

// Hash navigation does not move keyboard focus, and the link that was focused is usually
// gone after the screen changes. Move focus to <main> so Tab starts at the new content.
function focusMain() {
  const main = document.querySelector('main');
  if (!main) return;
  main.setAttribute('tabindex', '-1');
  main.focus({ preventScroll: true });
}

export function App() {
  const segments = useHashRoute();
  const [section, id, ...more] = segments;
  const firstRender = useRef(true);

  useEffect(() => {
    document.title = TITLES[section] ? `${TITLES[section]} · Bengali First Steps` : 'Bengali First Steps';
    if (firstRender.current) {
      firstRender.current = false; // do not steal focus on page load
      return;
    }
    focusMain();
  }, [segments.join('/')]);

  let screen;
  if (section === 'letters') screen = id ? <LetterScreen id={id} /> : <LettersPage />;
  else if (section === 'words') screen = <Words rest={[id, more[0]].filter(Boolean)} />;
  else if (section === 'grammar') screen = <Grammar rest={[id].filter(Boolean)} />;
  else screen = <Home />;

  return (
    <>
      {/* Hash routing owns the URL hash, so this is a button-like link handled in JS. */}
      <a
        class="skip"
        href="#/"
        onClick={(e) => {
          e.preventDefault();
          focusMain();
        }}
      >
        Skip to content
      </a>
      <header class="topbar">
        <a class="brand" href="#/">Bengali First Steps</a>
        <RomanToggle />
      </header>
      {screen}
    </>
  );
}
