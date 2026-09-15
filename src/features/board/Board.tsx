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
import { useCallback, useEffect, useReducer, useRef, useState } from 'react';

import type { LoadedCharacter } from '../characters/types';
import styles from './Board.module.css';
import { BoardColumn } from './BoardColumn';
import { boardReducer } from './boardReducer';
import { CardView } from './CardView';
import { insertionIndex, resolveDropColumn } from './dropTarget';
import { findColumnOf } from './moveCard';
import { NewCardForm } from './NewCardForm';
import { COLUMN_IDS, COLUMN_TITLES, emptyBoard, type ColumnId } from './types';

/** How long the Done portal stays up: the burst, plus a beat to read it. */
const COMPLETION_MS = 900;

export function Board() {
  const [arrivingIds, setArrivingIds] = useState<Set<string>>(new Set());
  const finishArrival = useCallback((id: string) => {
    setArrivingIds((previous) => {
      const next = new Set(previous);
      next.delete(id);
      return next;
    });
  }, []);
  const [board, dispatch] = useReducer(boardReducer, emptyBoard);

  // Characters referenced by cards on the board. The picker searches the API,
  // so what it has loaded changes as the user types — a card has to keep the
  // character it was created with rather than look it up in the current
  // results, where it may no longer be.
  const [charactersById, setCharactersById] = useState<Map<string, LoadedCharacter>>(new Map());

  // The card most recently finished, and a counter that changes on every
  // completion. The counter is what replays the portal discharge and the card's
  // pass-through, including when the same card is finished twice.
  //
  // Cleared once the effect has played, which is also what takes the Done
  // portal back off screen.
  const [completion, setCompletion] = useState<{ cardId: string; key: number } | null>(null);
  const completionCount = useRef(0);
  const completionTimer = useRef<number | undefined>(undefined);

  useEffect(() => () => window.clearTimeout(completionTimer.current), []);

  function playCompletion(cardId: string) {
    completionCount.current += 1;
    setCompletion({ cardId, key: completionCount.current });

    window.clearTimeout(completionTimer.current);
    completionTimer.current = window.setTimeout(() => setCompletion(null), COMPLETION_MS);
  }

  // The column a drag would currently land in. Derived from our own drop-target
  // resolution rather than dnd-kit's per-droppable `isOver`, because as soon as
  // a card moves into a column mid-drag the pointer is over that card and the
  // column's own droppable stops reporting isOver.
  const [targetColumn, setTargetColumn] = useState<ColumnId | null>(null);

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
    if (!over) {
      setTargetColumn(null);
      return;
    }

    const cardId = String(active.id);
    const overId = String(over.id);
    const from = findColumnOf(board, cardId);
    const to = resolveDropColumn(board, overId);

    setTargetColumn(to ?? null);

    // Cross-column moves are applied mid-drag so the card visibly enters the
    // new column and the other cards make room. Reordering inside one column is
    // already previewed by SortableContext, so it is settled on drop instead.
    //
    // Done is the exception: its portal is the preview, and a card sliding into
    // the column underneath it competes with the effect. The move is left to
    // the drop.
    if (!from || !to || from === to || to === 'done') return;

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
    setTargetColumn(null);

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

    // Matches how arrivals are handled: the effect is not created at all under
    // reduced motion, rather than created and then hidden.
    if (
      to === 'done' &&
      origin !== 'done' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      playCompletion(cardId);
    }
  }

  function handleDragCancel() {
    setActiveCardId(null);
    setTargetColumn(null);
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
        onCreate={({ title, character }) => {
          setCharactersById((previous) => new Map(previous).set(character.id, character));
          const id = crypto.randomUUID();
          if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
            setArrivingIds((previous) => new Set(previous).add(id));
          }
          dispatch({
            type: 'card/added',
            card: { id, title, characterId: character.id },
          });
        }}
      />

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
              charactersById={charactersById}
              arrivingIds={arrivingIds}
              onArrivalComplete={finishArrival}
              targeted={targetColumn === columnId}
              completedCardId={completion?.cardId ?? null}
              completionKey={completion?.key ?? null}
            />
          ))}
        </div>

        <DragOverlay>
          {/* Over Done the card is hidden and the portal stands in for it, so
              the drop reads as the card going through rather than a ghost card
              parked on top of the effect. */}
          {activeCard && targetColumn !== 'done' ? (
            <div data-testid="drag-overlay">
              <CardView
                card={activeCard}
                character={charactersById.get(activeCard.characterId)}
                lifted
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
