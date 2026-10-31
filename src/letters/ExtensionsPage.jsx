import { useState } from 'preact/hooks';
import rawExt from '../data/extensions.json';
import { LETTERS } from './letters.js';
import { Roman } from '../components/Roman.jsx';

const VOWEL_SIGNS = rawExt.vowelSigns || [];
const MODIFIERS = rawExt.modifiers || [];

// High-frequency simple starter consonants
const STARTER_CONSONANTS = LETTERS.filter((l) => l.type === 'consonant').slice(0, 10);

export function ExtensionsPage() {
  const [selectedConsonant, setSelectedConsonant] = useState(
    STARTER_CONSONANTS[0] || { glyph: 'ক', transliteration: 'k' }
  );

  return (
    <main class="page">
      <a class="back" href="#/letters">← Letters</a>
      <h1>Letter Extensions (কার – Kar)</h1>
      <p class="lead">
        In Bengali, consonants carry an inherent <strong>‘o’</strong> sound (e.g. <strong>ক = ko</strong>).
        When another vowel joins a consonant, it attaches as a <strong>vowel sign (কার)</strong> that replaces or changes the inherent vowel.
      </p>

      <div class="card-highlight">
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '8px' }}>
          <div>
            <h2 style={{ margin: '0 0 4px' }}>Generative Flashcards</h2>
            <p class="muted" style={{ margin: 0 }}>Train your ear and eye on consonant + extension combinations.</p>
          </div>
          <a class="btn btn-primary" href="#/letters/extensions/study">Launch Flashcards →</a>
        </div>
      </div>

      <section>
        <h2>Placement rules at a glance</h2>
        <div class="placement-grid">
          <div class="placement-card">
            <span class="badge badge-left">Left (Pre-base)</span>
            <p class="bn placement-glyph" lang="bn">কি, কে, কৈ</p>
            <p class="muted">Written <em>before</em> the letter, but pronounced <em>after</em>.</p>
          </div>
          <div class="placement-card">
            <span class="badge badge-right">Right (Post-base)</span>
            <p class="bn placement-glyph" lang="bn">কা, কী</p>
            <p class="muted">Written after the letter on the right.</p>
          </div>
          <div class="placement-card">
            <span class="badge badge-bottom">Bottom (Sub-base)</span>
            <p class="bn placement-glyph" lang="bn">কু, কূ, কৃ</p>
            <p class="muted">Attaches directly under the consonant.</p>
          </div>
          <div class="placement-card">
            <span class="badge badge-around">Around (Circumfix)</span>
            <p class="bn placement-glyph" lang="bn">কো, কৌ</p>
            <p class="muted">Wraps around both left and right sides.</p>
          </div>
        </div>
      </section>

      <section>
        <h2>Interactive Syllable Explorer</h2>
        <p class="muted">Choose a consonant to see how all vowel extensions attach to it:</p>

        <div class="consonant-selector" role="radiogroup" aria-label="Select consonant">
          {STARTER_CONSONANTS.map((c) => (
            <button
              type="button"
              key={c.id}
              class={`consonant-btn${selectedConsonant.glyph === c.glyph ? ' active' : ''}`}
              onClick={() => setSelectedConsonant(c)}
            >
              <span class="bn" lang="bn">{c.glyph}</span>
              <Roman class="consonant-roman">{c.transliteration}</Roman>
            </button>
          ))}
        </div>

        <div class="syllable-display">
          <div class="syllable-header">
            <h3>Forms of {selectedConsonant.glyph} ({selectedConsonant.transliteration}o)</h3>
          </div>
          <div class="syllable-table">
            <div class="syllable-row">
              <span class="syllable-cell-sign">Inherent vowel</span>
              <span class="bn syllable-cell-glyph" lang="bn">{selectedConsonant.glyph}</span>
              <span class="syllable-cell-trans"><Roman>{selectedConsonant.transliteration}o</Roman></span>
              <span class="syllable-cell-sound">Default inherent sound</span>
            </div>
            {VOWEL_SIGNS.map((ext) => {
              const combined = selectedConsonant.glyph + ext.sign;
              return (
                <div key={ext.id} class="syllable-row">
                  <span class="syllable-cell-sign">{ext.sign} ({ext.name})</span>
                  <span class="bn syllable-cell-glyph" lang="bn">{combined}</span>
                  <span class="syllable-cell-trans"><Roman>{selectedConsonant.transliteration}{ext.transliteration}</Roman></span>
                  <span class="syllable-cell-sound">{ext.sound}</span>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      <section>
        <h2>The 10 Vowel Extensions (কার)</h2>
        <ul class="llist">
          {VOWEL_SIGNS.map((ext) => (
            <li key={ext.id} class="ext-card">
              <div class="ext-card-header">
                <span class="bn ext-sign" lang="bn">{ext.sign}</span>
                <div>
                  <h3 class="ext-title">{ext.name}</h3>
                  <Roman class="muted">Sound: {ext.sound}</Roman>
                </div>
              </div>
              <p style={{ margin: '6px 0' }}>{ext.placementLabel}. {ext.tip}</p>
              <div class="ext-examples">
                {ext.examples.map((ex, i) => (
                  <span key={i} class="chip-example">
                    <strong class="bn" lang="bn">{ex.syllable}</strong>
                    {' '}
                    <Roman class="muted">({ex.transliteration})</Roman>
                    {' → '}
                    <span class="bn" lang="bn">{ex.word}</span>
                    {' '}({ex.meaning})
                  </span>
                ))}
              </div>
            </li>
          ))}
        </ul>
      </section>

      <section>
        <h2>Special modifiers</h2>
        <ul class="llist">
          {MODIFIERS.map((m) => (
            <li key={m.id} class="ext-card">
              <div class="ext-card-header">
                <span class="bn ext-sign" lang="bn">{m.sign}</span>
                <div>
                  <h3 class="ext-title">{m.name}</h3>
                  <Roman class="muted">{m.sound}</Roman>
                </div>
              </div>
              <p style={{ margin: '6px 0' }}>{m.placementLabel}. {m.tip}</p>
            </li>
          ))}
        </ul>
      </section>

      <div class="actions" style={{ marginTop: '24px' }}>
        <a class="btn btn-primary" href="#/letters/extensions/study">
          Practice Generative Flashcards →
        </a>
      </div>
    </main>
  );
}