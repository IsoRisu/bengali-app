// Inline markdown: **bold**, *italic*. With `gloss` on, a bold term followed by "(...)" is
// shown as a term plus a visible gloss. Quotes pass gloss={false}: there the bracket after a
// bold word labels a worked example, so it stays plain text.
export function Inline({ text, gloss = true }) {
  const out = [];
  const re = /\*\*([^*]+)\*\*(\s*\(([^)]+)\))?|\*([^*]+)\*/g;
  let last = 0;
  let m;
  let k = 0;
  while ((m = re.exec(text))) {
    if (m.index > last) out.push(text.slice(last, m.index));
    if (m[1] !== undefined) {
      if (gloss && m[3]) {
        out.push(<strong key={k++} class="term">{m[1]}</strong>);
        out.push(' ');
        out.push(<span key={k++} class="gloss">({m[3]})</span>);
      } else {
        out.push(<strong key={k++}>{m[1]}</strong>);
        if (m[2]) out.push(m[2]);
      }
    } else {
      out.push(<em key={k++}>{m[4]}</em>);
    }
    last = re.lastIndex;
  }
  if (last < text.length) out.push(text.slice(last));
  return <>{out}</>;
}

export function Blocks({ blocks }) {
  return (
    <>
      {blocks.map((b, i) => {
        if (b.type === 'ul') {
          return (
            <ul key={i} class="g-list">
              {b.items.map((it, j) => <li key={j}><Inline text={it} /></li>)}
            </ul>
          );
        }
        if (b.type === 'quote') {
          return (
            <blockquote key={i} class="g-quote">
              {b.lines.map((l, j) => <p key={j}><Inline text={l} gloss={false} /></p>)}
            </blockquote>
          );
        }
        return <p key={i} class="g-p"><Inline text={b.text} /></p>;
      })}
    </>
  );
}

// Glossary block: each technical term with its plain-English gloss.
export function Glossary({ items }) {
  if (!items.length) return null;
  return (
    <aside class="glossary" aria-label="Key terms">
      <h2 class="glossary-title">Key terms</h2>
      <dl>
        {items.map((g) => (
          <div class="glossary-row" key={g.term}>
            <dt>{g.term}</dt>
            <dd>{g.gloss}</dd>
          </div>
        ))}
      </dl>
    </aside>
  );
}
