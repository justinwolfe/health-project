export const COLUMN_IDS = ['todo', 'doing', 'done'] as const;

export type ColumnId = (typeof COLUMN_IDS)[number];

export const COLUMN_TITLES: Record<ColumnId, string> = {
  todo: 'To Do',
  doing: 'Doing',
  done: 'Done',
};

export type Card = {
  id: string;
  title: string;
  /** Every card must have a character assigned; enforced by the create form. */
  characterId: string;
};

/**
 * Normalized on purpose. Cards live in one map; each column holds an ordered
 * list of ids. Reordering therefore touches only a short array of strings, and
 * a card's identity is independent of where it currently sits.
 */
export type BoardState = {
  cards: Record<string, Card>;
  columnOrder: Record<ColumnId, string[]>;
};

export const emptyBoard: BoardState = {
  cards: {},
  columnOrder: { todo: [], doing: [], done: [] },
};
