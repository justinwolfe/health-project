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
      PortalVortex.tsx         # the portal art, shared by both effects
      CardArrival.tsx          # a new card materialises in To Do
      DonePortal.tsx           # Done's drop target, charges and discharges
      Board.tsx                # owns board state + all dnd-kit wiring
      BoardColumn.tsx          # one column: droppable + SortableContext
      SortableCard.tsx         # dnd wiring for a single card
      CardView.tsx             # card presentation, shared with DragOverlay
      NewCardForm.tsx          # create form (+ .graphql.ts fragment)
      boardReducer.ts          # add + move actions
      moveCard.ts              # the one pure state transition behind all drags
      dropTarget.ts            # turns a dnd-kit `over` id into column + index
      celebrate.ts             # confetti on reaching Done
      types.ts                 # ColumnId, Card, BoardState
      *.test.ts                # pure logic only
    characters/
      describeCharacter.ts     # disambiguates same-named characters
      describeCharacter.test.ts
      CharacterPicker.tsx      # ARIA 1.2 combobox: search, images, paging
      CharacterPicker.graphql.ts
      CharacterPicker.module.css
      useCharacterSearch.ts    # debounced server-side search + paging
      types.ts                 # LoadedCharacter
      CharacterChip.tsx
      CharacterChip.graphql.ts # its fragment (see note below)
      CharacterChip.module.css
  hooks/
    useDebouncedValue.ts
  styles/
    tokens.css                 # all design values live here
    global.css
e2e/
  board.spec.ts                # cards, dragging, celebration
  character-picker.spec.ts     # combobox behaviour and ARIA wiring
  support/
    app.ts                     # API stub, drag helpers, locators
    characters.ts              # 25-character fixture + query emulation
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

**Drag handling.** `Board.tsx` owns the state and the dnd-kit callbacks, and
those callbacks stay thin: they translate dnd-kit's `active`/`over` ids into a
column and an index via `dropTarget.ts`, then dispatch. Cross-column moves are
applied in `onDragOver` so the card visibly enters the new column mid-drag;
same-column reordering is already previewed by `SortableContext`, so it is
settled in `onDragEnd`. Because `onDragOver` may have already moved a card into
Done, the column the drag _started_ in is kept in a ref so the celebration fires
once, on arrival.

**State.** `moveCard()` in `features/board/moveCard.ts` is the single transition
for both reordering within a column and moving across columns — they are the same
operation with a different target column. It is pure, returns new state, and
returns the _same object_ when nothing changed so React can skip a render. Keep
new board logic pure and tested there rather than inside dnd event handlers.

**The character picker.** `CharacterPicker` is a hand-written ARIA 1.2
combobox — deliberately no dependency. Rules that are load-bearing, not
stylistic:

- DOM focus never leaves the `<input role="combobox">`. The highlighted option
  is pointed at with `aria-activedescendant`; the user must be able to keep
  typing while stepping through results.
- `aria-activedescendant` is **cleared whenever the text changes**. NVDA stops
  announcing typed and deleted characters while a virtual focus is set.
- `aria-selected` goes on the **highlighted** option, not only a chosen one.
  Chrome + VoiceOver only announce the active option when it is selected.
- The "load more" row is a real `role="option"`. A non-option element inside the
  popup makes screen readers switch interaction mode partway down the list.
- Options use `onMouseDown={preventDefault}`, or the input blurs and the list
  closes before the click lands.

Search runs on the server via `filter: { name: ... }`, debounced 250ms, so all
826 characters are reachable without loading them up front. `useCharacterSearch`
accumulates pages and keys applied results on the **response's** variables
(`operation.variables`), not the requested ones — urql keeps the previous
response visible while the next is in flight, so trusting the requested page
appends page 1's rows a second time.

The form resets the picker by changing its `key` after a successful submit.
Clearing only the selection would leave the field reading "Rick Sanchez" with
nothing actually selected.

