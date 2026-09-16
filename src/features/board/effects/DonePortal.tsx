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
  /** The drop would land in Done: the portal brightens and spins up. */
  charging: boolean;
  /**
   * Changes each time a card lands in Done. Used as a React key so the burst
   * remounts and replays — re-adding a CSS class alone would not restart it.
   * Null while the portal is merely open and waiting for a drop.
   */
  blastKey: number | null;
};

/**
 * The portal that opens in the middle of the Done column while a card is
 * dragged from an unfinished column, and discharges when one lands.
 *
 * It is mounted only for that window — the column owns the decision — so this
 * component has no idle state and animates itself open as it appears.
 *
 * Decorative throughout: the column heading, count, and drag announcements carry the
 * meaning for assistive technology, so the whole thing is aria-hidden.
 */
export function DonePortal({ charging, blastKey }: Props) {
  return (
    // Two elements on purpose: the outer one plays the entrance once, the inner
    // one carries the idle/charging state. Putting both on one element would
    // have the entrance animation's filled final values override the state.
    <div className={styles.root} aria-hidden="true" data-testid="done-portal">
      <div
        className={charging ? `${styles.portal} ${styles.charging}` : styles.portal}
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
    </div>
  );
}
