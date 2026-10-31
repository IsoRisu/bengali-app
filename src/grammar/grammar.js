import raw from '../data/grammar.json';

// grammar.json holds one lesson object today. Accept an array (or { lessons: [...] })
// too, so adding lessons later needs no code change. Array order is lesson order.
export const LESSONS = Array.isArray(raw) ? raw : Array.isArray(raw.lessons) ? raw.lessons : [raw];

export const findLesson = (id) => LESSONS.find((l) => l.id === id);

// ---------------------------------------------------------------------------
// Markdown subset (DECISIONS Entry 004): `##` headings, paragraphs, bold, italic,
// bullets, quotes. One `##` section = one idea = one screen (src/data/README.md).
//
// Glosses: the content writes a technical term in bold followed by its plain-English
// gloss in parentheses, e.g.  **subject** (the person or thing that does the action).
// parseExplanation() lifts those pairs out so the UI can show them in a glossary block
// as well as inline.
// ---------------------------------------------------------------------------

const GLOSS_RE = /\*\*([^*]+)\*\*\s*\(([^)]+)\)/g;
const stripMd = (s) => s.replace(/\*\*/g, '').replace(/\*/g, '');

export function parseExplanation(md) {
  const sections = [];
  let section = null;
  let para = [];
  let list = null;
  let quote = null;

  const open = (heading) => {
    section = { heading, blocks: [] };
    sections.push(section);
  };
  const ensure = () => {
    if (!section) open('');
  };
  const flush = () => {
    if (para.length) {
      ensure();
      section.blocks.push({ type: 'p', text: para.join(' ') });
      para = [];
    }
    if (list) { ensure(); section.blocks.push(list); list = null; }
    if (quote) { ensure(); section.blocks.push(quote); quote = null; }
  };

  for (const line of String(md || '').split(/\r?\n/)) {
    let m;
    if ((m = line.match(/^##\s+(.*)$/))) {
      flush();
      open(m[1].trim());
    } else if ((m = line.match(/^>\s?(.*)$/))) {
      if (!quote) { flush(); quote = { type: 'quote', lines: [] }; }
      quote.lines.push(m[1]);
    } else if ((m = line.match(/^[-*]\s+(.*)$/))) {
      if (!list) { flush(); list = { type: 'ul', items: [] }; }
      list.items.push(m[1]);
    } else if (line.trim() === '') {
      flush();
    } else {
      if (list || quote) flush();
      para.push(line.trim());
    }
  }
  flush();

  return sections.map((s) => {
    // Glosses are read from paragraphs and bullets only. In a quote, a bold word followed
    // by a bracket is a worked example ("I rice **eat** (verb)"), not a definition.
    const glosses = [];
    const texts = [];
    for (const b of s.blocks) {
      const parts = b.type === 'ul' ? b.items : b.type === 'quote' ? b.lines : [b.text];
      texts.push(...parts);
      if (b.type === 'quote') continue;
      for (const part of parts) {
        for (const g of part.matchAll(GLOSS_RE)) glosses.push({ term: g[1].trim(), gloss: g[2].trim() });
      }
    }
    return { ...s, glosses, text: stripMd(texts.join(' ')) };
  });
}

const escapeRe = (s) => s.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
const mentions = (text, term) => new RegExp(`\\b${escapeRe(term)}(?:s|es)?\\b`, 'i').test(text);

// Terms to show in the glossary block for a piece of text: every term defined so far in
// the lesson (sections 0..upTo) that the text uses. With `includeCurrent`, a term defined in
// section `upTo` is always listed (reading screens). First definition of a term wins.
export function glossaryFor(sections, upTo, text, includeCurrent = true) {
  const seen = new Set();
  const out = [];
  sections.slice(0, upTo + 1).forEach((s, i) => {
    for (const g of s.glosses) {
      const key = g.term.toLowerCase();
      if (seen.has(key)) continue;
      if ((includeCurrent && i === upTo) || mentions(text, g.term)) {
        seen.add(key);
        out.push(g);
      }
    }
  });
  return out;
}

// ---------------------------------------------------------------------------
// Exercise scoring
// ---------------------------------------------------------------------------

// Fill matching ignores whitespace, case and common punctuation, so "The  Subject." matches.
export const normalize = (s) =>
  String(s).normalize('NFC').toLowerCase().replace(/[\s.,!?;:"'“”‘’]/g, '');

export function isFillCorrect(ex, input) {
  const typed = normalize(input);
  if (!typed) return false;
  return [ex.answer, ...(ex.acceptedAnswers || [])].some((a) => normalize(a) === typed);
}

export const isMcqCorrect = (ex, optionText) => optionText === ex.answer;
