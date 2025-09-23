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
