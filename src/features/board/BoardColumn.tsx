import { useDroppable } from '@dnd-kit/core';
import { SortableContext, verticalListSortingStrategy } from '@dnd-kit/sortable';

import type { LoadedCharacter } from '../characters/types';
import styles from './BoardColumn.module.css';
import { SortableCard } from './SortableCard';
import { COLUMN_TITLES, type Card, type ColumnId } from './types';

type Props = {
  columnId: ColumnId;
  cardIds: string[];
  cards: Record<string, Card>;
  charactersById: Map<string, LoadedCharacter>;
};

export function BoardColumn({ columnId, cardIds, cards, charactersById }: Props) {
  // Registers the column itself as a drop target, which is what makes an empty
  // column droppable — with no cards there is nothing else to drop onto.
  const { setNodeRef, isOver } = useDroppable({ id: columnId });

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
          className={isOver ? `${styles.list} ${styles.listOver}` : styles.list}
          data-column={columnId}
        >
          {cardIds.map((cardId) => {
            const card = cards[cardId];
            if (!card) return null;
            return (
              <SortableCard
                key={cardId}
                card={card}
                character={charactersById.get(card.characterId)}
              />
            );
          })}

          {cardIds.length === 0 ? <li className={styles.empty}>Drop a card here</li> : null}
        </ul>
      </SortableContext>
    </section>
  );
}
