import { GrammarPage } from './GrammarPage.jsx';
import { LessonScreen } from './LessonScreen.jsx';

// Routes (everything after "#/grammar"):
//   (none)    lesson list
//   :id       one lesson
export function Grammar({ rest }) {
  const [id] = rest;
  if (id) return <LessonScreen key={id} id={id} />;
  return <GrammarPage />;
}
