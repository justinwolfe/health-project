# Architecture

## Ownership and data flow

`main.tsx` installs the urql provider; `App.tsx` renders the shell and passes its
title to `Board`, which groups it with the form so the form matches its width.
`Board` owns the reducer, retained character records, card creation, and arrival
ids. `useBoardDrag` owns drag state, sensors, event handlers, and announcements.
`useBoardCompletion` owns completion replay keys and cleanup timers.

## Board folder

```text
board/
  Board.tsx                  State ownership and screen composition
  BoardColumn.tsx            Column layout and sortable context
  NewCardForm.tsx            Card creation form
  cards/                     CardView and SortableCard
  drag/                      useBoardDrag and drop-target helpers
  effects/                   Portal/Meeseeks components and useBoardCompletion
  state/                     Types, reducer, and moveCard
```

CSS Modules stay beside their components, and pure-function tests stay beside
their implementations. Imports point directly to files so following a dependency
requires one jump. Hooks live with the responsibility they serve.

The hook boundary is the drag lifecycle: `Board` supplies its state, dispatch,
and completion callback, then connects the returned handlers to `DndContext`.
The hook never owns the reducer or completion timers. Card creation and the small
arrival bookkeeping remain in `Board` because extracting them would split a
short, readable flow across more files.

## Board state

`BoardState` separates card records from ordering:

- `cards` maps ids to title, details (empty when omitted), and character id.
- `columnOrder` holds an ordered list of card ids for each column.

`boardReducer` handles creation and movement. `moveCard` performs both sorting
and cross-column moves, clamps the destination index, and preserves object
identity for a no-op. These modules do not depend on React, GraphQL, or dnd-kit.

The picker returns a `LoadedCharacter` with a confirmed id and masked fragment
data. `Board` retains it in `charactersById`, so changing the search cannot make
an existing card lose its character. The form remounts the picker after creating
a card to reset both its text and selection.

## Drag handling

`useBoardDrag` translates dnd-kit events using `resolveDropColumn` and
`insertionIndex`.
`BoardColumn` registers each column as a droppable and a sortable context;
`SortableCard` handles individual cards. `CardView` is shared by the card and
`DragOverlay`.

Cross-column previews update the reducer during `onDragOver`. Done is the
exception: its placeholder is withheld to keep the portal visible, and the move
is committed on drop. Within-column sorting is previewed by dnd-kit and committed
on drop. The starting column and index are retained so cancellation or a drop
without a valid target restores the original position.

The target column is resolved from the hovered card or column id, rather than a
column's `isOver`: after a preview move, the pointer can be over a child card.
Droppables use `MeasuringStrategy.Always` because column heights change during
a drag. The keyboard sensor needs those updated rectangles.

## GraphQL files

`graphql/` groups the API integration in one place:

- `client.ts` configures urql and the API endpoint.
- `queries/` holds handwritten query documents that compose component fragments.
- `generated/` holds Code Generator output: typed documents, schema types, and
  fragment-masking helpers. It is committed and excluded from document scanning,
  linting, and formatting. Change its inputs or `codegen.ts`, then regenerate it.

Component fragments remain beside their consumers in `features/characters/`.
They describe each component's data needs; the shared query combines those needs
into one request. Imports explicitly name `generated` so generated helpers and
handwritten query definitions are easy to distinguish.

## Character search and accessibility

Character UI has two small groups: `characters/picker/` contains the combobox,
its fragment and styles, and `useCharacterSearch`; `characters/chip/` contains the
compact label and its fragment and styles. Shared `types.ts`,
`describeCharacter.ts`, and its tests stay at the feature root because both UI
components use them. Keyboard navigation and focus handling stay in the picker
component, where their relationship to the rendered options is visible.

`useCharacterSearch` debounces a trimmed query by 250 ms, searches on the server,
and accumulates pages. It keys applied results using the response's
`operation.variables`; urql may still expose the previous response while the
next request is in flight. Page one replaces the list; later pages append.

The picker keeps DOM focus in the input and uses `aria-activedescendant` to
identify an existing highlighted option. Typing clears that highlight so screen
readers continue announcing edits. `aria-selected` follows the highlight for
Chrome/VoiceOver support. “Load more” is also an option, reachable with the same
keys. Pointer selection prevents input blur; focus leaving the field closes it.

Components declare fragments in adjacent `*.graphql.ts` files. This keeps
component-only exports compatible with Fast Refresh. Read masked data through
`getFragmentData`, which is a plain function despite codegen's original
`useFragment` name. Regenerate committed `src/graphql/generated/` files after changing queries
or fragments; never edit generated files manually.

Duplicate character names represent distinct API records. `describeCharacters`
uses species, subtype, and origin to distinguish them, appending ids only when
loaded rows still clash. Never deduplicate characters by name.

## Visual effects

`PortalVortex` supplies the shared SVG art. `CardArrival` wraps a new card until
its 1850 ms cleanup timer finishes. Sorting is disabled during that arrival.
Done's portal opens throughout a drag from an unfinished column, charges when
Done is targeted, and discharges after a successful drop.

`useBoardCompletion` tracks one completion at a time with separate timers:

| Timer      | Duration | Responsibility                                     |
| ---------- | -------- | -------------------------------------------------- |
| Discharge  | 1000 ms  | Remove Done's portal                               |
| Completion | 1900 ms  | Clear the card celebration after Meeseeks finishes |

A counter supplies new React keys so repeated completions replay CSS animations.
Timers are cleared before replay and on unmount. Keep the completion duration
aligned with `MeeseeksPoof.module.css` when changing its timing.

Creation and completion handlers check reduced-motion preferences before
starting effects; the drag portal checks before mounting. Global CSS also
reduces animation and transition durations. Effects are decorative and hidden
from assistive technology; headings, counts, and drag announcements convey the
board state.

## Styling and build

Shared colors, spacing, radii, and shadows live in `styles/tokens.css`, including
dark-mode values. Component styles use CSS Modules. Illustration geometry and
animation-specific values stay with their effects.

The compiler is configured in `vite.config.ts` through `@rolldown/plugin-babel`
and `reactCompilerPreset()`. TypeScript is constrained to the 6.0 range in
`package.json`; check lint-tool compatibility before upgrading it. Use
`package-lock.json` and `npm ci` for reproducible installs.
