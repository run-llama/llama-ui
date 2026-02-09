"use client";

import { createCookieStorage } from "./utils/cookie";
import { Slot } from "@radix-ui/react-slot";
import type { VariantProps } from "class-variance-authority";
import { cva } from "class-variance-authority";
import {
  Check,
  ChevronRight,
  ChevronsUpDown,
  MoreHorizontal,
  PanelLeftIcon,
} from "lucide-react";
import * as React from "react";
import { DEFAULT_MOBILE_BREAKPOINT, useIsMobile } from "./utils/hooks/use-mobile";
import { cn, normalizeCid } from "../lib/utils";
import { Button } from "./button";
import { Input } from "./input";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "./sheet";
import { Skeleton } from "./skeleton";
import { Tooltip, TooltipProvider } from "./tooltip";
import type { AnalyticsProps } from "../types/analytics";

const SIDEBAR_COOKIE_EXPIRES_IN_DAYS = 7;
const SIDEBAR_WIDTH = "16rem";
const SIDEBAR_WIDTH_MOBILE = "18rem";
const SIDEBAR_WIDTH_ICON = "3rem";
const SIDEBAR_KEYBOARD_SHORTCUT = "b";

type SidebarContextProps = {
  state: "expanded" | "collapsed";
  open: boolean;
  setOpen: (open: boolean) => void;
  openMobile: boolean;
  setOpenMobile: (open: boolean) => void;
  isMobile: boolean;
  toggleSidebar: () => void;
};

const SidebarContext = React.createContext<SidebarContextProps | null>(null);

function useSidebar() {
  const context = React.use(SidebarContext);
  if (!context) {
    throw new Error("useSidebar must be used within a SidebarProvider.");
  }

  return context;
}

function SidebarProvider({
  defaultOpen = true,
  open: openProp,
  onOpenChange: setOpenProp,
  className,
  style,
  children,
  cookieOptions,
  mobileBreakpoint = DEFAULT_MOBILE_BREAKPOINT,
  ...props
}: React.ComponentProps<"div"> & {
  defaultOpen?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
  cookieOptions: {
    name: string;
    maxAge?: number;
  };
  /** Viewport width threshold for mobile/sheet mode (default: 768px) */
  mobileBreakpoint?: number;
}) {
  const isMobile = useIsMobile(mobileBreakpoint);
  const [openMobile, setOpenMobile] = React.useState(false);
  const { getItem, setItem } = createCookieStorage();

  // Read directly from cookie on client, fallback to defaultOpen on server
  const getInitialState = () => {
    if (typeof window === "undefined") return defaultOpen;
    const cookie = getItem(cookieOptions.name);
    return cookie === null ? defaultOpen : cookie === "true";
  };

  const [_open, _setOpen] = React.useState(getInitialState);
  const open = openProp ?? _open;
  const setOpen = React.useCallback(
    (value: boolean | ((value: boolean) => boolean)) => {
      const openState = typeof value === "function" ? value(open) : value;
      if (setOpenProp) {
        setOpenProp(openState);
      } else {
        _setOpen(openState);
      }
      // This sets the cookie to keep the sidebar state.
      setItem(cookieOptions.name, openState.toString(), {
        expires: SIDEBAR_COOKIE_EXPIRES_IN_DAYS,
      });
    },
    [setOpenProp, open, setItem, cookieOptions],
  );

  // Helper to toggle the sidebar.
  const toggleSidebar = React.useCallback(() => {
    return isMobile ? setOpenMobile((open) => !open) : setOpen((open) => !open);
  }, [isMobile, setOpen, setOpenMobile]);

  // Adds a keyboard shortcut to toggle the sidebar.
  React.useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (
        event.key === SIDEBAR_KEYBOARD_SHORTCUT &&
        (event.metaKey || event.ctrlKey)
      ) {
        event.preventDefault();
        toggleSidebar();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [toggleSidebar]);

  // We add a state so that we can do data-state="expanded" or "collapsed".
  // This makes it easier to style the sidebar with Tailwind classes.
  const state = open ? "expanded" : "collapsed";

  const contextValue = React.useMemo<SidebarContextProps>(
    () => ({
      state,
      open,
      setOpen,
      isMobile,
      openMobile,
      setOpenMobile,
      toggleSidebar,
    }),
    [state, open, setOpen, isMobile, openMobile, setOpenMobile, toggleSidebar],
  );

  return (
    <SidebarContext value={contextValue}>
      <TooltipProvider delayDuration={0}>
        <div
          data-slot="sidebar-wrapper"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH,
              "--sidebar-width-icon": SIDEBAR_WIDTH_ICON,
              ...style,
            } as React.CSSProperties
          }
          className={cn(
            "group/sidebar-wrapper has-data-[variant=inset]:bg-sidebar flex min-h-svh w-full",
            className,
          )}
          {...props}
        >
          {children}
        </div>
      </TooltipProvider>
    </SidebarContext>
  );
}

