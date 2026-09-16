import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import type { LoadedCharacter } from '../characters/types';
import styles from './BoardColumn.module.css';
import { SortableCard } from './cards/SortableCard';
import { DonePortal } from './effects/DonePortal';
import { COLUMN_TITLES, type Card, type ColumnId } from './state/types';

type Props = {
  columnId: ColumnId;
  cardIds: string[];
  cards: Record<string, Card>;
  charactersById: Map<string, LoadedCharacter>;
  /** This column is where the current drag would land. */
  targeted: boolean;
  /** Only meaningful for Done: a card is arriving from another column. */
  portalOpen: boolean;
  /** Only meaningful for Done: changes each time the portal should discharge. */
  dischargeKey: number | null;
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
  portalOpen,
  dischargeKey,
  arrivingIds,
  onArrivalComplete,
  completedCardId,
  completionKey,
}: Props) {
  // Registers the column itself as a drop target, which is what makes an empty
  // column droppable — with no cards there is nothing else to drop onto.
  // `isOver` is deliberately unused: see useBoardDrag's targetColumn.
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

          {/* Done has no placeholder: the portal is its affordance, and the
              heading and count already say the column is empty. */}
          {cardIds.length === 0 && columnId !== 'done' ? (
            <li className={styles.empty}>Drop a card here</li>
          ) : null}

          {/* Done opens a portal in the middle of its drop zone while a card
              is dragged from an unfinished column, and keeps it long enough to discharge. Absolutely
              positioned and pointer-events: none, so it overlays the cards
              without affecting layout or the drop itself. */}
          {columnId === 'done' && (portalOpen || dischargeKey !== null) ? (
            <li className={styles.portalSlot} aria-hidden="true">
              <DonePortal charging={targeted || dischargeKey !== null} blastKey={dischargeKey} />
            </li>
          ) : null}
        </ul>
      </SortableContext>
    </section>
  );
}
