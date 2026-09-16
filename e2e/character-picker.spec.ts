import { expect, test } from '@playwright/test';

import {
  failNextCharacterRequest,
  openBoard,
  picker,
  pickerOptions,
  searchCharacter,
} from './support/app';

test.beforeEach(async ({ page }) => {
  await openBoard(page);
});

test('exposes the ARIA combobox wiring', async ({ page }) => {
  const combobox = picker(page);

  await expect(combobox).toHaveAttribute('aria-autocomplete', 'list');
  await expect(combobox).toHaveAttribute('aria-expanded', 'false');

  await combobox.click();
  await expect(combobox).toHaveAttribute('aria-expanded', 'true');

  const listboxId = await combobox.getAttribute('aria-controls');
  expect(listboxId).toBeTruthy();
  await expect(page.locator(`#${listboxId}`)).toHaveRole('listbox');
});

test('filters on the server as you type', async ({ page }) => {
  await picker(page).click();
  await expect(pickerOptions(page).first()).toContainText('Rick Sanchez');

  await searchCharacter(page, 'summer');

  await expect(pickerOptions(page)).toHaveCount(1);
  await expect(pickerOptions(page).first()).toContainText('Summer Smith');
});

test('hides stale options while a new search is pending', async ({ page }) => {
  const combobox = picker(page);
  await combobox.click();
  await expect(pickerOptions(page).first()).toContainText('Rick Sanchez');

  await combobox.fill('summer');

  // Read immediately rather than polling past the debounce window.
  expect(await pickerOptions(page).count()).toBe(0);
  await expect(page.getByRole('listbox')).toHaveAttribute('aria-busy', 'true');
  await expect(pickerOptions(page)).toHaveCount(1);
  await expect(pickerOptions(page).first()).toContainText('Summer Smith');
});

test('explains a search failure and retries it', async ({ page }) => {
  await failNextCharacterRequest(page);
  await picker(page).fill('summer');

  await expect(page.getByRole('alert')).toContainText('Couldn’t load characters.');
  await page.getByRole('button', { name: 'Try again' }).click();

  await expect(page.getByRole('alert')).toHaveCount(0);
  await expect(pickerOptions(page)).toHaveCount(1);
  await expect(pickerOptions(page).first()).toContainText('Summer Smith');
});

test('finds a character that is not on the first page', async ({ page }) => {
  await picker(page).click();

  // Squanchy sits beyond the first page, so an unfiltered list cannot reach it.
  await expect(pickerOptions(page).filter({ hasText: 'Squanchy' })).toHaveCount(0);

  await searchCharacter(page, 'squanchy');

  await expect(pickerOptions(page)).toHaveCount(1);
  await expect(pickerOptions(page).first()).toContainText('Squanchy');
});

test('says so when nothing matches', async ({ page }) => {
  await searchCharacter(page, 'zzzznotreal');

  await expect(pickerOptions(page)).toHaveCount(0);
  await expect(page.getByRole('listbox')).toContainText('No characters match');
});

test('loads the next page from the last option', async ({ page }) => {
  await picker(page).click();

  await expect(pickerOptions(page)).toHaveCount(21); // 20 characters + load more
  const loadMore = pickerOptions(page).last();
  await expect(loadMore).toContainText('Load more (20 of 25)');

  await loadMore.click();

  // All 25 loaded, so the load-more option is gone.
  await expect(pickerOptions(page)).toHaveCount(25);
  await expect(pickerOptions(page).filter({ hasText: 'Squanchy' })).toHaveCount(1);
});

test('selects with the keyboard using virtual focus', async ({ page }) => {
  const combobox = picker(page);
  await combobox.click();

  // DOM focus must never leave the input — the user has to keep typing.
  await page.keyboard.press('ArrowDown');
  await expect(combobox).toBeFocused();

  const active = await combobox.getAttribute('aria-activedescendant');
  expect(active).toBeTruthy();
  await expect(page.locator(`#${active}`)).toHaveAttribute('aria-selected', 'true');

  await page.keyboard.press('ArrowDown');
  await page.keyboard.press('Enter');

  await expect(combobox).toHaveValue('Morty Smith');
  await expect(combobox).toHaveAttribute('aria-expanded', 'false');
});

test('drops the highlight while typing', async ({ page }) => {
  const combobox = picker(page);
  await combobox.click();
  await page.keyboard.press('ArrowDown');
  await expect(combobox).toHaveAttribute('aria-activedescendant', /.+/);

  // NVDA stops announcing typed characters while a virtual focus is set.
  await combobox.pressSequentially('ri');
  await expect(combobox).not.toHaveAttribute('aria-activedescendant', /.+/);
});

test('closes on Escape without clearing the text', async ({ page }) => {
  const combobox = picker(page);
  await searchCharacter(page, 'beth');

  await page.keyboard.press('Escape');

  await expect(combobox).toHaveAttribute('aria-expanded', 'false');
  await expect(combobox).toHaveValue('beth');
});

test('clears the selection when the text is edited afterwards', async ({ page }) => {
  await page.getByLabel('Title').fill('Needs a character');
  await searchCharacter(page, 'beth');
  await pickerOptions(page).first().click();
  await expect(picker(page)).toHaveValue('Beth Smith');

  // Editing the text means it no longer describes the chosen character.
  await picker(page).pressSequentially('x');
  await page.getByRole('button', { name: 'Create' }).click();

  await expect(page.getByRole('alert')).toHaveText('Pick a character for this card.');
});

test('announces the result count to screen readers', async ({ page }) => {
  await searchCharacter(page, 'smith');

  // Scoped via aria-describedby rather than role=status: dnd-kit renders its
  // own live region on the same page.
  const statusId = await picker(page).getAttribute('aria-describedby');
  await expect(page.locator(`#${statusId}`)).toHaveText('4 characters found.');
});

test('carries the distinguishing detail onto the card', async ({ page }) => {
  await page.getByLabel('Title').fill('Which Rick?');
  await searchCharacter(page, 'rick sanchez');
  await pickerOptions(page).nth(1).click();
  await page.getByRole('button', { name: 'Create' }).click();

  const card = page.getByTestId('card').first();
  await expect(card).toContainText('Rick Sanchez');
  await expect(card).toContainText('Earth (Replacement Dimension)');
});

test('does not point virtual focus at a missing result', async ({ page }) => {
  await searchCharacter(page, 'zzzznotreal');
  for (const key of ['ArrowDown', 'ArrowUp', 'Home', 'End']) {
    await picker(page).press(key);
    await expect(picker(page)).not.toHaveAttribute('aria-activedescendant', /.+/);
  }
});

test('closes when focus moves outside the picker', async ({ page }) => {
  await picker(page).click();
  await page.getByLabel('Title').focus();
  await expect(picker(page)).toHaveAttribute('aria-expanded', 'false');
});
