import type { Meta, StoryObj } from "@storybook/react";
import React, { useEffect } from "react";
import { within, waitFor, expect } from "@storybook/test";
import { WorkflowProgressBar } from "../src/workflows";
import { ApiProvider, createMockClients } from "../src/lib";
import {
  __setHandlerStoreState,
  useHandlerStore,
} from "../src/workflows/hooks/use-handler-store";
import { resetWorkflowMocks } from "../.storybook/mocks/workflow-handlers";

const meta: Meta<typeof WorkflowProgressBar> = {
  title: "Components/WorkflowProgressBar",
  component: WorkflowProgressBar,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => {
      return (
        <ApiProvider clients={createMockClients()}>
          <Resetter />
          <div style={{ padding: "16px", width: "100%" }}>
            <Story />
          </div>
        </ApiProvider>
      );
    },
  ],
  tags: ["autodocs"],
};
/**
 * Resets global/mock state between stories
 */
const Resetter = () => {
  resetWorkflowMocks();
  const clear = useHandlerStore((x) => x.clearCompleted);
  useEffect(() => {
    clear();
  }, [clear]);
  return null;
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    workflowName: "test-workflow",
  },
};

export const WithActiveHandlers: Story = {
  args: {
    workflowName: "storybook-workflow",
    mode: "always",
  },
  play: async ({ canvasElement, args }) => {
    __setHandlerStoreState(() => ({
      handlers: {
        "storybook-running": {
          handler_id: "storybook-running",
          status: "running",
          workflowName: args.workflowName,
        },
        "storybook-complete": {
          handler_id: "storybook-complete",
          status: "complete",
          workflowName: args.workflowName,
        },
      },
    }));

    const canvas = within(canvasElement);

    await waitFor(() => {
      expect(canvas.getByText("1/2")).toBeInTheDocument();
    });

    await waitFor(() => {
      expect(
        canvas.getByText("Uploaded files are processing")
      ).toBeInTheDocument();
    });
  },
};
