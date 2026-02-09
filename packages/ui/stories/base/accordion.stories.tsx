import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { FileText, Folder, Settings, User, Database, Code } from "lucide-react";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "../../base/accordion";

const meta: Meta<typeof AccordionTrigger> = {
  title: "Base/Accordion",
  component: AccordionTrigger,
  parameters: {
    layout: "padded",
  },
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "The main title text displayed prominently",
    },
    caption: {
      control: "text",
      description:
        "Optional secondary text (caption) displayed next to the title",
    },
    icon: {
      control: false,
      description:
        "Optional Lucide icon component displayed at the start of the trigger",
    },
    showTooltip: {
      control: "boolean",
      description: "Whether to show the tooltip info icon",
    },
    tooltipContent: {
      control: "text",
      description: "Content to display in the tooltip when showTooltip is true",
    },
    badge: {
      control: "text",
      description: "Optional badge text to display before the chevron",
    },
  },
};

export default meta; // Storybook requires default export
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  render: (args) => {
    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger title="" {...args} />
          <AccordionContent>This is an accordion content.</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  },
  args: {
    title: "Trigger Text",
    icon: undefined,
  },
};

export const WithAllFeatures: Story = {
  render: (args) => {
    return (
      <Accordion type="single" collapsible className="w-full">
        <AccordionItem value="item-1">
          <AccordionTrigger title="" {...args} />
          <AccordionContent>This is an accordion content.</AccordionContent>
        </AccordionItem>
      </Accordion>
    );
  },
  args: {
    title: "Document Settings",
    caption: "Configure your preferences",
    showTooltip: true,
    tooltipContent: "This is a tooltip with helpful information.",
    badge: "New",
    icon: FileText,
  },
};

export const MultipleItems: Story = {
  args: {
    title: "Multiple Items Example",
  },
  render: () => (
    <Accordion type="single" collapsible className="w-full">
      <AccordionItem value="item-1">
        <AccordionTrigger
          title="Documents"
          caption="12 files"
          icon={FileText}
          showTooltip
          tooltipContent="View and manage your documents"
          badge="New"
        />
        <AccordionContent>
          This section contains all your documents and files.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-2">
        <AccordionTrigger title="Folders" caption="5 folders" icon={Folder} />
        <AccordionContent>
          Organize your files into folders for better management.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-3">
        <AccordionTrigger
          title="Settings"
          caption="Preferences"
          icon={Settings}
          badge="2"
        />
        <AccordionContent>
          Configure your application settings and preferences.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-4">
        <AccordionTrigger title="User Profile" icon={User} />
        <AccordionContent>
          Manage your user profile and account information.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-5">
        <AccordionTrigger title="Database" icon={Database} />
        <AccordionContent>
          View and manage your database connections and queries.
        </AccordionContent>
      </AccordionItem>
      <AccordionItem value="item-6">
        <AccordionTrigger title="Code Editor" icon={Code} />
        <AccordionContent>
          Configure your code editor settings and themes.
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  ),
};
