import confetti from 'canvas-confetti';

type Origin = { x: number; y: number };

/**
 * Fired when a card reaches Done. `origin` is in canvas-confetti's normalized
 * viewport coordinates (0-1), so the burst comes from where the card landed
 * rather than from a fixed point on screen.
 *
 * disableForReducedMotion makes the library itself a no-op under
 * prefers-reduced-motion, matching the global rule in styles/global.css.
 */
export function celebrate(origin: Origin = { x: 0.5, y: 0.5 }) {
  void confetti({
    particleCount: 80,
    spread: 70,
    startVelocity: 32,
    ticks: 120,
    scalar: 0.9,
    origin,
    disableForReducedMotion: true,
  });
}

/** Converts a rect in page coordinates to canvas-confetti's 0-1 origin. */
export function originFromRect(rect: { left: number; top: number; width: number; height: number }) {
  return {
    x: (rect.left + rect.width / 2) / window.innerWidth,
    y: (rect.top + rect.height / 2) / window.innerHeight,
  };
}
