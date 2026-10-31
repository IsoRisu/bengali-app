import { WordsPage } from './WordsPage.jsx';
import { DeckPage } from './DeckPage.jsx';
import { StudyScreen } from './StudyScreen.jsx';
import { QuizScreen } from './QuizScreen.jsx';

// Routes (everything after "#/words"):
//   (none)                  list of decks
//   deck/:deckId            the words of one deck
//   study/all               spaced-repetition session: due words from every deck
//   study/:deckId           spaced-repetition session for one deck (due words + a few new)
//   study/:deckId/:wordId   same, with that word first
//   quiz/:deckId            optional reinforcement quiz on that deck
export function Words({ rest }) {
  const [sub, deckId, wordId] = rest;
  if (sub === 'deck' && deckId) return <DeckPage key={deckId} deckId={deckId} />;
  if (sub === 'study' && deckId) return <StudyScreen key={`${deckId}/${wordId || ''}`} deckId={deckId} startId={wordId} />;
  if (sub === 'quiz' && deckId) return <QuizScreen key={deckId} deckId={deckId} />;
  return <WordsPage />;
}
