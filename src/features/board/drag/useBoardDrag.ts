import {
  closestCorners,
  KeyboardSensor,
  MouseSensor,
  TouchSensor,
  useSensor,
  useSensors,
  type CollisionDetection,
  type DndContextProps,
  type DragEndEvent,
  type DragOverEvent,
  type DragStartEvent,
} from '@dnd-kit/core';
import { sortableKeyboardCoordinates } from '@dnd-kit/sortable';
import { useRef, useState, type Dispatch } from 'react';

import type { BoardAction } from '../state/boardReducer';
import { findColumnOf } from '../state/moveCard';
import { COLUMN_TITLES, type BoardState, type ColumnId } from '../state/types';
import { insertionIndex, resolveDropColumn } from './dropTarget';

type Options = {
  board: BoardState;
  dispatch: Dispatch<BoardAction>;
  onCardCompleted: (cardId: string) => void;
};

/** Translates dnd-kit events into board moves and manages the drag lifecycle. */
export function useBoardDrag({ board, dispatch, onCardCompleted }: Options) {
  // The column a drag would currently land in. Derived from our own drop-target
  // resolution rather than dnd-kit's per-droppable `isOver`, because as soon as
  // a card moves into a column mid-drag the pointer is over that card and the
  // column's own droppable stops reporting isOver.
  const [doneInsertionIndex, setDoneInsertionIndex] = useState<number | null>(null);

  const [targetColumn, setTargetColumn] = useState<ColumnId | null>(null);

  // Drives the DragOverlay. The card is still in the board while dragging; this
  // only records which one to render following the pointer.
  const [activeCardId, setActiveCardId] = useState<string | null>(null);

  // Where the drag began. Needed because handleDragOver may already have moved
  // the card into another column before the drop, which would make "did it just
  // arrive?" unanswerable at drop time. State rather than a ref because the
  // render reads it: a card being reordered inside Done must not open the
  // portal, which only marks a card arriving from elsewhere.
  const [dragOrigin, setDragOrigin] = useState<ColumnId | null>(null);

  // Remember the original position so Escape also undoes cross-column previews.
  const dragStartPosition = useRef<{ cardId: string; column: ColumnId; index: number } | null>(
    null,
  );

  function restoreDragPosition() {
    const position = dragStartPosition.current;
    if (position) {
      dispatch({
        type: 'card/moved',
        cardId: position.cardId,
        toColumn: position.column,
        toIndex: position.index,
      });
    }
    dragStartPosition.current = null;
  }

  const sensors = useSensors(
    // Mouse and touch use separate sensors so touch can retain native vertical
    // scrolling. A deliberate hold starts a touch drag without hijacking swipes.
    useSensor(MouseSensor, { activationConstraint: { distance: 4 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  // Use the actual pointer inside Done, so aiming below a card means after it.
  // The portal occupies a real gap; card midpoints on either side keep that gap
  // stable until the pointer deliberately crosses another card.
  const collisionDetection: CollisionDetection = (args) => {
    const { pointerCoordinates: pointer, droppableContainers } = args;
    const done = droppableContainers
      .find((container) => container.id === 'done')
      ?.node.current?.getBoundingClientRect();
    if (
      dragOrigin !== 'done' &&
      pointer &&
      done &&
      pointer.x >= done.left &&
      pointer.x <= done.right &&
      pointer.y >= done.top &&
      pointer.y <= done.bottom
    ) {
      const index = board.columnOrder.done.findIndex((id) => {
        // dnd-kit's cached rect can lag behind the gap moving without a card
        // resizing. Read the current layout to keep the advertised slot stable.
        const rect = droppableContainers
          .find((container) => container.id === id)
          ?.node.current?.getBoundingClientRect();
        return rect && pointer.y < rect.top + rect.height / 2;
      });
      return [
        { id: 'done', data: { insertionIndex: index < 0 ? board.columnOrder.done.length : index } },
      ];
    }
    return closestCorners(args);
  };

  function getInsertionIndex(event: DragOverEvent, column: ColumnId) {
    const index: unknown = event.collisions?.[0]?.data?.insertionIndex;
    return column === 'done' && typeof index === 'number'
      ? index
      : insertionIndex(board, column, String(event.over?.id));
  }

  function handleDragStart(event: DragStartEvent) {
    const cardId = String(event.active.id);
    setActiveCardId(cardId);
    setDoneInsertionIndex(null);
    const column = findColumnOf(board, cardId);
    setDragOrigin(column ?? null);
    dragStartPosition.current = column
      ? { cardId, column, index: board.columnOrder[column].indexOf(cardId) }
      : null;
  }

  function updateDropPreview(event: DragOverEvent) {
    const to = event.over ? resolveDropColumn(board, String(event.over.id)) : undefined;
    setTargetColumn(to ?? null);
    setDoneInsertionIndex(to === 'done' ? getInsertionIndex(event, to) : null);
  }

  function handleDragOver(event: DragOverEvent) {
    updateDropPreview(event);
    const { active, over } = event;
    if (!over) return;

    const cardId = String(active.id);
    const overId = String(over.id);
    const from = findColumnOf(board, cardId);
    const to = resolveDropColumn(board, overId);

    // Cross-column moves are applied mid-drag so the card visibly enters the
    // new column and the other cards make room. Reordering inside one column is
    // already previewed by SortableContext, so it is settled on drop instead.
    //
    // Done is the exception. Moving the card in mid-drag leaves a faded
    // placeholder sitting in the drop zone, which is exactly where the portal
    // opens. The card still follows the cursor; only the placeholder is
    // withheld, and the move is settled on the drop.
    if (!from || !to || from === to || to === 'done') return;

    dispatch({
      type: 'card/moved',
      cardId,
      toColumn: to,
      toIndex: getInsertionIndex(event, to),
    });
  }

  function handleDragEnd(event: DragEndEvent) {
    const { active, over } = event;
    setActiveCardId(null);
    setTargetColumn(null);

    const origin = dragOrigin;
    setDragOrigin(null);
    if (!over) {
      restoreDragPosition();
      return;
    }

    const cardId = String(active.id);
    const overId = String(over.id);
    const to = resolveDropColumn(board, overId);
    if (!to) {
      restoreDragPosition();
      return;
    }
    dragStartPosition.current = null;

    dispatch({
      type: 'card/moved',
      cardId,
      toColumn: to,
      toIndex: getInsertionIndex(event, to),
    });

    // Matches how arrivals are handled: the effect is not created at all under
    // reduced motion, rather than created and then hidden.
    if (
      to === 'done' &&
      origin !== 'done' &&
      !window.matchMedia('(prefers-reduced-motion: reduce)').matches
    ) {
      onCardCompleted(cardId);
    }
  }

  function handleDragCancel() {
    restoreDragPosition();
    setActiveCardId(null);
    setTargetColumn(null);
    setDragOrigin(null);
  }

  // Screen-reader announcements read from board state, so these live in scope.
  function describe(cardId: string) {
    return board.cards[cardId]?.title ?? 'card';
  }

  function describeTarget(overId: string) {
    const column = resolveDropColumn(board, overId);
    return column ? COLUMN_TITLES[column] : 'an unknown column';
  }

  // The Done portal opens for the whole drag, not just while Done is targeted:
  // by the time the cursor is over the column the card under it covers the
  // portal, so opening then would be showing it where it cannot be seen.
  //
  // A card already in Done is excluded — moving one of those around is an
  // ordinary sort, not something to finish.
  const portalOpen =
    activeCardId !== null &&
    dragOrigin !== null &&
    dragOrigin !== 'done' &&
    !window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  const activeCard = activeCardId ? board.cards[activeCardId] : undefined;

  const accessibility: NonNullable<DndContextProps['accessibility']> = {
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
  };

  return {
    activeCard,
    collisionDetection,
    doneInsertionIndex,
    targetColumn,
    portalOpen,
    sensors,
    accessibility,
    onDragStart: handleDragStart,
    onDragOver: handleDragOver,
    onDragMove: updateDropPreview,
    onDragEnd: handleDragEnd,
    onDragCancel: handleDragCancel,
  };
}
