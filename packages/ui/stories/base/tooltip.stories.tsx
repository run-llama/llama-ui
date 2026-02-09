import type { Meta, StoryObj } from "@storybook/react-vite";
import { CircleHelp } from "lucide-react";
import * as React from "react";
import { Button } from "../../base/button";
import { Tooltip } from "../../base/tooltip";

const meta: Meta<typeof Tooltip> = {
  title: "Base/Tooltip",
  component: Tooltip,
  tags: ["autodocs"],
};

 
export default meta;
type Story = StoryObj<typeof Tooltip>;

export const Default: Story = {
  render: () => (
    <Tooltip
      trigger={<Button variant="outline" label="Hover me" />}
      content="This is a tooltip"
    />
  ),
};

export const WithLink: Story = {
  render: () => (
    <Tooltip
      trigger={
        <Button
          variant="outline"
          label="With link"
          startIcon={<CircleHelp className="size-4" />}
        />
      }
      content="Select a preset from the main group to apply settings for common tasks."
      link="https://docs.llamaindex.ai"
      linkLabel="Docs"
      linkExternal={true}
    />
  ),
};

export const Sides: Story = {
  render: () => (
    <div className="flex flex-col items-center gap-8 py-16">
      <Tooltip
        defaultOpen
        trigger={<Button variant="outline" label="Top" />}
        side="top"
        content="This is a tooltip"
        link="#"
        linkLabel="Label"
        linkExternal={true}
      />

      <Tooltip
        defaultOpen
        trigger={<Button variant="outline" label="Bottom" />}
        side="bottom"
        content="This is a tooltip"
        link="#"
        linkLabel="Label"
        linkExternal={true}
      />

      <div className="flex gap-32">
        <Tooltip
          defaultOpen
          trigger={<Button variant="outline" label="Left" />}
          side="left"
          content="This is a tooltip"
          link="#"
          linkLabel="Label"
          linkExternal={true}
        />

        <Tooltip
          defaultOpen
          trigger={<Button variant="outline" label="Right" />}
          side="right"
          content="This is a tooltip"
          link="#"
          linkLabel="Label"
          linkExternal={true}
        />
      </div>
    </div>
  ),
};
