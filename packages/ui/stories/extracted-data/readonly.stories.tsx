import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within, screen } from "@storybook/test";
import { ExtractedDataDisplay } from "../../src/extracted-data";
import { sampleData, sampleFieldMetadata, sampleSchema } from "./shared-data";

const meta: Meta<typeof ExtractedDataDisplay> = {
  title: "Components/ExtractedDataDisplay/Readonly",
  component: ExtractedDataDisplay,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ExtractedDataDisplay>;

function ReadonlyStoryComponent() {
  const extractedData = {
    original_data: sampleData,
    data: sampleData,
    status: "completed" as const,
    field_metadata: sampleFieldMetadata,
  };

  return (
    <ExtractedDataDisplay
      extractedData={extractedData}
      jsonSchema={sampleSchema}
      editable={false}
    />
  );
}

export const Readonly: Story = {
  render: () => <ReadonlyStoryComponent />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Find clickable fields (they should be present but not open popovers)
    const fields = canvas.getAllByTestId("editable-field-trigger");

    for (const field of fields) {
      await userEvent.click(field);

      await waitFor(() => {
        const popovers = screen.queryAllByTestId("editable-field-popover");
        expect(popovers).toHaveLength(0);
      });
    }

    // Verify no add row buttons are present (tables/lists should be readonly)
    const addButtons = canvas.queryAllByTitle("Add row");
    expect(addButtons).toHaveLength(0);

    // Verify no delete buttons are present (tables/lists should be readonly)
    const deleteButtons = canvas.queryAllByTitle("Delete row");
    expect(deleteButtons).toHaveLength(0);

    // Also check for delete item buttons in lists
    const deleteItemButtons = canvas.queryAllByTitle("Delete item");
    expect(deleteItemButtons).toHaveLength(0);
  },
};
