import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import type { ColumnDef } from "@tanstack/react-table";
import { DataTable } from "../../base/data-table";
import { Button } from "../../base/button";
import { Checkbox } from "../../base/checkbox";
import { Input } from "../../base/input";
import {
  DropdownMenu,
  DropdownMenuCheckboxItem,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "../../base/dropdown-menu";
import { ChevronDown, MoreHorizontal } from "lucide-react";

// Sample data type matching the screenshot
type Payment = {
  id: string;
  status: "Success" | "Processing" | "Failed";
  email: string;
  amount: number;
};

// Sample data matching the screenshot
const paymentsData: Payment[] = [
  {
    id: "1",
    status: "Success",
    email: "michael.mitc@example.com",
    amount: 630.44,
  },
  {
    id: "2",
    status: "Success",
    email: "felicia.reid@example.com",
    amount: 767.5,
  },
  {
    id: "3",
    status: "Processing",
    email: "georgia.young@example.com",
    amount: 396.84,
  },
  {
    id: "4",
    status: "Success",
    email: "alma.lawson@example.com",
    amount: 475.22,
  },
  {
    id: "5",
    status: "Failed",
    email: "dolores.chambers@example.com",
    amount: 275.43,
  },
  {
    id: "6",
    status: "Success",
    email: "john.doe@example.com",
    amount: 892.15,
  },
  {
    id: "7",
    status: "Processing",
    email: "jane.smith@example.com",
    amount: 156.78,
  },
  {
    id: "8",
    status: "Failed",
    email: "bob.wilson@example.com",
    amount: 423.91,
  },
  {
    id: "9",
    status: "Success",
    email: "sarah.connor@example.com",
    amount: 1250.0,
  },
  {
    id: "10",
    status: "Success",
    email: "mike.johnson@example.com",
    amount: 89.99,
  },
  {
    id: "11",
    status: "Processing",
    email: "emily.davis@example.com",
    amount: 567.32,
  },
  {
    id: "12",
    status: "Failed",
    email: "chris.martin@example.com",
    amount: 234.56,
  },
];

// Column definitions
const createColumns = (
  enableSelection: boolean,
): ColumnDef<Payment, unknown>[] => {
  const columns: ColumnDef<Payment, unknown>[] = [];

  if (enableSelection) {
    columns.push({
      id: "select",
      header: ({ table }) => (
        <Checkbox
          checked={table.getIsAllPageRowsSelected()}
          onCheckedChange={(value) => table.toggleAllPageRowsSelected(!!value)}
          aria-label="Select all"
        />
      ),
      cell: ({ row }) => (
        <Checkbox
          checked={row.getIsSelected()}
          onCheckedChange={(value) => row.toggleSelected(!!value)}
          aria-label="Select row"
        />
      ),
      size: 40,
    });
  }

  columns.push(
    {
      accessorKey: "status",
      header: "Status",
      cell: ({ row }) => {
        const status = String(row.getValue("status"));
        return <span>{status}</span>;
      },
    },
    {
      accessorKey: "email",
      header: "Email",
    },
    {
      accessorKey: "amount",
      header: "Amount",
      cell: ({ row }) => {
        const amount = parseFloat(row.getValue("amount"));
        const formatted = new Intl.NumberFormat("en-US", {
          style: "currency",
          currency: "USD",
        }).format(amount);
        return <div className="font-medium">{formatted}</div>;
      },
      meta: { align: "right" as const },
    },
  );

  // Actions column - always included in this demo
  columns.push({
    id: "actions",
    cell: ({ row }) => {
      const payment = row.original;
      return (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="ghost"
              size="icon-sm"
              startIcon={<MoreHorizontal className="size-4" />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              label="Copy payment ID"
              onClick={() => {
                void navigator.clipboard.writeText(payment.id);
              }}
            />
            <DropdownMenuSeparator />
            <DropdownMenuItem label="View customer" />
            <DropdownMenuItem label="View payment details" />
          </DropdownMenuContent>
        </DropdownMenu>
      );
    },
    size: 40,
  });

  return columns;
};

// Story props type
type StoryProps = {
  pagination: boolean;
  isLoading: boolean;
  enableRowSelection: boolean;
  showEmptyState: boolean;
  showToolbar: boolean;
};

const meta: Meta<StoryProps> = {
  title: "Base/DataTable",
  tags: ["autodocs"],
  argTypes: {
    pagination: {
      control: "boolean",
      description: "Enable pagination",
    },
    isLoading: {
      control: "boolean",
      description: "Show loading state",
    },
    enableRowSelection: {
      control: "boolean",
      description: "Enable row selection with checkboxes",
    },
    showEmptyState: {
      control: "boolean",
      description: "Show empty state (no data)",
    },
    showToolbar: {
      control: "boolean",
      description: "Show toolbar with filter and columns dropdown",
    },
  },
};

// eslint-disable-next-line no-restricted-syntax
export default meta;
type Story = StoryObj<StoryProps>;

const DataTableStory = ({
  pagination,
  isLoading,
  enableRowSelection,
  showEmptyState,
  showToolbar,
}: StoryProps) => {
  const [rowSelection, setRowSelection] = React.useState<
    Record<string, boolean>
  >({});
  const [filterValue, setFilterValue] = React.useState("");
  const [columnVisibility, setColumnVisibility] = React.useState({
    status: true,
    email: true,
    amount: true,
  });

  // Filter data based on email
  const filteredData = React.useMemo(() => {
    if (showEmptyState) return [];
    if (!filterValue) return paymentsData;
    return paymentsData.filter((payment) =>
      payment.email.toLowerCase().includes(filterValue.toLowerCase()),
    );
  }, [filterValue, showEmptyState]);

  const columns = createColumns(enableRowSelection);

  // Get hidden columns based on visibility state
  const hiddenColumns = Object.entries(columnVisibility)
    .filter(([, visible]) => !visible)
    .map(([key]) => key);

  const tableContent = enableRowSelection ? (
    <DataTable
      columns={columns}
      data={filteredData}
      getDataId={(row) => row.id}
      pagination={pagination}
      isLoading={isLoading}
      rowSelection={rowSelection}
      onRowSelectionChange={setRowSelection}
      hiddenColumns={hiddenColumns}
      empty="No results."
    />
  ) : (
    <DataTable
      columns={columns}
      data={filteredData}
      getDataId={(row) => row.id}
      pagination={pagination}
      isLoading={isLoading}
      hiddenColumns={hiddenColumns}
      empty="No results."
    />
  );

  if (!showToolbar) {
    return tableContent;
  }

  return (
    <div className="flex flex-col gap-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between">
        <Input
          placeholder="Filter emails..."
          value={filterValue}
          onChange={(e) => setFilterValue(e.target.value)}
          style={{ width: 373 }}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button
              variant="outline"
              label="Columns"
              endIcon={<ChevronDown className="size-4" />}
            />
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuCheckboxItem
              label="Status"
              checked={columnVisibility.status}
              onCheckedChange={(checked) =>
                setColumnVisibility((prev) => ({
                  ...prev,
                  status: Boolean(checked),
                }))
              }
            />
            <DropdownMenuCheckboxItem
              label="Email"
              checked={columnVisibility.email}
              onCheckedChange={(checked) =>
                setColumnVisibility((prev) => ({
                  ...prev,
                  email: Boolean(checked),
                }))
              }
            />
            <DropdownMenuCheckboxItem
              label="Amount"
              checked={columnVisibility.amount}
              onCheckedChange={(checked) =>
                setColumnVisibility((prev) => ({
                  ...prev,
                  amount: Boolean(checked),
                }))
              }
            />
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {tableContent}
    </div>
  );
};

export const Default: Story = {
  args: {
    pagination: true,
    isLoading: false,
    enableRowSelection: true,
    showEmptyState: false,
    showToolbar: true,
  },
  render: (args) => <DataTableStory {...args} />,
};

export const WithoutToolbar: Story = {
  args: {
    pagination: true,
    isLoading: false,
    enableRowSelection: true,
    showEmptyState: false,
    showToolbar: false,
  },
  render: (args) => <DataTableStory {...args} />,
};

export const Loading: Story = {
  args: {
    pagination: true,
    isLoading: true,
    enableRowSelection: true,
    showEmptyState: false,
    showToolbar: true,
  },
  render: (args) => <DataTableStory {...args} />,
};

export const Empty: Story = {
  args: {
    pagination: true,
    isLoading: false,
    enableRowSelection: true,
    showEmptyState: true,
    showToolbar: true,
  },
  render: (args) => <DataTableStory {...args} />,
};
