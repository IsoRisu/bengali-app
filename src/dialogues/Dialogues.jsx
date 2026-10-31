import { useState } from 'preact/hooks';
import raw from '../data/dialogues.json';
import { getExtra, subscribeExtra, setDialogueRead } from '../lib/extra.js';
import { useStore } from '../lib/useStore.js';

export const DIALOGUES = raw.dialogues;

function List() {
  const { dialoguesRead } = useStore(getExtra, subscribeExtra);
  return (
    <main class="page">
      <a class="back" href="#/">← Home</a>
      <h1>Dialogues</h1>
      <p class="muted">Short conversations. Read the Bengali first, then check the English.</p>
      <ul class="llist">
        {DIALOGUES.map((d, i) => {
          const read = dialoguesRead.includes(d.id);
          return (
            <li key={d.id} class="lrow-wrap">
              <a class={`lrow${read ? ' lrow-done' : ''}`} href={`#/dialogues/${d.id}`}>
                <span class="lrow-num" aria-hidden="true">{i + 1}</span>
                <span class="lrow-text">
                  <span class="lrow-title">{d.title}</span>
                  <span class="lrow-sub">{read && <span class="sr-only">Read. </span>}{d.lines.length} lines</span>
                </span>
                <span class="lrow-mark" aria-hidden="true">{read ? '✓' : ''}</span>
              </a>
            </li>
          );
        })}
      </ul>
    </main>
  );
}

function Detail({ d }) {
  const { dialoguesRead } = useStore(getExtra, subscribeExtra);
  const [en, setEn] = useState(false);
  const read = dialoguesRead.includes(d.id);
  return (
    <main class="page">
      <a class="back" href="#/dialogues">← Dialogues</a>
      <h1>{d.title}</h1>
      <ul class="dlg">
        {d.lines.map((l, i) => (
          <li key={i} class="dlg-line">
            <span class="dlg-who" aria-label={`Speaker ${l.who}`}>{l.who}</span>
            <span>
              <span class="dlg-text">{l.text}</span>
              {en && <span class="dlg-en">{l.english}</span>}
            </span>
          </li>
        ))}
      </ul>
      <div class="actions">
        <button type="button" class="btn" aria-pressed={en} onClick={() => setEn(!en)}>
          {en ? 'Hide English' : 'Show English'}
        </button>
        <button type="button" class={`btn ${read ? 'btn-done' : 'btn-primary'}`} aria-pressed={read}
          onClick={() => setDialogueRead(d.id, !read)}>
          {read ? '✓ Read (tap to undo)' : 'Mark as read'}
        </button>
      </div>
    </main>
  );
}

export function Dialogues({ rest }) {
  const [id] = rest;
  if (!id) return <List />;
  const d = DIALOGUES.find((x) => x.id === id);
  if (!d) {
    return (
      <main class="page">
        <h1>Dialogue not found</h1>
        <a class="btn btn-primary" href="#/dialogues">Back to dialogues</a>
      </main>
    );
  }
  return <Detail key={id} d={d} />;
}
