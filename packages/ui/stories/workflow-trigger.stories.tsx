import type { Meta, StoryObj } from '@storybook/react';
import { WorkflowTrigger } from '../src/workflow-task';

function WorkflowTriggerDemo() {
  return (
    <div className="max-w-lg mx-auto p-6">
      <WorkflowTrigger
        deployment="demo-deployment"
        onSuccess={(result) => console.log('Task created:', result)}
      />
    </div>
  );
}

const meta: Meta<typeof WorkflowTriggerDemo> = {
  title: 'Components/Workflow Trigger',
  component: WorkflowTriggerDemo,
  parameters: {
    layout: 'centered',
  },
};

export default meta;
type Story = StoryObj<typeof WorkflowTriggerDemo>;

export const Default: Story = {}; 