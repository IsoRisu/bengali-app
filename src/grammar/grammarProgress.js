// Grammar progress: thin re-export of the shared progress store (DECISIONS Entry 012).
// progress.js owns `lessonsCompleted`; "Mark lesson complete" is an idempotent setter.
import { getProgress, subscribeProgress, isLessonCompleted, setLessonCompleted } from '../lib/progress.js';

export const getLessonsCompleted = () => getProgress().lessonsCompleted;
export const subscribeLessons = subscribeProgress;
export { isLessonCompleted, setLessonCompleted };
