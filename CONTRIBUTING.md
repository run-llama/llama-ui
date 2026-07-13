# Contributing to @llamaindex/ui

Thanks for your interest in contributing! This document explains how to set up your environment, the tools we use, checks to run before submitting changes, naming conventions, and best practices.

## Development Environment

- Node.js 22+
- pnpm 10+

Install dependencies:

```bash
pnpm install
```

### Core tools
- pnpm: workspace and scripts runner
- Vite: local dev and Storybook bundling
- Storybook: UI development and interaction tests
- shadcn/ui: component patterns and registry
- Tailwind CSS v4: styling

### Useful scripts (repo root)

```bash
# UI package development
pnpm dev:ui           # Start @llamaindex/ui dev build (tsup watch + CSS)
pnpm storybook        # Start Storybook at http://localhost:6006
pnpm build:ui         # Build @llamaindex/ui
pnpm build:all        # Build all exported entries

# Quality
pnpm format           # Format code with Prettier
pnpm format-check     # Check formatting only
pnpm lint             # Run ESLint

# Tests
pnpm test             # Run all tests (unit + storybook)
pnpm coverage         # Run tests with coverage
```

## Checks before submitting

Run these locally and ensure they pass:

```bash
pnpm format-check
pnpm lint
pnpm test
```

CI will run these as well.

## Styling & dark mode

Components must render correctly in both light and dark themes. The library
ships a `.dark` palette in `packages/ui/src/styles.css`; every surface flips
automatically **only if you style with semantic tokens instead of raw palette
colors**.

**Never** use raw Tailwind palette utilities (`text-gray-500`, `bg-red-600`,
`border-zinc-200`, `bg-white`, `bg-[#F3F3F3]`, …) in `src/**`. They are frozen
to a light value and become unreadable islands in dark mode. A lint guard
(`scripts/color-token-guard.mjs`, run as part of `pnpm lint`) enforces this.

Use the semantic tokens:

| Raw color                                   | Semantic token            |
| ------------------------------------------- | ------------------------- |
| `text-gray-400/500`, `text-zinc-500`        | `text-muted-foreground`   |
| `text-gray-600..900`, `text-zinc-900`, `text-black` | `text-foreground` |
| `bg-white` (page/base surface)              | `bg-background`           |
| `bg-white` (elevated card/panel)            | `bg-card` / `bg-popover`  |
| `bg-gray-50/100`, `bg-neutral-100`          | `bg-muted`                |
| `border-gray-200/300`                       | `border-border`           |
| `ring-*`, `focus-visible:ring-*`            | `ring-ring` (`ring-ring/20`) |
| `text-red-*`                                | `text-destructive`        |
| `bg-red-600 text-white` (button)            | `bg-destructive text-destructive-foreground` |
| `bg-green-50` / `text-green-*`              | `bg-success-muted` / `text-success` |
| `bg-orange-50` / `border-orange-300`        | `bg-warning-muted` / `border-warning` |
| status dots (`bg-green-500`, `bg-red-500`)  | `bg-success` / `bg-destructive` |
| ad-hoc chart hex                            | `var(--viz-1..6)` / `bg-viz-*` |

**Adding a token:** add the CSS variable to both `:root` and `.dark` in
`src/styles.css`, then register it under `@theme inline` as
`--color-<name>: var(--<name>)` so the `bg-<name>` / `text-<name>` utilities
exist.

**Intentional "paper":** rendered documents (DOCX/HTML/PDF pages, image
canvas) stay white on purpose. Tag those elements with `data-paper` and keep
`bg-white` — the guard does not flag `bg-white` (only `bg-*-<shade>` and
`bg-[#...]`), but the attribute documents the intent.

**Testing dark mode:** run `pnpm storybook` and use the **Theme** toggle in the
toolbar (Light / Dark) to QA every story against the dark palette.

## Naming conventions

- Use clear, descriptive names; avoid abbreviations.
- Functions and hooks: verb or verb-phrase (e.g., `useWorkflowHandler`, `createHandlerStore`).
- Components: PascalCase (e.g., `ItemGrid`, `ExtractedDataDisplay`).
- Variables: meaningful nouns (e.g., `paginationState`, `agentDataClient`).
- Files:
  - Components: `component-name.tsx` inside a feature folder
  - Hooks: `use-feature-name.ts`
  - Tests: mirror path with `.test.ts` or `.test.tsx`

## Best practices

- DRY principle: extract shared utilities when used in multiple places.
- Easy-to-test code: prefer small, composable functions; keep side-effects minimal and localized.
- Unit tests for pure functions: place in `tests/**/*.test.ts`; focus on deterministic inputs/outputs.
- Storybook interaction tests for UI components: add stories under `packages/ui/stories/**`, using `play` functions and Testing Library via `@storybook/test`.
- Type safety: use explicit types for exported APIs; avoid `any`.
- Formatting and linting: keep code formatted; fix lint warnings proactively.

## Submitting changes

1. Create a branch: `git checkout -b feat/your-change`
2. Make your changes with tests/stories
3. Run checks: `pnpm format-check && pnpm lint && pnpm test`
4. Commit using Conventional Commits (e.g., `feat: add X`, `fix: correct Y`, `docs: update Z`)
5. Push and open a PR. Include a concise summary and test plan.

## Questions

Open an issue or start a discussion in the repository.
