import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { BarChart, FileCode2, FileText, Plus, Search } from "lucide-react";

import { Empty } from "../../base/empty";

const iconMap = {
  FileText: FileText,
  FileCode2: FileCode2,
  Search: Search,
  BarChart: BarChart,
  None: null,
};

interface StoryArgs {
  title?: string;
  description?: string;
  iconType?: string;
  primaryActionLabel?: string;
  secondaryActionLabel?: string;
  tertiaryActionLabel?: string;
}

const meta: Meta<StoryArgs> = {
  title: "Base/Empty",
  component: Empty,
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Main heading text",
    },
    description: {
      control: "text",
      description: "Descriptive text below the title",
    },
    iconType: {
      control: { type: "select" },
      options: Object.keys(iconMap),
      description: "Icon to display",
    },
    primaryActionLabel: {
      control: "text",
      description: "Primary action button text",
    },
    secondaryActionLabel: {
      control: "text",
      description: "Secondary action button text",
    },
    tertiaryActionLabel: {
      control: "text",
      description: "Tertiary action button text",
    },
  },
  parameters: {
    controls: {
      exclude: ["primaryAction", "secondaryAction", "tertiaryAction"],
    },
  },
};

 
export default meta;
type Story = StoryObj<StoryArgs>;

export const Default: Story = {
  args: {
    title: "No parse configurations",
    description:
      "You haven't created any parse configurations yet. Create your first configuration by setting up parsing parameters and saving them.",
    iconType: "FileText",
  },
  render: (args) => {
    const IconComponent = iconMap[args.iconType as keyof typeof iconMap];
    const icon = IconComponent ? <IconComponent /> : undefined;

    const primaryAction = args.primaryActionLabel
      ? {
          label: args.primaryActionLabel,
          onClick: () => console.log("Primary action clicked"),
          icon: <Plus />,
        }
      : undefined;

    const secondaryAction = args.secondaryActionLabel
      ? {
          label: args.secondaryActionLabel,
          onClick: () => console.log("Secondary action clicked"),
          icon: <Plus />,
        }
      : undefined;

    const tertiaryAction = args.tertiaryActionLabel
      ? {
          label: args.tertiaryActionLabel,
          onClick: () => console.log("Tertiary action clicked"),
        }
      : undefined;

    return (
      <Empty
        title={args.title}
        description={args.description}
        icon={icon}
        primaryAction={primaryAction}
        secondaryAction={secondaryAction}
        tertiaryAction={tertiaryAction}
      />
    );
  },
};

export const SearchEmpty: Story = {
  args: {
    iconType: "Search",
    title: "Start searching",
    description:
      "Enter a query to start your search. Adjust settings for better results.",
  },
  render: Default.render,
};

export const NoUsageMetrics: Story = {
  args: {
    iconType: "BarChart",
    title: "No usage metrics",
    description: "Try adjusting your filters or date range.",
  },
  render: Default.render,
};

export const WithButton: Story = {
  args: {
    iconType: "FileCode2",
    title: "No parse configurations",
    description:
      "You haven't created any parse configurations yet. Create your first configuration by setting up parsing parameters and saving them.",
    secondaryActionLabel: "Save current config",
  },
  render: (args) => {
    const IconComponent = iconMap[args.iconType as keyof typeof iconMap];
    const icon = IconComponent ? <IconComponent /> : undefined;

    const secondaryAction = args.secondaryActionLabel
      ? {
          label: args.secondaryActionLabel,
          onClick: () => console.log("Save config clicked"),
          icon: <Plus />,
        }
      : undefined;

    return (
      <Empty
        title={args.title}
        description={args.description}
        icon={icon}
        secondaryAction={secondaryAction}
      />
    );
  },
};
