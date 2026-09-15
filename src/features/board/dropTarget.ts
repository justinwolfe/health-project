import { findColumnOf } from './moveCard';
import { isColumnId, type BoardState, type ColumnId } from './types';

/**
 * dnd-kit reports what the pointer is over as a single id, which is either a
 * column (an empty column's droppable) or a card sitting in one. Both cases
 * resolve to the column the card would land in.
 */
export function resolveDropColumn(state: BoardState, overId: string): ColumnId | undefined {
  if (isColumnId(overId)) return overId;
  return findColumnOf(state, overId);
}

/**
 * Where in `column` a card dropped on `overId` should be inserted: before the
 * card it was dropped on, or at the end when the drop landed on the column
 * itself rather than on a card.
 */
export function insertionIndex(state: BoardState, column: ColumnId, overId: string): number {
  const ids = state.columnOrder[column];
  const index = ids.indexOf(overId);
  return index === -1 ? ids.length : index;
}
