import type { BoardState, ColumnId } from './types';

/** The column a card currently sits in, or undefined if the id is unknown. */
export function findColumnOf(state: BoardState, cardId: string): ColumnId | undefined {
  for (const columnId of Object.keys(state.columnOrder) as ColumnId[]) {
    if (state.columnOrder[columnId].includes(cardId)) return columnId;
  }
  return undefined;
}

type MoveArgs = {
  state: BoardState;
  cardId: string;
  toColumn: ColumnId;
  /** Destination index within `toColumn`. Clamped; past-the-end means append. */
  toIndex: number;
};

/**
 * The single state transition behind every drag: reordering within a column and
 * moving across columns are the same operation with a different target column.
 *
 * Pure and returns a new object, so it is trivially testable without a DOM and
 * safe to call from a reducer. Returns the original state when nothing changes,
 * which lets React skip a re-render.
 */
export function moveCard({ state, cardId, toColumn, toIndex }: MoveArgs): BoardState {
  const fromColumn = findColumnOf(state, cardId);
  if (fromColumn === undefined) return state;

  const source = state.columnOrder[fromColumn].filter((id) => id !== cardId);
  // Within one column, removing the card first shifts later indices down by one,
  // so the clamp below is applied to the already-shortened array.
  const target = fromColumn === toColumn ? source : [...state.columnOrder[toColumn]];

  const index = Math.max(0, Math.min(toIndex, target.length));
  target.splice(index, 0, cardId);

  if (fromColumn === toColumn && isSameOrder(state.columnOrder[fromColumn], target)) {
    return state;
  }

  return {
    ...state,
    columnOrder: {
      ...state.columnOrder,
      [fromColumn]: source,
      [toColumn]: target,
    },
  };
}

function isSameOrder(a: readonly string[], b: readonly string[]): boolean {
  return a.length === b.length && a.every((id, i) => id === b[i]);
}
