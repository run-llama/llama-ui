import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, within, screen } from "@storybook/test";
import { useState } from "react";
import { ExtractedDataDisplay } from "../../src/extracted-data";
import { sampleData, sampleSchema, sampleFieldMetadata } from "./shared-data";

const meta: Meta<typeof ExtractedDataDisplay> = {
  title: "Components/ExtractedDataDisplay/Basic",
  component: ExtractedDataDisplay,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof ExtractedDataDisplay>;

function BasicStoryComponent() {
  const [data, setData] = useState(sampleData);

  const handleChange = (updatedData: Record<string, unknown>) => {
    setData(updatedData as typeof sampleData);
  };

  const extractedData = {
    original_data: data,
    data,
    status: "completed" as const,
    field_metadata: sampleFieldMetadata,
  };

  return (
    <ExtractedDataDisplay
      extractedData={extractedData}
      editable={true}
      onChange={handleChange}
      jsonSchema={sampleSchema}
      onClickField={(args) => {
        console.log("Field clicked:", args);
        // You can add custom logic here, such as:
        // - Opening a modal with field details
        // - Highlighting the field in the source document
        // - Logging analytics events
        // - Triggering external actions
      }}
    />
  );
}

export const Basic: Story = {
  args: {
    extractedData: {
      data: sampleData,
      original_data: sampleData,
      status: "completed",
      field_metadata: {
        receiptNumber: {
          confidence: 0.95,
          reasoning: "Receipt number clearly visible",
          citation: [
            {
              matching_text: "uyte1213",
              page_number: 1,
            },
          ],
        },
        invoiceNumber: {
          confidence: 0.92,
          reasoning: "Invoice number extracted",
          citation: [
            {
              matching_text: "8336",
              page_number: 1,
            },
          ],
        },
        merchant: {
          name: {
            confidence: 0.98,
            reasoning: "Merchant name clearly visible",
            citation: [
              {
                matching_text: "Wehner LLC",
                page_number: 1,
              },
            ],
          },
          address: {
            street: {
              confidence: 0.94,
              reasoning: "Street address extracted",
              citation: [
                {
                  matching_text: "Princess",
                  page_number: 1,
                },
              ],
            },
            city: {
              confidence: 0.96,
              reasoning: "City name extracted",
              citation: [
                {
                  matching_text: "Funkhaven",
                  page_number: 1,
                },
              ],
            },
          },
          tags: {
            confidence: 0.88,
            reasoning: "Tags identified",
            citation: [
              {
                matching_text: "urgent, paid, processed",
                page_number: 1,
              },
            ],
          },
        },
        items: {
          confidence: 0.91,
          reasoning: "Items array extracted",
          citation: [
            {
              matching_text: "Labour Charges, Material",
              page_number: 1,
            },
          ],
        },
        tags: {
          confidence: 0.89,
          reasoning: "Tags array extracted",
          citation: [
            {
              matching_text: "urgent, paid, processed",
              page_number: 1,
            },
          ],
        },
      },
    },
    jsonSchema: sampleSchema,
    editable: true,
    onChange: (updatedData) => {
      console.log("Data updated:", updatedData);
    },
    onClickField: (args) => {
      console.log("Field clicked:", args);
      // You can add custom logic here, such as:
      // - Opening a modal with field details
      // - Highlighting the field in the source document
      // - Logging analytics events
      // - Triggering external actions
    },
  },
  render: () => <BasicStoryComponent />,
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Schema Reconciliation Tests - verify required vs optional field display

    // Test: Top-level fields are displayed with schema titles
    const receiptNumberLabel = canvas.getByText(/Receipt Number/);
    expect(receiptNumberLabel).toBeInTheDocument();

    const invoiceNumberLabel = canvas.getByText(/Invoice Number/);
    expect(invoiceNumberLabel).toBeInTheDocument();

    // Test: Optional fields that were added should be present
    const emailLabel = canvas.queryByText(/Email Address/);
    expect(emailLabel).toBeInTheDocument(); // Email was missing, should be added

    const totalAmountLabel = canvas.queryByText(/Total Amount/);
    expect(totalAmountLabel).toBeInTheDocument(); // Total amount was missing, should be added

    // Test: Nested object fields are displayed with schema titles
    const merchantNameLabel = canvas.getByText(/Merchant Name/);
    expect(merchantNameLabel).toBeInTheDocument();

    // Test: Nested object optional fields should be present if missing
    const merchantPhoneLabel = canvas.queryByText(/Phone Number/);
    expect(merchantPhoneLabel).toBeInTheDocument(); // merchant.phone was missing, should be added

    // Test: Nested address fields are displayed
    const streetLabel = canvas.getByText(/Street/);
    expect(streetLabel).toBeInTheDocument();

    const cityLabel = canvas.getByText(/City/);
    expect(cityLabel).toBeInTheDocument();

    // Test: Table/array fields are displayed
    const descriptionLabels = canvas.getAllByText(/Description/);
    expect(descriptionLabels.length).toBeGreaterThan(0); // Should have description fields

    // Test: Table/array optional fields should be present if missing
    const amountLabels = canvas.queryAllByText(/Amount/);
    expect(amountLabels.length).toBeGreaterThan(0); // amount was missing from items, should be added

    // Test: Low confidence fields should have orange background (confidence < 0.9)
    // Count all low confidence fields that should have orange background
    // Based on sampleFieldMetadata, we have these low confidence fields:
    // - invoiceNumber: 0.87 (< 0.9, should be orange)
    // - merchant.address.street: 0.65 (< 0.9, should be orange)
    // - merchant.address.city: 0.89 (< 0.9, should be orange)
    // - merchant.tags[1]: 0.85 (< 0.9, should be orange)
    // - items[0].period.end: 0.88 (< 0.9, should be orange)
    // - items[1].description: 0.88 (< 0.9, should be orange)
    // - items[1].period.start: 0.89 (< 0.9, should be orange)
    // - items[1].period.end: 0.85 (< 0.9, should be orange)
    // - tags[1]: 0.85 (< 0.9, should be orange)

    const expectedLowConfidenceCount = 9; // 9 fields with confidence < 0.9

    // Find all inputs with orange background
    const allInputs = canvasElement.querySelectorAll(
      '[data-slot="popover-trigger"]'
    );
    let orangeBackgroundCount = 0;

    for (const input of allInputs) {
      if (input.classList.contains("bg-orange-50")) {
        orangeBackgroundCount++;
      }
    }

    // Verify that we have the expected number of low confidence fields
    expect(orangeBackgroundCount).toBe(expectedLowConfidenceCount);

    // Also verify that high confidence fields do NOT have orange background
    // Find a high confidence field (merchant name with confidence 0.92)
    let highConfidenceInput = null;
    for (const input of allInputs) {
      const textElement = input.querySelector("span");
      if (textElement && textElement.textContent?.includes("Wehner LLC")) {
        highConfidenceInput = input;
        break;
      }
    }

    expect(highConfidenceInput).toBeTruthy(); // Should find the merchant name input

    // High confidence fields should not have orange background
    if (highConfidenceInput) {
      expect(highConfidenceInput).not.toHaveClass("bg-orange-50"); // Should not have orange background
    }

    // Test: Nested period required fields should be bold
    const startDateLabels = canvas.getAllByText(/Start Date/);
    for (const label of startDateLabels) {
      const element = label.closest("div");
      expect(element).toHaveClass("font-semibold"); // period.start is required
    }

    const endDateLabels = canvas.getAllByText(/End Date/);
    for (const label of endDateLabels) {
      const element = label.closest("div");
      expect(element).toHaveClass("font-semibold"); // period.end is required
    }

    // Test 1: Edit primitive field (receipt number)
    const receiptSpan = canvas.getByText("uyte1213");
    await userEvent.click(receiptSpan);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const receiptInput = screen.getByDisplayValue("uyte1213");
    await userEvent.clear(receiptInput);
    await userEvent.type(receiptInput, "NEW123");
    await userEvent.keyboard("{Enter}");

    // Wait for update and check green background
    await new Promise((resolve) => setTimeout(resolve, 300));

    // Use a more flexible approach to find the updated text
    const receiptFields = canvas.queryAllByText("NEW123");
    if (receiptFields.length === 0) {
      // If direct text search fails, try to find by partial text or wait longer
      await new Promise((resolve) => setTimeout(resolve, 500));
      const receiptFieldsRetry = canvas.getAllByText("NEW123");
      const changedReceiptField = receiptFieldsRetry[0].closest(
        '[class*="bg-green-50"]'
      );
      expect(changedReceiptField).toBeInTheDocument();
    } else {
      const changedReceiptField = receiptFields[0].closest(
        '[class*="bg-green-50"]'
      );
      expect(changedReceiptField).toBeInTheDocument();
    }

    // Test 2: Edit nested field (merchant name)
    const merchantNameSpan = canvas.getByText("Wehner LLC");
    await userEvent.click(merchantNameSpan);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const merchantNameInput = screen.getByDisplayValue("Wehner LLC");
    await userEvent.clear(merchantNameInput);
    await userEvent.type(merchantNameInput, "Updated Company LLC");
    await userEvent.keyboard("{Enter}");

    // Wait for update and check green background
    await new Promise((resolve) => setTimeout(resolve, 300));
    const merchantFields = canvas.getAllByText(/Updated Company LLC/);
    const changedMerchantField = merchantFields[0].closest(
      '[class*="bg-green-50"]'
    );
    expect(changedMerchantField).toBeInTheDocument();

    // Test 3: Edit array element (root level tags)
    const allUrgentSpans = canvas.getAllByText("urgent");
    // Use the last "urgent" which should be from root-level tags (after merchant section)
    const rootTagsUrgent = allUrgentSpans[allUrgentSpans.length - 1];
    await userEvent.click(rootTagsUrgent);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const urgentInput = screen.getByDisplayValue("urgent");
    await userEvent.clear(urgentInput);
    await userEvent.type(urgentInput, "high-priority");
    await userEvent.keyboard("{Enter}");

    // Wait for update and verify tag was updated
    await new Promise((resolve) => setTimeout(resolve, 300));
    const highPriorityElements = canvas.getAllByText("high-priority");
    expect(highPriorityElements.length).toBeGreaterThan(0);

    // Verify the updated tag has green background
    const tagGreenBg = highPriorityElements[0].closest(
      '[class*="bg-green-50"]'
    );
    expect(tagGreenBg).toBeInTheDocument();

    // Test 4: Edit table cell (first item description)
    const labourChargesSpans = canvas.getAllByText("Labour Charges");
    const firstLabourChargesSpan = labourChargesSpans[0];
    await userEvent.click(firstLabourChargesSpan);
    await new Promise((resolve) => setTimeout(resolve, 100));

    const labourChargesInput = screen.getByDisplayValue("Labour Charges");
    await userEvent.clear(labourChargesInput);
    await userEvent.type(labourChargesInput, "Updated Labour Charges");
    await userEvent.keyboard("{Enter}");

    // Wait for update and verify table cell was updated
    await new Promise((resolve) => setTimeout(resolve, 300));
    const updatedLabourElements = canvas.getAllByText("Updated Labour Charges");
    expect(updatedLabourElements.length).toBeGreaterThan(0);

    // Verify the updated table cell has green background
    const tableGreenBg = updatedLabourElements[0].closest(
      '[class*="bg-green-50"]'
    );
    expect(tableGreenBg).toBeInTheDocument();
  },
};