**Same-named characters are real, not a bug.** The API returns several
alternate-dimension versions of one person — 46 names are shared by two or more
of the 826 characters, and Rick, Morty, Summer and Beth Smith have four each.
`species · status` alone collapses the four Ricks into two labels, so
`describeCharacter.ts` builds a fuller description from `type` and
`origin.name`. For the 23 names where even that is not enough (the four SEAL
Team Ricks are identical down to the episode), `describeCharacters` appends the
id — and only on the rows that actually clash, judged across the loaded results
rather than the whole catalogue. Do not "fix" the duplicates by deduplicating;
they are distinct characters.

**Cards own their character.** A card keeps the `LoadedCharacter` it was created
with (in a map on `Board`), rather than looking it up in the current search
results, where it will usually no longer be. The board's own types stay free of
GraphQL types, which is what keeps the reducer tests trivial.

**The portal effects.** One piece of art, `PortalVortex`, in two situations: a
card materialises into To Do through a portal (`CardArrival`), and a portal
opens in the centre of Done while a card is dragged over it, discharging when
one lands (`DonePortal`). There is no confetti and no `canvas-confetti`
dependency — the portal is the board's one visual vocabulary.

Done's portal is transient by design: mounted only while the column is targeted
or discharging, then unmounted. `Board` clears `completion` on a timer
(`COMPLETION_MS`), and that clearing is what takes the portal off screen.

Two rules keep the drop zone clear for it:

- **The portal opens only for a card arriving from another column.** Reordering
  inside Done is an ordinary sort. `Board` tracks `dragOrigin` in state — not a
  ref — precisely because the render needs it to decide this.
- **`handleDragOver` does not move the card into Done mid-drag**, unlike every
  other column. That move leaves a faded placeholder sitting exactly where the
  portal opens. The card still follows the cursor in the `DragOverlay`; only
  the in-column placeholder is withheld, and the move settles on the drop.

Done also has no empty-state placeholder text: the portal is its affordance, and
the heading and count already say the column is empty.

Worth knowing if the portal ever looks like it is painted behind something:
dnd-kit renders the `DragOverlay` in a fixed layer above the page, so it will
sit on top of the portal no matter what z-index the column uses. That is
expected, not a stacking bug.

Things that are easy to get wrong here:

- Both effects are **not created at all** under `prefers-reduced-motion`, rather
  than created and hidden.
- Replaying a CSS animation needs a **new element**, not a re-added class. Both
  effects key on a counter that changes per occurrence, so finishing the same
  card twice replays properly.
- Swirl speeds are CSS custom properties on `PortalVortex`, so the charging
  state can spin it up without redefining the animation.
- Sparks use the `transform` shorthand, not the individual `translate`/`rotate`
  properties. Those always apply in the order translate, rotate, scale, so a
  spark moved sideways and then span on the spot instead of orbiting outwards.

**Column targeting does not use dnd-kit's `isOver`.** `Board` derives
`targetColumn` from its own `resolveDropColumn`, because `onDragOver` moves a
card into a column mid-drag — after which the pointer is over that _card_ and
the column's own droppable stops reporting `isOver`. The Done portal would never
charge, and the column highlight would rarely show.

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

**The e2e suite never touches the network.** `openBoard()` in
`e2e/support/app.ts` intercepts the API with `page.route()` and serves a
25-character fixture, so assertions stay true and the suite does not fail when a
third party is down. The stub reads the request's `variables` and emulates the
real thing — substring name match, 20 per page, null counts on no match — which
is what lets the picker's search and paging be tested at all. Two named
characters sit deliberately beyond page 1.

Two traps that cost real time here, both encoded in that file:

- urql sends queries as a **GET with the document in the query string**, so
  `page.route('https://rickandmortyapi.com/graphql', ...)` — an exact URL —
  silently never matches and the tests quietly hit the real API. Match the
  endpoint with a regex.
- The fixture carries `__typename` on every object, because urql adds
  `__typename` to outgoing documents and its cache reads it back.

Keyboard drags need a frame between keypresses; `dragWithKeyboard()` waits on
dnd-kit's `aria-pressed` and then on animation frames rather than sleeping.

`DndContext` uses `MeasuringStrategy.Always` for droppables. This is not a test
workaround: cards entering and leaving change every column's height mid-drag,
and with dnd-kit's default one-shot measuring the keyboard sensor searches stale
rects and intermittently finds no column to move into.
