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

      <svg className={styles.meeseeks} viewBox="0 0 240 454" role="presentation">
        <g
          fill="#63cce7"
          stroke="#29464e"
          strokeWidth="1.6"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          {/* Long, slightly uneven legs and the broad, outward-pointing feet. */}
          <path d="M70 262 C70 307 71 369 68 411 C68 425 47 432 35 442 Q28 448 41 448 C59 448 77 446 87 443 C90 439 87 421 87 410 L84 269 Z" />
          <path d="M98 266 C96 312 94 368 94 409 C93 422 93 435 96 442 C109 446 134 449 148 446 Q151 444 143 440 C130 432 115 428 114 412 C112 360 111 309 112 259 Z" />

          {/* One continuous outline keeps the head, neck, torso and arms organic. */}
          <path d="M62 117 C59 111 45 103 38 88 C28 69 30 49 40 34 C51 17 68 12 86 15 C109 14 127 26 135 46 C144 69 135 91 119 108 C114 113 108 116 108 121 C125 137 145 161 167 174 C179 157 186 136 195 117 L201 106 C200 102 195 99 198 96 C201 93 205 99 208 100 C215 92 225 84 231 89 C238 94 235 103 227 109 L214 119 C203 143 190 169 175 183 C171 188 166 183 160 180 C139 166 122 148 108 134 C108 166 113 190 119 216 C124 239 123 256 114 266 C106 275 79 275 67 266 C55 257 55 241 58 222 C62 227 60 236 54 240 C51 242 47 239 49 236 C43 235 43 231 45 229 C27 214 12 196 4 183 C1 179 3 174 7 170 C23 153 45 135 62 122 Q66 120 62 117 Z M63 133 C46 145 24 164 13 179 C25 194 43 210 58 220 C61 190 63 160 63 133 Z" />
          <path
            d="M58 222 Q62 231 54 237 M79 155 Q87 153 95 154 M78 114 Q87 120 96 113 M72 269 Q78 272 84 271 M166 174 L169 179 M207 110 Q211 104 218 105"
            fill="none"
          />

          {/* The little orange tuft has the same fine ink outline as the body. */}
          <path
            d="M77 16 C77 12 70 14 70 11 C70 8 76 10 78 10 C76 6 73 4 76 3 C79 2 82 7 82 9 C83 4 86 3 87 6 C88 9 84 12 82 15 Z"
            fill="#ed985a"
          />

          {/* Small black eyes, with pinprick highlights rather than white sclera. */}
          <ellipse cx="76" cy="59" rx="4" ry="4.8" fill="#111a1e" strokeWidth="1" />
          <ellipse cx="90" cy="58" rx="3.8" ry="4.7" fill="#111a1e" strokeWidth="1" />
          <g fill="#fff" stroke="none">
            <ellipse cx="75" cy="57.5" rx="1.3" ry="1.6" />
            <ellipse cx="89" cy="56.5" rx="1.2" ry="1.5" />
          </g>

          {/* Asymmetric, upturned grin with individually curved teeth. */}
          <path
            d="M53 74 C58 69 62 76 70 76 C86 78 101 70 112 63 C117 60 121 65 117 71 C108 83 88 89 72 87 C61 87 51 83 53 74 Z"
            fill="#943d6c"
          />
          <path
            d="M58 74 Q62 75 67 76 Q68 81 64 81 Q60 81 58 74 Z M67 76 L77 76 Q78 82 73 82 Q69 83 67 76 Z M77 76 L87 75 Q89 80 84 81 Q79 83 77 76 Z M87 75 L96 72 Q99 77 94 79 Q90 80 87 75 Z M96 72 L104 68 Q108 72 103 75 Q99 78 96 72 Z M104 68 L112 63 Q117 64 113 68 Q109 73 104 68 Z"
            fill="#fff9ed"
            strokeWidth="1.1"
          />
          <path
            d="M65 85 Q68 80 73 85 Q77 80 82 85 Q86 80 91 83 Q96 77 100 80"
            fill="#fff9ed"
            strokeWidth="1.1"
          />
          <path d="M49 69 Q42 72 45 83 M115 55 Q124 53 126 65 M80 92 Q87 93 93 90" fill="none" />
        </g>
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
