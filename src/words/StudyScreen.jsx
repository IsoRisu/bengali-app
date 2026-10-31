import { useState, useEffect } from 'preact/hooks';
import { useLoaded, loadIndex, loadDeck } from './words.js';
import { WordsLoading } from './Loading.jsx';
import { MasteryBar } from './MasteryBar.jsx';
import { Roman } from '../components/Roman.jsx';
import { useStore } from '../lib/useStore.js';
import {
  getSrs, subscribeSrs, reviewWord, seedLearned, dueIds, nextDueAt,
} from '../lib/srs.js';
import {
  RATINGS, RATING_LABEL, STATE_LABEL, newItem, stateRank, delayAfter, formatDelay,
} from '../lib/srsCore.js';
import {
  planSession, pickNext, makeQuestion, REQUEUE_GAP, NEW_PER_SESSION, SESSION_CAP,
} from './session.js';

// Spaced-repetition session.
//   Every session = the words that are due (plus a few new ones), weakest first.
//   The next card is chosen again after every answer, from the current state.
//   Type of question rises with mastery: new = flashcard, learning = pick the meaning,
//   familiar = pick the meaning among look-alikes, known well = pick the Bengali word.
//   A miss counts as "Again": the word returns after a few cards, and the session only
//   ends when every word in it has been answered correctly (or the cap is reached).
//
// deckId: a deck id (due words of that deck + new words), or 'all' (due words from every
// deck + new words from the first deck that still has some).

async function loadSessionWords(deckId) {
  seedLearned(); // words learned before spaced repetition get an item first
  const index = await loadIndex();
  const srs = getSrs();
  if (deckId !== 'all') {
    if (!index.decks.some((d) => d.id === deckId)) throw new Error('Unknown deck');
    const deck = await loadDeck(deckId);
    return deck.items;
  }
  // All decks: the decks that hold the words due now, plus the first deck with new words.
  const now = Date.now();
  const due = new Set(dueIds(srs, now));
  const seen = srs.items;
  const needed = index.decks.filter((d) => d.ids.some((id) => due.has(id)));
  const withNew = index.decks.find((d) => d.ids.some((id) => !seen[id]));
  const ids = new Set(needed.map((d) => d.id));
  if (withNew) ids.add(withNew.id);
  const decks = await Promise.all([...ids].sort().map((id) => loadDeck(id)));
  return decks.flatMap((d) => d.items);
}

export function StudyScreen({ deckId, startId }) {
  const { data: words, error, retry } = useLoaded(() => loadSessionWords(deckId), deckId);
  const back = deckId === 'all' ? '#/words' : `#/words/deck/${deckId}`;
  if (!words) return <WordsLoading error={error} retry={retry} back={back} backLabel="← Back" />;
  return <Session words={words} deckId={deckId} startId={startId} back={back} />;
}

function startState(words, startId, extraNew = 0) {
  seedLearned();
  const now = Date.now();
  const items = getSrs().items;
  const plan = planSession({
    words, items, now, focusId: startId,
    newLimit: NEW_PER_SESSION + extraNew,
  });
  return {
    pool: plan.ids,
    eligibleAt: {},
    answered: 0,
    lastId: null,
    stats: { reviewed: 0, correct: 0, newSeen: 0, moves: [], planned: plan.ids.length, dueCount: plan.dueCount, newCount: plan.newCount },
  };
}

