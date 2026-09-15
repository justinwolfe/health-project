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

test('keeps showing the dragged card over columns other than Done', async ({ page }) => {
  await addCard(page, 'Still visible', 'Morty Smith');

  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'doing'), {
    hold: true,
  });
  await expect(page.getByTestId('drag-overlay')).toHaveCount(1);
  await page.mouse.up();
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

test('discharges the Done portal when a card reaches it', async ({ page }) => {
  await addCard(page, 'Ship the board', 'Rick Sanchez');

  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'));

  await expect(column(page, 'done').getByTestId('card')).toContainText('Ship the board');
  await expect(column(page, 'done').getByTestId('portal-blast')).toBeAttached();
  // The whole portal then leaves, rather than sitting in the column.
  await expect(column(page, 'done').getByTestId('done-portal')).toHaveCount(0);
});

test.describe('with reduced motion requested', () => {
  test.use({ reducedMotion: 'reduce' });

  test('moves the card to Done without discharging the portal', async ({ page }) => {
    await addCard(page, 'Quietly done', 'Morty Smith');

    await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'));

    await expect(column(page, 'done').getByTestId('card')).toContainText('Quietly done');
    await expect(column(page, 'done').getByTestId('portal-blast')).toHaveCount(0);
    await expect(column(page, 'done').getByTestId('done-portal')).toHaveCount(0);
  });
});

test('opens a portal in To Do, reveals the card, and clears the effect', async ({ page }) => {
  await addCard(page, 'Through the portal', 'Rick Sanchez');
  const portal = column(page, 'todo').getByTestId('creation-portal');
  await expect(portal).toBeVisible();
  const card = column(page, 'todo').getByTestId('card');
  await expect(card).toHaveAttribute('aria-disabled', 'true');
  await expect(portal).toHaveCount(0);
  await expect(card).not.toHaveAttribute('aria-disabled', 'true');
  await expect(card).toContainText('Through the portal');
});

test('skips the portal when reduced motion is requested', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await addCard(page, 'A quiet arrival', 'Morty Smith');
  await expect(page.getByTestId('creation-portal')).toHaveCount(0);
  await expect(column(page, 'todo').getByTestId('card')).toBeVisible();
  await expect(column(page, 'todo').getByTestId('card')).not.toHaveAttribute(
    'aria-disabled',
    'true',
  );
});

test('opens the Done portal only while a card is over it', async ({ page }) => {
  await addCard(page, 'Charge it up', 'Rick Sanchez');

  const portal = column(page, 'done').getByTestId('done-portal');
  await expect(portal).toHaveCount(0);

  // Hold the drag over Done rather than completing it, to catch the mid-drag state.
  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'), {
    hold: true,
  });
  await expect(portal).toBeVisible();

  await page.mouse.up();
  await expect(column(page, 'done').getByTestId('portal-blast')).toBeAttached();
  // And it leaves once the discharge has played.
  await expect(portal).toHaveCount(0);
});

test('shows only the portal in Done while dragging, not a preview of the card', async ({
  page,
}) => {
  await addCard(page, 'No preview please', 'Rick Sanchez');

  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'), {
    hold: true,
  });

  await expect(column(page, 'done').getByTestId('done-portal')).toBeVisible();
  await expect(column(page, 'done').getByTestId('card')).toHaveCount(0);
  // The dragged card is not shown over Done either: no list preview and no
  // drag ghost, so the portal is the only thing in the drop target.
  await expect(page.getByTestId('drag-overlay')).toHaveCount(0);
  // Still on the board, just not previewed into Done. It sits in Doing, which
  // the drag crossed on the way over and which does still preview.
  await expect(page.getByTestId('card')).toHaveCount(1);

  await page.mouse.up();
  await expect(column(page, 'done').getByTestId('card')).toHaveCount(1);
});

test('closes the Done portal again when the drag moves away without dropping', async ({ page }) => {
  await addCard(page, 'Not yet done', 'Rick Sanchez');

  const portal = column(page, 'done').getByTestId('done-portal');
  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'), {
    hold: true,
  });
  await expect(portal).toBeVisible();

  // Drag back out to Doing; the portal should not linger.
  const doing = await column(page, 'doing').boundingBox();
  if (!doing) throw new Error('Doing column is not visible');
  await page.mouse.move(doing.x + doing.width / 2, doing.y + doing.height / 2, { steps: 8 });
  await expect(portal).toHaveCount(0);

  await page.mouse.up();
  await expect(column(page, 'doing').getByTestId('card')).toHaveCount(1);
});

test('replays the discharge when a second card is finished', async ({ page }) => {
  await addCard(page, 'First done', 'Rick Sanchez');
  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'));
  await expect(column(page, 'done').getByTestId('card')).toHaveCount(1);

  await addCard(page, 'Second done', 'Morty Smith');
  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'));

  await expect(column(page, 'done').getByTestId('card')).toHaveCount(2);
  // One burst at a time: the previous portal has already left.
  await expect(column(page, 'done').getByTestId('portal-blast')).toHaveCount(1);
});
