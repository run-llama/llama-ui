import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Trash2,
  ChevronRight,
  Save,
  Mail,
  ArrowRight,
  Settings,
} from "lucide-react";
import { Button } from "../../base/button";

const meta: Meta<typeof Button> = {
  title: "Base/Button",
  component: Button,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: { type: "select" },
      options: ["default", "destructive", "outline", "ghost", "link"],
    },
    size: {
      control: { type: "select" },
      options: ["default", "sm", "icon", "icon-sm"],
    },
    label: {
      control: "text",
    },
    isLoading: {
      control: "boolean",
    },
  },
};

// eslint-disable-next-line no-restricted-syntax
export default meta;
type Story = StoryObj<typeof Button>;

export const Default: Story = {
  args: {
    label: "Click me",
  },
};

export const Destructive: Story = {
  args: {
    variant: "destructive",
    label: "Delete",
    startIcon: <Trash2 />,
  },
};

export const Outline: Story = {
  args: {
    variant: "outline",
    label: "View Details",
    endIcon: <ChevronRight />,
  },
};

export const WithStartIcon: Story = {
  args: {
    label: "Email",
    startIcon: <Mail />,
  },
};

export const WithEndIcon: Story = {
  args: {
    label: "Next Step",
    endIcon: <ArrowRight />,
  },
};

export const WithBothIcons: Story = {
  args: {
    label: "Settings",
    startIcon: <Settings />,
    endIcon: <ChevronRight />,
  },
};

export const Loading: Story = {
  args: {
    label: "Saving",
    isLoading: true,
    startIcon: <Save />, // Should be replaced by spinner
  },
};

export const FocusState: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <p className="text-sm text-muted-foreground">
        Tab through the buttons or click to see focus states
      </p>
      <div className="flex flex-wrap items-center gap-4">
        <Button label="Default" autoFocus />
        <Button variant="destructive" label="Destructive" />
        <Button variant="outline" label="Outline" />
        <Button variant="ghost" label="Ghost" />
        <Button variant="link" label="Link" />
      </div>
    </div>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button label="Default" />
      <Button variant="destructive" label="Destructive" />
      <Button variant="outline" label="Outline" />
      <Button variant="ghost" label="Ghost" />
      <Button variant="link" label="Link" />
    </div>
  ),
};

export const AllSizes: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button size="default" label="Default" />
      <Button size="sm" label="Small" />
      <Button size="icon" startIcon={<Settings />} label="Icon" />
      <Button size="icon-sm" startIcon={<Settings />} label="Icon Small" />
    </div>
  ),
};

export const Disabled: Story = {
  render: () => (
    <div className="flex flex-wrap items-center gap-4">
      <Button label="Default" disabled />
      <Button variant="destructive" label="Destructive" disabled />
      <Button variant="outline" label="Outline" disabled />
      <Button variant="ghost" label="Ghost" disabled />
    </div>
  ),
};
