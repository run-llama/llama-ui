import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import {
  FileText,
  Folder,
  Home,
  Inbox,
  Plus,
  Search,
  Settings,
  User,
} from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInset,
  SidebarMenu,
  SidebarMenuBadge,
  SidebarMenuButton,
  SidebarMenuItem,
  SidebarMenuSkeleton,
  SidebarMenuSub,
  SidebarMenuSubButton,
  SidebarMenuSubItem,
  SidebarProvider,
  SidebarSeparator,
  SidebarTrigger,
} from "../../base/sidebar";
import { Skeleton } from "../../base/skeleton";

// Story props for the Playground
type SidebarStoryProps = {
  variant: "sidebar" | "floating" | "inset";
  collapsible: "offcanvas" | "icon" | "none";
  defaultOpen: boolean;
  showHeader: boolean;
  showFooter: boolean;
  showBadges: boolean;
};

const meta: Meta<SidebarStoryProps> = {
  title: "Base/Sidebar",
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["sidebar", "floating", "inset"],
      description: "Visual variant of the sidebar",
    },
    collapsible: {
      control: "select",
      options: ["offcanvas", "icon", "none"],
      description: "How the sidebar collapses",
    },
    defaultOpen: {
      control: "boolean",
      description: "Whether the sidebar starts open",
    },
    showHeader: {
      control: "boolean",
      description: "Show the sidebar header",
    },
    showFooter: {
      control: "boolean",
      description: "Show the sidebar footer",
    },
    showBadges: {
      control: "boolean",
      description: "Show badges on menu items",
    },
  },
  decorators: [
    (Story) => (
      <div className="h-[600px] w-full overflow-hidden rounded-lg border">
        <Story />
      </div>
    ),
  ],
};

// eslint-disable-next-line no-restricted-syntax
export default meta;
type Story = StoryObj<SidebarStoryProps>;

// Playground sidebar with controls
const PlaygroundSidebarDemo = ({
  variant,
  collapsible,
  defaultOpen,
  showHeader,
  showFooter,
  showBadges,
}: SidebarStoryProps) => {
  const [open, setOpen] = React.useState(defaultOpen);

  return (
    <SidebarProvider
      defaultOpen={defaultOpen}
      open={open}
      onOpenChange={setOpen}
      cookieOptions={{ name: "storybook-sidebar-playground" }}
    >
      <Sidebar variant={variant} collapsible={collapsible}>
        {showHeader && (
          <>
            <SidebarHeader>
              <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:hidden">
                <div className="size-6 rounded bg-primary" />
                <span className="font-semibold">Acme Inc</span>
              </div>
              <div className="hidden group-data-[collapsible=icon]:block">
                <div className="size-6 rounded bg-primary" />
              </div>
            </SidebarHeader>
            <SidebarSeparator />
          </>
        )}
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive
                    icon={<Home className="size-4" />}
                    label="Home"
                    tooltip="Home"
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Inbox className="size-4" />}
                    label="Inbox"
                    tooltip="Inbox"
                  />
                  {showBadges && <SidebarMenuBadge>24</SidebarMenuBadge>}
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Search className="size-4" />}
                    label="Search"
                    tooltip="Search"
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Settings className="size-4" />}
                    label="Settings"
                    tooltip="Settings"
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Folder className="size-4" />}
                    label="Design System"
                    tooltip="Design System"
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Folder className="size-4" />}
                    label="Marketing Site"
                    tooltip="Marketing Site"
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        {showFooter && (
          <SidebarFooter>
            <SidebarSeparator />
            <SidebarMenu>
              <SidebarMenuItem>
                <SidebarMenuButton
                  icon={<User className="size-4" />}
                  label="John Doe"
                  tooltip="John Doe"
                />
              </SidebarMenuItem>
            </SidebarMenu>
          </SidebarFooter>
        )}
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>
        <div className="flex-1 p-4">
          <p className="text-muted-foreground">
            Use the controls panel to customize the sidebar.
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export const Playground: Story = {
  args: {
    variant: "sidebar",
    collapsible: "icon",
    defaultOpen: true,
    showHeader: true,
    showFooter: true,
    showBadges: true,
  },
  render: (args) => <PlaygroundSidebarDemo {...args} />,
};

