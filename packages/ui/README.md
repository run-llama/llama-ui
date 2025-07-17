# @llamaindex/ui

A comprehensive UI component library built with React, TypeScript, and Tailwind CSS.

## Features

- 🎨 **Modern Design System** - Built with Tailwind CSS for consistent styling
- 🧩 **Modular Components** - Tree-shakable exports for optimal bundle size
- 📱 **Responsive Design** - Mobile-first responsive components
- 🌙 **Dark Mode Support** - Built-in dark mode variants
- 📊 **Rich Components** - File upload, data tables, PDF preview, and more
- ⚡ **Performance Optimized** - Minimal bundle impact with external dependencies
- 🔧 **TypeScript First** - Full TypeScript support with comprehensive types

## Installation

```bash
npm install @llamaindex/ui
# or
yarn add @llamaindex/ui
# or
pnpm add @llamaindex/ui
```

## Setup

### Prerequisites

This library requires **Tailwind CSS** to be installed and configured in your application.

### 1. Install Tailwind CSS v4 (if not already installed)

```bash
npm install tailwindcss@next @tailwindcss/postcss@next
# or for Vite
npm install tailwindcss@next @tailwindcss/vite@next
```

### 2. Configure Tailwind CSS v4

For **PostCSS** setup:

```js
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

For **Vite** setup:

```js
// vite.config.ts
import { defineConfig } from 'vite';
import tailwindcss from '@tailwindcss/vite';

export default defineConfig({
  plugins: [
    tailwindcss()
  ],
});
```

### 3. Import Styles

Import the UI library styles in your main CSS file:

```css
/* In your globals.css, app.css, or index.css */
@import "@llamaindex/ui/styles.css";
@import "tailwindcss";
```

**Important:** Import the UI library styles **before** the Tailwind import to ensure proper CSS cascading.

### 4. Configure Source Detection (Optional)

Tailwind v4 automatically detects source files, but you can add explicit sources if needed:

```css
/* In your main CSS file */
@import "@llamaindex/ui/styles.css";
@import "tailwindcss";

/* Explicitly include UI library components */
@source "../node_modules/@llamaindex/ui/src";
```

### 5. Usage

```tsx
import { Button, Card, FileUploader } from '@llamaindex/ui';

function App() {
  return (
    <div className="p-8">
      <Card>
        <h1 className="text-2xl font-bold mb-4">Welcome</h1>
        <Button variant="primary">
          Get Started
        </Button>
        
        <FileUploader
          onUpload={(files) => console.log('Files uploaded:', files)}
          accept=".pdf,.doc,.docx"
          maxFiles={5}
        />
      </Card>
    </div>
  );
}
```

## Framework-Specific Setup

### Next.js

```js
// next.config.js
/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@llamaindex/ui'],
}

module.exports = nextConfig
```

```js
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

```css
/* app/globals.css or styles/globals.css */
@import "@llamaindex/ui/styles.css";
@import "tailwindcss";
```

### Vite + React

```js
// vite.config.ts
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  plugins: [
    react(),
    tailwindcss()
  ],
  optimizeDeps: {
    include: ['@llamaindex/ui']
  }
})
```

```css
/* src/index.css */
@import "@llamaindex/ui/styles.css";
@import "tailwindcss";
```

### Other Frameworks

For frameworks using PostCSS:

```js
// postcss.config.mjs
export default {
  plugins: {
    '@tailwindcss/postcss': {},
  },
};
```

```css
/* Main CSS file */
@import "@llamaindex/ui/styles.css";
@import "tailwindcss";
```

## Available Components

### Core Components
- `Button` - Versatile button component with multiple variants
- `Card` - Container component with built-in styling
- `Badge` - Status and category indicators
- `Dialog` - Modal dialogs and overlays

### Data Components
- `Table` - Data table with sorting and filtering
- `ItemGrid` - Grid layout for data items
- `Pagination` - Page navigation controls

### File Components
- `FileUploader` - Drag-and-drop file upload
- `FilePreview` - PDF and image preview
- `UploadProgress` - Upload progress indicators

### Form Components
- `Input` - Text input with validation
- `Textarea` - Multi-line text input
- `Select` - Dropdown selection
- `ColumnFilter` - Advanced filtering controls

## Component-Specific Imports

For better tree-shaking, you can import components from their specific modules:

```tsx
// Individual imports for optimal bundle size
import { FileUploader } from '@llamaindex/ui/file-uploader';
import { ExtractedDataDisplay } from '@llamaindex/ui/extracted-data';
import { PDFPreview } from '@llamaindex/ui/file-preview';
import { ItemGrid } from '@llamaindex/ui/item-grid';
import { ProcessingSteps } from '@llamaindex/ui/processing-steps';
```

## Styling and Customization

### Theme Customization

The UI library uses CSS custom properties that you can override:

```css
:root {
  --radius: 0.5rem;
  --background: oklch(1 0 0);
  --foreground: oklch(0.141 0.005 285.823);
  --primary: oklch(0.21 0.006 285.885);
  --primary-foreground: oklch(0.985 0 0);
  /* ... more variables */
}
```

### Dark Mode

The library includes built-in dark mode support. Apply the `dark` class to your root element:

```tsx
<html className="dark">
  <body>
    {/* Your app */}
  </body>
</html>
```

## Troubleshooting

### Styles Not Applied

1. **Check Source Detection**: Tailwind v4 automatically detects sources, but you can add explicit `@source` directives if needed
2. **Import Order**: Import UI library styles before `@import "tailwindcss"`
3. **Build Process**: Make sure your build process includes Tailwind v4 plugins (`@tailwindcss/postcss` or `@tailwindcss/vite`)

### Component Not Found

1. **Check Import Path**: Use correct import paths as shown in examples
2. **Transpilation**: For Next.js, add `@llamaindex/ui` to `transpilePackages`
3. **Bundle Configuration**: For Vite, add to `optimizeDeps.include`

### TypeScript Errors

1. **Types**: The library includes TypeScript definitions
2. **Version Compatibility**: Ensure compatible React and TypeScript versions
3. **Module Resolution**: Check your `tsconfig.json` module resolution settings

## Requirements

- React 18+
- TypeScript 4.5+ (optional but recommended)
- Tailwind CSS 4.0+ (beta)
- Node.js 18+

## Browser Support

- Chrome 88+
- Firefox 78+
- Safari 14+
- Edge 88+

## Contributing

See our [Contributing Guide](CONTRIBUTING.md) for development setup and guidelines.

## License

MIT © [Your Organization]
