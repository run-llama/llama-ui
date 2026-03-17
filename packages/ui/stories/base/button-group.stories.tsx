import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Bold,
  Italic,
  Underline,
  AlignLeft,
  AlignCenter,
  AlignRight,
  ChevronDown,
  Plus,
  Minus,
  Copy,
  Scissors,
  Clipboard,
  Undo,
  Redo,
} from "lucide-react";
import { ButtonGroup, ButtonGroupItem } from "../../base/button-group";
import { ThemeComparison } from "./theme-comparison";

const meta: Meta<typeof ButtonGroup> = {
  title: "Base/ButtonGroup",
  component: ButtonGroup,
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
    orientation: {
      control: { type: "select" },
      options: ["horizontal", "vertical"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof ButtonGroup>;

export const Default: Story = {
  render: (args) => (
    <ThemeComparison>
      <ButtonGroup {...args}>
        <ButtonGroupItem label="First" />
        <ButtonGroupItem label="Second" />
        <ButtonGroupItem label="Third" />
      </ButtonGroup>
    </ThemeComparison>
  ),
};

export const Outline: Story = {
  render: () => (
    <ThemeComparison>
      <ButtonGroup variant="outline">
        <ButtonGroupItem label="Left" />
        <ButtonGroupItem label="Center" />
        <ButtonGroupItem label="Right" />
      </ButtonGroup>
    </ThemeComparison>
  ),
};

export const Ghost: Story = {
  render: () => (
    <ThemeComparison>
      <ButtonGroup variant="ghost">
        <ButtonGroupItem label="Option A" />
        <ButtonGroupItem label="Option B" />
        <ButtonGroupItem label="Option C" />
      </ButtonGroup>
    </ThemeComparison>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <ThemeComparison>
      <ButtonGroup variant="outline">
        <ButtonGroupItem label="Copy" startIcon={<Copy />} />
        <ButtonGroupItem label="Cut" startIcon={<Scissors />} />
        <ButtonGroupItem label="Paste" startIcon={<Clipboard />} />
      </ButtonGroup>
    </ThemeComparison>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <ThemeComparison>
      <ButtonGroup variant="outline" size="icon">
        <ButtonGroupItem startIcon={<Bold />} label="Bold" />
        <ButtonGroupItem startIcon={<Italic />} label="Italic" />
        <ButtonGroupItem startIcon={<Underline />} label="Underline" />
      </ButtonGroup>
    </ThemeComparison>
  ),
};

export const SmallSize: Story = {
  render: () => (
    <ThemeComparison>
      <ButtonGroup variant="outline" size="sm">
        <ButtonGroupItem label="Day" />
        <ButtonGroupItem label="Week" />
        <ButtonGroupItem label="Month" />
        <ButtonGroupItem label="Year" />
      </ButtonGroup>
    </ThemeComparison>
  ),
};

export const Vertical: Story = {
  render: () => (
    <ThemeComparison>
      <ButtonGroup variant="outline" orientation="vertical">
        <ButtonGroupItem label="Top" />
        <ButtonGroupItem label="Middle" />
        <ButtonGroupItem label="Bottom" />
      </ButtonGroup>
    </ThemeComparison>
  ),
};

export const VerticalWithIcons: Story = {
  render: () => (
    <ThemeComparison>
      <ButtonGroup variant="outline" orientation="vertical" size="icon">
        <ButtonGroupItem startIcon={<AlignLeft />} label="Align Left" />
        <ButtonGroupItem startIcon={<AlignCenter />} label="Align Center" />
        <ButtonGroupItem startIcon={<AlignRight />} label="Align Right" />
      </ButtonGroup>
    </ThemeComparison>
  ),
};

export const MixedVariants: Story = {
  render: () => (
    <ThemeComparison>
      <ButtonGroup variant="outline">
        <ButtonGroupItem label="Save" variant="default" />
        <ButtonGroupItem label="Preview" />
        <ButtonGroupItem label="Delete" variant="destructive" />
      </ButtonGroup>
    </ThemeComparison>
  ),
};

export const WithDropdown: Story = {
  render: () => (
    <ThemeComparison>
      <ButtonGroup>
        <ButtonGroupItem label="Action" />
        <ButtonGroupItem startIcon={<ChevronDown />} label="More" size="icon" />
      </ButtonGroup>
    </ThemeComparison>
  ),
};

export const Counter: Story = {
  render: () => (
    <ThemeComparison>
      <ButtonGroup variant="outline" size="icon-sm">
        <ButtonGroupItem startIcon={<Minus />} label="Decrease" />
        <ButtonGroupItem startIcon={<Plus />} label="Increase" />
      </ButtonGroup>
    </ThemeComparison>
  ),
};

export const UndoRedo: Story = {
  render: () => (
    <ThemeComparison>
      <ButtonGroup variant="ghost" size="icon">
        <ButtonGroupItem startIcon={<Undo />} label="Undo" />
        <ButtonGroupItem startIcon={<Redo />} label="Redo" />
      </ButtonGroup>
    </ThemeComparison>
  ),
};

export const Disabled: Story = {
  render: () => (
    <ThemeComparison>
      <ButtonGroup variant="outline">
        <ButtonGroupItem label="Active" />
        <ButtonGroupItem label="Disabled" disabled />
        <ButtonGroupItem label="Active" />
      </ButtonGroup>
    </ThemeComparison>
  ),
};

export const AllVariants: Story = {
  render: () => (
    <ThemeComparison>
      <div className="flex flex-col gap-4">
        <ButtonGroup>
          <ButtonGroupItem label="Default" />
          <ButtonGroupItem label="Default" />
          <ButtonGroupItem label="Default" />
        </ButtonGroup>
        <ButtonGroup variant="outline">
          <ButtonGroupItem label="Outline" />
          <ButtonGroupItem label="Outline" />
          <ButtonGroupItem label="Outline" />
        </ButtonGroup>
        <ButtonGroup variant="ghost">
          <ButtonGroupItem label="Ghost" />
          <ButtonGroupItem label="Ghost" />
          <ButtonGroupItem label="Ghost" />
        </ButtonGroup>
        <ButtonGroup variant="destructive">
          <ButtonGroupItem label="Destructive" />
          <ButtonGroupItem label="Destructive" />
          <ButtonGroupItem label="Destructive" />
        </ButtonGroup>
      </div>
    </ThemeComparison>
  ),
};
