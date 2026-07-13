import { Alert } from "../../base/alert";
import type { Meta, StoryObj } from "@storybook/react-vite";
import * as React from "react";

const meta: Meta<typeof Alert> = {
  title: "Base/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error", "warning"],
    },
    showIcon: {
      control: "boolean",
    },
    buttonVariant: {
      control: "select",
      options: ["default", "secondary", "outline", "ghost", "destructive"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    title: "Information",
    description: "This is an informational alert with helpful details.",
  },
  render: (args) => <Alert {...args} />,
};

export const Error: Story = {
  args: {
    variant: "error",
    title: "Error Occurred",
    description: "Something went wrong. Please try again later.",
  },
  render: (args) => <Alert {...args} />,
};

export const Warning: Story = {
  args: {
    variant: "warning",
    title: "Warning",
    description: "This action may have unintended consequences.",
  },
  render: (args) => <Alert {...args} />,
};

export const TitleOnly: Story = {
  args: {
    title: "This alert has only a title, no description.",
  },
  render: (args) => <Alert {...args} />,
};

export const WithoutIcon: Story = {
  args: {
    title: "No Icon Alert",
    description: "This alert does not display an icon.",
    showIcon: false,
  },
  render: (args) => <Alert {...args} />,
};

export const WithActionButton: Story = {
  args: {
    title: "Action Required",
    description: "Please review and take action.",
    buttonLabel: "Take Action",
    onButtonClick: () => alert("Action button clicked!"),
  },
  render: (args) => <Alert {...args} />,
};

export const ErrorWithButton: Story = {
  args: {
    variant: "error",
    title: "Failed to Save",
    description: "Your changes could not be saved. Please retry.",
    buttonLabel: "Retry",
    buttonVariant: "destructive",
    onButtonClick: () => alert("Retry clicked!"),
  },
  render: (args) => <Alert {...args} />,
};

export const WarningWithButton: Story = {
  args: {
    variant: "warning",
    title: "Unsaved Changes",
    description: "You have unsaved changes that will be lost.",
    buttonLabel: "Save Now",
    buttonVariant: "default",
    onButtonClick: () => alert("Save clicked!"),
  },
  render: (args) => <Alert {...args} />,
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert
        title="Default Alert"
        description="This is the default informational style."
      />
      <Alert
        variant="error"
        title="Error Alert"
        description="This indicates an error or failure state."
      />
      <Alert
        variant="warning"
        title="Warning Alert"
        description="This indicates a warning or caution."
      />
    </div>
  ),
};

export const AllVariantsWithButtons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert
        title="Default Alert"
        description="This is the default informational style."
        buttonLabel="Learn More"
      />
      <Alert
        variant="error"
        title="Error Alert"
        description="This indicates an error or failure state."
        buttonLabel="Retry"
        buttonVariant="destructive"
      />
      <Alert
        variant="warning"
        title="Warning Alert"
        description="This indicates a warning or caution."
        buttonLabel="Dismiss"
        buttonVariant="outline"
      />
    </div>
  ),
};
