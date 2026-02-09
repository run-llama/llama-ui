import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Square, Circle } from "lucide-react";

import { Card, CardContent, CardFooter, CardHeader } from "../../base/card";
import { Button } from "../../base/button";

type CardStoryProps = {
  title: string;
  description: string;
  showIcon: boolean;
  showHeaderAction: boolean;
  showContent: boolean;
  showFooter: boolean;
  showPrimaryAction: boolean;
  showSecondaryAction: boolean;
  showTertiaryAction: boolean;
};

const meta: Meta<CardStoryProps> = {
  title: "Base/Card",
  component: Card,
  tags: ["autodocs"],
  argTypes: {
    title: {
      control: "text",
      description: "Card header title",
    },
    description: {
      control: "text",
      description: "Card header description",
    },
    showIcon: {
      control: "boolean",
      description: "Show icon in header",
    },
    showHeaderAction: {
      control: "boolean",
      description: "Show action button in header",
    },
    showContent: {
      control: "boolean",
      description: "Show card content area",
    },
    showFooter: {
      control: "boolean",
      description: "Show card footer",
    },
    showPrimaryAction: {
      control: "boolean",
      description: "Show primary action in footer",
    },
    showSecondaryAction: {
      control: "boolean",
      description: "Show secondary action in footer",
    },
    showTertiaryAction: {
      control: "boolean",
      description: "Show tertiary action in footer",
    },
  },
};

// eslint-disable-next-line no-restricted-syntax
export default meta;
type Story = StoryObj<CardStoryProps>;

const SlotPlaceholder = () => (
  <div className="mb-6 flex h-16 items-center justify-center rounded border-2 border-dashed border-purple-300 bg-purple-50 text-sm text-muted-foreground">
    Slot (swap it with your content)
  </div>
);

const CardPlayground = ({
  title,
  description,
  showIcon,
  showHeaderAction,
  showContent,
  showFooter,
  showPrimaryAction,
  showSecondaryAction,
  showTertiaryAction,
}: CardStoryProps) => (
  <Card className="w-[400px]">
    <CardHeader
      icon={showIcon ? <Square /> : undefined}
      title={title}
      description={description}
      action={
        showHeaderAction
          ? {
              label: "Button",
              variant: "outline",
              startIcon: <Circle />,
            }
          : undefined
      }
    />
    {showContent && (
      <CardContent>
        <SlotPlaceholder />
        <SlotPlaceholder />
      </CardContent>
    )}
    {showFooter && (
      <CardFooter
        tertiaryAction={
          showTertiaryAction ? (
            <Button variant="link" label="Tertiary" />
          ) : undefined
        }
        secondaryAction={
          showSecondaryAction ? (
            <Button variant="outline" label="Secondary" />
          ) : undefined
        }
        primaryAction={
          showPrimaryAction ? <Button label="Primary" /> : undefined
        }
      />
    )}
  </Card>
);

export const Playground: Story = {
  args: {
    title: "Title Text",
    description: "This is a card description.",
    showIcon: true,
    showHeaderAction: true,
    showContent: true,
    showFooter: true,
    showPrimaryAction: true,
    showSecondaryAction: true,
    showTertiaryAction: true,
  },
  render: (args) => <CardPlayground {...args} />,
};

export const Example = () => (
  <Card className="w-[400px]">
    <CardHeader
      icon={<Square />}
      title="Title Text"
      description="This is a card description."
      action={{
        label: "Button",
        variant: "outline",
        startIcon: <Circle />,
      }}
    />
    <CardContent>
      <SlotPlaceholder />
      <SlotPlaceholder />
    </CardContent>
    <CardFooter
      tertiaryAction={<Button variant="link" label="Button" />}
      secondaryAction={<Button variant="outline" label="Button" />}
      primaryAction={<Button label="Button" />}
    />
  </Card>
);
