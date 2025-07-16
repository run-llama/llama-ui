import type { Meta, StoryObj } from "@storybook/react-vite";
import { PropertyRenderer } from "@/registry/new-york/extracted-data";
import { userEvent, within, expect, screen } from "@storybook/test";
import { useState } from "react";
import type { FieldMetadata } from "@/registry/new-york/extracted-data/schema-reconciliation";

const meta: Meta<typeof PropertyRenderer> = {
  title: "Components/ExtractedData/PropertyRenderer",
  component: PropertyRenderer,
  parameters: {
    layout: "centered",
  },
};

export default meta;
type Story = StoryObj<typeof PropertyRenderer>;

// COMPREHENSIVE TEST DATA - covers all types in one unified dataset
const comprehensiveData = {
  // Primitive fields
  title: "Sample Document",
  amount: 1250.75,
  isActive: true,
  createdAt: "2024-01-15",

  // Nested object
  author: {
    name: "Jane Smith",
    email: "jane@example.com",
    profile: {
      role: "Manager",
      verified: false,
      joinDate: "2023-06-01",
    },
  },

  // Primitive arrays
  tags: ["urgent", "finance", "reviewed"],
  scores: [88, 92, 76, 95],
  flags: [true, false, true],

  // Object array (table)
  items: [
    {
      id: 1,
      name: "Service Fee",
      price: 150.0,
      category: "service",
      taxable: true,
    },
    {
      id: 2,
      name: "Material Cost",
      price: 85.5,
      category: "material",
      taxable: false,
    },
    {
      id: 3,
      name: "Labor Hours",
      price: 1200.0,
      category: "labor",
      taxable: true,
    },
  ],

  // Nested array
  departments: [
    {
      name: "Engineering",
      budget: 50000,
      active: true,
      employees: [
        { name: "Alice", role: "Senior Dev", salary: 120000 },
        { name: "Bob", role: "Junior Dev", salary: 80000 },
      ],
    },
    {
      name: "Marketing",
      budget: 30000,
      active: false,
      employees: [{ name: "Carol", role: "Manager", salary: 95000 }],
    },
  ],
};