// Basic sidebar with navigation items
const BasicSidebarDemo = () => {
  const [open, setOpen] = React.useState(true);

  return (
    <SidebarProvider
      defaultOpen={true}
      open={open}
      onOpenChange={setOpen}
      cookieOptions={{ name: "storybook-sidebar" }}
    >
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:hidden">
            <div className="size-6 rounded bg-primary" />
            <span className="font-semibold">Acme Inc</span>
          </div>
          <div className="hidden group-data-[collapsible=icon]:block">
            <div className="size-6 rounded bg-primary" />
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Platform</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive
                    icon={<Home className="size-4" />}
                    label="Home"
                    tooltip="Home"
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Inbox className="size-4" />}
                    label="Inbox"
                    tooltip="Inbox"
                  />
                  <SidebarMenuBadge>24</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Search className="size-4" />}
                    label="Search"
                    tooltip="Search"
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Settings className="size-4" />}
                    label="Settings"
                    tooltip="Settings"
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>

          <SidebarGroup>
            <SidebarGroupLabel>Projects</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Folder className="size-4" />}
                    label="Design System"
                    tooltip="Design System"
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Folder className="size-4" />}
                    label="Marketing Site"
                    tooltip="Marketing Site"
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Plus className="size-4" />}
                    label="Add Project"
                    tooltip="Add Project"
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                icon={<User className="size-4" />}
                label="John Doe"
                tooltip="John Doe"
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>
        <div className="flex-1 p-4">
          <p className="text-muted-foreground">
            Click the toggle button or the collapsed sidebar to expand/collapse.
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export const Basic: Story = {
  render: () => <BasicSidebarDemo />,
};

