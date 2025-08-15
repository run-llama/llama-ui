import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within } from "@storybook/test";
import { ExtractedDataDisplay } from "../../src/extracted-data";
import { sampleData, sampleSchema, sampleFieldMetadata } from "./shared-data";
import { ConfidenceThresholdSettings } from "../../src/extracted-data/confidence-threshold-settings";

const meta: Meta<typeof ExtractedDataDisplay> = {
  title: "Components/ExtractedDataDisplay/WithControl",
  component: ExtractedDataDisplay,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ExtractedDataDisplay>;

function WithControlStoryComponent() {
  const extractedData = {
    original_data: sampleData,
    data: sampleData,
    status: "completed" as const,
    field_metadata: sampleFieldMetadata,
  };

  return (
    <div className="flex flex-col gap-6">
      <ConfidenceThresholdSettings />
      <ExtractedDataDisplay
        extractedData={extractedData}
        jsonSchema={sampleSchema}
        editable={false}
      />
    </div>
  );
}

export const WithControl: Story = {
  render: () => <WithControlStoryComponent />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test that the slider is present
    const slider = canvas.getByRole("slider");
    expect(slider).toBeInTheDocument();

    // Find the invoice number field (87% confidence)
    const invoiceNumberValue = canvas.getByText("8336");
    expect(invoiceNumberValue).toBeInTheDocument();

    // Set slider to 90% - invoice number (87%) should be highlighted with orange background
    await userEvent.click(slider);
    await userEvent.keyboard("{End}"); // Move to maximum value (100%)
    await userEvent.keyboard("{ArrowLeft>10}"); // Move back to ~90%

    // Wait for the UI to update
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Test that invoice number field has orange background (bg-orange-50)
    const invoiceNumberField = invoiceNumberValue.closest('[class*="bg-orange-50"]');
    expect(invoiceNumberField).toBeInTheDocument();

    // Change threshold to 80% - invoice number (87%) should no longer be orange
    await userEvent.keyboard("{ArrowLeft>10}"); // Move to ~80%

    // Wait for the UI to update
    await new Promise((resolve) => setTimeout(resolve, 200));

    // Test that invoice number field no longer has orange background
    const invoiceNumberFieldAfter = invoiceNumberValue.closest('[class*="bg-orange-50"]');
    expect(invoiceNumberFieldAfter).not.toBeInTheDocument();
  },
};
