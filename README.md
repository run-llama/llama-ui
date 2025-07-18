# @llamaindex/ui

[![codecov](https://codecov.io/gh/run-llama/llama-ui/branch/main/graph/badge.svg)](https://codecov.io/gh/run-llama/llama-ui)

A React component library for LlamaIndex applications, built with TypeScript and Tailwind CSS.

## Packages

This monorepo contains:

- `@llamaindex/ui` - Main UI component library (published to npm)
- `@llamaindex/example-nextjs` - Next.js example application
- `@llamaindex/example-vite` - Vite example application
- `@llamaindex/testing` - Testing utilities and setup

## Development

### Prerequisites

- Node.js 22+
- pnpm 10+

### Setup

```bash
# Install dependencies
pnpm install

# Start UI development with Storybook
pnpm storybook

# Run examples
pnpm dev:ui
```

### Scripts

```bash
# Development
pnpm dev:ui          # Start UI package in development mode
pnpm storybook       # Start Storybook for component development

# Building
pnpm build:ui        # Build UI package
pnpm build:all       # Build all packages

# Testing & Linting
pnpm test           # Run tests
pnpm lint           # Run linting
```

## Release Process

This project uses [Changesets](https://github.com/changesets/changesets) for version management and publishing.

### Creating a release

1. **Make your changes** to the `@llamaindex/ui` package

2. **Create a changeset** describing your changes:
   ```bash
   pnpm changeset
   ```
   - Select `@llamaindex/ui` when asked which packages changed
   - Choose the appropriate semver bump (patch/minor/major)
   - Write a clear description of the changes

3. **Commit and push** your changes including the changeset file

4. **Create a Pull Request** - CI will automatically check for changesets

5. **Merge the PR** - A "Version Packages" PR will be automatically created

6. **Merge the "Version Packages" PR** - The package will be automatically published to npm

### Manual release (if needed)

```bash
# Update versions and generate changelogs
pnpm version-packages

# Build and publish
pnpm release
```

## Package Structure

The main UI package (`@llamaindex/ui`) exports components organized by functionality:

- `file-uploader` - File upload components and utilities
- `extracted-data` - Data display and editing components  
- `file-preview` - PDF and image preview components
- `item-grid` - Data grid and table components
- `processing-steps` - Step-by-step process indicators

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests if applicable
5. Create a changeset with `pnpm changeset`
6. Push your changes and create a Pull Request

## License

[License information to be added]
