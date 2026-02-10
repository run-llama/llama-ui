import type { Meta, StoryObj } from "@storybook/react-vite";
import { Settings } from "lucide-react";
import * as React from "react";
import { Badge } from "../../base/badge";
import { RadioGroup, RadioGroupItem } from "../../base/radio-group";

const meta: Meta<typeof RadioGroup> = {
  title: "Base/RadioGroup",
  component: RadioGroup,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "box"],
      description: "Visual style variant",
    },
    defaultValue: {
      control: "text",
      description: "Default selected value",
    },
    value: {
      control: "text",
      description: "Controlled selected value",
    },
  },
};

export default meta;
type Story = StoryObj<typeof RadioGroup>;

export const Default: Story = {
  render: (args) => (
    <RadioGroup defaultValue="page" {...args}>
      <RadioGroupItem value="document" label="Document" />
      <RadioGroupItem value="page" label="Page" />
      <RadioGroupItem
        value="section"
        label="Section"
        description="Extract from each section"
        badge={<Badge label="New" variant="success" />}
        tooltip="This is a new section"
      />
    </RadioGroup>
  ),
};

export const BoxVariant: Story = {
  args: {
    variant: "box",
    defaultValue: "document",
  },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "box"],
    },
    defaultValue: {
      control: "text",
    },
  },
  render: (args) => (
    <RadioGroup {...args}>
      <RadioGroupItem
        value="document"
        label="Document"
        description="Extract from the entire document at once"
      />
      <RadioGroupItem
        value="page"
        label="Page"
        description="Extract from each page separately"
      />
    </RadioGroup>
  ),
};

// Playground story for testing RadioGroupItem props
export const Playground: Story = {
  args: {
    variant: "box",
    defaultValue: "option1",
  },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "box"],
    },
    defaultValue: {
      control: "text",
    },
  },
  render: (args) => {
    // These would be controlled via Storybook args in a real scenario
    // For now, showing all props available
    return (
      <RadioGroup {...args}>
        <RadioGroupItem
          value="option1"
          label="Option 1"
          description="Description for option 1"
        />
        <RadioGroupItem
          value="option2"
          label="Option 2"
          description="Description for option 2"
          badge={<Badge label="New" variant="success" />}
        />
        <RadioGroupItem
          value="option3"
          label="Option 3"
          description="Description for option 3"
          tooltip="This is a tooltip"
          required
        />
      </RadioGroup>
    );
  },
};

// Interactive Box story with full controls
const BoxPlaygroundComponent = (
  args: React.ComponentProps<typeof RadioGroup>
) => {
  const [selectedValue, setSelectedValue] = React.useState(
    args.defaultValue ?? "document"
  );

  return (
    <RadioGroup
      {...args}
      value={selectedValue}
      onValueChange={setSelectedValue}
    >
      <RadioGroupItem
        value="document"
        label="Document"
        description="Extract from the entire document at once"
        controlPlacement="start"
      />
      <RadioGroupItem
        value="page"
        label="Page"
        description="Extract from each page separately"
        controlPlacement="start"
      />
      <RadioGroupItem
        value="section"
        label="Section"
        description="Extract from each section"
        badge={<Badge label="New" variant="success" />}
        tooltip="This is a new section"
        controlPlacement="start"
      />
    </RadioGroup>
  );
};

export const BoxPlayground: Story = {
  args: {
    variant: "box",
    defaultValue: "document",
  },
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "box"],
    },
    defaultValue: {
      control: "text",
    },
  },
  render: (args) => <BoxPlaygroundComponent {...args} />,
};

export const ControlPlacementEnd: Story = {
  render: (args) => (
    <RadioGroup defaultValue="page" variant="box" {...args}>
      <RadioGroupItem
        value="page"
        label="Page"
        description="Extract from each page separately"
        controlPlacement="end"
      />
      <RadioGroupItem
        value="section"
        label="Section"
        description="Extract from each section"
        controlPlacement="end"
      />
    </RadioGroup>
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
        <RadioGroup defaultValue="option1">
          <RadioGroupItem
            value="option1"
            label="Label"
            description="This is a field description."
            icon={<Settings className="size-4" />}
            badge={<Badge label="Badge" variant="outline" />}
            tooltip="This is a tooltip with additional context"
            required
            optional
          />
          <RadioGroupItem
            value="option2"
            label="Label"
            description="This is a field description."
            icon={<Settings className="size-4" />}
            badge={<Badge label="Badge" variant="outline" />}
            tooltip="This is a tooltip with additional context"
            required
            optional
          />
        </RadioGroup>
      </div>

      {/* Box variant with all features */}
      <div>
        <h3 className="mb-4 text-sm font-medium text-muted-foreground">
          Box Variant
        </h3>
        <RadioGroup defaultValue="option1" variant="box">
          <RadioGroupItem
            value="option1"
            label="Label"
            description="This is a field description."
            icon={<Settings className="size-4" />}
            badge={<Badge label="Badge" variant="outline" />}
            tooltip="This is a tooltip with additional context"
            required
            optional
          />
          <RadioGroupItem
            value="option2"
            label="Label"
            description="This is a field description."
            icon={<Settings className="size-4" />}
            badge={<Badge label="Badge" variant="outline" />}
            tooltip="This is a tooltip with additional context"
            required
            optional
          />
        </RadioGroup>
      </div>
    </div>
  ),
};
