import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { MultiInput } from "../../base/multi-input";

const meta: Meta<typeof MultiInput> = {
  title: "Base/MultiInput",
  component: MultiInput,
};

export default meta;
type Story = StoryObj<typeof MultiInput>;

export const Default: Story = {
  render: () => <MultiInput placeholder="Enter something" />,
};

export const Empty: Story = {
  render: () => <MultiInput defaultValue="" />,
};
