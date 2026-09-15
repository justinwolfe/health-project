import type { CSSProperties } from 'react';

import styles from './MeeseeksPoof.module.css';

// Fixed directions, so the puff looks the same every time.
const PUFF = Array.from({ length: 9 }, (_, index) => ({
  angle: (360 / 9) * index + (index % 2) * 14,
  distance: 22 + (index % 3) * 11,
}));

/**
 * A Mr. Meeseeks pops up on a finished card, beams, and poofs out of existence.
 *
 * The joke is the show's: a Meeseeks is summoned to do exactly one task and
 * ceases to exist the moment that task is complete. That is a Done column.
 *
 * Purely decorative, so the whole thing is aria-hidden. Mounted only for the
 * length of the celebration, and never at all under reduced motion — Board
 * declines to start a completion in that case.
 */
export function MeeseeksPoof() {
  return (
    <span className={styles.layer} aria-hidden="true" data-testid="meeseeks">
      <span className={styles.bubble}>Ooh wee!</span>

      <svg className={styles.meeseeks} viewBox="0 0 100 124" role="presentation">
        {/* Arms, thrown up in the usual Meeseeks delight. */}
        <path
          d="M36 84C25 80 18 70 16 60"
          stroke="#3bb6df"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />
        <path
          d="M64 84C75 80 82 70 84 60"
          stroke="#3bb6df"
          strokeWidth="6"
          strokeLinecap="round"
          fill="none"
        />

        {/* Torso: Meeseeks are all head and very little else. */}
        <path d="M50 76c-7 0-11 7-11 17v24h22V93c0-10-4-17-11-17z" fill="#3bb6df" />

        <ellipse cx="50" cy="48" rx="31" ry="37" fill="#54cdee" />

        {/* The tuft of hair on top. */}
        <path
          d="M50 12c-3-7-10-6-9 1M50 12c3-8 11-6 10 2M50 12c0-8 4-10 6-4"
          stroke="#d9552f"
          strokeWidth="4"
          strokeLinecap="round"
          fill="none"
        />

        <ellipse cx="38" cy="44" rx="9.5" ry="12" fill="#ffffff" />
        <ellipse cx="62" cy="44" rx="9.5" ry="12" fill="#ffffff" />
        <circle cx="38.5" cy="45.5" r="4.4" fill="#16232c" />
        <circle cx="61.5" cy="45.5" r="4.4" fill="#16232c" />

        {/* A wide, delighted, entirely uncomplicated grin. */}
        <path d="M36 62c5 12 23 12 28 0-9 5-19 5-28 0z" fill="#16232c" />
      </svg>

      {PUFF.map((particle, index) => (
        <span
          key={index}
          className={index % 2 === 0 ? styles.puff : `${styles.puff} ${styles.puffAlt}`}
          style={
            {
              '--puff-angle': `${particle.angle}deg`,
              '--puff-distance': `${particle.distance}px`,
            } as CSSProperties
          }
        />
      ))}
    </span>
  );
}
