// Words progress: thin re-export of the shared progress store (DECISIONS Entry 012).
// The in-place workaround of Entry 010 is gone: progress.js now owns `wordsLearned`.
import { getProgress, subscribeProgress, isWordLearned, setWordLearned } from '../lib/progress.js';

export const getWordsLearned = () => getProgress().wordsLearned;
export const subscribeWords = subscribeProgress;
export { isWordLearned, setWordLearned };
