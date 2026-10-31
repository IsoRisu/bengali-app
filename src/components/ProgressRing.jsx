// Small decorative progress ring. The numbers are always written out next to it,
// so the SVG is hidden from assistive technology.
const R = 20;
const C = 2 * Math.PI * R;

export function ProgressRing({ value, max }) {
  const frac = max > 0 ? Math.min(1, Math.max(0, value / max)) : 0;
  return (
    <svg class="ring" viewBox="0 0 48 48" width="48" height="48" aria-hidden="true" focusable="false">
      <circle class="ring-track" cx="24" cy="24" r={R} />
      <circle
        class="ring-fill"
        cx="24"
        cy="24"
        r={R}
        transform="rotate(-90 24 24)"
        style={{ strokeDasharray: C, strokeDashoffset: C * (1 - frac) }}
      />
    </svg>
  );
}
