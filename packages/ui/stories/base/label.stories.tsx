import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Circle } from "lucide-react";
import { Label } from "../../base/label";
import { Input } from "../../base/input";

interface StoryArgs {
  label?: string;
  required?: boolean;
  optional?: boolean;
  badgeLabel?: string;
  tooltip?: string;
  description?: string;
}

const meta: Meta<typeof Label> = {
  title: "Base/Label",
  component: Label,
  tags: ["autodocs"],
  argTypes: {
    label: { control: "text" },
    required: { control: "boolean" },
    optional: { control: "boolean" },
    badge: {
      table: { disable: true },
    },
    badgeLabel: {
      control: "text",
      description: "Badge text label",
    },
    tooltip: { control: "text" },
    description: { control: "text" },
  } as never,
  parameters: {
    controls: {
      exclude: ["badge"],
    },
  },
};

export default meta;
type Story = StoryObj<StoryArgs>;

// Interactive story - use Storybook controls to modify props
export const Playground: Story = {
  args: {
    label: "Label",
    required: true,
    optional: true,
    badgeLabel: "Hello",
    tooltip: "This is a tooltip content.",
    description: "This is a field description.",
  },
  render: (args) => {
    // TODO reenable after badge is fixed
    // const badge = args.badgeLabel ? (
    //   <Badge variant="outline" label={args.badgeLabel} />
    // ) : undefined;
    const badge = <div>Badge</div>;

    return (
      <Label
        icon={<Circle />}
        label={args.label ?? "Label"}
        required={args.required}
        optional={args.optional}
        badge={badge}
        tooltip={args.tooltip}
        description={args.description}
      />
    );
  },
};

export const WithInput: Story = {
  render: () => (
    <Label label="Email" required description="We'll never share your email.">
      <Input placeholder="example@email.com" />
    </Label>
  ),
};

export const WithRadioGroup: Story = {
  render: () => (
    <Label
      label="Notifications"
      optional
      description="Select your preferred notification method."
    >
      {/* TODO reenable after adding radiogroup */}
      {/* <RadioGroup defaultValue="email" variant="box">
        <RadioGroupItem value="email" label="Email" />
        <RadioGroupItem value="sms" label="SMS" />
        <RadioGroupItem value="push" label="Push Notification" />
      </RadioGroup> */}
    </Label>
  ),
};
