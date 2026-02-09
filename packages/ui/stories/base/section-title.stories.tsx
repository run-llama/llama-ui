import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Plus, RefreshCcw } from "lucide-react";

import { SectionTitle } from "../../base/section-title";

const meta = {
  title: "Base/SectionTitle",
  component: SectionTitle,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
} satisfies Meta<typeof SectionTitle>;

// eslint-disable-next-line no-restricted-syntax
export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Section Title",
    subtitle: "This is a subtitle providing context for the section.",
  },
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
};

export const Simple: Story = {
  args: {
    title: "Configuration",
  },
};
