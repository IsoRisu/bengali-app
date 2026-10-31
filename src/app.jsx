import { useEffect, useRef } from 'preact/hooks';
import { useHashRoute } from './lib/router.js';
import { RomanToggle } from './components/RomanToggle.jsx';
import { Home } from './home/Home.jsx';
import { LettersPage } from './letters/LettersPage.jsx';
import { LetterScreen } from './letters/LetterScreen.jsx';
import { Words } from './words/Words.jsx';
import { Grammar } from './grammar/Grammar.jsx';
import { Vocab } from './vocab/Vocab.jsx';
import { Dialogues } from './dialogues/Dialogues.jsx';
import { Practice } from './practice/Practice.jsx';
import { Sentence } from './sentence/Sentence.jsx';

const TITLES = {
  letters: 'Letters',
  words: 'Words',
  grammar: 'Grammar',
  vocab: 'Vocabulary',
  dialogues: 'Dialogues',
  practice: 'Practice',
  sentence: 'Sentence Builder'
};

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
    document.title = TITLES[section]
      ? `${TITLES[section]} · Bengali First Steps`
      : 'Bengali First Steps';
    if (firstRender.current) {
      firstRender.current = false;
      return;
    }
    focusMain();
  }, [segments.join('/')]);

  let screen;
  const rest = [id, ...more].filter(Boolean);

  if (section === 'letters') screen = id ? <LetterScreen id={id} /> : <LettersPage />;
  else if (section === 'words') screen = <Words rest={rest} />;
  else if (section === 'grammar') screen = <Grammar rest={rest} />;
  else if (section === 'vocab') screen = <Vocab rest={rest} />;
  else if (section === 'dialogues') screen = <Dialogues rest={rest} />;
  else if (section === 'practice') screen = <Practice />;
  else if (section === 'sentence') screen = <Sentence rest={rest} />;
  else screen = <Home />;

  return (
    <>
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