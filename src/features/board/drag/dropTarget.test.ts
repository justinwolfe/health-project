import { describe, expect, it } from 'vitest';

import type { BoardState } from '../state/types';
import { insertionIndex, resolveDropColumn } from './dropTarget';

const board: BoardState = {
  cards: {
    a: { id: 'a', title: 'A', characterId: '1' },
    b: { id: 'b', title: 'B', characterId: '2' },
    c: { id: 'c', title: 'C', characterId: '3' },
  },
  columnOrder: { todo: ['a', 'b'], doing: ['c'], done: [] },
};

describe('resolveDropColumn', () => {
  it('resolves a column id to itself', () => {
    expect(resolveDropColumn(board, 'done')).toBe('done');
  });

  it('resolves a card id to the column holding it', () => {
    expect(resolveDropColumn(board, 'c')).toBe('doing');
  });

  it('returns undefined for an id that is neither', () => {
    expect(resolveDropColumn(board, 'ghost')).toBeUndefined();
  });
});

describe('insertionIndex', () => {
  it('inserts before the card that was dropped on', () => {
    expect(insertionIndex(board, 'todo', 'b')).toBe(1);
    expect(insertionIndex(board, 'todo', 'a')).toBe(0);
  });

  it('appends when the drop landed on the column itself', () => {
    expect(insertionIndex(board, 'todo', 'todo')).toBe(2);
    expect(insertionIndex(board, 'done', 'done')).toBe(0);
  });
});
