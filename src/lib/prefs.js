// Preferences, stored apart from progress (DECISIONS Entry 006).
// The romanization toggle works through one class on <html>: `hide-roman`.
// Anything romanized must be wrapped in <Roman>, which carries the `roman` class.

const KEY = 'bn.prefs';
export const HIDE_ROMAN_CLASS = 'hide-roman';

function load() {
  try {
    const p = JSON.parse(localStorage.getItem(KEY) || '{}');
    return { showRomanization: p.showRomanization !== false }; // visible by default
  } catch {
    return { showRomanization: true };
  }
}

let state = load();
const listeners = new Set();

function apply() {
  document.documentElement.classList.toggle(HIDE_ROMAN_CLASS, !state.showRomanization);
}

export const getPrefs = () => state;

export function subscribePrefs(fn) {
  listeners.add(fn);
  return () => listeners.delete(fn);
}

export function setShowRomanization(show) {
  state = { ...state, showRomanization: !!show };
  try {
    localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    // keep working in memory
  }
  apply();
  listeners.forEach((fn) => fn());
}

export const initPrefs = apply;