// Sidebar with nested navigation
const NestedNavigationDemo = () => {
  const [open, setOpen] = React.useState(true);
  const [openItems, setOpenItems] = React.useState<string[]>(["documents"]);

  const toggleItem = (item: string) => {
    setOpenItems((prev) =>
      prev.includes(item) ? prev.filter((i) => i !== item) : [...prev, item],
    );
  };

  return (
    <SidebarProvider
      defaultOpen={true}
      open={open}
      onOpenChange={setOpen}
      cookieOptions={{ name: "storybook-sidebar-nested" }}
    >
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:hidden">
            <FileText className="size-5 text-primary" />
            <span className="font-semibold">DocManager</span>
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>Navigation</SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive
                    icon={<Home className="size-4" />}
                    label="Dashboard"
                    tooltip="Dashboard"
                  />
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    menuType="collapsible"
                    icon={<Folder className="size-4" />}
                    label="Documents"
                    tooltip="Documents"
                    isOpen={openItems.includes("documents")}
                    onClick={() => toggleItem("documents")}
                  />
                  {openItems.includes("documents") && (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton isActive>
                          <span>All Documents</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>
                          <span>Shared with me</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>
                          <span>Recent</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>
                          <span>Starred</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    menuType="collapsible"
                    icon={<FileText className="size-4" />}
                    label="Templates"
                    tooltip="Templates"
                    isOpen={openItems.includes("templates")}
                    onClick={() => toggleItem("templates")}
                  />
                  {openItems.includes("templates") && (
                    <SidebarMenuSub>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>
                          <span>Invoice</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>
                          <span>Contract</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                      <SidebarMenuSubItem>
                        <SidebarMenuSubButton>
                          <span>Report</span>
                        </SidebarMenuSubButton>
                      </SidebarMenuSubItem>
                    </SidebarMenuSub>
                  )}
                </SidebarMenuItem>

                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Settings className="size-4" />}
                    label="Settings"
                    tooltip="Settings"
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                icon={<User className="size-4" />}
                label="Account"
                tooltip="Account"
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Documents</h1>
        </header>
        <div className="flex-1 p-4">
          <p className="text-muted-foreground">
            This sidebar demonstrates nested navigation with collapsible
            sections.
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export const NestedNavigation: Story = {
  render: () => <NestedNavigationDemo />,
};

// Floating variant sidebar
const FloatingSidebarDemo = () => {
  const [open, setOpen] = React.useState(true);

  return (
    <SidebarProvider
      defaultOpen={true}
      open={open}
      onOpenChange={setOpen}
      cookieOptions={{ name: "storybook-sidebar-floating" }}
    >
      <Sidebar variant="floating" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2 group-data-[collapsible=icon]:hidden">
            <div className="size-6 rounded-full bg-gradient-to-br from-violet-500 to-pink-500" />
            <span className="font-semibold">Workspace</span>
          </div>
        </SidebarHeader>
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive
                    icon={<Home className="size-4" />}
                    label="Overview"
                    tooltip="Overview"
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Inbox className="size-4" />}
                    label="Messages"
                    tooltip="Messages"
                  />
                  <SidebarMenuBadge>5</SidebarMenuBadge>
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<FileText className="size-4" />}
                    label="Files"
                    tooltip="Files"
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                icon={<Settings className="size-4" />}
                label="Settings"
                tooltip="Settings"
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Overview</h1>
        </header>
        <div className="flex-1 p-4">
          <p className="text-muted-foreground">
            This is the floating variant with rounded corners and shadow.
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export const Floating: Story = {
  render: () => <FloatingSidebarDemo />,
};

// Loading skeleton state
const LoadingDemo = () => {
  const [open, setOpen] = React.useState(true);

  return (
    <SidebarProvider
      defaultOpen={true}
      open={open}
      onOpenChange={setOpen}
      cookieOptions={{ name: "storybook-sidebar-loading" }}
    >
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center gap-2 px-2">
            <Skeleton className="size-6 rounded" />
            <Skeleton className="h-4 w-24 group-data-[collapsible=icon]:hidden" />
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupLabel>
              <Skeleton className="h-3 w-16" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 5 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
          <SidebarGroup>
            <SidebarGroupLabel>
              <Skeleton className="h-3 w-20" />
            </SidebarGroupLabel>
            <SidebarGroupContent>
              <SidebarMenu>
                {Array.from({ length: 3 }).map((_, i) => (
                  <SidebarMenuItem key={i}>
                    <SidebarMenuSkeleton showIcon />
                  </SidebarMenuItem>
                ))}
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuSkeleton showIcon />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-4">
          <SidebarTrigger />
          <Skeleton className="h-5 w-32" />
        </header>
        <div className="flex-1 p-4">
          <div className="space-y-4">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-4 w-full max-w-md" />
            <Skeleton className="h-4 w-full max-w-sm" />
          </div>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export const Loading: Story = {
  render: () => <LoadingDemo />,
};

// Collapsed by default
const CollapsedDemo = () => {
  const [open, setOpen] = React.useState(false);

  return (
    <SidebarProvider
      defaultOpen={false}
      open={open}
      onOpenChange={setOpen}
      cookieOptions={{ name: "storybook-sidebar-collapsed" }}
    >
      <Sidebar variant="sidebar" collapsible="icon">
        <SidebarHeader>
          <div className="flex items-center justify-center">
            <div className="size-6 rounded bg-primary" />
          </div>
        </SidebarHeader>
        <SidebarSeparator />
        <SidebarContent>
          <SidebarGroup>
            <SidebarGroupContent>
              <SidebarMenu>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    isActive
                    icon={<Home className="size-4" />}
                    label="Home"
                    tooltip="Home"
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Inbox className="size-4" />}
                    label="Inbox"
                    tooltip="Inbox"
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Search className="size-4" />}
                    label="Search"
                    tooltip="Search"
                  />
                </SidebarMenuItem>
                <SidebarMenuItem>
                  <SidebarMenuButton
                    icon={<Settings className="size-4" />}
                    label="Settings"
                    tooltip="Settings"
                  />
                </SidebarMenuItem>
              </SidebarMenu>
            </SidebarGroupContent>
          </SidebarGroup>
        </SidebarContent>
        <SidebarFooter>
          <SidebarSeparator />
          <SidebarMenu>
            <SidebarMenuItem>
              <SidebarMenuButton
                icon={<User className="size-4" />}
                label="Profile"
                tooltip="Profile"
              />
            </SidebarMenuItem>
          </SidebarMenu>
        </SidebarFooter>
      </Sidebar>
      <SidebarInset>
        <header className="flex h-14 items-center gap-4 border-b px-4">
          <SidebarTrigger />
          <h1 className="text-lg font-semibold">Dashboard</h1>
        </header>
        <div className="flex-1 p-4">
          <p className="text-muted-foreground">
            This sidebar starts collapsed. Click the sidebar or toggle to
            expand.
          </p>
        </div>
      </SidebarInset>
    </SidebarProvider>
  );
};

export const Collapsed: Story = {
  render: () => <CollapsedDemo />,
};
