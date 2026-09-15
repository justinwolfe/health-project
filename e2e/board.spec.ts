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

test('keeps the dragged card under the cursor over every column, Done included', async ({
  page,
}) => {
  await addCard(page, 'Still visible', 'Morty Smith');

  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'doing'), {
    hold: true,
  });
  await expect(page.getByTestId('drag-overlay')).toHaveCount(1);

  const done = await column(page, 'done').boundingBox();
  if (!done) throw new Error('Done column is not visible');
  await page.mouse.move(done.x + done.width / 2, done.y + done.height / 2, { steps: 8 });
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

test('summons a Meeseeks on the finished card, which then poofs', async ({ page }) => {
  await addCard(page, 'Existence is pain', 'Rick Sanchez');

  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'));

  // It belongs to the card, so it travels with it rather than sitting in the
  // column, and it outlives the portal's discharge.
  const meeseeks = column(page, 'done').getByTestId('card').getByTestId('meeseeks');
  await expect(meeseeks).toBeAttached();
  await expect(column(page, 'done').getByTestId('done-portal')).toHaveCount(0);
  await expect(meeseeks).toBeAttached();

  // A Meeseeks exists only until its task is done.
  await expect(meeseeks).toHaveCount(0);
  await expect(column(page, 'done').getByTestId('card')).toContainText('Existence is pain');
});

test.describe('with reduced motion requested', () => {
  test.use({ reducedMotion: 'reduce' });

  test('moves the card to Done without discharging the portal', async ({ page }) => {
    await addCard(page, 'Quietly done', 'Morty Smith');

    await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'));

    await expect(column(page, 'done').getByTestId('card')).toContainText('Quietly done');
    await expect(column(page, 'done').getByTestId('portal-blast')).toHaveCount(0);
    await expect(column(page, 'done').getByTestId('done-portal')).toHaveCount(0);
    await expect(page.getByTestId('meeseeks')).toHaveCount(0);
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

test('opens the Done portal as soon as a card starts moving, not on hover', async ({ page }) => {
  await addCard(page, 'Charge it up', 'Rick Sanchez');

  const portal = column(page, 'done').getByTestId('done-portal');
  await expect(portal).toHaveCount(0);

  // Dragging only as far as Doing: the portal should already be open, so it is
  // visible before the cursor reaches Done and covers it.
  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'doing'), {
    hold: true,
  });
  await expect(portal).toBeVisible();
  await expect(portal.locator('[data-charging="true"]')).toHaveCount(0);

  // Over Done it charges.
  const done = await column(page, 'done').boundingBox();
  if (!done) throw new Error('Done column is not visible');
  await page.mouse.move(done.x + done.width / 2, done.y + done.height / 2, { steps: 8 });
  await expect(portal.locator('[data-charging="true"]')).toHaveCount(1);

  await page.mouse.up();
  await expect(column(page, 'done').getByTestId('portal-blast')).toBeAttached();
  // And it leaves once the discharge has played.
  await expect(portal).toHaveCount(0);
});

test('does not drop a placeholder card into Done while dragging over it', async ({ page }) => {
  await addCard(page, 'No placeholder please', 'Rick Sanchez');

  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'), {
    hold: true,
  });

  await expect(column(page, 'done').getByTestId('done-portal')).toBeVisible();
  // Nothing sits in the drop zone underneath the portal.
  await expect(column(page, 'done').getByTestId('card')).toHaveCount(0);
  // The card is still on the board and still under the cursor.
  await expect(page.getByTestId('card')).toHaveCount(1);
  await expect(page.getByTestId('drag-overlay')).toHaveCount(1);

  await page.mouse.up();
  await expect(column(page, 'done').getByTestId('card')).toHaveCount(1);
});

test('does not open the portal when reordering inside Done', async ({ page }) => {
  await addCard(page, 'First finished', 'Rick Sanchez');
  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'));
  await addCard(page, 'Second finished', 'Morty Smith');
  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'));

  await expect(column(page, 'done').getByTestId('card')).toHaveCount(2);
  await expect(column(page, 'done').getByTestId('done-portal')).toHaveCount(0);

  // Reordering within Done is an ordinary sort, not an arrival — no portal even
  // though a drag is in progress.
  const cards = column(page, 'done').getByTestId('card');
  await dragTo(page, cards.first(), cards.last(), { hold: true });
  await expect(column(page, 'done').getByTestId('done-portal')).toHaveCount(0);

  await page.mouse.up();
  await expect(column(page, 'done').getByTestId('portal-blast')).toHaveCount(0);
  await expect(page.getByTestId('meeseeks')).toHaveCount(0);
});

test('gives Done no placeholder text', async ({ page }) => {
  await expect(column(page, 'done')).not.toContainText('Drop a card here');
  // The other columns keep theirs.
  await expect(column(page, 'todo')).toContainText('Drop a card here');
  await expect(column(page, 'doing')).toContainText('Drop a card here');
});

test('closes the Done portal when a drag ends somewhere else', async ({ page }) => {
  await addCard(page, 'Not yet done', 'Rick Sanchez');

  const portal = column(page, 'done').getByTestId('done-portal');
  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'), {
    hold: true,
  });
  await expect(portal).toBeVisible();

  // Back out to Doing. The portal stays open — a drag is still in progress —
  // but stops charging, since the drop would no longer land in Done.
  const doing = await column(page, 'doing').boundingBox();
  if (!doing) throw new Error('Doing column is not visible');
  await page.mouse.move(doing.x + doing.width / 2, doing.y + doing.height / 2, { steps: 8 });
  await expect(portal).toBeVisible();
  await expect(portal.locator('[data-charging="true"]')).toHaveCount(0);

  // Dropping in Doing ends the drag, and the portal closes with no discharge.
  await page.mouse.up();
  await expect(column(page, 'doing').getByTestId('card')).toHaveCount(1);
  await expect(portal).toHaveCount(0);
  await expect(column(page, 'done').getByTestId('portal-blast')).toHaveCount(0);
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
