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
  character: LoadedCharacter | undefined;
};

export function SortableCard({ card, character, arriving, onArrivalComplete }: Props) {
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
        <CardView card={card} character={character} />
      )}
    </li>
  );
}
