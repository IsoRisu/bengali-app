// Wrap every piece of romanization in this. The global toggle hides `.roman`
// through the `hide-roman` class on <html> (see src/lib/prefs.js).
export function Roman({ children, as: Tag = 'span', class: cls = '' }) {
  return <Tag class={`roman ${cls}`.trim()}>{children}</Tag>;
}
