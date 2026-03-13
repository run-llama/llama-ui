import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus, RefreshCcw } from "lucide-react";

import { SectionTitle } from "../../base/section-title";
import { ThemeComparison } from "./theme-comparison";

const meta = {
  title: "Base/SectionTitle",
  component: SectionTitle,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SectionTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Section Title",
    subtitle: "This is a subtitle providing context for the section.",
  },
  render: (args) => (
    <ThemeComparison>
      <SectionTitle {...args} />
    </ThemeComparison>
  ),
};

export const WithActions: Story = {
  args: {
    title: "API Keys",
    subtitle: "Manage API keys for accessing the platform programmatically.",
    primaryAction: {
      label: "Create New Key",
      startIcon: <Plus />,
    },
    secondaryAction: {
      label: "Refresh",
      startIcon: <RefreshCcw />,
    },
  },
  render: (args) => (
    <ThemeComparison>
      <SectionTitle {...args} />
    </ThemeComparison>
  ),
};

export const Simple: Story = {
  args: {
    title: "Configuration",
  },
  render: (args) => (
    <ThemeComparison>
      <SectionTitle {...args} />
    </ThemeComparison>
  ),
};
