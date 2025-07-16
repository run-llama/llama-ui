import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "@storybook/test";
import { within, userEvent, screen } from "@storybook/test";
import { useState } from "react";
import { ListRenderer } from "@/registry/new-york/extracted-data/list-renderer";

const meta: Meta<typeof ListRenderer> = {
  title: "Components/ExtractedData/ListRenderer",
  component: ListRenderer,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ListRenderer>;

export const Basic: Story = {
  args: {
    data: ["urgent", "paid", "processed"],
    confidence: {
      "0": 0.96,
      "1": 0.85,
      "2": 0.92,
    },
    keyPath: ["tags"],
  },
  render: function Render(args) {
    const [data, setData] = useState(args.data);
    const [changedPaths, setChangedPaths] = useState<Set<string>>(new Set());

    const handleUpdate = (index: number, value: unknown) => {
      console.log(`Updated item ${index}:`, value);
      // Update the data
      const newData = [...data];
      newData[index] = value;
      setData(newData);

      // Add the changed path to the set
      const path = `${args.keyPath?.join(".") || ""}.${index}`;
      setChangedPaths((prev) => new Set([...prev, path]));
    };

    const handleAdd = (value: unknown) => {
      console.log(`Added item:`, value);
      const newData = [...data, value];
      setData(newData);

      // Add the new item path to changed paths
      const path = `${args.keyPath?.join(".") || ""}.${data.length}`;
      setChangedPaths((prev) => new Set([...prev, path]));
    };

    const handleDelete = (index: number) => {
      console.log(`Deleted item at index ${index}`);
      const newData = data.filter((_, i) => i !== index);
      setData(newData);

      // Mark the entire array as changed when deleting
      const arrayPath = args.keyPath?.join(".") || "";
      setChangedPaths((prev) => new Set([...prev, arrayPath]));
    };

    return (
      <ListRenderer
        {...args}
        data={data}
        onUpdate={handleUpdate}
        onAdd={handleAdd}
        onDelete={handleDelete}
        changedPaths={changedPaths}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that all items are rendered
    expect(canvas.getByText("urgent")).toBeInTheDocument();
    expect(canvas.getByText("paid")).toBeInTheDocument();
    expect(canvas.getByText("processed")).toBeInTheDocument();

    // Test that index numbers are displayed
    expect(canvas.getByText("1")).toBeInTheDocument();
    expect(canvas.getByText("2")).toBeInTheDocument();
    expect(canvas.getByText("3")).toBeInTheDocument();

    // Test that delete buttons are present
    const deleteButtons = canvas.getAllByTitle("Delete item");
    expect(deleteButtons).toHaveLength(3);

    // Test that add button is present (plus icon button)
    const addButton = canvas.getByRole("button", { name: "" }); // Plus icon button has no accessible name
    expect(addButton).toBeInTheDocument();

    // Test clicking on an item to edit
    const firstItem = canvas.getByText("urgent");
    await userEvent.click(firstItem);

    // Test that onUpdate is called when editing
    const input = screen.getByDisplayValue("urgent");
    await userEvent.clear(input);
    await userEvent.type(input, "updated urgent");
    await userEvent.keyboard("{Enter}");

    // Wait a bit for the state to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test that the edited item now has green background
    const updatedItem = canvas
      .getByText("updated urgent")
      .closest('[class*="bg-green-50"]');
    expect(updatedItem).toBeInTheDocument();

    // Test adding a new item
    await userEvent.click(addButton);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify new item was added (should be 4 items now)
    expect(canvas.getByText("4")).toBeInTheDocument();

    // Test deleting an item
    const deleteButton = deleteButtons[1]; // Delete the second item ("paid")
    await userEvent.click(deleteButton);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify item was deleted (should not find "paid" anymore)
    expect(canvas.queryByText("paid")).not.toBeInTheDocument();
  },
};

export const EmptyArray: Story = {
  args: {
    data: [],
    confidence: {},
    keyPath: ["emptyTags"],
  },
  render: function Render(args) {
    const [data, setData] = useState(args.data);
    const [changedPaths, setChangedPaths] = useState<Set<string>>(new Set());

    const handleUpdate = (index: number, value: unknown) => {
      console.log(`Updated item ${index}:`, value);
      const newData = [...data];
      newData[index] = value;
      setData(newData);

      const path = `${args.keyPath?.join(".") || ""}.${index}`;
      setChangedPaths((prev) => new Set([...prev, path]));
    };

    const handleAdd = (value: unknown) => {
      console.log(`Added item:`, value);
      const newData = [...data, value];
      setData(newData);

      const path = `${args.keyPath?.join(".") || ""}.${data.length}`;
      setChangedPaths((prev) => new Set([...prev, path]));
    };

    const handleDelete = (index: number) => {
      console.log(`Deleted item at index ${index}`);
      const newData = data.filter((_, i) => i !== index);
      setData(newData);

      const arrayPath = args.keyPath?.join(".") || "";
      setChangedPaths((prev) => new Set([...prev, arrayPath]));
    };

    return (
      <ListRenderer
        {...args}
        data={data}
        onUpdate={handleUpdate}
        onAdd={handleAdd}
        onDelete={handleDelete}
        changedPaths={changedPaths}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test empty array message is shown
    expect(canvas.getByText("Empty array")).toBeInTheDocument();

    // Test that add button is present (plus icon button)
    const addButton = canvas.getByRole("button", { name: "" }); // Plus icon button has no accessible name
    expect(addButton).toBeInTheDocument();

    // Test adding first item to empty array
    await userEvent.click(addButton);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify item was added (should show index "1")
    expect(canvas.getByText("1")).toBeInTheDocument();

    // Test that the new item shows up as an editable field with empty string
    const newItem = canvasElement.querySelector(
      'div[class*="cursor-pointer"] span[class*="text-sm"]:empty',
    ); // Empty string displays as blank
    expect(newItem).not.toBeNull();

    // Test editing the new item
    await userEvent.click(newItem!);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const input = screen.getByDisplayValue("");
    await userEvent.type(input, "first item");
    await userEvent.keyboard("{Enter}");

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify the item was updated
    expect(canvas.getByText("first item")).toBeInTheDocument();
  },
};

export const ReadOnlyList: Story = {
  args: {
    data: ["item1", "item2", "item3"],
    confidence: {
      "0": 0.9,
      "1": 0.8,
      "2": 0.7,
    },
    keyPath: ["readOnlyTags"],
  },
  render: function Render(args) {
    const [data, setData] = useState(args.data);

    const handleUpdate = (index: number, value: unknown) => {
      console.log(`Updated item ${index}:`, value);
      const newData = [...data];
      newData[index] = value;
      setData(newData);
    };

    return (
      <ListRenderer
        {...args}
        data={data}
        onUpdate={handleUpdate}
        // No onAdd or onDelete props - should be read-only
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that all items are rendered
    expect(canvas.getByText("item1")).toBeInTheDocument();
    expect(canvas.getByText("item2")).toBeInTheDocument();
    expect(canvas.getByText("item3")).toBeInTheDocument();

    // Test that no delete buttons are present
    const deleteButtons = canvas.queryAllByTitle("Delete item");
    expect(deleteButtons).toHaveLength(0);

    // Test that no add button is present
    const addButton = canvas.queryByRole("button", { name: "" });
    expect(addButton).not.toBeInTheDocument();

    // Test that editing still works
    const firstItem = canvas.getByText("item1");
    await userEvent.click(firstItem);

    const input = screen.getByDisplayValue("item1");
    await userEvent.clear(input);
    await userEvent.type(input, "updated item1");
    await userEvent.keyboard("{Enter}");

    await new Promise((resolve) => setTimeout(resolve, 100));

    expect(canvas.getByText("updated item1")).toBeInTheDocument();
  },
};

export const NumberArray: Story = {
  args: {
    data: [85, 92, 78, 95],
    confidence: {
      "0": 0.99,
      "1": 0.96,
      "2": 0.93,
      "3": 0.98,
    },
    keyPath: ["scores"],
    fieldMetadata: {
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
    },
  },
  render: function Render(args) {
    const [data, setData] = useState(args.data);
    const [changedPaths, setChangedPaths] = useState<Set<string>>(new Set());

    const handleUpdate = (index: number, value: unknown) => {
      console.log(`Updated item ${index}:`, value);
      const newData = [...data];
      newData[index] = value;
      setData(newData);

      const path = `${args.keyPath?.join(".") || ""}.${index}`;
      setChangedPaths((prev) => new Set([...prev, path]));
    };

    const handleAdd = (value: unknown) => {
      console.log(`Added item:`, value);
      const newData = [...data, value];
      setData(newData);

      const path = `${args.keyPath?.join(".") || ""}.${data.length}`;
      setChangedPaths((prev) => new Set([...prev, path]));
    };

    const handleDelete = (index: number) => {
      console.log(`Deleted item at index ${index}`);
      const newData = data.filter((_, i) => i !== index);
      setData(newData);

      const arrayPath = args.keyPath?.join(".") || "";
      setChangedPaths((prev) => new Set([...prev, arrayPath]));
    };

    return (
      <ListRenderer
        {...args}
        data={data}
        onUpdate={handleUpdate}
        onAdd={handleAdd}
        onDelete={handleDelete}
        changedPaths={changedPaths}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that number values are rendered
    expect(canvas.getByText("85")).toBeInTheDocument();
    expect(canvas.getByText("92")).toBeInTheDocument();
    expect(canvas.getByText("78")).toBeInTheDocument();
    expect(canvas.getByText("95")).toBeInTheDocument();

    // Test that add button is present (plus icon button)
    const addButton = canvas.getByRole("button", { name: "" }); // Plus icon button has no accessible name
    expect(addButton).toBeInTheDocument();

    // Test adding a new number item (should get 0 as default)
    await userEvent.click(addButton);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify new item was added (should show index "5")
    expect(canvas.getByText("5")).toBeInTheDocument();

    // Verify the new item has default value 0
    expect(canvas.getByText("0")).toBeInTheDocument();

    // Test editing a number item
    const firstScore = canvas.getByText("85");
    await userEvent.click(firstScore);

    const input = screen.getByDisplayValue("85");
    await userEvent.clear(input);
    await userEvent.type(input, "90");
    await userEvent.keyboard("{Enter}");

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify the item was updated and shows green background
    const updatedItem = canvas
      .getByText("90")
      .closest('[class*="bg-green-50"]');
    expect(updatedItem).toBeInTheDocument();

    // Test that number fields cannot be saved as empty (required validation)
    const secondScore = canvas.getByText("92");
    await userEvent.click(secondScore);

    await new Promise((resolve) => setTimeout(resolve, 100));

    const numberInput = screen.getByDisplayValue("92");
    await userEvent.clear(numberInput);
    // Try to save empty number field - should not work
    await userEvent.keyboard("{Enter}");

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify the value is still "92" (unchanged) because empty save was prevented
    expect(canvas.getByText("92")).toBeInTheDocument();
  },
};

export const BooleanArray: Story = {
  args: {
    data: [true, false, true, false],
    confidence: {
      "0": 0.95,
      "1": 0.88,
      "2": 0.92,
      "3": 0.97,
    },
    keyPath: ["flags"],
    fieldMetadata: {
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
    },
  },
  render: function Render(args) {
    const [data, setData] = useState(args.data);
    const [changedPaths, setChangedPaths] = useState<Set<string>>(new Set());

    const handleUpdate = (index: number, value: unknown) => {
      console.log(`Updated item ${index}:`, value);
      const newData = [...data];
      newData[index] = value;
      setData(newData);

      const path = `${args.keyPath?.join(".") || ""}.${index}`;
      setChangedPaths((prev) => new Set([...prev, path]));
    };

    const handleAdd = (value: unknown) => {
      console.log(`Added item:`, value);
      const newData = [...data, value];
      setData(newData);

      const path = `${args.keyPath?.join(".") || ""}.${data.length}`;
      setChangedPaths((prev) => new Set([...prev, path]));
    };

    const handleDelete = (index: number) => {
      console.log(`Deleted item at index ${index}`);
      const newData = data.filter((_, i) => i !== index);
      setData(newData);

      const arrayPath = args.keyPath?.join(".") || "";
      setChangedPaths((prev) => new Set([...prev, arrayPath]));
    };

    return (
      <ListRenderer
        {...args}
        data={data}
        onUpdate={handleUpdate}
        onAdd={handleAdd}
        onDelete={handleDelete}
        changedPaths={changedPaths}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that boolean values are rendered
    expect(canvas.getAllByText("true").length).toBeGreaterThanOrEqual(2); // At least 2 true values
    expect(canvas.getAllByText("false").length).toBeGreaterThanOrEqual(2); // At least 2 false values

    // Test that add button is present (plus icon button)
    const addButton = canvas.getByRole("button", { name: "" }); // Plus icon button has no accessible name
    expect(addButton).toBeInTheDocument();

    // Test adding a new boolean item (should get false as default)
    await userEvent.click(addButton);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify new item was added (should show index "5")
    expect(canvas.getByText("5")).toBeInTheDocument();

    // Verify the new item has default value false (multiple false values exist)
    const falseElements = canvas.getAllByText("false");
    expect(falseElements.length).toBeGreaterThanOrEqual(3); // Original 2 + 1 new

    // Test editing a boolean item
    const trueCells = canvas.getAllByText("true");
    const firstTrue = trueCells[0];
    await userEvent.click(firstTrue);

    // Wait for editable field popover to appear
    await new Promise((resolve) => setTimeout(resolve, 100));

    // For boolean editing, it should show a select dropdown
    // Click on the Select to open it
    const selectTrigger = screen.getByRole("combobox");
    await userEvent.click(selectTrigger);

    // Wait for options to appear
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Select "false" option
    const falseOption = screen.getByRole("option", { name: "false" });
    await userEvent.click(falseOption);

    // Click Save button
    const saveButton = screen.getByText("Save");
    await userEvent.click(saveButton);

    await new Promise((resolve) => setTimeout(resolve, 100));

    // Verify the item was updated and shows green background
    const updatedItems = canvas.getAllByText("false");
    const hasGreenBackground = updatedItems.some((item) =>
      item.closest('[class*="bg-green-50"]'),
    );
    expect(hasGreenBackground).toBe(true);
  },
};
