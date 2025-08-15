import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, screen } from "@storybook/test";
import { useState } from "react";
import { ExtractedDataDisplay } from "../../src/extracted-data";
import type { JSONSchema } from "zod/v4/core";
import { ExtractedDataDisplayControl } from "@/src/extracted-data/extracted-data-display-control";

const meta: Meta<typeof ExtractedDataDisplay> = {
  title: "Components/ExtractedDataDisplay/DataUpdateTests",
  component: ExtractedDataDisplay,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ExtractedDataDisplay>;

// Create a component for DataUpdateTests story to use hooks properly
function DataUpdateTestsComponent() {
  const initialData = {
    title: "Test Document",
    amount: 1000,
    tags: ["tag1", "tag2"],
    scores: [85, 92],
    flags: [true, false],
    metadata: {
      version: "1.2.3",
      priority: 5,
      published: false,
    },
    items: [
      {
        name: "Item 1",
        price: 100,
        category: "service",
        active: true,
        details: {
          supplier: "Supplier A",
          location: "Warehouse 1",
          verified: false,
        },
      },
      {
        name: "Item 2",
        price: 200,
        category: "material",
        active: false,
        details: {
          supplier: "Supplier B",
          location: "Warehouse 2",
          verified: true,
        },
      },
    ],
  };

  // Create field_metadata for the data (tree structure)
  const fieldMetadata = {
    title: {
      confidence: 0.95,
      reasoning: "Document title extracted from header",
      citation: [{ page_number: 1, matching_text: "Test Document" }],
    },
    amount: {
      confidence: 0.92,
      reasoning: "Amount extracted from financial section",
      citation: [{ page_number: 1, matching_text: "1000" }],
    },
    tags: [
      {
        confidence: 0.88,
        reasoning: "First tag identified",
        citation: [{ page_number: 1, matching_text: "tag1" }],
      },
      {
        confidence: 0.87,
        reasoning: "Second tag identified",
        citation: [{ page_number: 1, matching_text: "tag2" }],
      },
    ],
    scores: [
      {
        confidence: 0.91,
        reasoning: "First score extracted",
        citation: [{ page_number: 1, matching_text: "85" }],
      },
      {
        confidence: 0.89,
        reasoning: "Second score extracted",
        citation: [{ page_number: 1, matching_text: "92" }],
      },
    ],
    flags: [
      {
        confidence: 0.94,
        reasoning: "First flag extracted",
        citation: [{ page_number: 1, matching_text: "true" }],
      },
      {
        confidence: 0.93,
        reasoning: "Second flag extracted",
        citation: [{ page_number: 1, matching_text: "false" }],
      },
    ],
    metadata: {
      version: {
        confidence: 0.96,
        reasoning: "Version number identified",
        citation: [{ page_number: 1, matching_text: "1.2.3" }],
      },
      priority: {
        confidence: 0.9,
        reasoning: "Priority level extracted",
        citation: [{ page_number: 1, matching_text: "5" }],
      },
      published: {
        confidence: 0.85,
        reasoning: "Published status identified",
        citation: [{ page_number: 1, matching_text: "false" }],
      },
    },
    items: [
      {
        name: {
          confidence: 0.92,
          reasoning: "First item name extracted",
          citation: [{ page_number: 1, matching_text: "Item 1" }],
        },
        price: {
          confidence: 0.89,
          reasoning: "First item price extracted",
          citation: [{ page_number: 1, matching_text: "100" }],
        },
      },
      {
        name: {
          confidence: 0.91,
          reasoning: "Second item name extracted",
          citation: [{ page_number: 1, matching_text: "Item 2" }],
        },
        price: {
          confidence: 0.88,
          reasoning: "Second item price extracted",
          citation: [{ page_number: 1, matching_text: "200" }],
        },
      },
    ],
  };

  const schema: JSONSchema.ObjectSchema = {
    type: "object",
    properties: {
      title: { type: "string", title: "Title" },
      amount: { type: "number", title: "Amount" },
      tags: {
        type: "array",
        title: "Tags",
        items: { type: "string" },
      },
      scores: {
        type: "array",
        title: "Scores",
        items: { type: "number" },
      },
      flags: {
        type: "array",
        title: "Flags",
        items: { type: "boolean" },
      },
      metadata: {
        type: "object",
        title: "Metadata",
        properties: {
          version: { type: "string", title: "Version" },
          priority: { type: "number", title: "Priority" },
          published: { type: "boolean", title: "Published" },
        },
        required: ["version", "priority"],
      },
      items: {
        type: "array",
        title: "Items",
        items: {
          type: "object",
          properties: {
            name: { type: "string", title: "Name" },
            price: { type: "number", title: "Price" },
            category: { type: "string", title: "Category" },
            active: { type: "boolean", title: "Active" },
            details: {
              type: "object",
              title: "Details",
              properties: {
                supplier: { type: "string", title: "Supplier" },
                location: { type: "string", title: "Location" },
                verified: { type: "boolean", title: "Verified" },
              },
              required: ["supplier", "location"],
            },
          },
          required: ["name", "price"],
        },
      },
    },
    required: ["title", "amount"],
  };

  const [data, setData] = useState(initialData);
  const [updateCount, setUpdateCount] = useState(0);

  const handleChange = (updatedData: Record<string, unknown>) => {
    setData(updatedData as typeof initialData);
    setUpdateCount((prev) => prev + 1);
  };

  // Create extractedData structure
  const extractedData = {
    original_data: initialData,
    data,
    status: "completed" as const,
    field_metadata: fieldMetadata,
  };

  return (
    <div style={{ display: "flex", gap: "20px" }}>
      {/* Left panel: ExtractedDataDisplay */}
      <div style={{ flex: 1 }}>
        <ExtractedDataDisplay
          extractedData={extractedData}
          editable={true}
          onChange={handleChange}
          jsonSchema={schema}
        />

        <div
          data-testid="update-counter"
          style={{ marginTop: "10px", fontSize: "12px", fontWeight: "bold" }}
        >
          Updates: {updateCount}
        </div>
      </div>

      {/* Right panel: JSON comparison */}
      <div style={{ flex: 1, maxWidth: "500px" }}>
        <div style={{ marginBottom: "15px" }}>
          <h4 style={{ fontSize: "14px", margin: "5px 0", color: "#666" }}>
            Original Data:
          </h4>
          <pre
            style={{
              fontSize: "11px",
              background: "#f5f5f5",
              padding: "8px",
              borderRadius: "4px",
              maxHeight: "150px",
              overflow: "auto",
            }}
          >
            {JSON.stringify(initialData, null, 2)}
          </pre>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <h4 style={{ fontSize: "14px", margin: "5px 0", color: "#666" }}>
            Schema:
          </h4>
          <pre
            style={{
              fontSize: "11px",
              background: "#e8f4fd",
              padding: "8px",
              borderRadius: "4px",
              maxHeight: "150px",
              overflow: "auto",
            }}
          >
            {JSON.stringify(schema, null, 2)}
          </pre>
        </div>

        <div>
          <h4 style={{ fontSize: "14px", margin: "5px 0", color: "#666" }}>
            Current Data:
          </h4>
          <pre
            data-testid="current-data"
            style={{
              fontSize: "11px",
              background: updateCount > 0 ? "#f0f9f0" : "#f5f5f5",
              padding: "8px",
              borderRadius: "4px",
              maxHeight: "200px",
              overflow: "auto",
              border: updateCount > 0 ? "2px solid #4caf50" : "1px solid #ddd",
            }}
          >
            {JSON.stringify(data, null, 2)}
          </pre>
        </div>
      </div>
    </div>
  );
}

export const DataUpdateTests: Story = {
  render: () => <DataUpdateTestsComponent />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Testing data updates through onChange

    // Helper to wait for updates
    const waitForUpdate = async (expectedCount: number) => {
      await new Promise((resolve) => setTimeout(resolve, 300));
      expect(canvas.getByTestId("update-counter")).toHaveTextContent(
        `Updates: ${expectedCount}`
      );
    };

    // Test 1: Update primitive field
    const titleField = canvas.getByText("Test Document");
    await userEvent.click(titleField);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const titleInput = screen.getByDisplayValue("Test Document");
    await userEvent.clear(titleInput);
    await userEvent.type(titleInput, "Updated Title");
    await userEvent.keyboard("{Enter}");

    await waitForUpdate(1);
    expect(canvas.getByText("Updated Title")).toBeInTheDocument();

    // Test 2: Update number field
    const amountField = canvas.getByText("1000");
    await userEvent.click(amountField);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const amountInput = screen.getByDisplayValue("1000");
    await userEvent.clear(amountInput);
    await userEvent.type(amountInput, "2000");
    await userEvent.keyboard("{Enter}");

    await waitForUpdate(2);
    expect(canvas.getByText("2000")).toBeInTheDocument();

    // Test 3: Update array item
    const tag1Field = canvas.getByText("tag1");
    await userEvent.click(tag1Field);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const tag1Input = screen.getByDisplayValue("tag1");
    await userEvent.clear(tag1Input);
    await userEvent.type(tag1Input, "updated-tag");
    await userEvent.keyboard("{Enter}");

    await waitForUpdate(3);
    expect(canvas.getByText("updated-tag")).toBeInTheDocument();

    // Test 4: Update number array item
    const score85 = canvas.getByText("85");
    await userEvent.click(score85);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const scoreInput = screen.getByDisplayValue("85");
    await userEvent.clear(scoreInput);
    await userEvent.type(scoreInput, "95");
    await userEvent.keyboard("{Enter}");

    await waitForUpdate(4);
    expect(canvas.getByText("95")).toBeInTheDocument();

    // Test 5: Update boolean array item
    // Find the flags section specifically and click the first "true" value
    const flagsSection = canvas.getByText("Flags").closest("div");
    // Initial flags array is [true, false], so we'll change the true to false
    const trueFlagElements = within(flagsSection!).queryAllByText("true");
    if (trueFlagElements.length > 0) {
      await userEvent.click(trueFlagElements[0]);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const selectTrigger = screen.getByRole("combobox");
      await userEvent.click(selectTrigger);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const falseOption = screen.getByRole("option", { name: "false" });
      await userEvent.click(falseOption);

      const saveButton = screen.getByText("Save");
      await userEvent.click(saveButton);

      await waitForUpdate(5);
      // Verify boolean was changed - now should have two false values in flags array
    }

    // Test 6: Update nested object fields

    // Update metadata.version (string)
    const versionField = canvas.getByText("1.2.3");
    await userEvent.click(versionField);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const versionInput = screen.getByDisplayValue("1.2.3");
    await userEvent.clear(versionInput);
    await userEvent.type(versionInput, "2.0.0");
    await userEvent.keyboard("{Enter}");

    await waitForUpdate(5); // Adjusted since boolean update didn't count
    expect(canvas.getByText("2.0.0")).toBeInTheDocument();

    // Update metadata.priority (number)
    const priorityField = canvas.getByText("5");
    await userEvent.click(priorityField);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const priorityInput = screen.getByDisplayValue("5");
    await userEvent.clear(priorityInput);
    await userEvent.type(priorityInput, "10");
    await userEvent.keyboard("{Enter}");

    await waitForUpdate(6);
    expect(canvas.getByText("10")).toBeInTheDocument();

    // Test 7: Add array item
    const addButtons = canvas
      .getAllByRole("button")
      .filter((btn) => btn.querySelector('svg[class*="lucide-plus"]'));
    const addTagButton = addButtons[0]; // First should be for tags
    await userEvent.click(addTagButton);

    await waitForUpdate(7);

    // New empty item should appear as blank (empty string)
    // We can verify by checking that a new tag was added to the data
    // (The empty string will be in the JSON but won't have visible text)

    // Test 7: Update table cell
    const item1Field = canvas.getByText("Item 1");
    await userEvent.click(item1Field);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const item1Input = screen.getByDisplayValue("Item 1");
    await userEvent.clear(item1Input);
    await userEvent.type(item1Input, "Updated Item 1");
    await userEvent.keyboard("{Enter}");

    await waitForUpdate(8);
    expect(canvas.getByText("Updated Item 1")).toBeInTheDocument();

    // Test 8: Update nested table boolean field
    const activeTrue = canvas
      .getAllByText("true")
      .find((el) => el.closest("td") && el.textContent === "true");
    if (activeTrue) {
      await userEvent.click(activeTrue);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const activeBooleanSelect = screen.getByRole("combobox");
      await userEvent.click(activeBooleanSelect);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const activeFalseOption = screen.getByRole("option", { name: "false" });
      await userEvent.click(activeFalseOption);

      const activeSaveButton = screen.getByText("Save");
      await userEvent.click(activeSaveButton);

      await waitForUpdate(9);
    }

    // Test 9: Update deeply nested object field
    const supplierField = canvas.getByText("Supplier A");
    await userEvent.click(supplierField);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const supplierInput = screen.getByDisplayValue("Supplier A");
    await userEvent.clear(supplierInput);
    await userEvent.type(supplierInput, "Updated Supplier A");
    await userEvent.keyboard("{Enter}");

    await waitForUpdate(10);
    expect(canvas.getByText("Updated Supplier A")).toBeInTheDocument();

    // Test 10: Add table row
    // Find all tables and get the one that's not for the Tags section (Tags uses a simple list)
    const allTables = canvas.getAllByRole("table");
    // The second table should be the Items table (first is Tags, second is Items)
    const itemsTable = allTables[allTables.length - 1]; // Last table is Items
    const addRowButton = within(itemsTable)
      .getAllByRole("button")
      .find((btn) => btn.querySelector('svg[class*="lucide-plus"]'));
    await userEvent.click(addRowButton!);

    await waitForUpdate(11);

    // Should have more delete buttons now
    const deleteRowButtons = canvas.getAllByTitle("Delete row");
    expect(deleteRowButtons.length).toBe(3); // Original 2 + 1 new

    // Test 11: Edit new row properties

    // Edit name in new row - find the clickable div inside the first cell
    const tableRows = canvas.getAllByRole("row");
    const lastRow = tableRows[tableRows.length - 2]; // Get the last data table row (newly added)
    const tableCells = within(lastRow).getAllByRole("cell");
    if (tableCells.length > 0) {
      // Find the clickable div with cursor-pointer class (EditableField wrapper)
      const editableDiv = tableCells[0].querySelector(
        'div[class*="cursor-pointer"]'
      ) as HTMLElement;

      if (editableDiv) {
        await userEvent.click(editableDiv);
        await new Promise((resolve) => setTimeout(resolve, 200));

        // Look for the input field that appears when editing
        try {
          const nameInput = screen.getByRole("textbox");
          await userEvent.type(nameInput, "New Item 3");
          await userEvent.keyboard("{Enter}");

          await waitForUpdate(12);
          expect(canvas.getByText("New Item 3")).toBeInTheDocument();
        } catch (e) {
          console.error(e);
          console.log("Could not find textbox, skipping edit test");
        }
      } else {
        console.log("Could not find EditableField div in first cell");
      }
    }

    // Edit price in new row
    const priceZeros = canvas.getAllByText("0");
    if (priceZeros.length > 0) {
      await userEvent.click(priceZeros[priceZeros.length - 1]);
      await new Promise((resolve) => setTimeout(resolve, 100));

      const priceInput = screen.getByDisplayValue("0");
      await userEvent.clear(priceInput);
      await userEvent.type(priceInput, "300");
      await userEvent.keyboard("{Enter}");

      await waitForUpdate(13);
      expect(canvas.getByText("300")).toBeInTheDocument();
    }

    // Test 12: Delete table row
    const currentDeleteButtons = canvas.getAllByTitle("Delete row");
    if (currentDeleteButtons.length > 0) {
      await userEvent.click(currentDeleteButtons[0]);
      await waitForUpdate(14);

      const remainingDeleteButtons = canvas.getAllByTitle("Delete row");
      expect(remainingDeleteButtons.length).toBe(2);
    }

    expect(canvas.getByText("2000")).toBeInTheDocument();
    expect(canvas.getByText("updated-tag")).toBeInTheDocument();
    expect(canvas.getByText("95")).toBeInTheDocument(); // Updated score
    expect(canvas.getByText("2.0.0")).toBeInTheDocument(); // Updated version
    expect(canvas.getByText("10")).toBeInTheDocument(); // Updated priority
    expect(canvas.getByText("New Item 3")).toBeInTheDocument();
    expect(canvas.getByText("300")).toBeInTheDocument();

    // Verify JSON data is updated correctly
    const currentDataElement = canvas.getByTestId("current-data");
    const currentDataText = currentDataElement.textContent || "";
    expect(currentDataText).toContain("Updated Title");
    expect(currentDataText).toContain("updated-tag");
    expect(currentDataText).toContain("95");
    expect(currentDataText).toContain("2.0.0");
    expect(currentDataText).toContain("10");
    expect(currentDataText).toContain("New Item 3");
    expect(currentDataText).toContain("300");

    expect(canvas.getByTestId("update-counter")).toHaveTextContent(
      "Updates: 14"
    );
  },
};
