import type { Meta, StoryObj } from "@storybook/react-vite";
import { Settings } from "lucide-react";
import * as React from "react";

import { Badge } from "../../base/badge";
import { Switch, SwitchGroup } from "../../base/switch";

 
export default {
  title: "Base/Switch",
  component: Switch,
  args: {
    label: "Label",
    description: "This is a field description.",
    disabled: false,
    defaultChecked: false,
    required: false,
    optional: false,
    variant: "default",
    controlPlacement: "start",
  },
  argTypes: {
    variant: {
      control: "radio",
      options: ["default", "box"],
    },
    controlPlacement: {
      control: "radio",
      options: ["start", "end"],
    },
    disabled: {
      control: "boolean",
    },
    defaultChecked: {
      control: "boolean",
    },
    required: {
      control: "boolean",
    },
    optional: {
      control: "boolean",
    },
    tooltip: {
      control: "text",
    },
  },
} satisfies Meta<typeof Switch>;

type Story = StoryObj<typeof Switch>;

export const Playground: Story = {
  args: {
    label: "Enable notifications",
    tooltip: "This is a tooltip",
  },
  render: (args) => (
    <Switch {...args} />
    //TODO uncomment after badge is fixed
    // <Switch {...args} badge={<Badge label="New" variant="success" />} />
  ),
};

export const Group: Story = {
  render: ({ variant }) => (
    <SwitchGroup variant={variant as "default" | "box"}>
      <Switch label="Option 1" description="First option" />
      <Switch
        label="Option 2"
        description="Second option"
        defaultChecked
        //TODO uncomment after badge is fixed
        // badge={<Badge label="New" variant="success" />}
        tooltip="This is a tooltip"
      />
      <Switch
        label="Option 3"
        description="Third option"
        disabled
        tooltip="This is a tooltip"
        required
      />
    </SwitchGroup>
  ),
};

export const AllFeatures: Story = {
  render: () => (
    <div className="flex flex-col gap-8">
      {/* Default variant with all features */}
      <div>
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">
          Default Variant
        </h3>
        <Switch
          label="Label"
          description="This is a field description."
          icon={<Settings className="size-4" />}
          badge={<Badge label="Badge" variant="outline" />}
          tooltip="This is a tooltip with additional context"
          required
          optional
          defaultChecked
        />
      </div>

      {/* Box variant with all features */}
      <div>
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">
          Box Variant
        </h3>
        <Switch
          variant="box"
          label="Label"
          description="This is a field description."
          icon={<Settings className="size-4" />}
          badge={<Badge label="Badge" variant="outline" />}
          tooltip="This is a tooltip with additional context"
          required
          optional
          defaultChecked
        />
      </div>
    </div>
  ),
};
