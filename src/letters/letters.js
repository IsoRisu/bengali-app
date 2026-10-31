import raw from '../data/letters.json';

export const LETTERS = [...raw].sort((a, b) => (a.order || 0) - (b.order || 0));

export function findLetter(id) {
  return LETTERS.find((l) => l.id === id);
}
// Display groups, in learning order. `title` heads the grid section; `label` is the short chip.
export const GROUPS = [
  { type: 'vowel', title: 'Vowels', label: 'vowel' },
  { type: 'consonant', title: 'Consonants', label: 'consonant' },
  { type: 'sign', title: 'Signs & modifiers', label: 'sign' },
  { type: 'vowel_sign', title: 'Vowel signs (কার)', label: 'vowel sign' },
  { type: 'numeral', title: 'Numerals', label: 'numeral' },
  { type: 'diacritic', title: 'Marks', label: 'mark' },
  { type: 'phala', title: 'Phala marks (ফলা)', label: 'phala' },
  { type: 'reph', title: 'Reph (রেফ)', label: 'reph' },
  { type: 'phala_conjunct', title: 'Conjuncts with phala', label: 'phala conjunct' },
  { type: 'conjunct', title: 'Common conjuncts (যুক্তবর্ণ)', label: 'conjunct' },
  { type: 'conjunct_adv', title: 'More conjuncts', label: 'conjunct' },
  { type: 'punctuation', title: 'Punctuation (যতিচিহ্ন)', label: 'punctuation' },
  { type: 'archaic_letters', title: 'Historical characters', label: 'historical' },
];

export function typeLabel(type) {
  return GROUPS.find((g) => g.type === type)?.label || type;
}
