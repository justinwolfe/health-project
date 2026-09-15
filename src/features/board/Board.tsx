import {
  DndContext,
  DragOverlay,
  KeyboardSensor,
  MeasuringStrategy,
  PointerSensor,
  closestCorners,
  useSensor,
  useSensors,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useReducer, useRef, useState } from 'react';

import { useCharacters } from '../characters/useCharacters';
import styles from './Board.module.css';
import { BoardColumn } from './BoardColumn';
import { boardReducer } from './boardReducer';
import { CardView } from './CardView';
import { celebrate, originFromRect } from './celebrate';
import { insertionIndex, resolveDropColumn } from './dropTarget';
import { findColumnOf } from './moveCard';
import { NewCardForm } from './NewCardForm';
import { COLUMN_IDS, COLUMN_TITLES, emptyBoard } from './types';

export function Board() {
  const [board, dispatch] = useReducer(boardReducer, emptyBoard);
  const { characters, byId, fetching, error } = useCharacters();

  // Drives the DragOverlay. The card is still in the board while dragging; this
  // only records which one to render following the pointer.
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Where the drag began. Needed because handleDragOver may already have moved
  // the card into Done before the drop, which would make "did it just arrive?"
  // unanswerable at drop time.
  const originColumnRef = useRef<string | null>(null);

  const sensors = useSensors(
    // A small distance threshold so a click inside a card is not swallowed as
    // the start of a drag.
    useSensor(PointerSensor, { activationConstraint: { distance: 4 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  function handleDragStart(event: DragStartEvent) {
    const cardId = String(event.active.id);
    setActiveCardId(cardId);
    originColumnRef.current = findColumnOf(board, cardId) ?? null;
  }

  function handleDragOver(event: DragOverEvent) {
    const { active, over } = event;
    if (!over) return;

    const cardId = String(active.id);
    const overId = String(over.id);
    const from = findColumnOf(board, cardId);
    const to = resolveDropColumn(board, overId);

    // Cross-column moves are applied mid-drag so the card visibly enters the
    // new column and the other cards make room. Reordering inside one column is
    // already previewed by SortableContext, so it is settled on drop instead.
    if (!from || !to || from === to) return;

    dispatch({
      type: 'card/moved',
      cardId,
      toColumn: to,
      toIndex: insertionIndex(board, to, overId),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCardId(null);

    const origin = originColumnRef.current;
    originColumnRef.current = null;
    if (!over) return;

    const cardId = String(active.id);
    const overId = String(over.id);
    const to = resolveDropColumn(board, overId);
    if (!to) return;

    dispatch({
      type: 'card/moved',
      cardId,
      toColumn: to,
      toIndex: insertionIndex(board, to, overId),
    });

    if (to === 'done' && origin !== 'done') {
      celebrate(originFromRect(over.rect));
    }
  }

  function handleDragCancel() {
    setActiveCardId(null);
    originColumnRef.current = null;
  }

  // Screen-reader announcements read from board state, so these live in scope.
  function describe(cardId: string) {
    return board.cards[cardId]?.title ?? 'card';
  }

  function describeTarget(overId: string) {
    const column = resolveDropColumn(board, overId);
    return column ? COLUMN_TITLES[column] : 'an unknown column';
  }

  const activeCard = activeCardId ? board.cards[activeCardId] : undefined;

  return (
    <div className={styles.board}>
      <NewCardForm
        characters={characters}
        loading={fetching}
        onCreate={({ title, characterId }) => {
          dispatch({
            type: 'card/added',
            card: { id: crypto.randomUUID(), title, characterId },
          });
        }}
      />

      {error ? (
        <p className={styles.error} role="alert">
          Could not load characters: {error.message}
        </p>
      ) : null}

      <DndContext
        sensors={sensors}
        // closestCorners suits column layouts better than the default
        // closestCenter: it stays accurate when a tall card is dragged over a
        // short one near a column edge.
        collisionDetection={closestCorners}
        onDragStart={handleDragStart}
        onDragOver={handleDragOver}
        onDragEnd={handleDragEnd}
        onDragCancel={handleDragCancel}
        // Re-measure droppables continuously rather than only at drag start.
        // Cards entering and leaving change every column's height mid-drag, and
        // with one-shot measuring the keyboard sensor searches stale rects — it
        // can find no column to move into at all.
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        accessibility={{
          screenReaderInstructions: {
            draggable:
              'Press space or enter to pick up the card. Use the arrow keys to move it between positions and columns. Press space or enter again to drop it, or escape to cancel.',
          },
          announcements: {
            onDragStart: ({ active }) => `Picked up ${describe(String(active.id))}.`,
            onDragOver: ({ over }) =>
              over ? `Now over ${describeTarget(String(over.id))}.` : 'No drop target.',
            onDragEnd: ({ active, over }) =>
              over
                ? `Dropped ${describe(String(active.id))} into ${describeTarget(String(over.id))}.`
                : `Dropped ${describe(String(active.id))}.`,
            onDragCancel: ({ active }) => `Cancelled moving ${describe(String(active.id))}.`,
          },
        }}
      >
        <div className={styles.columns}>
          {COLUMN_IDS.map((columnId) => (
            <BoardColumn
              key={columnId}
              columnId={columnId}
              cardIds={board.columnOrder[columnId]}
              cards={board.cards}
              charactersById={byId}
            />
          ))}
        </div>

        <DragOverlay>
          {activeCard ? (
            <CardView card={activeCard} character={byId.get(activeCard.characterId)} lifted />
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
