import * as React from "react";
import { Info } from "lucide-react";
import { cva, type VariantProps } from "class-variance-authority";

import { cn } from "../lib/utils";
import { Badge } from "./badge";
import { Tooltip } from "./tooltip";

/**
 * Table - A semantic table component for displaying tabular data.
 *
 * Composition:
 * - `Table` - Root wrapper with horizontal scroll support
 * - `TableHeader` - Header section (thead)
 * - `TableBody` - Body section (tbody)
 * - `TableFooter` - Footer section (tfoot)
 * - `TableRow` - Table row (tr) with hover effects
 * - `TableHead` - Header cell (th) with alignment variants, icon, badge, and tooltip
 * - `TableCell` - Data cell (td) with alignment, strong text variants, and badge (text only)
 * - `CustomTableCell` - Data cell (td) that allows any custom children
 *
 * Features:
 * - Alignment variants: left, center, right
 * - Strong text support for table cells
 * - Support for icons, badges, and tooltips in headers
 * - Responsive scrolling for overflow
 *
 * Example:
 * ```tsx
 * <Table>
 *   <TableHeader>
 *     <TableRow>
 *       <TableHead tooltip="Helpful info" label="Name" />
 *       <TableHead alignment="center" badge={<Badge label="New" />} label="Value" />
 *     </TableRow>
 *   </TableHeader>
 *   <TableBody>
 *     <TableRow>
 *       <TableCell strong label="Item 1" />
 *       <TableCell alignment="center" label="100" />
 *     </TableRow>
 *   </TableBody>
 * </Table>
 * ```
 */

export interface TableProps
  extends Omit<React.HTMLAttributes<HTMLTableElement>, "className"> {
  ref?: React.Ref<HTMLTableElement | null>;
  /** Whether to disable the overflow wrapper (useful when table is inside a scrollable container) */
  disableOverflowWrapper?: boolean;
}

const Table = ({ ref, disableOverflowWrapper, ...props }: TableProps) => {
  const tableElement = (
    <table ref={ref} className="w-full text-sm" {...props} />
  );

  if (disableOverflowWrapper) {
    return tableElement;
  }

  return <div className="relative w-full overflow-auto">{tableElement}</div>;
};
Table.displayName = "Table";

export interface TableHeaderProps
  extends Omit<React.HTMLAttributes<HTMLTableSectionElement>, "className"> {
  ref?: React.Ref<HTMLTableSectionElement | null>;
  /** Whether the header should be sticky when scrolling (default: false) */
  sticky?: boolean;
}

const TableHeader = ({ ref, sticky, ...props }: TableHeaderProps) => (
  <thead
    ref={ref}
    className={cn(
      "[&_tr]:border-b [&_tr]:hover:bg-transparent",
      sticky && "sticky top-0 z-10 bg-background"
    )}
    {...props}
  />
);
TableHeader.displayName = "TableHeader";

const TableBody = ({
  ref,
  ...props
}: Omit<React.HTMLAttributes<HTMLTableSectionElement>, "className"> & {
  ref?: React.Ref<HTMLTableSectionElement | null>;
}) => <tbody ref={ref} className="[&_tr:last-child]:border-0" {...props} />;
TableBody.displayName = "TableBody";

const TableFooter = ({
  ref,
  ...props
}: Omit<React.HTMLAttributes<HTMLTableSectionElement>, "className"> & {
  ref?: React.Ref<HTMLTableSectionElement | null>;
}) => (
  <tfoot
    ref={ref}
    className="bg-muted/50 border-t font-medium [&>tr]:last:border-b-0"
    {...props}
  />
);
TableFooter.displayName = "TableFooter";

// TableRow variants for state
const tableRowVariants = cva(
  "border-b transition-colors data-[state=selected]:bg-muted",
  {
    variants: {
      state: {
        default: "",
        hover: "hover:bg-muted/50",
      },
    },
    defaultVariants: {
      state: "default",
    },
  }
);

export interface TableRowProps
  extends Omit<React.HTMLAttributes<HTMLTableRowElement>, "className">,
    VariantProps<typeof tableRowVariants> {
  ref?: React.Ref<HTMLTableRowElement | null>;
  /** Row state - 'default' has no hover effect, 'hover' adds background on hover */
  state?: "default" | "hover";
}

const TableRow = ({ ref, state, ...props }: TableRowProps) => (
  <tr ref={ref} className={tableRowVariants({ state })} {...props} />
);
TableRow.displayName = "TableRow";

