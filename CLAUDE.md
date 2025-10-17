# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is `@llamaindex/ui`, a React component library built with TypeScript, Vite, and Tailwind CSS. It provides UI components for LlamaIndex applications, including file handling, data extraction, and document processing functionality. The library is designed as a shadcn/ui addon with support for both traditional npm installation and individual component installation.

## Development Commands

### Core Development
- `pnpm dev` - Start development server
- `pnpm build` - Build for production (runs TypeScript compiler then Vite build)
- `pnpm preview` - Preview production build

### Testing
- `pnpm test` - Run all tests with Vitest
- `pnpm test:watch` - Run tests in watch mode
- `pnpm test:unit` - Run unit tests only
- `pnpm test:unit:watch` - Run unit tests in watch mode
- `pnpm test:storybook` - Run Storybook tests
- `pnpm test:coverage` - Run tests with coverage report

### Code Quality
- `pnpm lint` - Run ESLint
- `pnpm lint:fix` - Run ESLint with auto-fix
- `pnpm format-check` - Check code formatting with Prettier
- `pnpm format` - Format code with Prettier

### Storybook
- `pnpm storybook` - Start Storybook development server on port 6006
- `pnpm build-storybook` - Build Storybook for production

### Examples
- `pnpm dev:nextjs` - Start Next.js example development server
- `pnpm dev:vite` - Start Vite example development server
- `pnpm build:examples` - Build both example projects

## Architecture

### Project Structure
- `src/ui/` - Main UI components (buttons, cards, dialogs, etc.)
- `src/lib/` - Utility functions and JSON schema handling
- `src/ui/extracted-data/` - Data extraction and display components
- `src/ui/file-preview/` - File preview components (PDF, images)
- `src/ui/file-upload/` - File upload functionality
- `src/ui/item-grid/` - Data grid components
- `src/ui/processing-steps/` - Processing workflow components
- `stories/` - Storybook stories
- `registry/` - shadcn/ui compatible component registry
- `examples/` - Example implementations (Next.js, Vite)

### Key Technologies
- **React 18** with TypeScript
- **Vite** for build tooling
- **Tailwind CSS v4** for styling
- **Radix UI** for accessible components
- **Vitest** for testing (unit and Storybook tests)
- **Storybook** for component development
- **shadcn/ui** component system integration

### Testing Setup
- **Unit tests**: Located in `src/**/*.test.{ts,tsx}`, run with jsdom environment
- **Storybook tests**: Integration tests using Playwright browser testing
- **MSW**: Mock Service Worker for API mocking in tests and Storybook

### Build Configuration
- Library build target with external React/ReactDOM
- Path alias `@/` points to `src/`
- Exports multiple entry points: main (`./src/`), ui (`./src/ui/`), lib (`./src/lib/`)

### Key Dependencies
- `@llamaindex/core`, `@llamaindex/cloud` - LlamaIndex integrations
- `@llamaindex/chat-ui` - Chat interface components
- `react-pdf` - PDF handling
- `zod` - Schema validation
- `framer-motion` - Animations
- `sonner` - Toast notifications

## Component Development

Components follow the shadcn/ui pattern with:
- Radix UI primitives as base
- Tailwind CSS for styling
- Class variance authority for component variants
- TypeScript for type safety

When adding new components, follow existing patterns in `src/ui/` and add corresponding Storybook stories.

## Usage

### Traditional NPM Installation
```bash
npm install @llamaindex/ui
```

```typescript
import { FileUploader, ExtractedDataDisplay } from '@llamaindex/ui'
```

### shadcn/ui Individual Component Installation
```bash
# Install individual components
npx shadcn@latest add github:llamaindex/ui/file-upload
npx shadcn@latest add github:llamaindex/ui/extracted-data
npx shadcn@latest add github:llamaindex/ui/pdf-viewer
```

### Running Examples
- Navigate to `examples/nextjs/` or `examples/vite/` to see working implementations
- Use `pnpm dev:nextjs` or `pnpm dev:vite` to start example projects

## Registry Structure

The `registry/` directory contains shadcn/ui compatible component definitions:
- `registry/index.json` - Main registry manifest
- `registry/components/` - Individual component definitions
- Each component includes dependencies, files, and installation instructions
