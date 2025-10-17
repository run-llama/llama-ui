import type { Preview } from "@storybook/react-vite";
import { initialize, mswLoader } from "msw-storybook-addon";
import "../src/styles.css";
import { handlers } from "./mocks/handlers";

// Initialize MSW
initialize();

const preview: Preview = {
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
};

export default preview;