// TableHead variants for alignment
const tableHeadVariants = cva(
  "h-10 px-2 align-middle font-medium text-foreground [&:has([role=checkbox])]:pr-0 [&>div]:flex [&>div]:items-center [&>div]:gap-2 [&_svg]:size-4 [&_svg]:shrink-0",
  {
    variants: {
      alignment: {
        left: "text-left [&>div]:justify-start",
        center: "text-center [&>div]:justify-center",
        right: "text-right [&>div]:justify-end [&>div]:flex-row-reverse",
      },
    },
    defaultVariants: {
      alignment: "left",
    },
  }
);

export interface TableHeadProps
  extends Omit<
      React.ThHTMLAttributes<HTMLTableCellElement>,
      "children" | "className"
    >,
    VariantProps<typeof tableHeadVariants> {
  ref?: React.Ref<HTMLTableCellElement | null>;
  /** Text alignment within the header cell (default: "left") */
  alignment?: "left" | "center" | "right";
  /** Optional icon to display before the label */
  icon?: React.ReactNode;
  /** Optional badge to display after the label */
  badge?: React.ReactNode;
  /** Optional tooltip text to display via an info icon */
  tooltip?: string;
  /** The text content of the header cell */
  label?: string;
}

const TableHead = ({
  ref,
  alignment,
  label,
  icon,
  badge,
  tooltip,
  ...props
}: TableHeadProps) => (
  <th ref={ref} className={tableHeadVariants({ alignment })} {...props}>
    <div>
      {icon}
      {label}
      {typeof badge === "string" ? (
        <Badge variant="secondary" label={badge} />
      ) : (
        badge
      )}
      {tooltip && (
        <Tooltip
          trigger={<Info className="size-4 text-muted-foreground" />}
          content={tooltip}
        />
      )}
    </div>
  </th>
);
TableHead.displayName = "TableHead";

// TableCell variants for alignment and strong text
const tableCellVariants = cva(
  "p-2 align-middle [&:has([role=checkbox])]:pr-0 [&>div]:flex [&>div]:items-center [&>div]:gap-2",
  {
    variants: {
      alignment: {
        left: "text-left [&>div]:justify-start",
        center: "text-center [&>div]:justify-center",
        right: "text-right [&>div]:justify-end [&>div]:flex-row-reverse",
      },
      strong: {
        true: "font-semibold",
        false: "font-normal",
      },
    },
    defaultVariants: {
      alignment: "left",
      strong: false,
    },
  }
);

export interface TableCellProps
  extends Omit<
      React.TdHTMLAttributes<HTMLTableCellElement>,
      "children" | "className"
    >,
    VariantProps<typeof tableCellVariants> {
  ref?: React.Ref<HTMLTableCellElement | null>;
  /** Text alignment within the cell (default: "left") */
  alignment?: "left" | "center" | "right";
  /** Whether to use bold/semibold font weight (default: false) */
  strong?: boolean;
  /** Optional badge to display after the text */
  badge?: React.ReactNode;
  /** The text content of the cell */
  label?: string | number | null;
}

const TableCell = ({
  ref,
  alignment,
  strong,
  badge,
  label,
  ...props
}: TableCellProps) => (
  <td ref={ref} className={tableCellVariants({ alignment, strong })} {...props}>
    <div>
      {label}
      {typeof badge === "string" ? (
        <Badge variant="secondary" label={badge} />
      ) : (
        badge
      )}
    </div>
  </td>
);
TableCell.displayName = "TableCell";

export interface CustomTableCellProps
  extends React.TdHTMLAttributes<HTMLTableCellElement>,
    VariantProps<typeof tableCellVariants> {
  ref?: React.Ref<HTMLTableCellElement | null>;
  /** Text alignment within the cell (default: "left") */
  alignment?: "left" | "center" | "right";
  /** Whether to use bold/semibold font weight (default: false) */
  strong?: boolean;
}

const CustomTableCell = ({
  ref,
  className,
  alignment,
  strong,
  children,
  ...props
}: CustomTableCellProps) => (
  <td
    ref={ref}
    className={cn(tableCellVariants({ alignment, strong }), className)}
    {...props}
  >
    <div>{children}</div>
  </td>
);
CustomTableCell.displayName = "CustomTableCell";

export {
  Table,
  TableBody,
  TableCell,
  CustomTableCell,
  tableCellVariants,
  TableFooter,
  TableHead,
  tableHeadVariants,
  TableHeader,
  TableRow,
  tableRowVariants,
};
