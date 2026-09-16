# Rick And Morty's Kanban Board

A board with **To Do**, **Doing**, and **Done** columns. Create a
card, assign a Rick and Morty character, then drag it between columns or reorder
it with a mouse or keyboard.

New cards arrive through an animated portal. Finishing a card triggers a portal
burst and a brief additional celebration. Reduced-motion preferences skip
these effects. Cards live in memory and reset when the page reloads.

## Get started

Requires Node.js 22+; `.nvmrc` is included.

```bash
npm i
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

## Design and maintenance
- [Architecture](docs/architecture.md): state flow, drag behavior, search, and effects.
- [Testing](docs/testing.md): coverage, fixtures, and checks to run for each change.
- [Contributor guidance](CLAUDE.md): conventions for maintaining the project.
