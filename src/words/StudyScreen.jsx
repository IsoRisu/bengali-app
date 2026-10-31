import { useState, useEffect, useRef } from 'preact/hooks';
import { useLoaded, loadIndex, loadDeck } from './words.js';
import { WordsLoading } from './Loading.jsx';
import { MasteryBar } from './MasteryBar.jsx';
import { Roman } from '../components/Roman.jsx';
import { useStore } from '../lib/useStore.js';
import {
  getSrs, subscribeSrs, reviewWord, seedLearned, dueIds, nextDueAt, toggleStar, starredIds,
} from '../lib/srs.js';
import {
  RATINGS, RATING_LABEL, STATE_LABEL, newItem, stateRank, delayAfter, formatDelay, isStarred,
} from '../lib/srsCore.js';
import {
  planSession, pickNext, makeQuestion, requeueGap, answerFormat, ratingsAfterCorrect, NEW_PER_SESSION,
} from './session.js';
import { checkAnswer } from './answer.js';
import { getPrefs, subscribePrefs, setAnswerMode, ANSWER_MODES } from '../lib/prefs.js';

// Spaced-repetition session.
//   Every session = the words that are due (plus a few new ones), weakest first.
//   The next card is chosen again after every answer, from the current state.
//   Type of question rises with mastery: new = flashcard, learning = pick the meaning,
//   familiar = pick the meaning among look-alikes, known well = pick the Bengali word.
//   How it is answered: New and Learning cards are multiple choice, Familiar and Known well
//   cards are typed. The learner can switch any card ("Type instead" / "Choose instead") or
//   set a default (Auto / Choose / Type). Easy is only offered after a typed answer.
//   Flipping a card only shows the answer: it never changes mastery. A star marks a word as
//   difficult: it is reviewed sooner and first. Shuffle randomizes the order only.
//   A miss counts as "Again": the word returns after a few cards, and the session only
//   ends when every word in it has been answered correctly (or the cap is reached).
//
// deckId: a deck id (due words of that deck + new words), 'all' (due words from every
// deck + new words from the first deck that still has some), or 'starred' (every starred
// word, due or not).
const isNew = (it) => !it || it.state === 'new';

async function loadSessionWords(deckId) {
  seedLearned(); // words learned before spaced repetition get an item first
  const index = await loadIndex();
  const srs = getSrs();
  if (deckId === 'starred') {
    const starred = new Set(starredIds(srs));
    const decks = await Promise.all(index.decks.filter((d) => d.ids.some((id) => starred.has(id))).map((d) => loadDeck(d.id)));
    return decks.flatMap((d) => d.items);
  }
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
  const withNew = index.decks.find((d) => d.ids.some((id) => isNew(seen[id])));
  const ids = new Set(needed.map((d) => d.id));
  if (withNew) ids.add(withNew.id);
  const decks = await Promise.all([...ids].sort().map((id) => loadDeck(id)));
  return decks.flatMap((d) => d.items);
}

export function StudyScreen({ deckId, startId }) {
  const { data: words, error, retry } = useLoaded(() => loadSessionWords(deckId), deckId);
  const back = deckId === 'all' || deckId === 'starred' ? '#/words' : `#/words/deck/${deckId}`;
  if (!words) return <WordsLoading error={error} retry={retry} back={back} backLabel="← Back" />;
  return <Session words={words} deckId={deckId} startId={startId} back={back} />;
}