function Session({ words, deckId, startId, back }) {
  const srs = useStore(getSrs, subscribeSrs);
  const byId = Object.fromEntries(words.map((w) => [w.id, w]));
  const [sess, setSess] = useState(() => startState(words, startId));
  const [card, setCard] = useState(null);       // { word, question }
  const [phase, setPhase] = useState('ask');   // ask | rate | missed
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [last, setLast] = useState(null);       // { before, after } of the last rating

  // Choose the card whenever the session changes and nothing is on screen.
  useEffect(() => {
    if (card || !sess.pool.length) return;
    const now = Date.now();
    const id = pickNext({
      pool: sess.pool, items: srs.items, eligibleAt: sess.eligibleAt, answered: sess.answered,
      lastId: sess.lastId, now, focusId: startId,
    });
    const word = byId[id];
    const item = srs.items[id] || newItem();
    setCard({ word, question: makeQuestion(word, item.state, words), item });
    setPhase('ask'); setPicked(null); setRevealed(false); setLast(null);
  }, [card, sess]);

  const finishCard = (rating) => {
    const now = Date.now();
    const id = card.word.id;
    const { before, after } = reviewWord(id, rating, now);
    setLast({ before, after });
    const correct = rating !== 'again';
    setSess((s) => {
      const eligibleAt = { ...s.eligibleAt };
      let pool = s.pool;
      if (correct) { pool = pool.filter((p) => p !== id); delete eligibleAt[id]; }
      else eligibleAt[id] = s.answered + 1 + REQUEUE_GAP; // see it again before the session ends
      const moved = stateRank(after.state) !== stateRank(before.state);
      return {
        ...s, pool, eligibleAt, answered: s.answered + 1, lastId: id,
        stats: {
          ...s.stats,
          reviewed: s.stats.reviewed + 1,
          correct: s.stats.correct + (correct ? 1 : 0),
          newSeen: s.stats.newSeen + (before.state === 'new' && correct ? 1 : 0),
          moves: moved ? [...s.stats.moves, { id, from: before.state, to: after.state }] : s.stats.moves,
        },
      };
    });
  };

  const next = () => setCard(null);

  // ---- finished ----
  if (!sess.pool.length && !card) {
    const now = Date.now();
    const st = sess.stats;
    const up = st.moves.filter((m) => stateRank(m.to) > stateRank(m.from));
    const upTo = (tier) => up.filter((m) => m.to === tier).length;
    const nextAt = nextDueAt(srs, now);
    const empty = st.planned === 0;
    const moreNew = words.filter((w) => !srs.items[w.id] || srs.items[w.id].state === 'new').length;
    return (
      <main class="page">
        <a class="back" href={back}>← Back</a>
        <h1>{empty ? 'All caught up' : 'Session done'}</h1>
        {empty ? (
          <p>Nothing is due right now.{nextAt && <> Your next word is due in <strong>{formatDelay(nextAt - now)}</strong>.</>}</p>
        ) : (
          <>
            <p class="counter">
              <strong>{st.correct}</strong> of {st.reviewed} answers correct
            </p>
            <ul class="summary">
              <li>{st.dueCount} {st.dueCount === 1 ? 'word' : 'words'} reviewed, {st.newCount} new</li>
              {upTo('familiar') > 0 && <li>{upTo('familiar')} reached {STATE_LABEL.familiar}</li>}
              {upTo('known') > 0 && <li>{upTo('known')} reached {STATE_LABEL.known}</li>}
              {st.moves.some((m) => stateRank(m.to) < stateRank(m.from)) && (
                <li>{st.moves.filter((m) => stateRank(m.to) < stateRank(m.from)).length} slipped back a tier</li>
              )}
              {nextAt && <li>Next word due in {formatDelay(nextAt - now)}</li>}
            </ul>
          </>
        )}
        <div class="actions actions-col">
          {moreNew > 0 && (
            <button type="button" class="btn btn-primary" onClick={() => { setCard(null); setSess(startState(words, null, 0)); }}>
              {empty ? `Learn ${Math.min(NEW_PER_SESSION, moreNew)} new words` : `Keep going (${Math.min(NEW_PER_SESSION, moreNew)} new words)`}
            </button>
          )}
          <a class="btn" href={back}>Back</a>
        </div>
      </main>
    );
  }

  if (!card) return <main class="page"><p class="muted" role="status">Loading…</p></main>;

  // ---- one card ----
  const { word, question, item } = card;
  const shown = phase === 'ask' ? item : (last ? last.after : item);
  const total = sess.stats.planned;
  const left = sess.pool.length;
  const ratingHint = (r) => formatDelay(delayAfter(item, r, Date.now()));

  const answerMcq = (opt) => {
    if (phase !== 'ask') return;
    setPicked(opt.id);
    if (opt.id === word.id) setPhase('rate');
    else { setPhase('missed'); finishCard('again'); }
  };

  const ratingButtons = (rs) => (
    <div class="rate" role="group" aria-label="How well did you remember it?">
      {rs.map((r) => (
        <button key={r} type="button" class={`btn rate-${r}`} onClick={() => { finishCard(r); next(); }}>
          <span class="rate-name">{RATING_LABEL[r]}</span>
          <span class="rate-when">{ratingHint(r)}</span>
        </button>
      ))}
    </div>
  );

  const showE2B = question.type === 'e2b';
  return (
    <main class="page">
      <a class="back" href={back}>← Leave session</a>
      <p class="muted" role="status">
        {left} left · {STATE_LABEL[item.state]}
        {sess.eligibleAt[word.id] !== undefined && ' · again'}
      </p>
      <div class="bar" aria-hidden="true">
        <div class="bar-fill" style={{ width: `${total ? ((total - Math.min(left, total)) / total) * 100 : 0}%` }} />
      </div>

      <div class="srs-card">
        <MasteryBar item={shown} />

        {question.type === 'intro' && (
          <button
            type="button"
            class={`flash${revealed ? ' flash-open' : ''}`}
            aria-expanded={revealed}
            onClick={() => setRevealed(true)}
          >
            <span class="bn flash-bn" lang="bn">{word.bengali}</span>
            <Roman class="flash-roman">{word.transliteration}</Roman>
            {revealed ? <span class="flash-en">{word.english}</span> : <span class="flash-hint">Tap to reveal</span>}
          </button>
        )}

        {question.type !== 'intro' && (
          <div class="quiz-q">
            <p class="muted">{showE2B ? 'Which Bengali word means…' : 'What does this word mean?'}</p>
            {showE2B ? (
              <p class="quiz-bn-en">{word.english}</p>
            ) : (
              <>
                <p class="bn quiz-bn" lang="bn">{word.bengali}</p>
                <Roman as="p" class="quiz-roman">{word.transliteration}</Roman>
              </>
            )}
          </div>
        )}
      </div>

      {question.type !== 'intro' && (
        <ul class="opts">
          {question.options.map((o) => {
            const right = o.id === word.id;
            const isPicked = o.id === picked;
            let state = '', mark = '';
            if (phase !== 'ask' && right) { state = ' opt-right'; mark = '✓ '; }
            else if (phase !== 'ask' && isPicked) { state = ' opt-wrong'; mark = '✗ '; }
            return (
              <li key={o.id}>
                <button type="button" class={`btn opt${state}`} aria-disabled={phase !== 'ask'} onClick={() => answerMcq(o)}>
                  {showE2B ? (
                    <span class="opt-bn"><span class="bn" lang="bn">{mark}{o.bengali}</span> <Roman class="opt-roman">{o.transliteration}</Roman></span>
                  ) : <>{mark}{o.english}</>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {question.type === 'intro' && revealed && ratingButtons(RATINGS)}

      {question.type !== 'intro' && phase === 'rate' && (
        <div class="feedback" role="status">
          <p class="feedback-line">✓ Correct. How well did you remember it?</p>
          {ratingButtons(RATINGS)}
        </div>
      )}

      {phase === 'missed' && (
        <div class="feedback" role="status">
          <p class="feedback-line">
            ✗ Not quite. {showE2B
              ? <>The answer is <span class="bn" lang="bn">{word.bengali}</span> (<Roman>{word.transliteration}</Roman>).</>
              : <>The answer is “{word.english}”.</>}
          </p>
          <p class="muted">Marked Again. You will see it again before this session ends.</p>
          <button type="button" class="btn btn-primary" onClick={next}>Continue</button>
        </div>
      )}
    </main>
  );
}
