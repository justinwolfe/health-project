# Contributor guidance

This is a frontend Kanban take-home project. The author should be able to explain
every line in a live review. Prefer readable code, small changes, and comments
that explain a non-obvious reason. Avoid speculative abstractions, unnecessary
dependencies, dead code, and unsafe type escapes.

## Start here

- [README](README.md): setup, commands
- [Architecture](docs/architecture.md): ownership, drag rules, search, and effects.
- [Testing](docs/testing.md): required checks and browser-test conventions.

Keep these documents aligned with the implementation. Put architectural detail
in the architecture guide instead of duplicating it here.

## Conventions

- Group board code by responsibility (`state`, `drag`, `cards`, `effects`). Keep
  styles and tests beside their owners, and use direct file imports. Extract
  hooks for cohesive lifecycles; keep short orchestration in `Board`.
- Keep board transitions pure and tested. Board types stay independent of
  GraphQL and dnd-kit; translate UI events at the component boundary.
- Keep GraphQL fragments beside their components in `*.graphql.ts`. Use
  `getFragmentData` to unmask them. After query or fragment changes, run
  `npm run codegen`; never hand-edit `src/graphql/generated/`.
- Preserve keyboard dragging, focus outlines, drag announcements, and the
  picker's virtual-focus behavior. “Load more” remains a keyboard-reachable
  option. Editing search text clears the highlight and any chosen character.
- Keep character records by id. Same-named characters are distinct records.
- Use design tokens for shared UI values and CSS Modules for component styles.
  Illustration geometry and effect-specific timing may use local values.
- Skip decorative effects under reduced motion. If animation durations change,
  keep their cleanup timers aligned and verify replay and removal.

## Before finishing

Run `npm run verify`. For rendered behavior or drag-and-drop changes, also run
`npm run test:e2e`. Run `npm run build` when changing build configuration or
module structure. Report what changed, the checks run, and any remaining limits.
