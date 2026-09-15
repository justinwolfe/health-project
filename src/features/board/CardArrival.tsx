import { useEffect, type ReactNode } from 'react';

import styles from './CardArrival.module.css';
import { PortalVortex } from './PortalVortex';

export function CardArrival({
  children,
  onComplete,
}: {
  children: ReactNode;
  onComplete: () => void;
}) {
  useEffect(() => {
    // Also clean up when animation events are suppressed by browser settings.
    const timeout = window.setTimeout(onComplete, 1850);
    return () => window.clearTimeout(timeout);
  }, [onComplete]);

  return (
    <div className={styles.arrival} data-testid="card-arrival">
      <div className={styles.portal} aria-hidden="true" data-testid="creation-portal">
        <PortalVortex />
      </div>
      <div className={styles.card}>{children}</div>
    </div>
  );
}
