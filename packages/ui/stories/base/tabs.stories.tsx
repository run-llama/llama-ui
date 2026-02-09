import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  Bot,
  Search,
  Table,
  Code2,
  SlidersHorizontal,
  FileText,
} from "lucide-react";

import { Badge } from "../../base/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "../../base/tabs";

type TabsStoryProps = {
  variant: "default" | "underline";
  showIcons: boolean;
  tabCount: number;
  defaultTab: string;
};

const meta: Meta<TabsStoryProps> = {
  title: "Base/Tabs",
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "underline"],
      description: "Visual variant of the tabs",
    },
    showIcons: {
      control: "boolean",
      description: "Show icons on tabs",
    },
    tabCount: {
      control: { type: "range", min: 2, max: 5, step: 1 },
      description: "Number of tabs to display",
    },
    defaultTab: {
      control: "select",
      options: ["tab1", "tab2", "tab3", "tab4", "tab5"],
      description: "Default selected tab",
    },
  },
};

 
export default meta;
type Story = StoryObj<TabsStoryProps>;

const tabData = [
  {
    value: "tab1",
    label: "Overview",
    icon: Bot,
    content: "Overview content goes here.",
  },
  {
    value: "tab2",
    label: "Settings",
    icon: SlidersHorizontal,
    content: "Settings content goes here.",
  },
  {
    value: "tab3",
    label: "Search",
    icon: Search,
    content: "Search content goes here.",
  },
  {
    value: "tab4",
    label: "Results",
    icon: FileText,
    content: "Results content goes here.",
  },
  {
    value: "tab5",
    label: "Code",
    icon: Code2,
    content: "Code content goes here.",
  },
];

const TabsPlayground = ({
  variant,
  showIcons,
  tabCount,
  defaultTab,
}: TabsStoryProps) => {
  const visibleTabs = tabData.slice(0, tabCount);

  return (
    <Tabs defaultValue={defaultTab}>
      <TabsList variant={variant}>
        {visibleTabs.map((tab) => (
          <TabsTrigger
            key={tab.value}
            value={tab.value}
            label={tab.label}
            icon={showIcons ? tab.icon : undefined}
          />
        ))}
      </TabsList>
      {visibleTabs.map((tab) => (
        <TabsContent key={tab.value} value={tab.value}>
          {tab.content}
        </TabsContent>
      ))}
    </Tabs>
  );
};

export const Playground: Story = {
  args: {
    variant: "default",
    showIcons: false,
    tabCount: 3,
    defaultTab: "tab1",
  },
  render: (args) => <TabsPlayground {...args} />,
};

export const Default: Story = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview" label="Overview" />
        <TabsTrigger value="settings" label="Settings" />
        <TabsTrigger value="help" label="Help" />
      </TabsList>
      <TabsContent value="overview">Overview content</TabsContent>
      <TabsContent value="settings">Settings content</TabsContent>
      <TabsContent value="help">Help content</TabsContent>
    </Tabs>
  ),
};

export const WithIcons: Story = {
  render: () => (
    <Tabs defaultValue="bot">
      <TabsList>
        <TabsTrigger value="bot" label="Chatbot" icon={Bot} />
        <TabsTrigger value="search" label="Search" icon={Search} />
      </TabsList>
      <TabsContent value="bot">Chatbot content</TabsContent>
      <TabsContent value="search">Search content</TabsContent>
    </Tabs>
  ),
};

export const Underline: Story = {
  render: () => (
    <Tabs defaultValue="upload">
      <TabsList variant="underline">
        <TabsTrigger value="upload" label="Upload" />
        <TabsTrigger value="url" label="URL" />
      </TabsList>
      <TabsContent value="upload">Upload content</TabsContent>
      <TabsContent value="url">URL content</TabsContent>
    </Tabs>
  ),
};

export const UnderlineWithIcons: Story = {
  render: () => (
    <Tabs defaultValue="build">
      <TabsList variant="underline">
        <TabsTrigger value="build" label="Build" icon={SlidersHorizontal} />
        <TabsTrigger value="results" label="Results" icon={FileText} />
      </TabsList>
      <TabsContent value="build">Build content</TabsContent>
      <TabsContent value="results">Results content</TabsContent>
    </Tabs>
  ),
};

export const IconOnly: Story = {
  render: () => (
    <Tabs defaultValue="table">
      <TabsList>
        <TabsTrigger value="table" icon={Table} />
        <TabsTrigger value="code" icon={Code2} />
      </TabsList>
      <TabsContent value="table">Table view</TabsContent>
      <TabsContent value="code">Code view</TabsContent>
    </Tabs>
  ),
};

export const WithBadge: Story = {
  args: {
    tabCount: 2,
  },

  render: () => (
    <Tabs defaultValue="all">
      <TabsList>
        <TabsTrigger
          value="all"
          label="All"
          badge={<Badge label="12" variant="default" />}
        />
        <TabsTrigger
          value="active"
          label="Active"
          badge={<Badge label="5" variant="default" />}
        />
        <TabsTrigger value="archived" label="Archived" />
      </TabsList>
      <TabsContent value="all">All items</TabsContent>
      <TabsContent value="active">Active items</TabsContent>
      <TabsContent value="archived">Archived items</TabsContent>
    </Tabs>
  ),
};

export const UnderlineWithBadge: Story = {
  render: () => (
    <Tabs defaultValue="all">
      <TabsList variant="underline">
        <TabsTrigger
          value="all"
          label="All"
          badge={<Badge label="12" variant="default" />}
        />
        <TabsTrigger
          value="active"
          label="Active"
          badge={<Badge label="5" variant="default" />}
        />
        <TabsTrigger value="archived" label="Archived" />
      </TabsList>
      <TabsContent value="all">All items</TabsContent>
      <TabsContent value="active">Active items</TabsContent>
      <TabsContent value="archived">Archived items</TabsContent>
    </Tabs>
  ),
};

export const Disabled: Story = {
  render: () => (
    <Tabs defaultValue="overview">
      <TabsList>
        <TabsTrigger value="overview" label="Overview" />
        <TabsTrigger value="settings" label="Settings" />
        <TabsTrigger value="admin" label="Admin" disabled />
      </TabsList>
      <TabsContent value="overview">Overview content</TabsContent>
      <TabsContent value="settings">Settings content</TabsContent>
      <TabsContent value="admin">Admin content</TabsContent>
    </Tabs>
  ),
};
