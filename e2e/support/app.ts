import { expect, type Locator, type Page } from '@playwright/test';

import { queryCharacters } from './characters';

/**
 * Matches the endpoint regardless of how the request is shaped. urql sends
 * queries as a GET with the document in the query string, so an exact-URL match
 * silently never fires and the suite hits the real API instead.
 */
const API = /rickandmortyapi\.com\/graphql/;

type CharacterVariables = { page?: number; filter?: { name?: string } };

/** JSON.parse returns `any`; this keeps the unsafe value from spreading. */
function parseJson<T>(raw: string | null | undefined): T | null {
  if (!raw) return null;
  return JSON.parse(raw) as T;
}

/**
 * Serves the characters query from a fixture. Without this the suite depends on
 * a third-party API being up and on its data never changing, which makes
 * assertions like "the third card is Birdperson" quietly fragile.
 */
export async function stubCharactersApi(page: Page) {
  await page.route(API, async (route) => {
    const request = route.request();

    // urql sends a GET with `variables` as a query-string parameter; the POST
    // branch is here so the stub does not quietly stop matching if that changes.
    const encoded =
      request.method() === 'POST'
        ? (parseJson<{ variables?: CharacterVariables }>(request.postData())?.variables ?? {})
        : (parseJson<CharacterVariables>(new URL(request.url()).searchParams.get('variables')) ??
          {});

    const variables: CharacterVariables = encoded;

    await route.fulfill({
      status: 200,
      contentType: 'application/json',
      body: JSON.stringify(queryCharacters(variables.filter?.name ?? '', variables.page ?? 1)),
    });
  });
}

export async function openBoard(page: Page) {
  await stubCharactersApi(page);
  await page.goto('/');
  await page.getByRole('combobox', { name: 'Character' }).waitFor();
}

export function picker(page: Page): Locator {
  return page.getByRole('combobox', { name: 'Character' });
}

export function pickerOptions(page: Page): Locator {
  return page.getByRole('option');
}

/** Types into the combobox and waits for the results to catch up. */
export async function searchCharacter(page: Page, text: string) {
  await picker(page).fill(text);
  // The search is debounced, so the first render still shows the old results.
  await expect(page.getByRole('listbox')).toHaveAttribute('aria-busy', 'false');
}

export async function chooseCharacter(page: Page, name: string) {
  await searchCharacter(page, name);
  await pickerOptions(page).filter({ hasText: name }).first().click();
}

export async function addCard(page: Page, title: string, character: string) {
  await page.getByLabel('Title').fill(title);
  await chooseCharacter(page, character);
  await page.getByRole('button', { name: 'Add card' }).click();
}

export function column(page: Page, columnId: 'todo' | 'doing' | 'done'): Locator {
  return page.locator(`[data-column="${columnId}"]`);
}

export function cardTitles(page: Page, columnId: 'todo' | 'doing' | 'done') {
  return column(page, columnId).getByTestId('card').locator('p');
}

/**
 * Drags `source` onto `target` with real pointer events.
 *
 * dnd-kit's PointerSensor only starts a drag once the pointer has travelled
 * past its activation distance, and it recomputes collisions on each move — so
 * a single jump from source to target registers as neither a drag nor a drop.
 * Hence the stepped movement, and the settle move at the end before releasing.
 */
export async function dragTo(page: Page, source: Locator, target: Locator) {
  const from = await source.boundingBox();
  const to = await target.boundingBox();
  if (!from || !to) throw new Error('Cannot drag: source or target is not visible');

  const start = { x: from.x + from.width / 2, y: from.y + from.height / 2 };
  const end = { x: to.x + to.width / 2, y: to.y + to.height / 2 };

  await page.mouse.move(start.x, start.y);
  await page.mouse.down();

  const steps = 12;
  for (let step = 1; step <= steps; step += 1) {
    await page.mouse.move(
      start.x + ((end.x - start.x) * step) / steps,
      start.y + ((end.y - start.y) * step) / steps,
    );
  }

  await page.mouse.move(end.x, end.y);
  await page.mouse.up();
}

/** Lets the browser paint before the next key, so dnd-kit can settle a move. */
async function nextFrame(page: Page) {
  await page.evaluate(
    () =>
      new Promise<void>((resolve) => {
        requestAnimationFrame(() => requestAnimationFrame(() => resolve()));
      }),
  );
}

/**
 * Moves a focused card with the keyboard sensor: space picks it up, arrows move
 * it, space drops it.
 *
 * The waits are not padding. dnd-kit measures droppable rects when the drag
 * starts and recomputes them as the item moves, so keys delivered back to back
 * arrive before it has anything to move against and are dropped on the floor.
 */
export async function dragWithKeyboard(page: Page, card: Locator, keys: string[]) {
  await card.focus();
  await page.keyboard.press('Space');

  // dnd-kit sets aria-pressed on the lifted item — a real signal that the drag
  // has begun, rather than a fixed sleep. The frame after it is for the first
  // measuring pass, which is what the arrow keys search.
  await page.locator('[data-testid="card"][aria-pressed="true"]').waitFor();
  await nextFrame(page);

  for (const key of keys) {
    await page.keyboard.press(key);
    await nextFrame(page);
  }

  await page.keyboard.press('Space');
}
