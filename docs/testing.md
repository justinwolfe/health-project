# Testing

## Required checks

Run `npm run verify` after changes. It runs Prettier, ESLint, TypeScript, and
Vitest in order; a failure stops subsequent steps.

Run `npm run test:e2e` for rendered behavior, accessibility, forms, search,
dragging, or effects. Run `npm run build` for the production build, especially
after changing imports, dependencies, or configuration. `verify` does not include
browser tests or production bundling.

## Unit tests

Vitest runs `src/**/*.test.ts` in a Node environment. Tests cover reducer actions,
card movement, drop-target resolution, and character descriptions. Keep pure
logic tests beside the implementation. There is no jsdom dependency.

## Browser tests

Playwright runs Chromium and starts Vite on port 5173. Locally it can reuse an
existing server; ensure that server belongs to this checkout. In CI it starts a
fresh server and uses one worker. Install the browser with
`npx playwright install chromium` before the first run.

The browser suites cover creation and validation, pointer and keyboard dragging,
sorting, cancellation, animation cleanup, reduced motion, and picker search,
paging, selection, duplicate labels, and ARIA wiring.

`e2e/support/app.ts` provides locators, drag helpers, and an API interceptor.
`e2e/support/characters.ts` supplies 25 characters and emulates name filtering
and 20-result pages. The GraphQL endpoint is stubbed, so tests do not depend on
live catalogue contents or API availability. Fixtures use local data-URL images.

When extending tests:

- Match the GraphQL endpoint including query strings: urql can send GET requests.
- Keep `__typename` fields on fixture objects for urql's cache.
- Put fixtures beyond page one when testing server search or pagination.
- Use real pointer steps for dragging; one move can miss sensor activation.
- Let keyboard drag helpers wait for measurement frames between arrow presses.
- Prefer locator assertions and browser frames to arbitrary sleeps.
- Add regression coverage for behavior fixes; avoid tests that merely repeat
  presentation markup or implementation details.

Browser coverage is limited to Chromium. Screen-reader-specific behavior and
other browser engines still require manual checks or additional projects.
