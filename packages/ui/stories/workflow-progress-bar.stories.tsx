import type { Meta, StoryObj } from '@storybook/react';
import React from 'react';
import { WorkflowProgressBar } from '../src/workflow-task';

const meta: Meta<typeof WorkflowProgressBar> = {
  title: 'Components/WorkflowProgressBar',
  component: WorkflowProgressBar,
  parameters: {
    layout: 'fullscreen',
  },
  decorators: [
    (Story) => (
      <div style={{ padding: '16px', width: '100%' }}>
        <Story />
      </div>
    ),
  ],
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {},
};