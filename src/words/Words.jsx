import { WordsPage } from './WordsPage.jsx';
import { StudyScreen } from './StudyScreen.jsx';
import { QuizScreen } from './QuizScreen.jsx';

// Routes (everything after "#/words"):
//   (none)          deck list
//   study           flashcards, from the first unlearned word
//   study/:id       flashcards, starting at that word
//   quiz            optional reinforcement quiz
export function Words({ rest }) {
  const [sub, id] = rest;
  if (sub === 'study') return <StudyScreen key={id || 'first'} startId={id} />;
  if (sub === 'quiz') return <QuizScreen />;
  return <WordsPage />;
}
