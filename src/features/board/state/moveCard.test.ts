import { describe, expect, it } from 'vitest';

import { findColumnOf, moveCard } from './moveCard';
import type { BoardState } from './types';

const board: BoardState = {
  cards: {
    a: { id: 'a', title: 'A', details: '', characterId: '1' },
    b: { id: 'b', title: 'B', details: '', characterId: '2' },
    c: { id: 'c', title: 'C', details: '', characterId: '3' },
    d: { id: 'd', title: 'D', details: '', characterId: '4' },
  },
  columnOrder: { todo: ['a', 'b', 'c'], doing: ['d'], done: [] },
};

describe('findColumnOf', () => {
  it('locates the column holding a card', () => {
    expect(findColumnOf(board, 'c')).toBe('todo');
    expect(findColumnOf(board, 'd')).toBe('doing');
  });

  it('returns undefined for an unknown card', () => {
    expect(findColumnOf(board, 'nope')).toBeUndefined();
  });
});

describe('moveCard within a column', () => {
  it('moves a card later, accounting for its own removal', () => {
    const next = moveCard({ state: board, cardId: 'a', toColumn: 'todo', toIndex: 2 });
    expect(next.columnOrder.todo).toEqual(['b', 'c', 'a']);
  });

  it('moves a card earlier', () => {
    const next = moveCard({ state: board, cardId: 'c', toColumn: 'todo', toIndex: 0 });
    expect(next.columnOrder.todo).toEqual(['c', 'a', 'b']);
  });

  it('returns the same state object when the order is unchanged', () => {
    const next = moveCard({ state: board, cardId: 'b', toColumn: 'todo', toIndex: 1 });
    expect(next).toBe(board);
  });
});

describe('moveCard across columns', () => {
  it('removes from the source and inserts at the target index', () => {
    const next = moveCard({ state: board, cardId: 'b', toColumn: 'doing', toIndex: 0 });
    expect(next.columnOrder.todo).toEqual(['a', 'c']);
    expect(next.columnOrder.doing).toEqual(['b', 'd']);
  });

  it('appends into an empty column', () => {
    const next = moveCard({ state: board, cardId: 'a', toColumn: 'done', toIndex: 0 });
    expect(next.columnOrder.done).toEqual(['a']);
    expect(next.columnOrder.todo).toEqual(['b', 'c']);
  });

  it('clamps an out-of-range index instead of leaving a hole', () => {
    const next = moveCard({ state: board, cardId: 'a', toColumn: 'doing', toIndex: 99 });
    expect(next.columnOrder.doing).toEqual(['d', 'a']);
  });

  it('does not mutate the input state', () => {
    moveCard({ state: board, cardId: 'a', toColumn: 'done', toIndex: 0 });
    expect(board.columnOrder.todo).toEqual(['a', 'b', 'c']);
    expect(board.columnOrder.done).toEqual([]);
  });

  it('ignores an unknown card id', () => {
    expect(moveCard({ state: board, cardId: 'zz', toColumn: 'done', toIndex: 0 })).toBe(board);
  });
});
