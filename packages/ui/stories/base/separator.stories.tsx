import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Separator } from "../../base/separator";

const meta: Meta<typeof Separator> = {
  title: "Base/Separator",
  component: Separator,
  tags: ["autodocs"],
  argTypes: {
    orientation: {
      control: { type: "select" },
      options: ["horizontal", "vertical"],
    },
  },
};

// eslint-disable-next-line no-restricted-syntax
export default meta;
type Story = StoryObj<typeof Separator>;

export const Default: Story = {
  args: {
    orientation: "horizontal",
  },
  render: (args) => {
    if (args.orientation === "vertical") {
      return (
        <div className="flex h-20 items-center gap-4">
          <div>Left content</div>
          <Separator {...args} />
          <div>Right content</div>
        </div>
      );
    }
    return (
      <div className="flex flex-col gap-4">
        <div>Content above</div>
        <Separator {...args} />
        <div>Content below</div>
      </div>
    );
  },
};

export const Vertical: Story = {
  render: () => (
    <div className="flex h-20 items-center gap-4">
      <div>Left content</div>
      <Separator orientation="vertical" />
      <div>Right content</div>
    </div>
  ),
};
