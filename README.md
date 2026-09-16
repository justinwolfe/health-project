# Kanban Board

A frontend-only board with **To Do**, **Doing**, and **Done** columns. Create a
card, assign a Rick and Morty character, then drag it between columns or reorder
it with a mouse or keyboard.

New cards arrive through an animated portal. Finishing a card triggers a portal
burst and a brief Mr. Meeseeks celebration. Reduced-motion preferences skip
these effects. Cards live in memory and reset when the page reloads.

## Get started

Requires Node.js 22+; `.nvmrc` is included.

```bash
npm ci
npm run dev
```

Open [localhost:5173](http://localhost:5173). Character search uses the public
Rick and Morty GraphQL API and requires internet access. No credentials or
backend setup are needed.

## Commands

| Command               | Purpose                                            |
| --------------------- | -------------------------------------------------- |
| `npm run dev`         | Start the Vite development server                  |
| `npm run build`       | Typecheck and create a production build in `dist/` |
| `npm run preview`     | Serve the production build locally                 |
| `npm run verify`      | Check formatting, lint, types, and unit tests      |
| `npm run test:e2e`    | Run Chromium browser tests; starts the dev server  |
| `npm run test:e2e:ui` | Open Playwright's interactive test runner          |
| `npm run format`      | Apply Prettier formatting                          |
| `npm run codegen`     | Regenerate GraphQL types from the live API schema  |

Before the first browser test run, install Chromium:

```bash
npx playwright install chromium
```

For a full local check:

```bash
npm run verify
npm run build
npm run test:e2e
```

## Using the board

- Enter a title, optional details, and choose a character from the search
  results. A typed name alone does not select a character.
- In the character field, use arrow keys to browse, Enter to select, and Escape
  to close. The final “Load more” option fetches another page.
- Drag a card to move it. With a focused card, press Space or Enter to pick it
  up, use arrow keys to move, and press Space or Enter to drop. Escape restores
  its original position.

## Project map

```text
src/
  App.tsx          Application shell
  features/
    board/         Board, columns, and create form
      cards/       Card presentation and sortable wrapper
      drag/        Drag lifecycle hook and drop-target helpers
      effects/     Portals, Meeseeks, and completion timers
      state/       Types, reducer, movement logic, and tests
    characters/    Shared character types and description helpers
      picker/      Search combobox, fragment, styles, and search hook
      chip/        Compact character label, fragment, and styles
  graphql/
    client.ts      urql client configuration
    queries/       Handwritten query documents
    generated/     Generated documents, types, and fragment helpers (committed)
  hooks/           Shared React hooks
  styles/          Design tokens and global styles
e2e/              Browser tests and deterministic API fixtures
docs/             Architecture and testing notes
```

## Design and maintenance

React 19 and TypeScript provide the UI and types; Vite builds the app. The React
Compiler runs through Babel. urql and GraphQL Code Generator provide typed
queries and fragment masking. dnd-kit provides pointer and keyboard dragging.
CSS Modules scope styles; SVG and CSS implement the effects.

The board uses one reducer with normalized card data. There is no state library,
persistence, routing, or component library. Persistence is intentionally left
available as a follow-up exercise.

- [Architecture](docs/architecture.md): state flow, drag behavior, search, and effects.
- [Testing](docs/testing.md): coverage, fixtures, and checks to run for each change.
- [Contributor guidance](CLAUDE.md): conventions for maintaining the project.