// UNIFIED FIELD METADATA using "*" wildcard schema
const comprehensiveFieldMetadata: Record<string, FieldMetadata> = {
  // Primitive fields
  title: {
    isRequired: true,
    isOptional: false,
    schemaType: "string",
    title: "Document Title",
    wasMissing: false,
  },
  amount: {
    isRequired: true,
    isOptional: false,
    schemaType: "number",
    title: "Total Amount",
    wasMissing: false,
  },
  isActive: {
    isRequired: false,
    isOptional: true,
    schemaType: "boolean",
    title: "Active Status",
    wasMissing: false,
  },
  createdAt: {
    isRequired: true,
    isOptional: false,
    schemaType: "string",
    title: "Created Date",
    wasMissing: false,
  },

  // Nested object fields
  "author.name": {
    isRequired: true,
    isOptional: false,
    schemaType: "string",
    title: "Author Name",
    wasMissing: false,
  },
  "author.email": {
    isRequired: true,
    isOptional: false,
    schemaType: "string",
    title: "Email",
    wasMissing: false,
  },
  "author.profile.role": {
    isRequired: false,
    isOptional: true,
    schemaType: "string",
    title: "Role",
    wasMissing: false,
  },
  "author.profile.verified": {
    isRequired: false,
    isOptional: true,
    schemaType: "boolean",
    title: "Verified",
    wasMissing: false,
  },
  "author.profile.joinDate": {
    isRequired: false,
    isOptional: true,
    schemaType: "string",
    title: "Join Date",
    wasMissing: false,
  },

  // Primitive arrays
  tags: {
    isRequired: false,
    isOptional: true,
    schemaType: "array",
    title: "Tags",
    wasMissing: false,
  },
  "tags.*": {
    isRequired: false,
    isOptional: true,
    schemaType: "string",
    title: "Tag",
    wasMissing: false,
  },
  scores: {
    isRequired: false,
    isOptional: true,
    schemaType: "array",
    title: "Scores",
    wasMissing: false,
  },
  "scores.*": {
    isRequired: false,
    isOptional: true,
    schemaType: "number",
    title: "Score",
    wasMissing: false,
  },
  flags: {
    isRequired: false,
    isOptional: true,
    schemaType: "array",
    title: "Flags",
    wasMissing: false,
  },
  "flags.*": {
    isRequired: false,
    isOptional: true,
    schemaType: "boolean",
    title: "Flag",
    wasMissing: false,
  },

  // Object array (table) fields
  items: {
    isRequired: false,
    isOptional: true,
    schemaType: "array",
    title: "Items",
    wasMissing: false,
  },
  "items.*.id": {
    isRequired: true,
    isOptional: false,
    schemaType: "number",
    title: "ID",
    wasMissing: false,
  },
  "items.*.name": {
    isRequired: true,
    isOptional: false,
    schemaType: "string",
    title: "Item Name",
    wasMissing: false,
  },
  "items.*.price": {
    isRequired: true,
    isOptional: false,
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
  "items.*.taxable": {
    isRequired: false,
    isOptional: true,
    schemaType: "boolean",
    title: "Taxable",
    wasMissing: false,
  },

  // Nested array fields
  departments: {
    isRequired: false,
    isOptional: true,
    schemaType: "array",
    title: "Departments",
    wasMissing: false,
  },
  "departments.*.name": {
    isRequired: true,
    isOptional: false,
    schemaType: "string",
    title: "Department Name",
    wasMissing: false,
  },
  "departments.*.budget": {
    isRequired: true,
    isOptional: false,
    schemaType: "number",
    title: "Budget",
    wasMissing: false,
  },
  "departments.*.active": {
    isRequired: false,
    isOptional: true,
    schemaType: "boolean",
    title: "Active",
    wasMissing: false,
  },
  "departments.*.employees": {
    isRequired: false,
    isOptional: true,
    schemaType: "array",
    title: "Employees",
    wasMissing: false,
  },
  "departments.*.employees.*.name": {
    isRequired: true,
    isOptional: false,
    schemaType: "string",
    title: "Employee Name",
    wasMissing: false,
  },
  "departments.*.employees.*.role": {
    isRequired: false,
    isOptional: true,
    schemaType: "string",
    title: "Role",
    wasMissing: false,
  },
  "departments.*.employees.*.salary": {
    isRequired: true,
    isOptional: false,
    schemaType: "number",
    title: "Salary",
    wasMissing: false,
  },
};

// Interactive wrapper component for testing
function InteractivePropertyRenderer({
  initialData,
  confidence,
  changedPaths: initialChangedPaths,
  fieldMetadata,
}: {
  initialData: unknown;
  confidence?: Record<string, number>;
  changedPaths?: Set<string>;
  fieldMetadata?: Record<string, FieldMetadata>;
}) {
  const [data, setData] = useState(initialData);
  const [changedPaths, setChangedPaths] = useState(
    initialChangedPaths || new Set<string>(),
  );

  const handleUpdate = (
    path: string[],
    newValue: unknown,
    additionalPaths?: string[][],
  ) => {
    // Update data
    const updatedData = JSON.parse(JSON.stringify(data));
    let current = updatedData;

    for (let i = 0; i < path.length - 1; i++) {
      current = current[path[i]];
    }
    current[path[path.length - 1]] = newValue;

    setData(updatedData);

    // Track changed paths - main path and any additional paths
    const pathsToTrack = [path, ...(additionalPaths || [])];
    setChangedPaths((prev) => {
      const newSet = new Set(prev);
      pathsToTrack.forEach((p) => {
        newSet.add(p.join("."));
      });
      return newSet;
    });
  };

  return (
    <div className="w-full max-w-4xl p-4 border rounded">
      <PropertyRenderer
        keyPath={[]}
        value={data}
        onUpdate={handleUpdate}
        confidence={confidence}
        changedPaths={changedPaths}
        fieldMetadata={fieldMetadata}
      />
    </div>
  );
}

// Interactive Editing - focuses on key editing scenarios
export const InteractiveEditing: Story = {
  render: () => (
    <InteractivePropertyRenderer
      initialData={comprehensiveData}
      confidence={{
        title: 0.98,
        amount: 0.92,
        isActive: 0.95,
        "author.name": 0.97,
        "author.profile.verified": 0.85,
        "tags.0": 0.93,
        "scores.0": 0.88,
        "flags.0": 0.91,
        "items.0.taxable": 0.82,
      }}
      fieldMetadata={comprehensiveFieldMetadata}
    />
  ),
  play: async ({ canvasElement }: { canvasElement: HTMLElement }) => {
    const canvas = within(canvasElement);

    // Test primitive field editing
    const titleField = canvas.getByText("Sample Document");
    await userEvent.click(titleField);
    const titleInput = await screen.findByDisplayValue("Sample Document");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Updated Document");
    await userEvent.keyboard("{Enter}");
    expect(canvas.getByText("Updated Document")).toBeInTheDocument();

    // Test boolean field rendering (should be select) - find first "true" value
    const activeFields = canvas.getAllByText("true");
    await userEvent.click(activeFields[0]);
    // Should open a select, not an input
    const selectTrigger = await screen.findByRole("combobox");
    expect(selectTrigger).toBeInTheDocument();
    await userEvent.keyboard("{Escape}");

    // Test array operations - add item to tags (plus icon buttons)
    const addTagButtons = canvas.getAllByRole("button", { name: "" }); // Plus icon buttons have no accessible name
    if (addTagButtons.length > 0) {
      await userEvent.click(addTagButtons[0]);
      await new Promise((resolve) => setTimeout(resolve, 100));
    }

    // Test table operations - verify boolean fields in table render correctly
    const tableSection = canvas.getByText("Items");
    expect(tableSection).toBeInTheDocument();

    // Look for boolean values in the table
    const taxableFields = canvas.getAllByText("true");
    expect(taxableFields.length).toBeGreaterThan(0);
  },
  parameters: {
    docs: {
      description: {
        story:
          "Interactive editing test that covers key scenarios: primitive field editing, boolean field rendering as selects, array operations, and table boolean field handling. Tests the unified field metadata system in action.",
      },
    },
  },
};
