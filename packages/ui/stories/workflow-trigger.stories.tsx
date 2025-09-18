import type { Meta, StoryObj } from "@storybook/react";
import { WorkflowTrigger } from "../src/workflows";
import { ApiProvider, createMockClients } from "../src/lib";

function WorkflowTriggerDemo() {
  return (
    <ApiProvider clients={createMockClients()}>
      <div className="max-w-lg mx-auto p-6">
        <WorkflowTrigger
          workflowName="demo-workflow"
          onSuccess={(result) => console.log("Task created:", result)}
        />
      </div>
    </ApiProvider>
  );
}

const meta: Meta<typeof WorkflowTriggerDemo> = {
  title: "Components/Workflow Trigger",
  component: WorkflowTriggerDemo,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof WorkflowTriggerDemo>;

export const Default: Story = {};
