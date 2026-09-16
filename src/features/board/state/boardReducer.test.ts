import { describe, expect, it } from 'vitest';

import { boardReducer } from './boardReducer';
import { emptyBoard, type BoardState } from './types';

describe('boardReducer', () => {
  it('adds a card to the top of To Do', () => {
    const first = boardReducer(emptyBoard, {
      type: 'card/added',
      card: { id: 'a', title: 'First', details: '', characterId: '1' },
    });
    const second = boardReducer(first, {
      type: 'card/added',
      card: { id: 'b', title: 'Second', details: '', characterId: '2' },
    });

    expect(second.columnOrder.todo).toEqual(['b', 'a']);
    expect(second.cards.b?.title).toBe('Second');
  });

  it('does not mutate the previous state when adding', () => {
    boardReducer(emptyBoard, {
      type: 'card/added',
      card: { id: 'a', title: 'First', details: '', characterId: '1' },
    });

    expect(emptyBoard.columnOrder.todo).toEqual([]);
    expect(emptyBoard.cards).toEqual({});
  });

  it('moves an existing card between columns', () => {
    const state: BoardState = {
      cards: { a: { id: 'a', title: 'A', details: '', characterId: '1' } },
      columnOrder: { todo: ['a'], doing: [], done: [] },
    };

    const next = boardReducer(state, {
      type: 'card/moved',
      cardId: 'a',
      toColumn: 'done',
      toIndex: 0,
    });

    expect(next.columnOrder).toEqual({ todo: [], doing: [], done: ['a'] });
  });
});
