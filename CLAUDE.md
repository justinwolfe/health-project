# CLAUDE.md

Guidance for AI agents working in this repo. Read this before making changes.

## What this is

A frontend-only Kanban board (To Do / Doing / Done) built as a take-home
project. Cards are created via a form, each card must have a Rick and Morty
character assigned, cards drag between columns and reorder within a column, and
moving a card to Done triggers a celebration.

## The one rule that shapes everything

**The author must be able to explain every line in a live review.** The brief
says so explicitly. This has consequences for how you work here:

- Prefer boring, readable code over clever code. No abstraction that exists only
  to be abstract.
- Do not add a dependency to save five lines. Every dependency is a question the
  author has to answer.
- When a non-obvious choice is made, leave a short comment saying _why_ — not
  what the code does, which is already visible.
- Do not leave generated or copy-pasted code the author has not seen. If you
  generate something structural, say so in your summary.
- No dead code, no commented-out alternatives, no `any` smuggled in to make a
  type error go away.

## Stack, and why each piece is here

| Choice                                            | Why                                                                                                     |
| ------------------------------------------------- | ------------------------------------------------------------------------------------------------------- |
| React 19 + **React Compiler**                     | Auto-memoization; no manual `useMemo`/`useCallback` noise in drag handlers. Runs via Babel — see below. |
| TypeScript, `strict` + `noUncheckedIndexedAccess` | The board stores ordered id arrays; index access should be checked.                                     |
| Vite 8                                            | Bundler and dev server.                                                                                 |
| **urql** + graphql-codegen `client` preset        | Typed documents with fragment masking.                                                                  |
| **dnd-kit** (`@dnd-kit/core` + `/sortable`)       | Drag and drop with real keyboard support.                                                               |
| **CSS Modules**                                   | Scoped styles, zero runtime, no build magic to explain.                                                 |
| **Vitest**                                        | Pure logic only (`src/**/*.test.ts`), node environment.                                                 |
| **Playwright**                                    | Everything involving the DOM, and all drag-and-drop.                                                    |
| ESLint (flat config, type-aware) + Prettier       | Prettier owns formatting; ESLint owns correctness.                                                      |

### Deliberately _not_ here

- **No state management library.** Board state is one `useReducer` in a single
  owner component. Reach for more only if the shape of the app demands it.
- **No persistence.** The brief flags persistence as a candidate for the live
  pairing session; leaving it out keeps that exercise available.
- **No routing.** Single screen.
- **No component library.** Styling is hand-rolled; the brief asks for
  considered styling, not a design system.

### Two version pins worth knowing

1. **TypeScript is pinned to `^6.0.3`, not 7.x.** TS 7 (the native compiler) is
   published as `latest`, but `typescript-eslint@8` declares
   `typescript >=4.8.4 <6.1.0`. Using TS 7 would break type-aware linting.
   Revisit when typescript-eslint ships TS 7 support.
2. **React Compiler runs through Babel, not oxc.** `@vitejs/plugin-react` v6
   offers a one-line `compiler: true` option backed by `oxc-transform-react`,
   but it is marked experimental _and_ currently has a peer-range conflict
   (plugin wants `^0.145`, published is `0.150`). So `vite.config.ts` adds
   `@rolldown/plugin-babel` running only `reactCompilerPreset()`. If the oxc
   path stabilizes, switching is a three-line change and drops four devDeps.

## Commands

```bash
npm run dev            # dev server on http://localhost:5173 (strictPort)
npm run build          # tsc -b && vite build
npm run typecheck      # tsc --noEmit
npm run lint           # eslint .   (lint:fix to autofix)
npm run format         # prettier --write .   (format:check in CI)
npm test               # vitest run  — pure logic only
npm run test:e2e       # playwright test  — starts the dev server itself
npm run codegen        # regenerate src/gql/ from the live schema
npm run verify         # format:check + lint + typecheck + test
```

Run `npm run verify` before declaring work done. For anything touching drag and
drop, also run `npm run test:e2e` — unit tests cannot catch it.

## Layout

```
src/
  main.tsx                     # root render + urql Provider
  App.tsx                      # app shell
  gql/                         # GENERATED by codegen — never hand-edit
  graphql/
    client.ts                  # urql client
    characters.ts              # the Characters query
  features/
    board/
      types.ts                 # ColumnId, Card, BoardState
      moveCard.ts              # the one pure state transition behind all drags
      moveCard.test.ts
    characters/
      CharacterChip.tsx
      CharacterChip.graphql.ts # its fragment (see note below)
      CharacterChip.module.css
  styles/
    tokens.css                 # all design values live here
    global.css
e2e/                           # Playwright specs
```

## Conventions

**GraphQL.** Components declare the fields they need as a fragment; queries
spread those fragments. Fragment masking is **on**, so a component can only read
fields it declared — unmask with `getFragmentData(Fragment, prop)` (renamed from
codegen's default `useFragment` because it is not a React hook).

A fragment lives in a `*.graphql.ts` file **beside** its component, not inside
it. Reason: `eslint-plugin-react-refresh` requires that a module exporting a
component export nothing else, or Fast Refresh silently stops working.

After editing any query or fragment, run `npm run codegen`. `src/gql/` is
committed so a fresh clone builds without network access.

**State.** `moveCard()` in `features/board/moveCard.ts` is the single transition
for both reordering within a column and moving across columns — they are the same
operation with a different target column. It is pure, returns new state, and
returns the _same object_ when nothing changed so React can skip a render. Keep
new board logic pure and tested there rather than inside dnd event handlers.

**Styling.** Use tokens from `styles/tokens.css`; do not write raw colors or
pixel spacing in a component's CSS module. Respect
`prefers-reduced-motion` — global.css already neutralizes animation, and the
Done celebration must honor it too.

**Accessibility.** The board is keyboard-operable via dnd-kit's keyboard sensor.
Do not remove focus outlines. Announce drag results for screen readers rather
than relying on visual position alone.

## Testing split

- **Vitest** — pure functions only, `node` environment, no DOM. There is no
  jsdom here on purpose.
- **Playwright** — anything rendered, and all drag-and-drop. jsdom has no layout
  engine and cannot produce the pointer events dnd-kit's sensors need, so
  drag-and-drop is untestable there. Drive drags with real mouse steps
  (`mouse.down` → several `mouse.move` calls → `mouse.up`); a single move is
  often ignored by the sensor's activation constraint.

The e2e smoke test hits the **real** Rick and Morty API. If a test needs
determinism, stub with `page.route()` rather than adding a mocking layer.
