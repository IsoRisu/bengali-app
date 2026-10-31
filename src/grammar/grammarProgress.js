import {
  getProgress,
  subscribeProgress,
  isLessonCompleted,
  setLessonCompleted,
  toggleLessonCompleted
} from '../lib/progress.js';

export function getLessonsCompleted() {
  return getProgress().lessonsCompleted;
}

export const subscribeLessons = subscribeProgress;
export { isLessonCompleted, setLessonCompleted, toggleLessonCompleted };