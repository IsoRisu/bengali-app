import { useState } from 'preact/hooks';
import rawExt from '../data/extensions.json';
import { LETTERS } from './letters.js';
import { Roman } from '../components/Roman.jsx';
import { getExtra, subscribeExtra, setExtensionLearned } from '../lib/extra.js';
import { useStore } from '../lib/useStore.js';

const VOWEL_SIGNS = rawExt.vowelSigns || [];
const CONSONANTS = LETTERS.filter((l) => l.type === 'consonant');

function generateDeck(filterConsonantId = 'all', filterExtensionId = 'all') {
  const consonants = filterConsonantId === 'all'
    ? CONSONANTS.slice(0, 12)
    : CONSONANTS.filter((c) => c.id === filterConsonantId);

  const signs = filterExtensionId === 'all'
    ? VOWEL_SIGNS
    : VOWEL_SIGNS.filter((s) => s.id === filterExtensionId);

  const cards = [];
  for (const c of consonants) {
    for (const s of signs) {
      // Find matching worked example if available
      const example = s.examples?.find((ex) => ex.consonant === c.glyph);
      cards.push({
        id: `${c.id}_${s.id}`,
        consonant: c,
        extension: s,
        syllable: c.glyph + s.sign,
        transliteration: `${c.transliteration}${s.transliteration}`,
        example
      });
    }
  }

  // Shuffle deck
  for (let i = cards.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [cards[i], cards[j]] = [cards[j], cards[i]];
  }
  return cards;
}

export function GenerativeFlashcards() {
  const extra = useStore(getExtra, subscribeExtra);
  const extensionsLearned = extra?.extensionsLearned || [];

  const [selectedConsonant, setSelectedConsonant] = useState('all');
  const [selectedSign, setSelectedSign] = useState('all');
  const [deck, setDeck] = useState(() => generateDeck('all', 'all'));
  const [idx, setIdx] = useState(0);
  const [revealed, setRevealed] = useState(false);

  const refreshDeck = (cId, sId) => {
    setDeck(generateDeck(cId, sId));
    setIdx(0);
    setRevealed(false);
  };

  const handleConsonantFilter = (cId) => {
    setSelectedConsonant(cId);
    refreshDeck(cId, selectedSign);
  };

  const handleSignFilter = (sId) => {
    setSelectedSign(sId);
    refreshDeck(selectedConsonant, sId);
  };

  const advance = () => {
    setRevealed(false);
    setIdx(idx + 1);
  };

  if (idx >= deck.length) {
    return (
      <main class="page">
        <a class="back" href="#/letters/extensions">← Letter extensions</a>
        <h1>Generative Pass Complete!</h1>
        <p class="muted">You practiced {deck.length} generated consonant + vowel sign combinations.</p>
        <div class="actions actions-col">
          <button
            type="button"
            class="btn btn-primary"
            onClick={() => refreshDeck(selectedConsonant, selectedSign)}
          >
            Generate another pass
          </button>
          <a class="btn" href="#/letters/extensions">Back to extensions guide</a>
          <a class="btn" href="#/letters">Back to letters</a>
        </div>
      </main>
    );
  }

  const card = deck[idx];
  const isMastered = extensionsLearned.includes(card.id);

  return (
    <main class="page">
      <a class="back" href="#/letters/extensions">← Letter extensions</a>
      <p class="muted">
        Generative flashcard {idx + 1} of {deck.length}
        <span class="badge" style={{ marginLeft: '8px' }}>{card.extension.name}</span>
      </p>

      {/* Filter filters bar */}
      <div class="filter-bar">
        <label>
          <span class="muted" style={{ fontSize: '0.8rem', display: 'block' }}>Consonant:</span>
          <select
            value={selectedConsonant}
            onChange={(e) => handleConsonantFilter(e.target.value)}
            class="g-select"
          >
            <option value="all">All (Shuffle)</option>
            {CONSONANTS.slice(0, 14).map((c) => (
              <option key={c.id} value={c.id}>{c.glyph} ({c.name})</option>
            ))}
          </select>
        </label>
        <label>
          <span class="muted" style={{ fontSize: '0.8rem', display: 'block' }}>Vowel sign:</span>
          <select
            value={selectedSign}
            onChange={(e) => handleSignFilter(e.target.value)}
            class="g-select"
          >
            <option value="all">All 10 signs</option>
            {VOWEL_SIGNS.map((s) => (
              <option key={s.id} value={s.id}>{s.sign} {s.name}</option>
            ))}
          </select>
        </label>
      </div>

      {/* Generative Interactive Card */}
      <button
        type="button"
        class={`flash flash-generative${revealed ? ' flash-open' : ''}`}
        aria-expanded={revealed}
        onClick={() => setRevealed(!revealed)}
      >
        <span class="bn flash-bn" lang="bn" style={{ fontSize: '5rem' }}>{card.syllable}</span>

        {!revealed ? (
          <div>
            <p class="muted" style={{ margin: '4px 0' }}>
              Base: <span class="bn">{card.consonant.glyph}</span> + Sign: <span class="bn">{card.extension.sign}</span>
            </p>
            <span class="flash-hint">Tap to reveal pronunciation & formation</span>
          </div>
        ) : (
          <div class="flash-details">
            <div class="formula-box">
              <span class="bn" lang="bn">{card.consonant.glyph}</span>
              <Roman class="muted">({card.consonant.transliteration})</Roman>
              {' + '}
              <span class="bn" lang="bn">{card.extension.sign}</span>
              <Roman class="muted">({card.extension.name})</Roman>
              {' = '}
              <strong class="bn" lang="bn">{card.syllable}</strong>
            </div>

            <p class="sound" style={{ margin: '12px 0 4px' }}>
              Pronounced: <Roman class="sound-roman">{card.transliteration}</Roman>
            </p>
            <p class="muted" style={{ fontSize: '0.95rem', margin: '0 0 10px' }}>
              {card.extension.sound}
            </p>

            <p class="placement-note">
              <strong>Placement:</strong> {card.extension.placementLabel}
            </p>

            {card.example && (
              <div class="flash-example" style={{ marginTop: '10px' }}>
                <span class="muted" style={{ fontSize: '0.85rem' }}>In context: </span>
                <strong class="bn" lang="bn" style={{ fontSize: '1.3rem' }}>{card.example.word}</strong>
                {' '}
                <Roman class="muted">({card.example.wordTrans})</Roman>
                {' = '}
                <span>{card.example.meaning}</span>
              </div>
            )}
          </div>
        )}
      </button>

      <div class="actions">
        <button type="button" class="btn" onClick={advance}>Next combination →</button>
        <button
          type="button"
          class={`btn ${isMastered ? 'btn-done' : 'btn-primary'}`}
          onClick={() => {
            setExtensionLearned(card.id, !isMastered);
            advance();
          }}
        >
          {isMastered ? '✓ Mastered' : 'Mark mastered'}
        </button>
      </div>
    </main>
  );
}