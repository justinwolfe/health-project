// A tapered, ragged ribbon spirals out from the center. Its edges use separate
// waves so the silhouette looks like liquid ink rather than concentric rings.
function ribbon(phase: number, start: number, end: number, width: number) {
  const edges = [1, -1].map((side) => {
    const points = Array.from({ length: 300 }, (_, index) => {
      const t = start + ((end - start) * index) / 299;
      const angle = t * Math.PI * 5.4 + phase;
      const ripple = Math.sin(t * 173 + phase) * 1.8 + Math.sin(t * 311) * 0.9;
      const radius = 7 + t * 137 + side * (width * (0.25 + t * 0.75) + ripple);
      return `${(160 + Math.cos(angle) * radius).toFixed(2)},${(160 + Math.sin(angle) * radius).toFixed(2)}`;
    });
    return side === 1 ? points : points.reverse();
  });
  return `M${edges.flat().join(' L')}Z`;
}

const greenRibbon = ribbon(0, 0, 1, 10);
const limeRibbon = ribbon(0.5, 0.56, 1, 5);
const darkRibbon = ribbon(2.7, 0.1, 0.96, 4);
const flecks = Array.from({ length: 44 }, (_, i) => {
  const angle = i * 2.39996;
  const radius = 111 + Math.sin(i * 7.3) * 29;
  return {
    x: 160 + Math.cos(angle) * radius,
    y: 160 + Math.sin(angle) * radius,
    angle: (angle * 180) / Math.PI,
    size: 1.4 + (i % 4) * 0.65,
  };
});

import styles from './PortalVortex.module.css';

/**
 * The portal itself, with no opinion about why it is open.
 *
 * Extracted from CardArrival so the Done column can show the same portal: a
 * card arriving and a card being finished are the same piece of art in two
 * states, and the path maths is not worth duplicating.
 *
 * Swirl speeds are CSS custom properties so a consumer can spin it up — see
 * DonePortal's charging state.
 */
export function PortalVortex({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 320 320"
      className={className ? `${styles.vortex} ${className}` : styles.vortex}
    >
      <path
        fill="#83ce4b"
        d="M160 7C194 2 214 19 242 30S285 67 298 99 312 144 308 174 297 231 274 255 232 290 204 301 145 310 116 301 59 282 40 257 14 216 9 184 8 125 22 95 49 48 78 30 127 12 160 7Z"
      />
      <circle cx="160" cy="160" r="137" fill="#247c32" />
      <g className={styles.swirl}>
        <path d={greenRibbon} fill="#83dc50" />
        <path d={darkRibbon} fill="#14652e" />
        <path d={limeRibbon} fill="#d7ed75" />
      </g>
      <g className={styles.sparks} fill="#f1ffd6">
        {flecks.map((fleck, index) => (
          <ellipse
            key={index}
            cx={fleck.x}
            cy={fleck.y}
            rx={fleck.size}
            ry={fleck.size * 2.2}
            transform={`rotate(${fleck.angle} ${fleck.x} ${fleck.y})`}
          />
        ))}
      </g>
    </svg>
  );
}
