import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useCallback } from 'react';

import type { LoadedCharacter } from '../../characters/types';
import { DonePortal } from '../effects/DonePortal';
import { CardArrival } from '../effects/CardArrival';
import { MeeseeksPoof } from '../effects/MeeseeksPoof';
import type { Card } from '../state/types';
import { CardView } from './CardView';
import styles from './SortableCard.module.css';

type Props = {
  card: Card;
  arriving: boolean;
  onArrivalComplete: (id: string) => void;
  /**
   * Changes each time this card lands in Done. Used as a React key so the
   * animation replays: re-adding the class alone would not restart it.
   */
  completionKey: number | null;
  dischargeKey: number | null;
  character: LoadedCharacter | undefined;
};

export function SortableCard({
  card,
  character,
  arriving,
  onArrivalComplete,
  completionKey,
  dischargeKey,
}: Props) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({
    id: card.id,
    disabled: arriving,
  });

  const finishArrival = useCallback(() => onArrivalComplete(card.id), [card.id, onArrivalComplete]);

  const style = {
    // Translate rather than Transform: sortable supplies a scale for size
    // differences between items, and applying it here stretches the card.
    transform: CSS.Translate.toString(transform),
    transition,
  };

  return (
    <li
      ref={setNodeRef}
      style={style}
      className={[
        styles.item,
        isDragging && styles.placeholder,
        completionKey !== null && styles.celebrating,
      ]
        .filter(Boolean)
        .join(' ')}
      data-testid="card"
      // The whole card is the drag handle. `attributes` also supplies the
      // roving tabindex and ARIA wiring that make the keyboard sensor usable.
      {...attributes}
      {...listeners}
    >
      {dischargeKey !== null ? (
        <div className={styles.portal}>
          <DonePortal charging blastKey={dischargeKey} />
        </div>
      ) : null}
      {arriving ? (
        <CardArrival onComplete={finishArrival}>
          <CardView card={card} character={character} />
        </CardArrival>
      ) : (
        // Keyed so a repeat completion remounts this wrapper and replays the
        // pass-through; 'rest' is the steady state, which animates nothing.
        <div
          key={completionKey ?? 'rest'}
          className={completionKey !== null ? styles.completed : undefined}
        >
          <CardView card={card} character={character} />
          {completionKey !== null ? <MeeseeksPoof /> : null}
        </div>
      )}
    </li>
  );
}
