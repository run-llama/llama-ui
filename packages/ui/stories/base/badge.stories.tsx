import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Check, AlertTriangle } from "lucide-react";
import { Badge } from "../../base/badge";

const meta: Meta<typeof Badge> = {
  title: "Base/Badge",
  component: Badge,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: [
        "default",
        "secondary",
        "outline",
        "destructive",
        "warning",
        "success",
      ],
    },
    icon: {
      control: false,
    },
  },
};

export default meta;
type Story = StoryObj<typeof Badge>;

export const Default: Story = {
  args: {
    label: "Badge",
  },
  render: (args) => <Badge {...args} />,
};

export const WithIcon: Story = {
  args: {
    label: "Badge with Icon",
    icon: <Check />,
  },
  render: (args) => <Badge {...args} />,
};

export const Variants: Story = {
  render: () => (
    <div className="flex gap-2">
      <Badge variant="default" label="Default" />
      <Badge variant="secondary" label="Secondary" />
      <Badge variant="outline" label="Outline" />
      <Badge
        variant="destructive"
        icon={<AlertTriangle />}
        label="Destructive"
      />
      <Badge variant="warning" icon={<AlertTriangle />} label="Warning" />
      <Badge variant="success" icon={<Check />} label="Success" />
    </div>
  ),
};
