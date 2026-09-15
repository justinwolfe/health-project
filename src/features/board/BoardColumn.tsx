import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import type { LoadedCharacter } from '../characters/types';
import styles from './BoardColumn.module.css';
import { DonePortal } from './DonePortal';
import { SortableCard } from './SortableCard';
import { COLUMN_TITLES, type Card, type ColumnId } from './types';

type Props = {
  columnId: ColumnId;
  cardIds: string[];
  cards: Record<string, Card>;
  charactersById: Map<string, LoadedCharacter>;
  /** This column is where the current drag would land. */
  targeted: boolean;
  arrivingIds: Set<string>;
  onArrivalComplete: (id: string) => void;
  /** Set on the card that just landed here, to play its pass-through. */
  completedCardId: string | null;
  /** Changes each time a card lands in Done; null when motion is reduced. */
  completionKey: number | null;
};

export function BoardColumn({
  columnId,
  cardIds,
  cards,
  charactersById,
  targeted,
  arrivingIds,
  onArrivalComplete,
  completedCardId,
  completionKey,
}: Props) {
  // Registers the column itself as a drop target, which is what makes an empty
  // column droppable — with no cards there is nothing else to drop onto.
  // `isOver` is deliberately unused: see the note on Board's targetColumn.
  const { setNodeRef } = useDroppable({ id: columnId });

  const headingId = `column-heading-${columnId}`;

  return (
    <section className={styles.column} aria-labelledby={headingId}>
      <h2 className={styles.heading} id={headingId}>
        {COLUMN_TITLES[columnId]}
        <span className={styles.count} aria-label={`${cardIds.length} cards`}>
          {cardIds.length}
        </span>
      </h2>

      <SortableContext items={cardIds} strategy={verticalListSortingStrategy}>
        <ul
          ref={setNodeRef}
          className={targeted ? `${styles.list} ${styles.listOver}` : styles.list}
          data-column={columnId}
        >
          {cardIds.map((cardId) => {
            const card = cards[cardId];
            if (!card) return null;
            return (
              <SortableCard
                key={cardId}
                card={card}
                arriving={arrivingIds.has(cardId)}
                onArrivalComplete={onArrivalComplete}
                completionKey={completedCardId === cardId ? completionKey : null}
                character={charactersById.get(card.characterId)}
              />
            );
          })}

          {cardIds.length === 0 ? (
            <li className={styles.empty}>
              {columnId === 'done' ? 'Drop a card here to finish it' : 'Drop a card here'}
            </li>
          ) : null}

          {/* Done's drop target is the portal. It lives inside the droppable
              list so dropping onto it is dropping onto the column. */}
          {columnId === 'done' ? (
            <li className={styles.portalSlot} aria-hidden="true">
              <DonePortal charging={targeted} blastKey={completionKey} />
            </li>
          ) : null}
        </ul>
      </SortableContext>
    </section>
  );
}
