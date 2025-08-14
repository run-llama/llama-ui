import type { Meta, StoryObj } from "@storybook/react";
import React from "react";
import { WorkflowProgressBar } from "../src/workflow-task";
import { ApiProvider, createMockClients } from "../src/lib";

const meta: Meta<typeof WorkflowProgressBar> = {
  title: "Components/WorkflowProgressBar",
  component: WorkflowProgressBar,
  parameters: {
    layout: "fullscreen",
  },
  decorators: [
    (Story) => (
      <ApiProvider clients={createMockClients()} deployment="mock-deployment">
        <div style={{ padding: "16px", width: "100%" }}>
          <Story />
        </div>
      </ApiProvider>
    ),
  ],
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};
