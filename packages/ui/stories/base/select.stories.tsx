import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { Zap, Cpu, Sparkles, Globe, Bot } from "lucide-react";
import type { LucideIcon } from "lucide-react";
import {
  Select,
  SelectContent,
  SelectGroup,
  SelectItem,
  SelectLabel,
  SelectTrigger,
} from "../../base/select";

// Helper to cast Lucide icons to the expected component type
const asIcon = (Icon: LucideIcon) =>
  Icon as React.ComponentType<{ className?: string; "aria-hidden"?: string }>;

type SelectStoryProps = {
  placeholder: string;
  disabled: boolean;
  badge: string;
  showGroups: boolean;
  showIcons: boolean;
  showCaptions: boolean;
};

const meta: Meta<SelectStoryProps> = {
  title: "Base/Select",
  component: Select,
  tags: ["autodocs"],
  argTypes: {
    placeholder: {
      control: "text",
      description: "Placeholder text for the select trigger",
    },
    disabled: {
      control: "boolean",
      description: "Disable the select",
    },
    badge: {
      control: "text",
      description: "Badge text on the trigger",
    },
    showGroups: {
      control: "boolean",
      description: "Show grouped items with labels",
    },
    showIcons: {
      control: "boolean",
      description: "Show icons on items",
    },
    showCaptions: {
      control: "boolean",
      description: "Show captions on items",
    },
  },
};

 
export default meta;
type Story = StoryObj<SelectStoryProps>;

const SelectPlayground = ({
  placeholder,
  disabled,
  badge,
  showGroups,
  showIcons,
  showCaptions,
}: SelectStoryProps) => (
  <Select disabled={disabled}>
    <SelectTrigger placeholder={placeholder} badge={badge || undefined} />
    <SelectContent>
      {showGroups ? (
        <>
          <SelectGroup>
            <SelectLabel label="Multi-Modal" />
            <SelectItem
              value="gpt-4o"
              label="GPT-4o"
              icon={showIcons ? asIcon(Zap) : undefined}
              caption={showCaptions ? "Fast and capable" : undefined}
            />
            <SelectItem
              value="claude-3.5"
              label="Claude 3.5 Sonnet"
              icon={showIcons ? asIcon(Cpu) : undefined}
              caption={showCaptions ? "Great for analysis" : undefined}
            />
          </SelectGroup>
          <SelectGroup>
            <SelectLabel label="Text-Only" />
            <SelectItem
              value="gpt-3.5"
              label="GPT-3.5 Turbo"
              icon={showIcons ? asIcon(Sparkles) : undefined}
              caption={showCaptions ? "Fast and affordable" : undefined}
            />
          </SelectGroup>
        </>
      ) : (
        <>
          <SelectItem
            value="option1"
            label="Option 1"
            icon={showIcons ? asIcon(Globe) : undefined}
            caption={showCaptions ? "First option" : undefined}
          />
          <SelectItem
            value="option2"
            label="Option 2"
            icon={showIcons ? asIcon(Bot) : undefined}
            caption={showCaptions ? "Second option" : undefined}
          />
          <SelectItem
            value="option3"
            label="Option 3"
            icon={showIcons ? asIcon(Zap) : undefined}
            caption={showCaptions ? "Third option" : undefined}
          />
        </>
      )}
    </SelectContent>
  </Select>
);

export const Playground: Story = {
  args: {
    placeholder: "Select an option",
    disabled: false,
    badge: "",
    showGroups: false,
    showIcons: false,
    showCaptions: false,
  },
  render: (args) => <SelectPlayground {...args} />,
};

export const Default: Story = {
  render: () => (
    <Select>
      <SelectTrigger placeholder="Select an option" />
      <SelectContent>
        <SelectItem value="option1" label="Option 1" />
        <SelectItem value="option2" label="Option 2" />
        <SelectItem value="option3" label="Option 3" />
      </SelectContent>
    </Select>
  ),
};

