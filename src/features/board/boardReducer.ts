import { moveCard } from './moveCard';
import type { BoardState, Card, ColumnId } from './types';

export type BoardAction =
  | { type: 'card/added'; card: Card }
  | { type: 'card/moved'; cardId: string; toColumn: ColumnId; toIndex: number };

export function boardReducer(state: BoardState, action: BoardAction): BoardState {
  switch (action.type) {
    case 'card/added':
      // New cards go to the top of To Do so the result of submitting the form
      // is visible without scrolling.
      return {
        cards: { ...state.cards, [action.card.id]: action.card },
        columnOrder: {
          ...state.columnOrder,
          todo: [action.card.id, ...state.columnOrder.todo],
        },
      };

    case 'card/moved':
      return moveCard({
        state,
        cardId: action.cardId,
        toColumn: action.toColumn,
        toIndex: action.toIndex,
      });
  }
}
