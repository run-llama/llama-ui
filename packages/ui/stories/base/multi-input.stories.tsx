import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import { MultiInput } from "../../base/multi-input";
import { ThemeComparison } from "./theme-comparison";

const meta: Meta<typeof MultiInput> = {
  title: "Base/MultiInput",
  component: MultiInput,
};

export default meta;
type Story = StoryObj<typeof MultiInput>;

export const Default: Story = {
  render: () => (
    <ThemeComparison>
      <MultiInput placeholder="Enter something" />
    </ThemeComparison>
  ),
};

export const Empty: Story = {
  render: () => (
    <ThemeComparison>
      <MultiInput defaultValue="" />
    </ThemeComparison>
  ),
};
