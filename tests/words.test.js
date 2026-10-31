// Run with: npm test   (Node's built-in test runner; no extra packages)
import test from 'node:test';
import assert from 'node:assert/strict';
import { newItem, review, withStar, isStarred, DAY } from '../src/lib/srsCore.js';
import {
  planSession, pickNext, priority, answerFormat, ratingsAfterCorrect, makeQuestion, requeueGap,
  REQUEUE_GAP,
} from '../src/words/session.js';
import { checkAnswer, normEnglish } from '../src/words/answer.js';

const NOW = 1_800_000_000_000;
const W = (id, english, bengali, transliteration) => ({ id, english, bengali, transliteration, usesLetters: [] });
const words = [
  W('a', 'all, everything', 'সব', 'shob'),
  W('b', 'to climb', 'ওঠা', 'otha'),
  W('c', 'farmer', 'কৃষক', 'krishok'),
  W('d', 'spoon', 'চামচ', 'chamoch'),
  W('e', 'to buy', 'কেনা', 'kena'),
  W('f', 'sun (maker of the day)', 'দিবাকর', 'dibakor'),
];
const due = (state, extra = {}) => ({ ...newItem(), state, interval: 1, streak: 2, seen: 2, due: NOW - DAY, ...extra });

// ---- typed answers ----
test('b2e: any listed meaning is correct, "to" and case are ignored', () => {
  const q = { type: 'b2e', word: words[0] };
  assert.equal(checkAnswer('Everything', q).ok, true);
  assert.equal(checkAnswer('all', q).ok, true);
  assert.equal(checkAnswer('all, everything', q).ok, true);
  assert.equal(checkAnswer('nothing', q).ok, false);
  assert.equal(checkAnswer('climb', { type: 'b2e', word: words[1] }).ok, true);
  assert.equal(checkAnswer('sun', { type: 'b2e', word: words[5] }).ok, true);
  assert.equal(normEnglish('To climb'), 'climb');
});
test('b2e: one slip is forgiven on longer answers and flagged as close', () => {
  const q = { type: 'b2e', word: words[2] };
  assert.deepEqual(checkAnswer('farmar', q), { ok: true, close: true });
  assert.equal(checkAnswer('farmer', q).close, false);
  const short = { type: 'b2e', word: words[3] }; // "spoon" has 5 letters
  assert.equal(checkAnswer('spoin', short).ok, true);
  assert.equal(checkAnswer('car', { type: 'b2e', word: W('x', 'cat', 'x', 'x') }).ok, false); // 3 letters: no slack
});
test('e2b: Bengali script or romanization, shared meanings accepted', () => {
  const q = { type: 'e2b', word: words[2], accept: [] };
  assert.equal(checkAnswer('কৃষক', q).ok, true);
  assert.equal(checkAnswer(' krishok ', q).ok, true);
  assert.equal(checkAnswer('সব', q).ok, false);
  const shared = { type: 'e2b', word: words[1], accept: [W('b2', 'to climb', 'চড়া', 'chora')] };
  assert.equal(checkAnswer('চড়া', shared).ok, true);
  assert.equal(checkAnswer('', q).empty, true);
});

// ---- answer format ----
test('auto: new = intro, learning = choose, familiar and known = type', () => {
  assert.equal(answerFormat({ state: 'new' }), 'intro');
  assert.equal(answerFormat({ state: 'learning' }), 'mcq');
  assert.equal(answerFormat({ state: 'familiar' }), 'type');
  assert.equal(answerFormat({ state: 'known' }), 'type');
});
test('preference and per-card switch override the tier; no options means typing', () => {
  assert.equal(answerFormat({ state: 'known', preference: 'choose' }), 'mcq');
  assert.equal(answerFormat({ state: 'learning', preference: 'type' }), 'type');
  assert.equal(answerFormat({ state: 'learning', override: 'type' }), 'type');
  assert.equal(answerFormat({ state: 'familiar', override: 'mcq' }), 'mcq');
  assert.equal(answerFormat({ state: 'learning', canChoose: false }), 'type');
  assert.equal(answerFormat({ state: 'new', preference: 'type' }), 'intro');
});
test('Easy needs typing', () => {
  assert.ok(!ratingsAfterCorrect({ format: 'mcq' }).includes('easy'));
  assert.ok(!ratingsAfterCorrect({ format: 'type', close: true }).includes('easy'));
  assert.ok(ratingsAfterCorrect({ format: 'type' }).includes('easy'));
  assert.ok(ratingsAfterCorrect({ format: 'intro' }).includes('easy'));
});
test('makeQuestion keeps options for choosing, none when the pool is too small', () => {
  const q = makeQuestion(words[0], 'learning', words, () => 0.3);
  assert.equal(q.type, 'b2e'); assert.equal(q.options.length, 3);
  const tiny = makeQuestion(words[0], 'known', words.slice(0, 2), () => 0.3);
  assert.equal(tiny.type, 'e2b'); assert.equal(tiny.options, null);
  assert.equal(makeQuestion(words[0], 'new', words).type, 'intro');
});

// ---- star ----
test('star shortens intervals and never changes the mastery state by itself', () => {
  const base = due('familiar', { interval: 10, streak: 3 });
  const plain = review(base, 'good', NOW);
  const star = review(withStar(base, true), 'good', NOW);
  assert.ok(star.interval < plain.interval);
  assert.ok(star.interval <= 7);
  assert.equal(star.state, plain.state);
  assert.equal(isStarred(star), true);
  assert.equal(isStarred(withStar(star, false)), false);
});
test('starred words rank first and come back sooner', () => {
  const items = { a: due('known'), b: due('learning'), c: due('known', { starred: true }) };
  const plan = planSession({ words: words.slice(0, 3), items, now: NOW });
  assert.equal(plan.ids[0], 'c'); // starred known word outranks a plain learning word
  assert.ok(priority(items.c, NOW) < priority(items.b, NOW));
  assert.ok(requeueGap(items.c) < REQUEUE_GAP);
});
test('starred review includes words that are not due and mixes in nothing new', () => {
  const items = { a: due('known', { starred: true, due: NOW + 30 * DAY }), b: due('learning') };
  const plan = planSession({ words: words.slice(0, 4), items, now: NOW, starredOnly: true });
  assert.deepEqual(plan.ids, ['a']);
  assert.equal(plan.newCount, 0);
});
test('new words: starred first', () => {
  const items = { e: withStar(newItem(), true) };
  const plan = planSession({ words, items, now: NOW, newLimit: 2 });
  assert.equal(plan.ids[0], 'e');
});

// ---- shuffle ----
test('shuffle changes the order, never the data, and missed words still return first', () => {
  const items = { a: due('known'), b: due('learning'), c: due('familiar') };
  const snapshot = JSON.stringify(items);
  const pool = ['a', 'b', 'c'];
  const eligibleAt = {};
  const picks = new Set();
  let seed = 7;
  const rand = () => ((seed = (seed * 16807) % 2147483647) / 2147483647);
  for (let i = 0; i < 30; i++) {
    picks.add(pickNext({ pool, items, eligibleAt, answered: 0, lastId: null, now: NOW, shuffle: true, rand }));
  }
  assert.ok(picks.size > 1); // not always the weakest
  assert.equal(JSON.stringify(items), snapshot);
  const missed = pickNext({ pool, items, eligibleAt: { a: 0 }, answered: 1, lastId: 'b', now: NOW, shuffle: true, rand: () => 0.9 });
  assert.equal(missed, 'a');
  // without shuffle: weakest first
  assert.equal(pickNext({ pool, items, eligibleAt, answered: 0, lastId: null, now: NOW }), 'b');
});
