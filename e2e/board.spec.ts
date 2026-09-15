import { expect, test } from '@playwright/test';

import {
  addCard,
  cardTitles,
  chooseCharacter,
  column,
  dragTo,
  dragWithKeyboard,
  openBoard,
  picker,
} from './support/app';

test.beforeEach(async ({ page }) => {
  await openBoard(page);
});

test('renders the three columns and the create form', async ({ page }) => {
  await expect(page.getByRole('heading', { name: 'Kanban', level: 1 })).toBeVisible();

  for (const name of ['To Do', 'Doing', 'Done']) {
    await expect(page.getByRole('heading', { name, level: 2 })).toBeVisible();
  }

  await expect(page.getByRole('form', { name: 'Add a card' })).toBeVisible();
});

test('creates a card with its assigned character and clears the form', async ({ page }) => {
  await addCard(page, 'Fix the portal gun', 'Rick Sanchez');

  const card = column(page, 'todo').getByTestId('card');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('Fix the portal gun');
  await expect(card).toContainText('Rick Sanchez');

  await expect(page.getByLabel('Title')).toHaveValue('');
  await expect(picker(page)).toHaveValue('');
});

test('refuses a card with no character assigned', async ({ page }) => {
  await page.getByLabel('Title').fill('No character on this one');
  await page.getByRole('button', { name: 'Add card' }).click();

  await expect(page.getByRole('alert')).toHaveText('Pick a character for this card.');
  await expect(column(page, 'todo').getByTestId('card')).toHaveCount(0);
});

test('refuses a card with a blank title', async ({ page }) => {
  await chooseCharacter(page, 'Morty Smith');
  await page.getByLabel('Title').fill('   ');
  await page.getByRole('button', { name: 'Add card' }).click();

  await expect(page.getByRole('alert')).toHaveText('Give the card a title.');
  await expect(column(page, 'todo').getByTestId('card')).toHaveCount(0);
});

test('drags a card from To Do into Doing', async ({ page }) => {
  await addCard(page, 'Investigate the anomaly', 'Morty Smith');

  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'doing'));

  await expect(column(page, 'todo').getByTestId('card')).toHaveCount(0);
  await expect(column(page, 'doing').getByTestId('card')).toHaveCount(1);
  await expect(column(page, 'doing').getByTestId('card')).toContainText('Investigate the anomaly');
});

test('reorders cards within a column', async ({ page }) => {
  // Cards are added to the top, so adding first/second/third yields the
  // reverse order in the column.
  await addCard(page, 'Third', 'Rick Sanchez');
  await addCard(page, 'Second', 'Morty Smith');
  await addCard(page, 'First', 'Birdperson');

  await expect(cardTitles(page, 'todo')).toHaveText(['First', 'Second', 'Third']);

  const cards = column(page, 'todo').getByTestId('card');
  await dragTo(page, cards.first(), cards.last());

  await expect(cardTitles(page, 'todo')).toHaveText(['Second', 'Third', 'First']);
});

test('moves a card with the keyboard alone', async ({ page }) => {
  await addCard(page, 'Keyboard only', 'Birdperson');

  await dragWithKeyboard(page, column(page, 'todo').getByTestId('card'), ['ArrowRight']);

  await expect(column(page, 'doing').getByTestId('card')).toContainText('Keyboard only');
});

test('celebrates when a card reaches Done', async ({ page }) => {
  await addCard(page, 'Ship the board', 'Rick Sanchez');

  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'));

  await expect(column(page, 'done').getByTestId('card')).toContainText('Ship the board');
  // canvas-confetti renders into a canvas it appends to the document.
  await expect(page.locator('canvas')).toBeAttached();
});

test.describe('with reduced motion requested', () => {
  test.use({ reducedMotion: 'reduce' });

  test('moves the card to Done without firing confetti', async ({ page }) => {
    await addCard(page, 'Quietly done', 'Morty Smith');

    await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'));

    await expect(column(page, 'done').getByTestId('card')).toContainText('Quietly done');
    await expect(page.locator('canvas')).toHaveCount(0);
  });
});
