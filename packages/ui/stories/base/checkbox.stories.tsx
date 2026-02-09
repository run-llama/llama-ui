import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Circle,
  Mail,
  Settings,
  Bell,
  CheckCircle,
  AlertCircle,
  Info,
} from "lucide-react";

import { Checkbox, CheckboxGroup } from "../../base/checkbox";
import { Badge } from "../../base/badge";

// Icon mapping for Storybook controls
const iconMap: Record<string, React.ReactNode> = {
  none: undefined,
  circle: <Circle className="size-4" />,
  mail: <Mail className="size-4" />,
  settings: <Settings className="size-4" />,
  bell: <Bell className="size-4" />,
  checkCircle: <CheckCircle className="size-4" />,
  alertCircle: <AlertCircle className="size-4" />,
  info: <Info className="size-4" />,
};

const meta: Meta<typeof Checkbox> = {
  title: "Base/Checkbox",
  component: Checkbox,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "box"],
      description: "Visual style variant",
    },
    label: {
      control: "text",
      description: "Main label text (if not provided, returns checkbox only)",
    },
    description: {
      control: "text",
      description: "Helper text displayed below the label",
    },
    required: {
      control: "boolean",
      description: "Shows red asterisk to indicate required field",
    },
    optional: {
      control: "boolean",
      description: "Shows 'Optional' text after the label",
    },
    tooltip: {
      control: "text",
      description: "Tooltip content (shows info icon on hover)",
    },
    disabled: {
      control: "boolean",
      description: "Disables the checkbox",
    },
    checked: {
      control: "boolean",
      description: "Controlled checked state",
    },
    defaultChecked: {
      control: "boolean",
      description: "Default checked state (uncontrolled)",
    },
    icon: {
      control: { type: "select" },
      options: Object.keys(iconMap),
      mapping: iconMap,
      description: "Icon displayed before the label",
    },
  },
};

 
export default meta;
type Story = StoryObj<typeof Checkbox>;

// Interactive story - use Storybook controls to modify props
export const Playground: Story = {
  args: {
    variant: "default",
    label: "Label",
    description: "This is a field description.",
    required: true,
    optional: true,
    tooltip: "This is a tooltip content.",
    disabled: false,
    defaultChecked: false,
    icon: "circle",
  },
  render: (args) => (
    <Checkbox {...args} badge={<Badge label="New" variant="success" />} />
  ),
};

export const Group = () => (
  <CheckboxGroup>
    <Checkbox label="Option 1" />
    <Checkbox label="Option 2" />
    <Checkbox label="Option 3" disabled />
  </CheckboxGroup>
);

export const GroupWithBox = () => (
  <CheckboxGroup variant="box">
    <Checkbox label="Option 1" description="Description for option 1" />
    <Checkbox
      label="Option 2"
      description="Description for option 2"
      defaultChecked
      badge={<Badge label="New" variant="success" />}
    />
    <Checkbox label="Option 3" description="Description for option 3" />
  </CheckboxGroup>
);
