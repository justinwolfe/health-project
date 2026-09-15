import type { CSSProperties } from 'react';

import styles from './DonePortal.module.css';
import { PortalVortex } from './PortalVortex';

// Fixed directions rather than random ones, so the burst looks the same every
// time and a screenshot diff means something.
const SPARKS = Array.from({ length: 16 }, (_, index) => ({
  angle: (360 / 16) * index + (index % 3) * 6,
  distance: 74 + (index % 5) * 24,
}));

type Props = {
  /** A card is currently being dragged over Done. */
  charging: boolean;
  /**
   * Changes each time a card lands in Done. Used as a React key so the burst
   * remounts and replays — re-adding a CSS class alone would not restart it.
   * Null means no card has landed yet, or motion is reduced.
   */
  blastKey: number | null;
};

/**
 * The portal that sits at the bottom of the Done column and acts as its drop
 * target. Idle it is small and dim; while a card is over it, it brightens and
 * spins up; when a card lands, it discharges.
 *
 * Decorative throughout — the column heading and its empty-state text carry the
 * meaning for assistive technology, so the whole thing is aria-hidden.
 */
export function DonePortal({ charging, blastKey }: Props) {
  return (
    <div
      className={charging ? `${styles.portal} ${styles.charging}` : styles.portal}
      aria-hidden="true"
      data-testid="done-portal"
      data-charging={charging}
    >
      {/* Rendered before the vortex so it lights the portal from behind rather
          than washing it out. Keyed like the burst so it replays with it. */}
      {blastKey === null ? null : <span key={`glow-${blastKey}`} className={styles.glow} />}

      <PortalVortex />

      {blastKey === null ? null : (
        <span key={blastKey} className={styles.blast} data-testid="portal-blast">
          <span className={styles.afterglow} />
          <span className={styles.ring} />
          <span className={`${styles.ring} ${styles.ringLate}`} />
          {SPARKS.map((spark, index) => (
            <span
              key={index}
              className={index % 2 === 0 ? styles.spark : `${styles.spark} ${styles.alt}`}
              style={
                {
                  '--spark-angle': `${spark.angle}deg`,
                  '--spark-distance': `${spark.distance}px`,
                } as CSSProperties
              }
            />
          ))}
        </span>
      )}
    </div>
  );
}
