import raw from '../data/grammar.json';

export const LESSONS = raw.lessons || (Array.isArray(raw) ? raw : [raw]);

export function findLesson(id) {
  return LESSONS.find((l) => l.id === id);
}

export function parseExplanation(explanation) {
  if (!explanation) return [];
  const rawSections = explanation.split(/(?:^|\n)(?=##\s+)/);
  const sections = [];

  for (const rawSec of rawSections) {
    const trimmed = rawSec.trim();
    if (!trimmed) continue;

    const lines = trimmed.split('\n');
    let heading = '';
    let startIdx = 0;

    if (lines[0].startsWith('## ')) {
      heading = lines[0].slice(3).trim();
      startIdx = 1;
    }

    const bodyLines = lines.slice(startIdx);
    const blocks = [];
    let i = 0;

    while (i < bodyLines.length) {
      const line = bodyLines[i].trim();
      if (!line) {
        i++;
        continue;
      }

      if (line.startsWith('>')) {
        const quoteLines = [];
        while (i < bodyLines.length && bodyLines[i].trim().startsWith('>')) {
          quoteLines.push(bodyLines[i].trim().replace(/^>\s*/, ''));
          i++;
        }
        blocks.push({ type: 'quote', lines: quoteLines });
      } else if (line.startsWith('- ') || line.startsWith('* ')) {
        const listItems = [];
        while (i < bodyLines.length && (bodyLines[i].trim().startsWith('- ') || bodyLines[i].trim().startsWith('* '))) {
          listItems.push(bodyLines[i].trim().replace(/^[-*]\s+/, ''));
          i++;
        }
        blocks.push({ type: 'ul', items: listItems });
      } else {
        const pLines = [];
        while (
          i < bodyLines.length &&
          bodyLines[i].trim() &&
          !bodyLines[i].trim().startsWith('>') &&
          !bodyLines[i].trim().startsWith('- ') &&
          !bodyLines[i].trim().startsWith('* ')
        ) {
          pLines.push(bodyLines[i].trim());
          i++;
        }
        blocks.push({ type: 'p', text: pLines.join(' ') });
      }
    }

    const definedTerms = [];
    const termRe = /\*\*([^*]+)\*\*\s*\(([^)]+)\)/g;
    for (const b of blocks) {
      if (b.type === 'quote') continue;
      const texts = b.type === 'ul' ? b.items : [b.text];
      for (const t of texts) {
        let m;
        while ((m = termRe.exec(t)) !== null) {
          definedTerms.push({ term: m[1].trim(), gloss: m[2].trim() });
        }
      }
    }

    const fullText = [
      heading,
      ...blocks.flatMap((b) => (b.type === 'ul' ? b.items : b.type === 'quote' ? b.lines : [b.text]))
    ].join(' ');

    sections.push({
      heading,
      blocks,
      text: fullText,
      definedTerms
    });
  }

  return sections;
}

function textMatchesTerm(text, term) {
  if (!text || !term) return false;
  const escaped = term.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
  const re = new RegExp(`\\b${escaped}(?:s|es)?\\b`, 'i');
  return re.test(text);
}

export function glossaryFor(sections, upToStep, text, includeCurrentDefined = true) {
  if (!sections || sections.length === 0) return [];
  const validStep = Math.min(sections.length - 1, Math.max(0, upToStep));

  const allTerms = [];
  const seen = new Set();

  if (includeCurrentDefined && sections[validStep]?.definedTerms) {
    for (const item of sections[validStep].definedTerms) {
      const lower = item.term.toLowerCase();
      if (!seen.has(lower)) {
        seen.add(lower);
        allTerms.push(item);
      }
    }
  }

  const maxSec = includeCurrentDefined ? validStep : validStep + 1;
  for (let s = 0; s < maxSec; s++) {
    const sec = sections[s];
    if (!sec?.definedTerms) continue;
    for (const item of sec.definedTerms) {
      const lower = item.term.toLowerCase();
      if (!seen.has(lower) && textMatchesTerm(text, item.term)) {
        seen.add(lower);
        allTerms.push(item);
      }
    }
  }

  return allTerms;
}

export function isMcqCorrect(ex, choice) {
  return choice === ex.answer;
}

function normalize(str) {
  if (typeof str !== 'string') return '';
  return str.toLowerCase().replace(/[\s.,!?;:"'“”‘’]/g, '');
}

export function isFillCorrect(ex, draft) {
  const normDraft = normalize(draft);
  if (!normDraft) return false;
  if (normDraft === normalize(ex.answer)) return true;
  if (Array.isArray(ex.acceptedAnswers)) {
    return ex.acceptedAnswers.some((ans) => normalize(ans) === normDraft);
  }
  return false;
}