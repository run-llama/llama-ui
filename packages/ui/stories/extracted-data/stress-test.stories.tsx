import type { Meta, StoryObj } from "@storybook/react-vite";
import { ExtractedDataDisplay } from "../../src/extracted-data";
import { hugeSampleData } from "./shared-data";

const meta: Meta<typeof ExtractedDataDisplay> = {
  title: "Components/ExtractedDataDisplay/StressTest",
  component: ExtractedDataDisplay,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ExtractedDataDisplay>;

function StressTestStoryComponent() {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { extractedData, schema } = hugeSampleData as any;
  return (
    <ExtractedDataDisplay
      extractedData={extractedData}
      jsonSchema={schema}
      editable={false}
    />
  );
}

export const StressTest: Story = {
  render: () => <StressTestStoryComponent />,
};
