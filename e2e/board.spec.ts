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

test('creates a card with its assigned character and clears the form', async ({ page }) => {
  await addCard(page, 'Fix the portal gun', 'Rick Sanchez');

  const card = column(page, 'todo').getByTestId('card');
  await expect(card).toHaveCount(1);
  await expect(card).toContainText('Fix the portal gun');
  await expect(card).toContainText('Rick Sanchez');

  await expect(page.getByLabel('Title')).toHaveValue('');
  await expect(picker(page)).toHaveValue('');
});

test('shows optional details on the card and clears them from the form', async ({ page }) => {
  await page.getByLabel('Title').fill('Fix the portal gun');
  await page.getByLabel('Details').fill('Recalibrate the dial.\nAvoid the Cronenberg dimension.');
  await chooseCharacter(page, 'Rick Sanchez');
  await page.getByRole('button', { name: 'Create' }).click();

  const card = column(page, 'todo').getByTestId('card');
  await expect(card).toContainText('Recalibrate the dial.');
  await expect(card).toContainText('Avoid the Cronenberg dimension.');
  await expect(cardTitles(page, 'todo')).toHaveText(['Fix the portal gun']);
  await expect(page.getByLabel('Details')).toHaveValue('');
});

test('refuses a card with no character assigned', async ({ page }) => {
  await page.getByLabel('Title').fill('No character on this one');
  await page.getByRole('button', { name: 'Create' }).click();

  const error = page.getByRole('alert');
  const character = picker(page);
  await expect(error).toHaveText('Pick a character for this card.');
  await expect(character).toBeFocused();
  await expect(character).toHaveAttribute('aria-invalid', 'true');
  const errorId = await error.getAttribute('id');
  expect(errorId).toBeTruthy();
  await expect(character).toHaveAttribute('aria-describedby', new RegExp(errorId ?? ''));
  await expect(column(page, 'todo').getByTestId('card')).toHaveCount(0);

  await chooseCharacter(page, 'Morty Smith');
  await expect(error).toHaveCount(0);
  await expect(character).toHaveAttribute('aria-invalid', 'false');
});

test('refuses a card with a blank title', async ({ page }) => {
  await chooseCharacter(page, 'Morty Smith');
  await page.getByLabel('Title').fill('   ');
  await page.getByRole('button', { name: 'Create' }).click();

  const error = page.getByRole('alert');
  const title = page.getByLabel('Title');
  await expect(error).toHaveText('Give the card a title.');
  await expect(title).toBeFocused();
  await expect(title).toHaveAttribute('aria-invalid', 'true');
  const errorId = await error.getAttribute('id');
  expect(errorId).toBeTruthy();
  await expect(title).toHaveAttribute('aria-describedby', errorId ?? '');
  await expect(column(page, 'todo').getByTestId('card')).toHaveCount(0);

  await title.fill('A valid title');
  await expect(error).toHaveCount(0);
  await expect(title).toHaveAttribute('aria-invalid', 'false');
});

test('keeps cards vertically scrollable on touch screens', async ({ page }) => {
  await addCard(page, 'Scroll past me', 'Morty Smith');
  await expect(column(page, 'todo').getByTestId('card')).toHaveCSS('touch-action', 'pan-y');
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

test('Escape restores the original order after a cross-column preview', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await addCard(page, 'Last', 'Morty Smith');
  await addCard(page, 'Middle', 'Birdperson');
  await addCard(page, 'First', 'Rick Sanchez');
  await dragTo(page, column(page, 'todo').getByTestId('card').nth(1), column(page, 'doing'), {
    hold: true,
  });
  await expect(cardTitles(page, 'doing')).toHaveText(['Middle']);
  await page.keyboard.press('Escape');
  await page.mouse.up();
  await expect(cardTitles(page, 'todo')).toHaveText(['First', 'Middle', 'Last']);
  await expect(cardTitles(page, 'doing')).toHaveCount(0);
  await expect(page.getByTestId('drag-overlay')).toHaveCount(0);
});

test('does not mount the drag portal under reduced motion', async ({ page }) => {
  await page.emulateMedia({ reducedMotion: 'reduce' });
  await addCard(page, 'Quiet drag', 'Morty Smith');
  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'doing'), {
    hold: true,
  });
  await expect(page.getByTestId('done-portal')).toHaveCount(0);
  await page.mouse.up();
});

