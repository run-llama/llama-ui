import type { Meta, StoryObj } from "@storybook/react-vite";
import { ArrowLeft, Plus } from "lucide-react";
import * as React from "react";

import { PageTitle } from "../../base/page-title";

const meta = {
  title: "Base/PageTitle",
  component: PageTitle,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    separator: {
      control: "boolean",
    },
  },
} satisfies Meta<typeof PageTitle>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  args: {
    title: "Page Title",
    subtitle: "This is a subtitle providing context for the page.",
  },
  render: (args) => <PageTitle {...args} />,
};

export const WithActions: Story = {
  args: {
    title: "Deployments",
    subtitle: "Manage your application deployments and configurations.",
    primaryAction: {
      label: "New Deployment",
      startIcon: <Plus />,
    },
    secondaryAction: {
      label: "Back",
      startIcon: <ArrowLeft />,
      onClick: () => alert("Back clicked"),
    },
  },
  render: (args) => <PageTitle {...args} />,
};

export const WithoutSeparator: Story = {
  args: {
    title: "Settings",
    subtitle: "Update your profile and account settings.",
    separator: false,
    primaryAction: {
      label: "Save Changes",
    },
  },
  render: (args) => <PageTitle {...args} />,
};
