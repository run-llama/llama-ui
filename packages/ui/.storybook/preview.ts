import type { Decorator, Preview } from "@storybook/react-vite";
import { initialize, mswLoader } from "msw-storybook-addon";
import React, { useEffect } from "react";
import "../src/styles.css";
import { Toaster } from "sonner";
import { handlers } from "./mocks/handlers";

// Initialize MSW
initialize();

// Applies the `.dark` class to the document root so every story can be
// visually QA'd against the library's dark palette. Toggle via the "Theme"
// item in the Storybook toolbar.
const withTheme: Decorator = (Story, context) => {
  const theme = context.globals.theme ?? "light";
  useEffect(() => {
    const root = document.documentElement;
    root.classList.toggle("dark", theme === "dark");
    // Keep the story canvas background in sync with the active theme so
    // there is no white gutter around dark stories.
    document.body.style.backgroundColor = "var(--background)";
    document.body.style.color = "var(--foreground)";
  }, [theme]);

  return React.createElement(
    React.Fragment,
    null,
    React.createElement(Story),
    React.createElement(Toaster)
  );
};

const preview: Preview = {
  globalTypes: {
    theme: {
      description: "Global theme for components",
      defaultValue: "light",
      toolbar: {
        title: "Theme",
        icon: "circlehollow",
        items: [
          { value: "light", title: "Light", icon: "sun" },
          { value: "dark", title: "Dark", icon: "moon" },
        ],
        dynamicTitle: true,
      },
    },
  },
  parameters: {
    controls: {
      matchers: {
        color: /(background|color)$/i,
        date: /Date$/i,
      },
    },

    a11y: {
      // 'todo' - show a11y violations in the test UI only
      // 'error' - fail CI on a11y violations
      // 'off' - skip a11y checks entirely
      test: "todo",
    },
    msw: {
      handlers: [
        handlers.upload,
        ...handlers.fileContent,
        ...handlers.agentData,
      ],
    },
  },
  loaders: [mswLoader],
  decorators: [withTheme],
};

export default preview;