for (const destination of ['above', 'between', 'below'] as const) {
  test(`Done portal reserves the ${destination} insertion point and drops there`, async ({
    page,
  }) => {
    await page.emulateMedia({ reducedMotion: 'reduce' });
    await addCard(page, 'Existing A', 'Rick Sanchez');
    await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'));
    await addCard(page, 'Existing B', 'Morty Smith');
    await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'));
    await addCard(page, 'Incoming', 'Birdperson');
    const original = await cardTitles(page, 'done').allTextContents();
    await page.emulateMedia({ reducedMotion: 'no-preference' });
    await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'doing'), {
      hold: true,
    });

    const done = column(page, 'done');
    const slot = done.getByTestId('done-portal-slot');
    const cards = done.getByTestId('card');
    const last = await cards.last().boundingBox();
    const initialSlot = await slot.boundingBox();
    if (!last || !initialSlot) throw new Error('Missing Done geometry');
    expect(initialSlot.y).toBeGreaterThanOrEqual(last.y + last.height);

    const target =
      destination === 'below'
        ? initialSlot
        : await cards.nth(destination === 'above' ? 0 : 1).boundingBox();
    if (!target) throw new Error('Missing target');
    await page.mouse.move(target.x + target.width / 2, target.y + 4, { steps: 10 });
    if (destination === 'below') {
      // Crossing into Done can open an earlier gap along the diagonal path.
      // Aim below the last card in its current layout, just as the user sees it.
      const bottomCard = await cards.last().boundingBox();
      if (!bottomCard) throw new Error('Missing last card');
      await page.mouse.move(
        bottomCard.x + bottomCard.width / 2,
        bottomCard.y + bottomCard.height + 4,
      );
    }
    const index = destination === 'above' ? 0 : destination === 'between' ? 1 : 2;
    await expect
      .poll(() => slot.evaluate((el) => Array.from(el.parentElement!.children).indexOf(el)))
      .toBe(index);
    // The portal's reserved space must stay separate from all existing cards,
    // including after dnd-kit has remeasured the shifted list.
    await expect
      .poll(async () => {
        const gap = await slot.boundingBox();
        const boxes = await cards.evaluateAll((els) =>
          els.map((el) => {
            const r = el.getBoundingClientRect();
            return { top: r.top, bottom: r.bottom };
          }),
        );
        return !!gap && boxes.every((r) => r.bottom <= gap.y || r.top >= gap.y + gap.height);
      })
      .toBe(true);
    const gap = await slot.boundingBox();
    if (!gap) throw new Error('Missing portal gap');
    await page.mouse.move(gap.x + gap.width / 2, gap.y + gap.height / 2);
    await expect
      .poll(() => slot.evaluate((el) => Array.from(el.parentElement!.children).indexOf(el)))
      .toBe(index);
    await page.mouse.up();
    const expected = [...original];
    expected.splice(index, 0, 'Incoming');
    await expect(cardTitles(page, 'done')).toHaveText(expected);
    await expect(cards.filter({ hasText: 'Incoming' }).getByTestId('portal-blast')).toBeAttached();
  });
}

test('hands completion straight to the card and settles its spacing without a jump', async ({
  page,
}) => {
  await addCard(page, 'Smooth completion', 'Rick Sanchez');
  await dragTo(page, column(page, 'todo').getByTestId('card'), column(page, 'done'));
  const done = column(page, 'done');
  await expect(done.getByTestId('portal-blast')).toBeAttached();
  await expect(page.getByTestId('drag-overlay')).toHaveCount(0);
  // The discharge must take over at full size, without replaying portalOpen.
  expect(
    await done.getByTestId('done-portal').evaluate((el) => getComputedStyle(el).animationName),
  ).toBe('none');

  const spacing = await done.getByTestId('card').evaluate(
    (el) =>
      new Promise<number[]>((resolve) => {
        const samples: number[] = [];
        const started = performance.now();
        function sample(now: number) {
          samples.push(parseFloat(getComputedStyle(el).paddingTop));
          if (now - started < 2000) requestAnimationFrame(sample);
          else resolve(samples);
        }
        requestAnimationFrame(sample);
      }),
  );
  expect(spacing[0]).toBeGreaterThan(0);
  expect(spacing.at(-1)).toBe(0);
  // A gradual settle has intermediate positions; timer-driven removal goes
  // straight from the reserved space to zero in a single frame.
  expect(spacing.filter((value) => value > 0 && value < spacing[0]!).length).toBeGreaterThan(5);
  expect(
    Math.max(...spacing.slice(1).map((value, i) => Math.abs(value - spacing[i]!))),
  ).toBeLessThan(spacing[0]! / 2);
});
