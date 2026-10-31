import {
  getProgress,
  subscribeProgress,
  isWordLearned,
  setWordLearned,
  toggleWordLearned
} from '../lib/progress.js';

export function getWordsLearned() {
  return getProgress().wordsLearned;
}

export const subscribeWords = subscribeProgress;
export { isWordLearned, setWordLearned, toggleWordLearned };