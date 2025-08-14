import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "@storybook/test";
import { useState } from "react";
import { ExtractedDataDisplay } from "../../src/extracted-data";
import { sampleData, sampleSchema, sampleFieldMetadata } from "./shared-data";

const meta: Meta<typeof ExtractedDataDisplay> = {
  title: "Components/ExtractedDataDisplay/FieldClickInteractions",
  component: ExtractedDataDisplay,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ExtractedDataDisplay>;

function FieldClickWrapper() {
  const [data, setData] = useState(sampleData);
  const [lastClick, setLastClick] = useState<unknown>(null);

  const extractedData = {
    original_data: data,
    data,
    status: "completed" as const,
    field_metadata: sampleFieldMetadata,
  };

  return (
    <div>
      <ExtractedDataDisplay
        extractedData={extractedData}
        editable={true}
        jsonSchema={sampleSchema}
        onChange={(args) => setData(args)}
        onClickField={(args) => setLastClick(args)}
      />
      <pre data-testid="field-click-json">
        {lastClick ? JSON.stringify(lastClick) : ""}
      </pre>
    </div>
  );
}

export const FieldClickInteractions: Story = {
  render: () => <FieldClickWrapper />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    const readClick = () => {
      const holder = canvas.getByTestId("field-click-json");
      const text = holder.textContent || "";
      return text ? JSON.parse(text) : null;
    };

    // 1) Top-level field
    await userEvent.click(canvas.getByText("uyte1213"));
    await new Promise((r) => setTimeout(r, 50));
    let payload = readClick();
    expect(payload).toBeTruthy();
    expect(payload.path).toEqual(["receiptNumber"]);
    expect(payload.value).toBe("uyte1213");
    expect(payload.metadata?.confidence).toBeDefined();

    // 2) Nested object field
    await userEvent.click(canvas.getByText("Wehner LLC"));
    await new Promise((r) => setTimeout(r, 50));
    payload = readClick();
    expect(payload.path).toEqual(["merchant", "name"]);
    expect(payload.value).toBe("Wehner LLC");

    // 3) Array item (root-level tags). Choose the last occurrence to avoid merchant tags.
    const allUrgent = canvas.getAllByText("urgent");
    await userEvent.click(allUrgent[allUrgent.length - 1]);
    await new Promise((r) => setTimeout(r, 50));
    payload = readClick();
    expect(payload.path[0]).toBe("tags");
    expect(payload.path.length).toBe(2);
    expect(Number.isInteger(Number(payload.path[1]))).toBe(true);
    expect(payload.value).toBe("urgent");

    // 4) Table cell (items[0].description)
    const labourCells = canvas.getAllByText("Labour Charges");
    await userEvent.click(labourCells[0]);
    await new Promise((r) => setTimeout(r, 50));
    payload = readClick();
    expect(payload.path).toEqual(["items", "0", "description"]);
    expect(payload.value).toBe("Labour Charges");
  },
};
