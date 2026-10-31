import { LettersPage } from './LettersPage.jsx';
import { LetterScreen } from './LetterScreen.jsx';
import { LetterStudy } from './LetterStudy.jsx';
import { ExtensionsPage } from './ExtensionsPage.jsx';
import { GenerativeFlashcards } from './GenerativeFlashcards.jsx';

// Routes under "#/letters":
//   ""                     -> letters grid
//   "study"                -> letter flashcards
//   "study/:id"            -> letter flashcards from id
//   "extensions"           -> letter extensions guide & explorer
//   "extensions/study"     -> generative flashcards
//   ":id"                  -> single letter detail
export function Letters({ rest }) {
  const [sub, second] = rest;

  if (sub === 'study') {
    return <LetterStudy key={second || 'first'} startId={second} />;
  }
  if (sub === 'extensions') {
    if (second === 'study') return <GenerativeFlashcards />;
    return <ExtensionsPage />;
  }
  if (sub) {
    return <LetterScreen key={sub} id={sub} />;
  }
  return <LettersPage />;
}