function startState(words, startId, extraNew = 0, starredOnly = false) {
  seedLearned();
  const now = Date.now();
  const items = getSrs().items;
  const plan = planSession({
    words, items, now, focusId: startId,
    newLimit: NEW_PER_SESSION + extraNew, starredOnly,
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
  const prefs = useStore(getPrefs, subscribePrefs);
  const starredOnly = deckId === 'starred';
  const byId = Object.fromEntries(words.map((w) => [w.id, w]));
  const [sess, setSess] = useState(() => startState(words, startId, 0, starredOnly));
  const [card, setCard] = useState(null);       // { word, question }
  const [phase, setPhase] = useState('ask');   // ask | rate | missed
  const [picked, setPicked] = useState(null);
  const [revealed, setRevealed] = useState(false);
  const [last, setLast] = useState(null);       // { before, after } of the last rating
  const [shuffled, setShuffled] = useState(false); // random order instead of weakest-first
  const [override, setOverride] = useState(null);  // this card only: 'mcq' | 'type' | null
  const [typed, setTyped] = useState('');
  const [result, setResult] = useState(null);      // { ok, close } of the typed answer
  const [peeked, setPeeked] = useState(false);     // the answer was flipped before answering
  const inputRef = useRef(null);

  // Choose the card whenever the session changes and nothing is on screen.
  useEffect(() => {
    if (card || !sess.pool.length) return;
    const now = Date.now();
    const id = pickNext({
      pool: sess.pool, items: srs.items, eligibleAt: sess.eligibleAt, answered: sess.answered,
      lastId: sess.lastId, now, focusId: startId, shuffle: shuffled,
    });
    const word = byId[id];
    const item = srs.items[id] || newItem();
    setCard({ word, question: makeQuestion(word, item.state, words), item });
    setPhase('ask'); setPicked(null); setRevealed(false); setLast(null);
    setOverride(null); setTyped(''); setResult(null); setPeeked(false);
  }, [card, sess]);

  // Put the cursor in the box when a typed card appears.
  useEffect(() => { if (card && phase === 'ask' && inputRef.current) inputRef.current.focus(); }, [card, override, prefs.answerMode]);

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
      else eligibleAt[id] = s.answered + 1 + requeueGap(getSrs().items[id]); // see it again before the session ends (starred: sooner)
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

  // The answer was flipped before answering, so there is nothing fair to score. Nothing
  // changes in mastery; the card goes to the back of the queue and the learner tries again later.
  const deferCard = () => {
    const id = card.word.id;
    setSess((s) => ({ ...s, answered: s.answered + 1, lastId: id, eligibleAt: { ...s.eligibleAt, [id]: s.answered + 1 + requeueGap(getSrs().items[id]) } }));
    next();
  };

  // ---- finished ----
  if (!sess.pool.length && !card) {
    const now = Date.now();
    const st = sess.stats;
    const up = st.moves.filter((m) => stateRank(m.to) > stateRank(m.from));
    const upTo = (tier) => up.filter((m) => m.to === tier).length;
    const nextAt = nextDueAt(srs, now);
    const empty = st.planned === 0;
    const moreNew = starredOnly ? 0 : words.filter((w) => isNew(srs.items[w.id])).length;
    return (
      <main class="page">
        <a class="back" href={back}>← Back</a>
        <h1>{empty ? (starredOnly ? 'No starred words' : 'All caught up') : 'Session done'}</h1>
        {empty ? (
          starredOnly
            ? <p>Tap the ☆ on a word to flag it as difficult. Starred words are reviewed sooner and can be studied here on their own.</p>
            : <p>Nothing is due right now.{nextAt && <> Your next word is due in <strong>{formatDelay(nextAt - now)}</strong>.</>}</p>
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
            <button type="button" class="btn btn-primary" onClick={() => { setCard(null); setSess(startState(words, null, 0, false)); }}>
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
  const { word, question, item: pickedItem } = card;
  const live = srs.items[word.id] || pickedItem;  // live copy: the star can change mid-card
  const starred = isStarred(live);
  const shown = phase === 'ask' ? live : (last ? last.after : live);
  const total = sess.stats.planned;
  const left = sess.pool.length;
  const ratingHint = (r) => formatDelay(delayAfter(live, r, Date.now()));

  const canChoose = !!question.options;
  const format = question.type === 'intro'
    ? 'intro'
    : answerFormat({ state: pickedItem.state, preference: prefs.answerMode, override, canChoose });
  const showE2B = question.type === 'e2b';
  const answered = phase !== 'ask';

  const answerMcq = (opt) => {
    if (phase !== 'ask' || peeked) return;
    setPicked(opt.id);
    if (opt.id === word.id) { setResult({ ok: true, close: false }); setPhase('rate'); }
    else { setPhase('missed'); finishCard('again'); }
  };

  const submitTyped = (e) => {
    e.preventDefault();
    if (phase !== 'ask' || peeked) return;
    const r = checkAnswer(typed, question);
    if (r.empty) { if (inputRef.current) inputRef.current.focus(); return; }
    setResult(r);
    if (r.ok) setPhase('rate');
    else { setPhase('missed'); finishCard('again'); }
  };

  const giveUp = () => { // "I don't know": same as a wrong answer
    if (phase !== 'ask' || peeked) return;
    setResult({ ok: false, close: false });
    setPhase('missed');
    finishCard('again');
  };

  const ratingButtons = (rs) => (
    <div class="rate" style={{ gridTemplateColumns: `repeat(${rs.length}, 1fr)` }} role="group" aria-label="How well did you remember it?">
      {rs.map((r) => (
        <button key={r} type="button" class={`btn rate-${r}`} onClick={() => { finishCard(r); next(); }}>
          <span class="rate-name">{RATING_LABEL[r]}</span>
          <span class="rate-when">{ratingHint(r)}</span>
        </button>
      ))}
    </div>
  );

  const answerText = showE2B
    ? <><span class="bn" lang="bn">{word.bengali}</span> (<Roman>{word.transliteration}</Roman>)</>
    : <>“{word.english}”</>;

  // The whole card, face and back together. Flipping it never touches mastery.
  const fullCard = (
    <div class="reveal" role="group" aria-label="Full card">
      <span class="bn reveal-bn" lang="bn">{word.bengali}</span>
      <Roman class="reveal-roman">{word.transliteration}</Roman>
      <span class="reveal-en">{word.english}</span>
    </div>
  );

  const modeLabel = { auto: 'Auto', choose: 'Choose', type: 'Type' };

  return (
    <main class="page">
      <a class="back" href={back}>← Leave session</a>
      <p class="muted" role="status">
        {left} left · {STATE_LABEL[pickedItem.state]}
        {sess.eligibleAt[word.id] !== undefined && ' · again'}
      </p>
      <div class="bar" aria-hidden="true">
        <div class="bar-fill" style={{ width: `${total ? ((total - Math.min(left, total)) / total) * 100 : 0}%` }} />
      </div>

      <div class="tools">
        <button
          type="button"
          class={`btn btn-quiet star${starred ? ' star-on' : ''}`}
          aria-pressed={starred}
          onClick={() => toggleStar(word.id)}
        >
          {starred ? '★ Starred' : '☆ Star'}
        </button>
        <button type="button" class="btn btn-quiet" aria-pressed={shuffled} onClick={() => setShuffled(!shuffled)}>
          Shuffle: {shuffled ? 'on' : 'off'}
        </button>
        <span class="tools-group" role="group" aria-label="Answer with">
          <span class="muted">Answer:</span>
          {ANSWER_MODES.map((m) => (
            <button key={m} type="button" class="btn btn-quiet" aria-pressed={prefs.answerMode === m} onClick={() => setAnswerMode(m)}>
              {modeLabel[m]}
            </button>
          ))}
        </span>
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
            <p class="muted">
              {format === 'type'
                ? (showE2B ? 'Type the Bengali word for…' : 'Type what this word means')
                : (showE2B ? 'Which Bengali word means…' : 'What does this word mean?')}
            </p>
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

      {/* ---- multiple choice ---- */}
      {format === 'mcq' && (
        <ul class="opts">
          {question.options.map((o) => {
            const right = o.id === word.id;
            const isPicked = o.id === picked;
            let state = '', mark = '';
            if (answered && right) { state = ' opt-right'; mark = '✓ '; }
            else if (answered && isPicked) { state = ' opt-wrong'; mark = '✗ '; }
            return (
              <li key={o.id}>
                <button type="button" class={`btn opt${state}`} aria-disabled={answered || peeked} onClick={() => answerMcq(o)}>
                  {showE2B ? (
                    <span class="opt-bn"><span class="bn" lang="bn">{mark}{o.bengali}</span> <Roman class="opt-roman">{o.transliteration}</Roman></span>
                  ) : <>{mark}{o.english}</>}
                </button>
              </li>
            );
          })}
        </ul>
      )}

      {/* ---- typed answer ---- */}
      {format === 'type' && (
        <form class="typebox" onSubmit={submitTyped} autocomplete="off">
          <label class="sr-only" for="typed-answer">{showE2B ? 'Bengali word, in Bengali script or romanized' : 'Meaning in English'}</label>
          <input
            id="typed-answer"
            ref={inputRef}
            class={`typein${answered ? (result && result.ok ? ' typein-right' : ' typein-wrong') : ''}`}
            type="text"
            lang={showE2B ? 'bn' : 'en'}
            value={typed}
            readOnly={answered || peeked}
            autocomplete="off"
            autocapitalize="none"
            autocorrect="off"
            spellcheck={false}
            enterkeyhint="done"
            placeholder={showE2B ? 'Bengali script or romanized' : 'English meaning'}
            onInput={(e) => setTyped(e.currentTarget.value)}
          />
          {phase === 'ask' && !peeked && (
            <div class="actions">
              <button type="submit" class="btn btn-primary">Check</button>
              <button type="button" class="btn" onClick={giveUp}>I don’t know</button>
            </div>
          )}
        </form>
      )}

      {/* ---- per-card switch and passive flip ---- */}
      {phase === 'ask' && question.type !== 'intro' && !peeked && (
        <div class="tools">
          {format === 'mcq'
            ? <button type="button" class="btn btn-quiet" onClick={() => setOverride('type')}>Type instead</button>
            : canChoose && <button type="button" class="btn btn-quiet" onClick={() => { setOverride('mcq'); setTyped(''); }}>Choose instead</button>}
          <button type="button" class="btn btn-quiet" onClick={() => setPeeked(true)}>Flip to see the answer</button>
        </div>
      )}

      {peeked && phase === 'ask' && (
        <div class="feedback" role="status">
          {fullCard}
          <p class="muted">Flipping only shows the answer. It does not change this word’s progress, and it is not scored. Try this word again a little later.</p>
          <button type="button" class="btn btn-primary" onClick={deferCard}>Next card</button>
        </div>
      )}

      {question.type === 'intro' && revealed && ratingButtons(RATINGS)}

      {question.type !== 'intro' && phase === 'rate' && (
        <div class="feedback" role="status">
          <p class="feedback-line">
            ✓ Correct{result && result.close ? <>. Close: the exact answer is {answerText}</> : ''}. How well did you remember it?
          </p>
          {revealed && fullCard}
          {ratingButtons(ratingsAfterCorrect({ format, close: !!(result && result.close) }))}
          {format === 'mcq' && <p class="muted">Easy is only offered after a typed answer.</p>}
          {!revealed && <button type="button" class="btn btn-quiet" onClick={() => setRevealed(true)}>Flip card</button>}
        </div>
      )}

      {phase === 'missed' && (
        <div class="feedback" role="status">
          <p class="feedback-line">
            ✗ Not quite. {format === 'type' && typed.trim() && <>You typed “{typed.trim()}”. </>}The answer is {answerText}.
          </p>
          {fullCard}
          <p class="muted">Marked Again. You will see it again before this session ends.</p>
          <button type="button" class="btn btn-primary" onClick={next}>Continue</button>
        </div>
      )}
    </main>
  );
}
