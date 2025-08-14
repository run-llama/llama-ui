import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "@storybook/test";
import { within, userEvent, screen } from "@storybook/test";
import { useState } from "react";
import { TableRenderer } from "../../src/extracted-data/table-renderer";

const meta: Meta<typeof TableRenderer> = {
  title: "Components/ExtractedData/TableRenderer",
  component: TableRenderer,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof TableRenderer>;

const sampleObjectArray = [
  {
    description: "Labour Charges",
    amount: 1250.0,
    period: {
      start: "09/06/2025",
      end: "10/06/2025",
    },
    category: "service",
    completed: true,
  },
  {
    description: "Material Costs",
    amount: 850.5,
    period: {
      start: "08/06/2025",
      end: "09/06/2025",
    },
    category: "material",
    completed: false,
  },
];


export const BasicTable: Story = {
  args: {
    data: sampleObjectArray,
    keyPath: ["expenses"],
    metadata: {
      extracted: {},
      schema: {
        expenses: {
          isRequired: false,
          isOptional: true,
          schemaType: "array",
          title: "Expenses",
          wasMissing: false,
        },
        "expenses.*.description": {
          isRequired: true,
          isOptional: false,
          schemaType: "string",
          title: "Description",
          wasMissing: false,
        },
        "expenses.*.amount": {
          isRequired: true,
          isOptional: false,
          schemaType: "number",
          title: "Amount",
          wasMissing: false,
        },
        "expenses.*.period.start": {
          isRequired: true,
          isOptional: false,
          schemaType: "string",
          title: "Start",
          wasMissing: false,
        },
        "expenses.*.period.end": {
          isRequired: true,
          isOptional: false,
          schemaType: "string",
          title: "End",
          wasMissing: false,
        },
        "expenses.*.category": {
          isRequired: false,
          isOptional: true,
          schemaType: "string",
          title: "Category",
          wasMissing: false,
        },
        "expenses.*.completed": {
          isRequired: false,
          isOptional: true,
          schemaType: "boolean",
          title: "Completed",
          wasMissing: false,
        },
      },
    },
  },
  render: function Render(args) {
    const [data, setData] = useState(args.data);
    const [changedPaths, setChangedPaths] = useState<Set<string>>(new Set());

    const handleUpdate = (
      index: number,
      key: string,
      value: unknown,
      affectedPaths?: string[],
    ) => {
      // noop for test
      const newData = [...data];
      newData[index] = { ...newData[index], [key]: value };
      setData(newData);

      // Use the affectedPaths provided by handleUpdate
      if (affectedPaths && affectedPaths.length > 0) {
        setChangedPaths((prev) => new Set([...prev, ...affectedPaths]));
      } else {
        // Fallback for backward compatibility
        const cellPath = `${index}.${key}`;
        setChangedPaths((prev) => new Set([...prev, cellPath]));
      }
    };

    const handleAddRow = (newRow: Record<string, unknown>) => {
      // noop for test
      const newData = [...data, newRow];
      setData(newData);

      // Add the new row path to changed paths
      const rowPath = `${data.length}`;
      setChangedPaths((prev) => new Set([...prev, rowPath]));
    };

    const handleDeleteRow = (index: number) => {
      // noop for test
      const newData = data.filter((_, i) => i !== index);
      setData(newData);

      // Mark the entire array as changed when deleting
      setChangedPaths((prev) => new Set([...prev, "table"]));
    };

    return (
      <TableRenderer
        data={data}
        onUpdate={handleUpdate}
        onAddRow={handleAddRow}
        onDeleteRow={handleDeleteRow}
        changedPaths={changedPaths}
        keyPath={args.keyPath}
        metadata={args.metadata ?? { schema: {}, extracted: {} }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that table headers are rendered correctly (with required field indicators)
    expect(canvas.getByText("Description")).toBeInTheDocument();
    expect(canvas.getByText("Amount")).toBeInTheDocument();
    expect(canvas.getByText("Category")).toBeInTheDocument(); // Optional field, no *
    expect(canvas.getByText("Completed")).toBeInTheDocument(); // Boolean field, no *
    expect(canvas.getByText("Period")).toBeInTheDocument();
    expect(canvas.getByText("Start")).toBeInTheDocument();
    expect(canvas.getByText("End")).toBeInTheDocument();
    // Actions column is just an empty header, no text

    // Test that unique data is rendered correctly (as text, not form fields)
    expect(canvas.getByText("Labour Charges")).toBeInTheDocument();
    expect(canvas.getByText("1250")).toBeInTheDocument();
    expect(canvas.getByText("service")).toBeInTheDocument();
    expect(canvas.getByText("true")).toBeInTheDocument(); // Boolean value
    expect(canvas.getByText("Material Costs")).toBeInTheDocument();
    expect(canvas.getByText("850.5")).toBeInTheDocument();
    expect(canvas.getByText("material")).toBeInTheDocument();
    expect(canvas.getByText("false")).toBeInTheDocument(); // Boolean value

    // Test that delete buttons are present
    const deleteButtons = canvas.getAllByTitle("Delete row");
    expect(deleteButtons).toHaveLength(2);

    // Test that add button is present (plus icon button)
    const addButton = canvas.getByRole("button", { name: "" }); // Plus icon button has no accessible name
    expect(addButton).toBeInTheDocument();

    // Test editing functionality - click on a cell to make it editable
    const firstDescription = canvas.getByText("Labour Charges");
    await userEvent.click(firstDescription);

    // Wait for the field to become editable
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Now it should be an input field
    const input = screen.getByDisplayValue("Labour Charges");
    await userEvent.clear(input);
    await userEvent.type(input, "Updated Labour Charges");
    await userEvent.keyboard("{Enter}");

    // Wait for update
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Verify the update
    expect(canvas.getByText("Updated Labour Charges")).toBeInTheDocument();

    // CRITICAL TEST: Verify that the edited cell now has green background
    const updatedCell = canvas
      .getByText("Updated Labour Charges")
      .closest('[class*="bg-green-50"]');
    expect(updatedCell).toBeInTheDocument();

    // Test adding a new row
    await userEvent.click(addButton);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify new row was added (should be 3 delete buttons now)
    const deleteButtonsAfterAdd = canvas.getAllByTitle("Delete row");
    expect(deleteButtonsAfterAdd).toHaveLength(3);

    // Test deleting a row
    const deleteButton = deleteButtons[1]; // Delete the second row
    await userEvent.click(deleteButton);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify row was deleted (should not find "Material Costs" anymore)
    expect(canvas.queryByText("Material Costs")).not.toBeInTheDocument();
  },
};

export const InconsistentKeys: Story = {
  args: {
    data: [
      { name: "Item 1", price: 100, category: "A" },
      { name: "Item 2", price: 200 }, // Missing category
      { name: "Item 3", category: "B", discount: 10 }, // Missing price, has discount
    ],
  },
  render: function Render(args) {
    const [data, setData] = useState(args.data);

    const handleUpdate = (
      index: number,
      key: string,
      value: unknown,
      affectedPaths?: string[],
    ) => {
      void affectedPaths; // Not used in this story
      // noop for test
      const newData = [...data];
      newData[index] = { ...newData[index], [key]: value };
      setData(newData);
    };

    const handleAddRow = (newRow: Record<string, unknown>) => {
      // noop for test
      const newData = [...data, newRow];
      setData(newData);
    };

    const handleDeleteRow = (index: number) => {
      // noop for test
      const newData = data.filter((_, i) => i !== index);
      setData(newData);
    };

    return (
      <TableRenderer
        data={data}
        onUpdate={handleUpdate}
        onAddRow={handleAddRow}
        onDeleteRow={handleDeleteRow}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that all columns are rendered even when some rows have missing data
    expect(canvas.getByText("Name")).toBeInTheDocument();
    expect(canvas.getByText("Price")).toBeInTheDocument();
    expect(canvas.getByText("Category")).toBeInTheDocument();
    expect(canvas.getByText("Discount")).toBeInTheDocument();

    // Test that data is rendered correctly (as text)
    expect(canvas.getByText("Item 1")).toBeInTheDocument();
    expect(canvas.getByText("100")).toBeInTheDocument();
    expect(canvas.getByText("A")).toBeInTheDocument();
    expect(canvas.getByText("Item 3")).toBeInTheDocument();
    expect(canvas.getByText("10")).toBeInTheDocument();

    // Test that missing values are displayed as blank
    const emptyButtons = canvas
      .getAllByRole("button")
      .filter((btn) => btn.textContent === "");
    expect(emptyButtons.length).toBeGreaterThan(0);
  },
};

export const DeepNestedTable: Story = {
  args: {
    data: [
      {
        id: "INV-001",
        customer: {
          name: "John Doe",
          contact: {
            email: "john@example.com",
            phone: "123-456-7890",
            address: {
              street: "123 Main St",
              city: "New York",
              country: "USA",
            },
          },
        },
        order: {
          date: "2024-01-15",
          total: 299.99,
        },
      },
    ],
    keyPath: ["invoices"],
    metadata: {
      extracted: {},
      schema: {
      invoices: {
        isRequired: false,
        isOptional: true,
        schemaType: "array",
        title: "Invoices",
        wasMissing: false,
      },
      "invoices.*.id": {
        isRequired: true,
        isOptional: false,
        schemaType: "string",
        title: "ID",
        wasMissing: false,
      },
      "invoices.*.customer.name": {
        isRequired: true,
        isOptional: false,
        schemaType: "string",
        title: "Name",
        wasMissing: false,
      },
      "invoices.*.customer.contact.email": {
        isRequired: true,
        isOptional: false,
        schemaType: "string",
        title: "Email",
        wasMissing: false,
      },
      "invoices.*.customer.contact.phone": {
        isRequired: false,
        isOptional: true,
        schemaType: "string",
        title: "Phone",
        wasMissing: false,
      },
      "invoices.*.customer.contact.address.street": {
        isRequired: true,
        isOptional: false,
        schemaType: "string",
        title: "Street",
        wasMissing: false,
      },
      "invoices.*.customer.contact.address.city": {
        isRequired: true,
        isOptional: false,
        schemaType: "string",
        title: "City",
        wasMissing: false,
      },
      "invoices.*.customer.contact.address.country": {
        isRequired: true,
        isOptional: false,
        schemaType: "string",
        title: "Country",
        wasMissing: false,
      },
      "invoices.*.order.date": {
        isRequired: true,
        isOptional: false,
        schemaType: "string",
        title: "Date",
        wasMissing: false,
      },
      "invoices.*.order.total": {
        isRequired: true,
        isOptional: false,
        schemaType: "number",
        title: "Total",
        wasMissing: false,
      },
    },
    },
  },
  render: function Render(args) {
    const [data, setData] = useState(args.data);
    const [changedPaths, setChangedPaths] = useState<Set<string>>(new Set());

    const handleUpdate = (
      index: number,
      key: string,
      value: unknown,
      affectedPaths?: string[],
    ) => {
      // noop for test
      const newData = [...data];
      if (typeof value === "object" && value !== null) {
        newData[index] = { ...newData[index], [key]: value };
      } else {
        newData[index] = { ...newData[index], [key]: value };
      }
      setData(newData);

      // Use the affectedPaths provided by handleUpdate
      if (affectedPaths && affectedPaths.length > 0) {
        setChangedPaths((prev) => new Set([...prev, ...affectedPaths]));
      } else {
        // Fallback for backward compatibility
        const cellPath = `${index}.${key}`;
        setChangedPaths((prev) => new Set([...prev, cellPath]));
      }
    };

    const handleAddRow = (newRow: Record<string, unknown>) => {
      // noop for test
      const newData = [...data, newRow];
      setData(newData);

      const rowPath = `${data.length}`;
      setChangedPaths((prev) => new Set([...prev, rowPath]));
    };

    const handleDeleteRow = (index: number) => {
      // noop for test
      const newData = data.filter((_, i) => i !== index);
      setData(newData);

      setChangedPaths((prev) => new Set([...prev, "table"]));
    };

    return (
      <TableRenderer
        data={data}
        onUpdate={handleUpdate}
        onAddRow={handleAddRow}
        onDeleteRow={handleDeleteRow}
        changedPaths={changedPaths}
        keyPath={args.keyPath}
        metadata={args.metadata ?? { schema: {}, extracted: {} }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that nested headers are rendered correctly
    expect(canvas.getByText("Customer")).toBeInTheDocument();
    expect(canvas.getByText("Contact")).toBeInTheDocument();
    expect(canvas.getByText("Address")).toBeInTheDocument();
    expect(canvas.getByText("Order")).toBeInTheDocument();

    // Test that leaf headers are rendered (with required field indicators)
    expect(canvas.getByText("ID")).toBeInTheDocument();
    expect(canvas.getByText("Name")).toBeInTheDocument();
    expect(canvas.getByText("Email")).toBeInTheDocument();
    expect(canvas.getByText("Phone")).toBeInTheDocument(); // Optional field, no *
    expect(canvas.getByText("Street")).toBeInTheDocument();
    expect(canvas.getByText("City")).toBeInTheDocument();
    expect(canvas.getByText("Country")).toBeInTheDocument();
    expect(canvas.getByText("Date")).toBeInTheDocument();
    expect(canvas.getByText("Total")).toBeInTheDocument();

    // Test that nested data is rendered correctly (as text)
    expect(canvas.getByText("John Doe")).toBeInTheDocument();
    expect(canvas.getByText("john@example.com")).toBeInTheDocument();
    expect(canvas.getByText("123 Main St")).toBeInTheDocument();
    expect(canvas.getByText("299.99")).toBeInTheDocument();

    // Test editing a nested field
    const emailField = canvas.getByText("john@example.com");
    await userEvent.click(emailField);

    // Wait for the field to become editable
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Now it should be an input field
    const input = screen.getByDisplayValue("john@example.com");
    await userEvent.clear(input);
    await userEvent.type(input, "john.doe@example.com");
    await userEvent.keyboard("{Enter}");

    // Wait for update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify the update
    expect(canvas.getByText("john.doe@example.com")).toBeInTheDocument();

    // CRITICAL TEST: Verify that the edited cell now has green background
    const updatedEmailCell = canvas
      .getByText("john.doe@example.com")
      .closest('[class*="bg-green-50"]');
    expect(updatedEmailCell).toBeInTheDocument();
  },
};

export const EmptyTable: Story = {
  args: {
    data: [],
    keyPath: ["items"],
    metadata: {
      extracted: {},
      schema: {
      items: {
        isRequired: false,
        isOptional: true,
        schemaType: "array",
        title: "Items",
        wasMissing: false,
      },
      "items.*.name": {
        isRequired: true,
        isOptional: false,
        schemaType: "string",
        title: "Name",
        wasMissing: false,
      },
      "items.*.price": {
        isRequired: false,
        isOptional: true,
        schemaType: "number",
        title: "Price",
        wasMissing: false,
      },
      "items.*.category": {
        isRequired: false,
        isOptional: true,
        schemaType: "string",
        title: "Category",
        wasMissing: false,
      },
    },
    },
  },
  render: function Render(args) {
    const [data, setData] = useState(args.data);

    const handleUpdate = (index: number, key: string, value: unknown) => {
      // noop for test
      const newData = [...data];
      newData[index] = { ...newData[index], [key]: value };
      setData(newData);
    };

    const handleAddRow = (newRow: Record<string, unknown>) => {
      // noop for test
      const newData = [...data, newRow];
      setData(newData);
    };

    const handleDeleteRow = (index: number) => {
      // noop for test
      const newData = data.filter((_, i) => i !== index);
      setData(newData);
    };

    return (
      <TableRenderer
        data={data}
        onUpdate={handleUpdate}
        onAddRow={handleAddRow}
        onDeleteRow={handleDeleteRow}
        keyPath={args.keyPath}
        metadata={args.metadata ?? { schema: {}, extracted: {} }}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that table headers are shown even for empty data (from schema)
    expect(canvas.getByText("Name")).toBeInTheDocument(); // Required field shows with *
    expect(canvas.getByText("Price")).toBeInTheDocument();
    expect(canvas.getByText("Category")).toBeInTheDocument();
    // Actions column is just an empty header, no text

    // Test that add button is present (plus icon button)
    const addButton = canvas.getByRole("button", { name: "" }); // Plus icon button has no accessible name
    expect(addButton).toBeInTheDocument();

    // Test adding first row to empty table
    await userEvent.click(addButton);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify row was added (should now see table structure with data)
    const deleteButtons = canvas.getAllByTitle("Delete row");
    expect(deleteButtons).toHaveLength(1);

    // Verify the new row has empty fields
    const emptyFields = canvas
      .getAllByRole("button")
      .filter((btn) => btn.textContent === ""); // Empty strings display as blank
    expect(emptyFields.length).toBeGreaterThan(0);

    // Test adding another row
    const addButtonAfterFirstAdd = canvas.getByRole("button", { name: "" }); // Plus icon button
    await userEvent.click(addButtonAfterFirstAdd);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify second row was added
    const deleteButtonsAfterSecond = canvas.getAllByTitle("Delete row");
    expect(deleteButtonsAfterSecond).toHaveLength(2);
  },
};

export const ReadOnlyTable: Story = {
  args: {
    data: [
      { name: "Item 1", price: 100, category: "A" },
      { name: "Item 2", price: 200, category: "B" },
    ],
  },
  render: function Render(args) {
    const [data, setData] = useState(args.data);

    const handleUpdate = (index: number, key: string, value: unknown) => {
      // noop for test
      const newData = [...data];
      newData[index] = { ...newData[index], [key]: value };
      setData(newData);
    };

    return (
      <TableRenderer
        data={data}
        onUpdate={handleUpdate}
        // No onAddRow or onDeleteRow props - should be read-only
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that table data is rendered
    expect(canvas.getByText("Item 1")).toBeInTheDocument();
    expect(canvas.getByText("Item 2")).toBeInTheDocument();
    expect(canvas.getByText("100")).toBeInTheDocument();
    expect(canvas.getByText("200")).toBeInTheDocument();

    // Test that no delete buttons are present
    const deleteButtons = canvas.queryAllByTitle("Delete row");
    expect(deleteButtons).toHaveLength(0);

    // Test that no add button is present
    const addButton = canvas.queryByRole("button", { name: "" });
    expect(addButton).not.toBeInTheDocument();

    // Test that no Actions column is present (empty header)
    // Actions column is just an empty header, no text to query

    // Test that editing still works
    const firstItem = canvas.getByText("Item 1");
    await userEvent.click(firstItem);

    const input = screen.getByDisplayValue("Item 1");
    await userEvent.clear(input);
    await userEvent.type(input, "Updated Item 1");
    await userEvent.keyboard("{Enter}");

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(canvas.getByText("Updated Item 1")).toBeInTheDocument();
  },
};
