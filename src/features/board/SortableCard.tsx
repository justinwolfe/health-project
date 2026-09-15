import { useSortable } from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

import { useCallback } from 'react';

import { CardArrival } from './CardArrival';
import type { LoadedCharacter } from '../characters/types';
import { CardView } from './CardView';
import styles from './SortableCard.module.css';
import type { Card } from './types';

type Props = {
  card: Card;
  arriving: boolean;
  onArrivalComplete: (id: string) => void;
  /**
   * Changes each time this card lands in Done. Used as a React key so the
   * animation replays: re-adding the class alone would not restart it.
   */
  completionKey: number | null;
  character: LoadedCharacter | undefined;
};

export function SortableCard({
  card,
  character,
  arriving,
  onArrivalComplete,
  completionKey,
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
      className={isDragging ? `${styles.item} ${styles.placeholder}` : styles.item}
      data-testid="card"
      // The whole card is the drag handle. `attributes` also supplies the
      // roving tabindex and ARIA wiring that make the keyboard sensor usable.
      {...attributes}
      {...listeners}
    >
      {arriving ? (
        <CardArrival onComplete={finishArrival}>
          <CardView card={card} character={character} />
        </CardArrival>
      ) : (
        // Keyed so a repeat completion remounts this wrapper and replays the
        // pass-through; 'rest' is the steady state, which animates nothing.
        <div
          key={completionKey ?? 'rest'}
          className={completionKey === null ? undefined : styles.completed}
        >
          <CardView card={card} character={character} />
        </div>
      )}
    </li>
  );
}
