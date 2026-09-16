import { Fragment } from 'react';
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
  portalIndex: number | null;
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
  portalIndex,
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

  const portal =
    columnId === 'done' && portalOpen ? (
      <li className={styles.portalSlot} aria-hidden="true" data-testid="done-portal-slot">
        <DonePortal charging={targeted} blastKey={null} />
      </li>
    ) : null;
  const insertion = portalIndex ?? cardIds.length;

  const headingId = `column-heading-${columnId}`;

  return (
    <section className={styles.column} data-status={columnId} aria-labelledby={headingId}>
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
          {cardIds.map((cardId, index) => {
            const card = cards[cardId];
            if (!card) return null;
            const isCompleted = completedCardId === cardId;
            return (
              <Fragment key={cardId}>
                {index === insertion ? portal : null}
                <SortableCard
                  dischargeKey={columnId === 'done' && isCompleted ? dischargeKey : null}
                  card={card}
                  arriving={arrivingIds.has(cardId)}
                  onArrivalComplete={onArrivalComplete}
                  completionKey={isCompleted ? completionKey : null}
                  character={charactersById.get(card.characterId)}
                />
              </Fragment>
            );
          })}

          {insertion === cardIds.length ? portal : null}
        </ul>
      </SortableContext>
    </section>
  );
}
