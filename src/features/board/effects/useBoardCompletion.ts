import { useEffect, useRef, useState } from 'react';

/** How long the Done portal stays up: the burst, plus a beat to read it. */
const DISCHARGE_MS = 1000;

/**
 * How long the finished card keeps its celebration. Longer than the portal's,
 * because the Meeseeks pops up after the discharge and has to poof before this
 * expires — see the timings in MeeseeksPoof.module.css.
 */
const COMPLETION_MS = 1900;

/** Owns completion replay keys and the two independently timed effects. */
export function useBoardCompletion() {
  // The card most recently finished, and a counter that changes on every
  // completion. The counter is what replays the portal discharge and the card's
  // pass-through, including when the same card is finished twice.
  const [completion, setCompletion] = useState<{ cardId: string; key: number } | null>(null);

  // The portal's discharge is tracked separately because it finishes first: the
  // portal closes while the card is still celebrating.
  const [discharge, setDischarge] = useState<number | null>(null);

  const completionCount = useRef(0);
  const completionTimer = useRef<number | undefined>(undefined);
  const dischargeTimer = useRef<number | undefined>(undefined);

  useEffect(
    () => () => {
      window.clearTimeout(completionTimer.current);
      window.clearTimeout(dischargeTimer.current);
    },
    [],
  );

  function playCompletion(cardId: string) {
    completionCount.current += 1;
    const key = completionCount.current;

    setCompletion({ cardId, key });
    setDischarge(key);

    window.clearTimeout(completionTimer.current);
    window.clearTimeout(dischargeTimer.current);
    completionTimer.current = window.setTimeout(() => setCompletion(null), COMPLETION_MS);
    dischargeTimer.current = window.setTimeout(() => setDischarge(null), DISCHARGE_MS);
  }

  return { completion, discharge, playCompletion };
}