function Sidebar({
  side = "left",
  variant = "sidebar",
  collapsible = "offcanvas",
  className,
  children,
  ...props
}: React.ComponentProps<"div"> & {
  side?: "left" | "right";
  variant?: "sidebar" | "floating" | "inset";
  collapsible?: "offcanvas" | "icon" | "none";
}) {
  const { isMobile, state, openMobile, setOpenMobile, toggleSidebar } =
    useSidebar();

  if (collapsible === "none") {
    return (
      <div
        data-slot="sidebar"
        className={cn(
          "w-(--sidebar-width) flex h-full flex-col bg-sidebar text-sidebar-foreground",
          className,
        )}
        {...props}
      >
        {children}
      </div>
    );
  }

  if (isMobile) {
    return (
      <Sheet open={openMobile} onOpenChange={setOpenMobile} {...props}>
        <SheetContent
          data-sidebar="sidebar"
          data-slot="sidebar"
          data-mobile="true"
          className="w-(--sidebar-width) bg-sidebar p-0 text-sidebar-foreground [&>button]:hidden"
          style={
            {
              "--sidebar-width": SIDEBAR_WIDTH_MOBILE,
            } as React.CSSProperties
          }
          side={side}
        >
          <SheetHeader className="sr-only">
            <SheetTitle>Sidebar</SheetTitle>
            <SheetDescription>Displays the mobile sidebar.</SheetDescription>
          </SheetHeader>
          <div className="flex h-full w-full flex-col">{children}</div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <div
      className="group peer hidden text-sidebar-foreground md:block"
      data-state={state}
      data-collapsible={state === "collapsed" ? collapsible : ""}
      data-variant={variant}
      data-side={side}
      data-slot="sidebar"
    >
      {/* This is what handles the sidebar gap on desktop */}
      <div
        data-slot="sidebar-gap"
        className={cn(
          "w-(--sidebar-width) relative bg-transparent transition-[width] duration-200 ease-linear",
          "group-data-[collapsible=offcanvas]:w-0",
          "group-data-[side=right]:rotate-180",
          variant === "floating" || variant === "inset"
            ? "group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4)))]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon)",
        )}
      />
      <div
        data-slot="sidebar-container"
        className={cn(
          "w-(--sidebar-width) fixed inset-y-0 z-10 hidden h-svh transition-[left,right,width] duration-200 ease-linear md:flex",
          side === "left"
            ? "left-0 group-data-[collapsible=offcanvas]:left-[calc(var(--sidebar-width)*-1)]"
            : "right-0 group-data-[collapsible=offcanvas]:right-[calc(var(--sidebar-width)*-1)]",
          // Adjust the padding for floating and inset variants.
          variant === "floating" || variant === "inset"
            ? "p-2 group-data-[collapsible=icon]:w-[calc(var(--sidebar-width-icon)+(--spacing(4))+2px)]"
            : "group-data-[collapsible=icon]:w-(--sidebar-width-icon) group-data-[side=left]:border-r group-data-[side=right]:border-l",
          className,
        )}
        {...props}
      >
        <div
          data-sidebar="sidebar"
          data-slot="sidebar-inner"
          className={cn(
            "relative flex h-full w-full flex-col bg-sidebar group-data-[variant=floating]:rounded-lg group-data-[variant=floating]:border group-data-[variant=floating]:border-sidebar-border group-data-[variant=floating]:shadow-sm",
            // When collapsed, show expand cursor on background areas
            "group-data-[collapsible=icon]:cursor-col-resize",
          )}
          onClick={
            state === "collapsed"
              ? (event) => {
                  // Only toggle if clicking on the sidebar background, not on interactive elements
                  const target = event.target as HTMLElement;
                  const isInteractiveElement =
                    target.closest("button") ||
                    target.closest("a") ||
                    target.closest('[role="button"]') ||
                    target.closest("[data-sidebar='menu-button']");
                  if (!isInteractiveElement) {
                    event.preventDefault();
                    toggleSidebar();
                  }
                }
              : undefined
          }
        >
          {children}
          {/* Right border hover area with left arrow cursor - only show when expanded */}
          <div
            className={cn(
              "absolute bottom-0 right-0 top-0 w-1 cursor-w-resize opacity-0 transition-opacity hover:opacity-100",
              "group-data-[collapsible=icon]:hidden",
            )}
            data-slot="sidebar-resize-handle"
            onClick={(event) => {
              event.preventDefault();
              toggleSidebar();
            }}
            role="button"
            tabIndex={0}
            onKeyDown={(event) => {
              if (event.key === "Enter" || event.key === " ") {
                event.preventDefault();
                toggleSidebar();
              }
            }}
            aria-label="Toggle Sidebar"
          />
        </div>
      </div>
    </div>
  );
}

type SidebarTriggerProps = React.ComponentProps<typeof Button> & {
  icon?: React.ReactNode;
  hoverIcon?: React.ReactNode;
  className?: string;
};

function SidebarTrigger({
  icon,
  hoverIcon,
  onClick,
  className,
  ...props
}: SidebarTriggerProps) {
  const { toggleSidebar } = useSidebar();

  if (hoverIcon) {
    return (
      <div className={cn("group relative", className)}>
        <div className="group-hover:opacity-0">
          <Button
            startIcon={icon ?? <PanelLeftIcon />}
            label="Toggle Sidebar"
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            data-testid="sidebar-trigger"
            variant="ghost"
            size="icon-sm"
            onClick={(event) => {
              onClick?.(event);
              toggleSidebar();
            }}
            {...props}
          />
        </div>
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100">
          <Button
            startIcon={hoverIcon}
            label="Toggle Sidebar"
            data-sidebar="trigger"
            data-slot="sidebar-trigger"
            variant="ghost"
            size="icon-sm"
            onClick={(event) => {
              onClick?.(event);
              toggleSidebar();
            }}
            {...props}
          />
        </div>
      </div>
    );
  }

  return (
    <div className={className}>
      <Button
        startIcon={icon ?? <PanelLeftIcon />}
        label="Toggle Sidebar"
        data-sidebar="trigger"
        data-slot="sidebar-trigger"
        data-testid="sidebar-trigger"
        variant="ghost"
        size="icon-sm"
        onClick={(event) => {
          onClick?.(event);
          toggleSidebar();
        }}
        {...props}
      />
    </div>
  );
}

function MobileSidebarTrigger({
  ...props
}: React.ComponentProps<typeof SidebarTrigger>) {
  return (
    <SidebarTrigger
      data-testid="mobile-sidebar-trigger"
      startIcon={<PanelLeftIcon />}
      label="Toggle Sidebar"
      {...props}
    />
  );
}

function SidebarInset({ className, ...props }: React.ComponentProps<"main">) {
  return (
    <main
      data-slot="sidebar-inset"
      className={cn(
        "relative flex w-full flex-1 flex-col bg-background",
        "md:peer-data-[variant=inset]:m-2 md:peer-data-[variant=inset]:ml-0 md:peer-data-[variant=inset]:peer-data-[state=collapsed]:ml-2 md:peer-data-[variant=inset]:rounded-xl md:peer-data-[variant=inset]:shadow-sm",
        className,
      )}
      {...props}
    />
  );
}

function SidebarInput({ ...props }: React.ComponentProps<typeof Input>) {
  return <Input data-slot="sidebar-input" data-sidebar="input" {...props} />;
}

function SidebarHeader({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-header"
      data-sidebar="header"
      className={cn(
        "flex items-center justify-between p-2 group-data-[collapsible=icon]:justify-center group-data-[collapsible=icon]:px-0",
        className,
      )}
      {...props}
    />
  );
}

function SidebarFooter({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-footer"
      data-sidebar="footer"
      className={cn("flex flex-col", className)}
      {...props}
    />
  );
}

function SidebarSeparator({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      role="separator"
      data-slot="sidebar-separator"
      data-sidebar="separator"
      className={cn(
        "w-full shrink-0 border-b border-sidebar-border",
        className,
      )}
      {...props}
    />
  );
}

function SidebarContent({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-content"
      className={cn(
        "flex min-h-0 flex-1 flex-col overflow-auto group-data-[collapsible=icon]:overflow-hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroup({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group"
      data-sidebar="group"
      className={cn(
        "relative flex w-full min-w-0 flex-col p-2 group-data-[collapsible=icon]:items-center",
        className,
      )}
      {...props}
    />
  );
}

/**
 * Group label type variants based on Figma design:
 * - default: Simple label text
 * - collapsible: Label with collapse/expand chevron
 * - action: Label with action button (e.g., add)
 */
type SidebarGroupLabelType = "default" | "collapsible" | "action";

const sidebarGroupLabelVariants = cva(
  "text-sidebar-foreground/70 outline-hidden flex h-8 shrink-0 items-center rounded-md px-2 font-medium ring-sidebar-ring transition-[margin,opacity] duration-200 ease-linear focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0 group-data-[collapsible=icon]:-mt-8 group-data-[collapsible=icon]:opacity-0 text-xs leading-4",
  {
    variants: {
      labelType: {
        default: "",
        collapsible: "",
        action: "",
      },
    },
    defaultVariants: {
      labelType: "default",
    },
  },
);

function SidebarGroupLabel({
  asChild = false,
  labelType = "default",
  ...props
}: Omit<React.ComponentProps<"div">, "className"> & {
  asChild?: boolean;
  labelType?: SidebarGroupLabelType;
}) {
  const Comp = asChild ? Slot : "div";

  return (
    <Comp
      data-slot="sidebar-group-label"
      data-sidebar="group-label"
      data-label-type={labelType}
      className={sidebarGroupLabelVariants({ labelType })}
      {...props}
    />
  );
}

function SidebarGroupAction({
  className,
  asChild = false,
  ...props
}: React.ComponentProps<"button"> & { asChild?: boolean }) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-group-action"
      data-sidebar="group-action"
      className={cn(
        "outline-hidden absolute right-3 top-3.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarGroupContent({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-group-content"
      data-sidebar="group-content"
      className={cn(
        "w-full text-sm group-data-[collapsible=icon]:w-8",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenu({ className, ...props }: React.ComponentProps<"ul">) {
  return (
    <ul
      data-slot="sidebar-menu"
      data-sidebar="menu"
      className={cn(
        "flex w-full min-w-0 flex-col group-data-[collapsible=icon]:w-8 group-data-[collapsible=icon]:items-center",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuItem({ className, ...props }: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-item"
      data-sidebar="menu-item"
      className={cn("group/menu-item relative", className)}
      {...props}
    />
  );
}

/**
 * Menu button type variants based on Figma design:
 * - simple: Basic menu item with icon and text
 * - collapsible: Menu item that can expand/collapse to show sub-items
 * - dropdown: Menu item that triggers a dropdown menu
 * - tree: Menu item for tree navigation structure
 * - badge: Menu item with a badge indicator
 * - bigIcon: Menu item with larger icon display (for project/org selectors)
 * - checkbox: Menu item with checkbox selection
 */
type SidebarMenuButtonType =
  | "simple"
  | "collapsible"
  | "dropdown"
  | "tree"
  | "badge"
  | "bigIcon"
  | "checkbox";

const sidebarMenuButtonVariants = cva(
  "peer/menu-button flex w-full cursor-pointer items-center gap-2 overflow-hidden rounded-md p-2 text-left text-sm outline-hidden ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 group-has-data-[sidebar=menu-action]/menu-item:pr-8 aria-disabled:pointer-events-none aria-disabled:opacity-50 data-[active=true]:bg-sidebar-accent data-[active=true]:font-medium data-[active=true]:text-sidebar-accent-foreground data-[state=open]:bg-sidebar-accent data-[state=open]:text-sidebar-accent-foreground group-data-[collapsible=icon]:size-8! group-data-[collapsible=icon]:p-2! [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0",
  {
    variants: {
      variant: {
        default: "hover:bg-sidebar-accent hover:text-sidebar-accent-foreground",
        outline:
          "bg-background shadow-[0_0_0_1px_hsl(var(--sidebar-border))] hover:bg-sidebar-accent hover:text-sidebar-accent-foreground hover:shadow-[0_0_0_1px_hsl(var(--sidebar-accent))]",
      },
      size: {
        default: "h-8 text-sm",
        sm: "h-7 text-xs",
        lg: "h-12 text-sm group-data-[collapsible=icon]:p-0!",
      },
      menuType: {
        simple: "",
        collapsible: "",
        dropdown: "",
        tree: "",
        badge: "",
        bigIcon:
          "h-auto group-data-[collapsible=icon]:w-full! group-data-[collapsible=icon]:h-auto! group-data-[collapsible=icon]:p-0!",
        checkbox: "",
      },
    },
    defaultVariants: {
      variant: "default",
      size: "default",
      menuType: "simple",
    },
  },
);

type SidebarMenuButtonProps = AnalyticsProps &
  Omit<React.ComponentProps<"button">, "className"> & {
    asChild?: boolean;
    isActive?: boolean;
    tooltip?: string;
    menuType?: SidebarMenuButtonType;
    /** Icon to display (for simple, collapsible, dropdown, badge variants) */
    icon?: React.ReactNode;
    /** Main label text */
    label?: string;
    /** Subtitle text (for bigIcon variant) */
    subtitle?: string;
    /** Badge content (for badge variant) */
    badge?: React.ReactNode;
    /** Whether the collapsible is open (for collapsible variant) */
    isOpen?: boolean;
  } & VariantProps<typeof sidebarMenuButtonVariants>;

function SidebarMenuButton({
  "da-cid": cid,
  asChild = false,
  isActive = false,
  variant = "default",
  size = "default",
  menuType = "simple",
  tooltip,
  icon,
  label,
  subtitle,
  badge,
  isOpen = false,
  ...props
}: SidebarMenuButtonProps) {
  const Comp = asChild ? Slot : "button";
  const { state, isMobile } = useSidebar();

  // Only show tooltip when sidebar is collapsed (not on mobile)
  const showTooltip = tooltip && state === "collapsed" && !isMobile;

  const renderContent = () => {
    switch (menuType) {
      case "dropdown":
        // Icon + Label + MoreHorizontal ("...")
        return (
          <>
            {icon}
            <span className="flex-1 truncate">{label}</span>
            <MoreHorizontal className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
          </>
        );
      case "bigIcon":
        // Large icon + Label + Subtitle + ChevronsUpDown
        return (
          <>
            {icon}
            <div className="grid flex-1 text-left text-sm leading-tight group-data-[collapsible=icon]:hidden">
              <span className="truncate font-medium">{label}</span>
              {subtitle && (
                <span className="truncate text-xs text-muted-foreground">
                  {subtitle}
                </span>
              )}
            </div>
            <ChevronsUpDown className="ml-auto size-4 group-data-[collapsible=icon]:hidden" />
          </>
        );
      case "collapsible":
        // Icon + Label + ChevronRight (rotates when open)
        return (
          <>
            {icon}
            <span className="flex-1 truncate">{label}</span>
            <ChevronRight
              className={cn(
                "ml-auto size-4 transition-transform group-data-[collapsible=icon]:hidden",
                isOpen && "rotate-90",
              )}
            />
          </>
        );
      case "tree":
        // ChevronRight + Icon + Label
        return (
          <>
            <ChevronRight
              className={cn(
                "size-4 transition-transform",
                isOpen && "rotate-90",
              )}
            />
            {icon}
            <span className="flex-1 truncate">{label}</span>
          </>
        );
      case "badge":
        // Icon + Label + Badge
        return (
          <>
            {icon}
            <span className="flex-1 truncate">{label}</span>
            {badge && (
              <span className="ml-auto text-xs group-data-[collapsible=icon]:hidden">
                {badge}
              </span>
            )}
          </>
        );
      case "checkbox":
        // Checkbox + Label
        return (
          <>
            <div
              className={cn(
                "flex size-4 items-center justify-center rounded border border-primary",
                isActive
                  ? "bg-primary text-primary-foreground"
                  : "bg-background",
              )}
            >
              {isActive && <Check className="size-3" />}
            </div>
            <span className="flex-1 truncate">{label}</span>
          </>
        );
      case "simple":
      default:
        // Icon + Label
        return (
          <>
            {icon}
            <span className="flex-1 truncate">{label}</span>
          </>
        );
    }
  };

  const button = (
    <Comp
      data-slot="sidebar-menu-button"
      data-sidebar="menu-button"
      data-size={size}
      data-active={isActive}
      data-menu-type={menuType}
      className={sidebarMenuButtonVariants({ variant, size, menuType })}
      da-cid={cid ?? (label ? normalizeCid(label) : undefined)}
      {...props}
    >
      {renderContent()}
    </Comp>
  );

  if (!showTooltip) {
    return button;
  }

  return (
    <Tooltip trigger={button} side="right" content={tooltip} sideOffset={6} />
  );
}

function SidebarMenuAction({
  className,
  asChild = false,
  showOnHover = false,
  ...props
}: React.ComponentProps<"button"> & {
  asChild?: boolean;
  showOnHover?: boolean;
}) {
  const Comp = asChild ? Slot : "button";

  return (
    <Comp
      data-slot="sidebar-menu-action"
      data-sidebar="menu-action"
      className={cn(
        "outline-hidden absolute right-1 top-1.5 flex aspect-square w-5 items-center justify-center rounded-md p-0 text-sidebar-foreground ring-sidebar-ring transition-transform hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 peer-hover/menu-button:text-sidebar-accent-foreground [&>svg]:size-4 [&>svg]:shrink-0",
        // Increases the hit area of the button on mobile.
        "after:absolute after:-inset-2 md:after:hidden",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        showOnHover &&
          "group-focus-within/menu-item:opacity-100 group-hover/menu-item:opacity-100 data-[state=open]:opacity-100 peer-data-[active=true]/menu-button:text-sidebar-accent-foreground md:opacity-0",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuBadge({
  className,
  ...props
}: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="sidebar-menu-badge"
      data-sidebar="menu-badge"
      className={cn(
        "pointer-events-none absolute right-1 flex h-5 min-w-5 select-none items-center justify-center rounded-md px-1 text-xs font-medium tabular-nums text-sidebar-foreground",
        "peer-hover/menu-button:text-sidebar-accent-foreground peer-data-[active=true]/menu-button:text-sidebar-accent-foreground",
        "peer-data-[size=sm]/menu-button:top-1",
        "peer-data-[size=default]/menu-button:top-1.5",
        "peer-data-[size=lg]/menu-button:top-2.5",
        "group-data-[collapsible=icon]:hidden",
        className,
      )}
      {...props}
    />
  );
}

function SidebarMenuSkeleton({
  className,
  showIcon = false,
  ...props
}: React.ComponentProps<"div"> & {
  showIcon?: boolean;
}) {
  // Random width between 50 to 90%.
  const width = React.useMemo(() => {
    return `${Math.floor(Math.random() * 40) + 50}%`;
  }, []);

  return (
    <div
      data-slot="sidebar-menu-skeleton"
      data-sidebar="menu-skeleton"
      className={cn("flex h-8 items-center gap-2 rounded-md px-2", className)}
      {...props}
    >
      {showIcon && (
        <Skeleton
          className="size-4 rounded-md"
          data-sidebar="menu-skeleton-icon"
        />
      )}
      <Skeleton
        className="max-w-(--skeleton-width) h-4 flex-1"
        data-sidebar="menu-skeleton-text"
        style={
          {
            "--skeleton-width": width,
          } as React.CSSProperties
        }
      />
    </div>
  );
}

/**
 * Submenu type variants based on Figma design:
 * - border: Submenu with left border indicator
 * - default: Submenu without border
 * - indent: Submenu with additional indentation
 */
type SidebarMenuSubType = "border" | "default" | "indent";

const sidebarMenuSubVariants = cva(
  "flex min-w-0 translate-x-px flex-col gap-1 py-0.5 group-data-[collapsible=icon]:hidden",
  {
    variants: {
      subType: {
        border: "mx-3.5 border-l border-sidebar-border px-2.5",
        default: "mx-3.5 px-2.5",
        indent: "mx-6 px-2.5",
      },
    },
    defaultVariants: {
      subType: "border",
    },
  },
);

function SidebarMenuSub({
  subType = "border",
  ...props
}: Omit<React.ComponentProps<"ul">, "className"> & {
  subType?: SidebarMenuSubType;
}) {
  return (
    <ul
      data-slot="sidebar-menu-sub"
      data-sidebar="menu-sub"
      data-sub-type={subType}
      className={sidebarMenuSubVariants({ subType })}
      {...props}
    />
  );
}

function SidebarMenuSubItem({
  className,
  ...props
}: React.ComponentProps<"li">) {
  return (
    <li
      data-slot="sidebar-menu-sub-item"
      data-sidebar="menu-sub-item"
      className={cn("group/menu-sub-item relative", className)}
      {...props}
    />
  );
}

const sidebarMenuSubButtonVariants = cva(
  "outline-hidden flex h-7 min-w-0 -translate-x-px items-center gap-2 overflow-hidden rounded-md px-2 text-sidebar-foreground ring-sidebar-ring hover:bg-sidebar-accent hover:text-sidebar-accent-foreground focus-visible:ring-2 active:bg-sidebar-accent active:text-sidebar-accent-foreground disabled:pointer-events-none disabled:opacity-50 aria-disabled:pointer-events-none aria-disabled:opacity-50 [&>span:last-child]:truncate [&>svg]:size-4 [&>svg]:shrink-0 [&>svg]:text-sidebar-accent-foreground data-[active=true]:bg-sidebar-accent data-[active=true]:text-sidebar-accent-foreground group-data-[collapsible=icon]:hidden",
  {
    variants: {
      size: {
        sm: "text-xs",
        md: "text-sm",
      },
    },
    defaultVariants: {
      size: "md",
    },
  },
);

function SidebarMenuSubButton({
  asChild = false,
  size = "md",
  isActive = false,
  showIcon = false,
  ...props
}: Omit<React.ComponentProps<"a">, "className"> & {
  asChild?: boolean;
  size?: "sm" | "md";
  isActive?: boolean;
  showIcon?: boolean;
}) {
  const Comp = asChild ? Slot : "a";

  return (
    <Comp
      data-slot="sidebar-menu-sub-button"
      data-sidebar="menu-sub-button"
      data-size={size}
      data-active={isActive}
      data-show-icon={showIcon}
      className={sidebarMenuSubButtonVariants({ size })}
      {...props}
    />
  );
}

export {
  MobileSidebarTrigger,
  Sidebar,
  SidebarContent,
  SidebarFooter,
  SidebarGroup,
  SidebarGroupAction,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarHeader,
  SidebarInput,
  SidebarInset,
  SidebarMenu,
  SidebarMenuAction,
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
  useSidebar,
};

export type {
  SidebarMenuButtonType,
  SidebarGroupLabelType,
  SidebarMenuSubType,
};
