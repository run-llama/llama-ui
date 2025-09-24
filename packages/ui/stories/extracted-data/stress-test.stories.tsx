import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "@storybook/test";
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
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Wait for the component to load
    await waitFor(() => {
      expect(
        canvas.getByText(/Page \d+ \/ \d+ - \d+ items/)
      ).toBeInTheDocument();
    });

    // Find pagination elements
    const paginationInfo = canvas.getByText(/Page \d+ \/ \d+ - \d+ items/);
    expect(paginationInfo).toBeInTheDocument();

    // Extract pagination info to understand the data size
    const paginationText = paginationInfo.textContent || "";
    const pageMatch = paginationText.match(/Page (\d+) \/ (\d+) - (\d+) items/);
    expect(pageMatch).toBeTruthy();

    const [, currentPage, totalPages, totalItems] = pageMatch!;
    const currentPageNum = parseInt(currentPage);
    const totalPagesNum = parseInt(totalPages);
    const totalItemsNum = parseInt(totalItems);

    console.log(
      `Pagination info: Page ${currentPageNum}/${totalPagesNum}, ${totalItemsNum} items`
    );

    // Test pagination navigation if there are multiple pages
    if (totalPagesNum > 1) {
      // Test next page navigation
      const nextButton = canvas.getByLabelText("Go to next page");
      expect(nextButton).toBeInTheDocument();

      // Click next page
      await userEvent.click(nextButton);

      // Wait for page to update
      await waitFor(() => {
        const updatedPaginationInfo = canvas.getByText(
          /Page \d+ \/ \d+ - \d+ items/
        );
        const updatedText = updatedPaginationInfo.textContent || "";
        const updatedMatch = updatedText.match(
          /Page (\d+) \/ (\d+) - (\d+) items/
        );
        expect(updatedMatch).toBeTruthy();
        const [, newCurrentPage] = updatedMatch!;
        expect(parseInt(newCurrentPage)).toBe(currentPageNum + 1);
      });

      // Test previous page navigation
      const prevButton = canvas.getByLabelText("Go to previous page");
      expect(prevButton).toBeInTheDocument();

      // Click previous page
      await userEvent.click(prevButton);

      // Wait for page to update back to original
      await waitFor(() => {
        const finalPaginationInfo = canvas.getByText(
          /Page \d+ \/ \d+ - \d+ items/
        );
        const finalText = finalPaginationInfo.textContent || "";
        const finalMatch = finalText.match(/Page (\d+) \/ \d+ - \d+ items/);
        expect(finalMatch).toBeTruthy();
        const [, finalCurrentPage] = finalMatch!;
        expect(parseInt(finalCurrentPage)).toBe(currentPageNum);
      });
    }
  },
};
