import type { Meta, StoryObj } from "@storybook/react-vite";
import { File, Search } from "lucide-react";
import * as React from "react";
import { Input } from "../../base/input";

const meta: Meta<typeof Input> = {
  title: "Base/Input",
  component: Input,
};

// eslint-disable-next-line no-restricted-syntax
export default meta;
type Story = StoryObj<typeof Input>;

export const Default: Story = {
  render: () => (
    <div className="flex w-[300px] flex-col gap-4">
      <Input placeholder="Default Input" />
      <Input type="password" placeholder="Password" />
    </div>
  ),
};

export const WithIcon: Story = {
  render: () => (
    <div className="flex w-[300px] flex-col gap-4">
      <Input icon={<Search />} placeholder="Search..." />
      <Input
        icon={<Search />}
        type="password"
        placeholder="Search password..."
      />
      <Input type="file" icon={<File />} />
    </div>
  ),
};

export const Variants: Story = {
  render: () => (
    <div className="flex w-[300px] flex-col gap-4">
      <Input variant="error" placeholder="Error variant" />
      <Input aria-invalid placeholder="Error via aria-invalid" />
      <Input type="file" />
      <Input disabled placeholder="Disabled" />
    </div>
  ),
};
