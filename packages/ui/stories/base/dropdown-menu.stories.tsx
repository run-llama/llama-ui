import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  BarChart,
  CircleHelp,
  LogOut,
  Mail,
  MessageSquareWarning,
  Signal,
  Bell,
  Shield,
  Settings,
} from "lucide-react";

import { Button } from "../../base/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuGroup,
  DropdownMenuItem,
  DropdownMenuPortal,
  DropdownMenuSeparator,
  DropdownMenuSub,
  DropdownMenuSubContent,
  DropdownMenuSubTrigger,
  DropdownMenuTrigger,
  DropdownMenuUserItem,
  DropdownMenuLabel,
  DropdownMenuCheckboxItem,
  DropdownMenuRadioGroup,
  DropdownMenuRadioItem,
} from "../../base/dropdown-menu";

// Wrapper component for DropdownMenuItem playground
interface DropdownMenuItemPlaygroundProps {
  // MenuItem props
  label: string;
  caption?: string;
  badge?: string;
  shortcut?: string;
  destructive?: boolean;
  inset?: boolean;
  showIcon: boolean;
  disabled?: boolean;
  // MenuLabel props
  sectionLabel: string;
  sectionLevel: 1 | 2;
  showSectionIcon: boolean;
}

const DropdownMenuItemPlayground = ({
  label,
  caption,
  badge,
  shortcut,
  destructive,
  inset,
  showIcon,
  disabled,
  sectionLabel,
  sectionLevel,
  showSectionIcon,
}: DropdownMenuItemPlaygroundProps) => {
  const iconElement = showIcon ? <Settings className="size-4" /> : undefined;
  const sectionIconElement = showSectionIcon ? (
    <Settings className="size-4" />
  ) : undefined;

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" label="Open Menu" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuLabel
          label={sectionLabel}
          level={sectionLevel}
          icon={sectionIconElement}
        />
        <DropdownMenuItem
          label={label}
          caption={caption}
          badge={badge}
          shortcut={shortcut}
          destructive={destructive}
          inset={inset}
          icon={iconElement}
          disabled={disabled}
        />
        <DropdownMenuSeparator />
        <DropdownMenuItem label="Normal Item" icon={<Settings />} />
        <DropdownMenuItem
          label="Destructive Item"
          destructive
          icon={<LogOut />}
        />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

const meta: Meta<typeof DropdownMenuItemPlayground> = {
  title: "Base/DropdownMenu",
  component: DropdownMenuItemPlayground,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof DropdownMenuItemPlayground>;

// Interactive story - use Storybook controls to modify props
export const Playground: Story = {
  argTypes: {
    // MenuItem props
    label: {
      control: "text",
      description: "The text label for the menu item",
    },
    caption: {
      control: "text",
      description: "Secondary text displayed below the main label",
    },
    badge: {
      control: "text",
      description: "Badge text displayed before the shortcut",
    },
    shortcut: {
      control: "text",
      description: "Keyboard shortcut text (e.g., '⌘K')",
    },
    destructive: {
      control: "boolean",
      description: "Style the item as a destructive action (red text)",
    },
    inset: {
      control: "boolean",
      description: "Add left padding for visual indentation",
    },
    showIcon: {
      control: "boolean",
      description: "Show icon at the start of the item",
    },
    disabled: {
      control: "boolean",
      description: "Disables the menu item",
    },
    // MenuLabel props
    sectionLabel: {
      control: "text",
      description: "The text label for the section",
    },
    sectionLevel: {
      control: { type: "select" },
      options: [1, 2],
      description: "Heading level for styling (1 = normal, 2 = indented)",
    },
    showSectionIcon: {
      control: "boolean",
      description: "Show icon before the section label",
    },
  },
  args: {
    label: "Menu Item",
    caption: "This is a caption",
    badge: "New",
    shortcut: "⌘K",
    destructive: false,
    inset: false,
    showIcon: false,
    disabled: false,
    sectionLabel: "Change me",
    sectionLevel: 1,
    showSectionIcon: false,
  },
};

export const Default = () => {
  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" label="Open" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-56">
        <DropdownMenuUserItem
          fullName="Marek Żernik"
          email="marekzernik@gmail.com"
        />
        <DropdownMenuSeparator />
        <DropdownMenuGroup>
          <DropdownMenuItem icon={<BarChart />} label="Usage" />
          <DropdownMenuItem icon={<Signal />} label="Status" />
          <DropdownMenuItem
            icon={<Settings />}
            label="Admin Settings"
            disabled
          />
        </DropdownMenuGroup>
        <DropdownMenuSeparator />
        <DropdownMenuSub>
          <DropdownMenuSubTrigger icon={<CircleHelp />} label="Help" />
          <DropdownMenuPortal>
            <DropdownMenuSubContent>
              <DropdownMenuItem icon={<Mail />} label="Contact Us" />
              <DropdownMenuItem
                icon={<MessageSquareWarning />}
                label="Feedback & Issues"
              />
            </DropdownMenuSubContent>
          </DropdownMenuPortal>
        </DropdownMenuSub>
        <DropdownMenuSeparator />
        <DropdownMenuItem icon={<LogOut />} destructive label="Log out" />
      </DropdownMenuContent>
    </DropdownMenu>
  );
};

export const CheckboxesAndRadios = () => {
  const [showStatusBar, setShowStatusBar] = React.useState(true);
  const [showActivityBar, setShowActivityBar] = React.useState(false);
  const [position, setPosition] = React.useState("bottom");

  return (
    <DropdownMenu>
      <DropdownMenuTrigger asChild>
        <Button variant="outline" label="Preferences" />
      </DropdownMenuTrigger>
      <DropdownMenuContent className="w-80">
        <DropdownMenuLabel label="View Options" icon={<Settings />} />
        <DropdownMenuCheckboxItem
          checked={showStatusBar}
          onCheckedChange={setShowStatusBar}
          icon={<Signal />}
          caption="Show the status bar at the bottom"
          label="Status Bar"
        />
        <DropdownMenuCheckboxItem
          checked={showActivityBar}
          onCheckedChange={setShowActivityBar}
          icon={<BarChart />}
          badge="Beta"
          label="Activity Bar"
        />
        <DropdownMenuSeparator />
        <DropdownMenuLabel label="Panel Position" icon={<Bell />} />
        <DropdownMenuRadioGroup value={position} onValueChange={setPosition}>
          <DropdownMenuRadioItem
            value="top"
            icon={<Shield />}
            caption="Dock to top"
            label="Top"
          />
          <DropdownMenuRadioItem
            value="bottom"
            icon={<Bell />}
            shortcut="⌘B"
            label="Bottom"
          />
        </DropdownMenuRadioGroup>
      </DropdownMenuContent>
    </DropdownMenu>
  );
};