export const WithGroups: Story = {
  render: () => (
    <Select>
      <SelectTrigger placeholder="Select a model" />
      <SelectContent>
        <SelectGroup>
          <SelectLabel label="Multi-Modal" />
          <SelectItem value="gpt-4o" label="GPT-4o" />
          <SelectItem value="gpt-4o-mini" label="GPT-4o-mini" />
          <SelectItem value="gpt-4.1" label="GPT 4.1" />
          <SelectItem value="gpt-4.1-nano" label="GPT 4.1 nano" />
          <SelectItem value="gpt-4.1-mini" label="GPT 4.1 mini" />
          <SelectItem value="claude-3.5-sonnet" label="Claude 3.5 Sonnet" />
          <SelectItem value="claude-sonnet-4.5" label="Claude Sonnet 4.5" />
        </SelectGroup>
        <SelectGroup>
          <SelectLabel label="Text-Only" />
          <SelectItem
            value="vertex-ai-claude-3.5-sonnet-v2"
            label="Vertex AI Claude 3.5 Sonnet V2"
          />
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const WithRichItems: Story = {
  render: () => (
    <Select>
      <SelectTrigger badge="Beta" placeholder="Choose a service" />
      <SelectContent>
        <SelectGroup>
          <SelectLabel label="AI Services" />
          <SelectItem
            value="fast"
            label="Fast Inference"
            caption="Optimized for speed"
            icon={asIcon(Zap)}
            badge="Popular"
          />
          <SelectItem
            value="precise"
            label="Precise Logic"
            caption="Best for complex reasoning"
            icon={asIcon(Cpu)}
          />
          <SelectItem
            value="creative"
            label="Creative Mode"
            caption="For brainstorming and writing"
            icon={asIcon(Sparkles)}
            badge="New"
          />
        </SelectGroup>
        <SelectGroup>
          <SelectLabel label="Deployment" />
          <SelectItem
            value="global"
            label="Global Edge"
            caption="Deploy to 100+ regions"
            icon={asIcon(Globe)}
          />
          <SelectItem
            value="local"
            label="Local Instance"
            caption="Run on your own infra"
            icon={asIcon(Bot)}
          />
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const WithImageIcons: Story = {
  render: () => (
    <Select>
      <SelectTrigger placeholder="Select a provider" />
      <SelectContent>
        <SelectGroup>
          <SelectLabel label="Cloud Providers" />
          <SelectItem
            value="aws"
            label="AWS"
            icon={
              <svg
                width={16}
                height={16}
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="size-4"
              >
                <rect width={16} height={16} rx={2} fill="#FF9900" />
                <path
                  d="M8 5c-1.5 0-2.7 1-3.1 2.4-.3-.1-.6-.1-1-.1-1.4 0-2.5 1.1-2.5 2.5S2.5 12.4 4 12.4h6c1.4 0 2.5-1.1 2.5-2.5S11.4 7.4 10 7.4c-.2-1.3-1.4-2.4-2-2.4z"
                  fill="white"
                  opacity={0.95}
                />
              </svg>
            }
          />
          <SelectItem
            value="azure"
            label="Azure"
            icon={
              <svg
                width={16}
                height={16}
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="size-4"
              >
                <rect width={16} height={16} rx={2} fill="#0078D4" />
                <path
                  d="M4 4l4 4-4 4V4zm8 0v8l-4-4 4-4z"
                  fill="white"
                  opacity={0.95}
                />
              </svg>
            }
            caption="Microsoft Cloud"
          />
          <SelectItem
            value="gcp"
            label="Google Cloud"
            icon={
              <svg
                width={16}
                height={16}
                viewBox="0 0 16 16"
                fill="none"
                xmlns="http://www.w3.org/2000/svg"
                className="size-4"
              >
                <rect width={16} height={16} rx={2} fill="#4285F4" />
                <path
                  d="M8 4.5c-1.9 0-3.5 1.6-3.5 3.5 0 .3.1.6.2.9C3.8 9.2 3 10 3 11c0 1.1.9 2 2 2h6c1.1 0 2-.9 2-2 0-1-.8-1.8-1.7-2.1.1-.3.2-.6.2-.9 0-1.9-1.6-3.5-3.5-3.5z"
                  fill="white"
                  opacity={0.95}
                />
              </svg>
            }
            badge="Popular"
          />
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};

export const WithValueOverride: Story = {
  render: () => (
    <Select defaultValue="option2">
      <SelectTrigger
        placeholder="Select an option"
        value="Custom Display Value"
      />
      <SelectContent>
        <SelectItem value="option1" label="Option 1" />
        <SelectItem value="option2" label="Option 2" />
        <SelectItem value="option3" label="Option 3" />
      </SelectContent>
    </Select>
  ),
};

export const AllFeatures: Story = {
  render: () => (
    <Select>
      <SelectTrigger badge="Badge" placeholder="Select an option" />
      <SelectContent>
        <SelectGroup>
          <SelectLabel label="Group Label" />
          <SelectItem
            value="option1"
            label="Label"
            caption="This is a caption with additional context"
            icon={asIcon(Zap)}
            badge="Badge"
          />
          <SelectItem
            value="option2"
            label="Label"
            caption="This is a caption with additional context"
            icon={asIcon(Cpu)}
            badge="Badge"
          />
          <SelectItem
            value="option3"
            label="Label"
            caption="This is a caption with additional context"
            icon={asIcon(Sparkles)}
            badge="Badge"
          />
        </SelectGroup>
      </SelectContent>
    </Select>
  ),
};
