import { DndContext, DragOverlay, MeasuringStrategy } from '@dnd-kit/core';
import { useCallback, useReducer, useState } from 'react';

import type { LoadedCharacter } from '../characters/types';
import styles from './Board.module.css';
import { BoardColumn } from './BoardColumn';
import { NewCardForm } from './NewCardForm';
import { CardView } from './cards/CardView';
import { useBoardDrag } from './drag/useBoardDrag';
import { useBoardCompletion } from './effects/useBoardCompletion';
import { boardReducer } from './state/boardReducer';
import { COLUMN_IDS, emptyBoard } from './state/types';

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

  const { completion, discharge, playCompletion } = useBoardCompletion();

  const drag = useBoardDrag({ board, dispatch, onCardCompleted: playCompletion });

  function handleCreate({
    title,
    details,
    character,
  }: {
    title: string;
    details: string;
    character: LoadedCharacter;
  }) {
    setCharactersById((previous) => new Map(previous).set(character.id, character));
    const id = crypto.randomUUID();
    if (!window.matchMedia('(prefers-reduced-motion: reduce)').matches) {
      setArrivingIds((previous) => new Set(previous).add(id));
    }
    dispatch({
      type: 'card/added',
      card: { id, title, details, characterId: character.id },
    });
  }

  return (
    <div className={styles.board}>
      <NewCardForm onCreate={handleCreate} />

      <DndContext
        sensors={drag.sensors}
        collisionDetection={drag.collisionDetection}
        onDragMove={drag.onDragMove}
        onDragStart={drag.onDragStart}
        onDragOver={drag.onDragOver}
        onDragEnd={drag.onDragEnd}
        onDragCancel={drag.onDragCancel}
        // Re-measure droppables continuously rather than only at drag start.
        // Cards entering and leaving change every column's height mid-drag, and
        // with one-shot measuring the keyboard sensor searches stale rects — it
        // can find no column to move into at all.
        measuring={{ droppable: { strategy: MeasuringStrategy.Always } }}
        accessibility={drag.accessibility}
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
              targeted={drag.targetColumn === columnId}
              portalOpen={drag.portalOpen}
              portalIndex={drag.doneInsertionIndex}
              dischargeKey={discharge}
              completedCardId={completion?.cardId ?? null}
              completionKey={completion?.key ?? null}
            />
          ))}
        </div>

        {/* Completion already animates the real card. A second drop animation on
            the overlay obscures its first quarter-second. */}
        <DragOverlay dropAnimation={completion !== null ? null : undefined}>
          {drag.activeCard ? (
            <div data-testid="drag-overlay">
              <CardView
                card={drag.activeCard}
                character={charactersById.get(drag.activeCard.characterId)}
                lifted
              />
            </div>
          ) : null}
        </DragOverlay>
      </DndContext>
    </div>
  );
}
