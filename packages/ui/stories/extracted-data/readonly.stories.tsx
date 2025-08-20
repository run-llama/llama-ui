import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExtractedDataDisplay } from "../../src/extracted-data";
import { sampleData, sampleSchema, sampleFieldMetadata } from "./shared-data";

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
};
