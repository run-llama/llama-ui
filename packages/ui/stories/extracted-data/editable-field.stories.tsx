import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect } from "@storybook/test";
import { within, userEvent, screen } from "@storybook/test";
import { useState } from "react";
import { EditableField } from "@/registry/new-york/extracted-data/editable-field";
import { PrimitiveType } from "@/registry/new-york/extracted-data/primitive-validation";

const meta: Meta<typeof EditableField> = {
  title: "Components/ExtractedData/EditableField",
  component: EditableField,
  parameters: {
    layout: "padded",
  },
};

export default meta;
type Story = StoryObj<typeof EditableField>;

export const Basic: Story = {
  args: {
    value: "Sample text",
    confidence: 0.95,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);
    const [confidence, setConfidence] = useState(args.confidence);

    const handleSave = (newValue: unknown) => {
      console.log("Saved:", newValue);
      setValue(newValue);
    };

    const handleConfidenceUpdate = (newConfidence: number) => {
      console.log("Confidence updated:", newConfidence);
      setConfidence(newConfidence);
    };

    return (
      <EditableField
        {...args}
        value={value}
        onSave={handleSave}
        confidence={confidence}
        onConfidenceUpdate={handleConfidenceUpdate}
      />
    );
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test initial display
    expect(canvas.getByText("Sample text")).toBeInTheDocument();

    // Test clicking to edit - opens popover
    const field = canvas.getByText("Sample text");
    await userEvent.click(field);

    // Wait for popover to open
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test popover appears (rendered in body via Portal)
    const editValueText = await screen.findByText(
      "Edit Value",
      {},
      { timeout: 1000 },
    );
    expect(editValueText).toBeInTheDocument();

    // Test input appears and is focused (also in body)
    const input = screen.getByDisplayValue("Sample text");
    expect(input).toBeInTheDocument();
    expect(input).toHaveFocus();

    // Test editing and saving with Enter
    await userEvent.clear(input);
    await userEvent.type(input, "Updated text");
    await userEvent.keyboard("{Enter}");

    // Wait for popover to close and value to update
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test that value is updated
    expect(canvas.getByText("Updated text")).toBeInTheDocument();
  },
};

export const LowConfidence: Story = {
  args: {
    value: "Low confidence value",
    confidence: 0.65,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return <EditableField {...args} value={value} onSave={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test low confidence styling (orange border)
    const field = canvas.getByText("Low confidence value");
    const container = field.closest('[class*="border-orange-300"]');
    expect(container).toBeInTheDocument();

    // Test low confidence background color (orange)
    const backgroundContainer = field.closest('[class*="bg-orange-50"]');
    expect(backgroundContainer).toBeInTheDocument();
  },
};

export const ChangedState: Story = {
  args: {
    value: "Changed value",
    confidence: 0.92,
    isChanged: true,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return <EditableField {...args} value={value} onSave={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test changed state styling (green background)
    const field = canvas.getByText("Changed value");
    const container = field.closest('[class*="bg-green-50"]');
    expect(container).toBeInTheDocument();
  },
};

export const NoBorder: Story = {
  args: {
    value: "No border field",
    confidence: 0.88,
    showBorder: false,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return <EditableField {...args} value={value} onSave={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test no border styling
    const field = canvas.getByText("No border field");
    const container = field.closest('[class*="w-full"]');
    expect(container).toBeInTheDocument();

    // Test editing still works
    await userEvent.click(field);

    // Wait for popover to open
    await new Promise((resolve) => setTimeout(resolve, 100));

    const input = screen.getByDisplayValue("No border field");
    expect(input).toBeInTheDocument();
  },
};

export const EscapeToCancel: Story = {
  args: {
    value: "Original value",
    confidence: 0.75,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return <EditableField {...args} value={value} onSave={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test editing
    const field = canvas.getByText("Original value");
    await userEvent.click(field);

    // Wait for popover to open
    await new Promise((resolve) => setTimeout(resolve, 100));

    const input = screen.getByDisplayValue("Original value");
    await userEvent.clear(input);
    await userEvent.type(input, "This should be cancelled");

    // Test escape cancels edit
    await userEvent.keyboard("{Escape}");

    // Wait for popover to close
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test original value is restored
    expect(canvas.getByText("Original value")).toBeInTheDocument();
  },
};

export const NumberType: Story = {
  args: {
    value: 42,
    confidence: 0.92,
    expectedType: PrimitiveType.NUMBER,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return <EditableField {...args} value={value} onSave={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test initial display
    expect(canvas.getByText("42")).toBeInTheDocument();

    // Test clicking to edit
    const field = canvas.getByText("42");
    await userEvent.click(field);

    // Test that popover opens
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.getByText("Edit Value")).toBeInTheDocument();

    // Test input appears with number type
    const input = screen.getByDisplayValue("42") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input.type).toBe("number");

    // Test editing valid number
    await userEvent.clear(input);
    await userEvent.type(input, "123.45");

    // Test saving
    const saveButton = screen.getByText("Save");
    await userEvent.click(saveButton);

    // Test that value is updated
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(canvas.getByText("123.45")).toBeInTheDocument();
  },
};

export const NumberClearValue: Story = {
  args: {
    value: 100,
    confidence: 0.85,
    expectedType: PrimitiveType.NUMBER,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return <EditableField {...args} value={value} onSave={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test clicking to edit
    const field = canvas.getByText("100");
    await userEvent.click(field);

    // Wait for popover to open
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test clearing the number input (should convert to null)
    const input = screen.getByDisplayValue("100");
    await userEvent.clear(input);

    // Test saving empty value
    const saveButton = screen.getByText("Save");
    await userEvent.click(saveButton);

    // Test that empty number becomes null, displayed as blank
    await new Promise((resolve) => setTimeout(resolve, 100));
    const fieldElement = canvasElement.querySelector(
      'div[class*="cursor-pointer"] span',
    );
    expect(fieldElement?.textContent).toBe("");
  },
};

export const RequiredNumber: Story = {
  args: {
    value: 50,
    confidence: 0.9,
    expectedType: PrimitiveType.NUMBER,
    required: true,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return <EditableField {...args} value={value} onSave={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test clicking to edit
    const field = canvas.getByText("50");
    await userEvent.click(field);

    // Wait for popover to open
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test that input has required attribute
    const input = screen.getByDisplayValue("50") as HTMLInputElement;
    expect(input).toBeInTheDocument();
    expect(input).toHaveAttribute("required");

    // Test clearing the required number input
    await userEvent.clear(input);

    // Test attempting to save empty value (should not save)
    const saveButton = screen.getByText("Save");
    await userEvent.click(saveButton);

    // Test that popover stays open and value unchanged (save was prevented)
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.getByText("Edit Value")).toBeInTheDocument();
    expect(canvas.getByText("50")).toBeInTheDocument();

    // Test entering a valid number
    await userEvent.type(input, "75");
    await userEvent.click(saveButton);

    // Test that value is updated
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(canvas.getByText("75")).toBeInTheDocument();
  },
};

export const BooleanType: Story = {
  args: {
    value: true,
    confidence: 0.88,
    expectedType: PrimitiveType.BOOLEAN,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return <EditableField {...args} value={value} onSave={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test initial display
    expect(canvas.getByText("true")).toBeInTheDocument();

    // Test clicking to edit
    const field = canvas.getByText("true");
    await userEvent.click(field);

    // Test that popover opens
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(screen.getByText("Edit Value")).toBeInTheDocument();

    // Test that select dropdown appears
    const selectTrigger = screen.getByRole("combobox");
    expect(selectTrigger).toBeInTheDocument();

    // Test opening the select
    await userEvent.click(selectTrigger);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test selecting false
    const falseOption = screen.getByText("false");
    await userEvent.click(falseOption);

    // Test saving
    const saveButton = screen.getByText("Save");
    await userEvent.click(saveButton);

    // Test that value is updated
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(canvas.getByText("false")).toBeInTheDocument();
  },
};

export const BooleanToggle: Story = {
  args: {
    value: false,
    confidence: 0.72,
    expectedType: PrimitiveType.BOOLEAN,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return <EditableField {...args} value={value} onSave={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test clicking to edit
    const field = canvas.getByText("false");
    await userEvent.click(field);

    // Wait for popover to open
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test that select works with different values
    const selectTrigger = screen.getByRole("combobox");
    await userEvent.click(selectTrigger);
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test selecting true
    const trueOption = screen.getByText("true");
    await userEvent.click(trueOption);

    // Test saving
    const saveButton = screen.getByText("Save");
    await userEvent.click(saveButton);

    // Test that value is updated
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(canvas.getByText("true")).toBeInTheDocument();
  },
};

export const StringEdit: Story = {
  args: {
    value: "Hello World",
    confidence: 0.95,
    expectedType: PrimitiveType.STRING,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return <EditableField {...args} value={value} onSave={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test clicking to edit
    const field = canvas.getByText("Hello World");
    await userEvent.click(field);

    // Wait for popover to open
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test input appears (textarea for string types)
    const input = screen.getByDisplayValue(
      "Hello World",
    ) as HTMLTextAreaElement;
    expect(input).toBeInTheDocument();
    expect(input.tagName.toLowerCase()).toBe("textarea");
    expect(input.placeholder).toBe("Enter value");

    // Test editing
    await userEvent.clear(input);
    await userEvent.type(input, "Updated String");

    // Test saving with Enter key
    await userEvent.keyboard("{Enter}");

    // Test that value is updated
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(canvas.getByText("Updated String")).toBeInTheDocument();
  },
};

export const CancelWithButton: Story = {
  args: {
    value: "Cancel test",
    confidence: 0.8,
    expectedType: PrimitiveType.STRING,
  },
  render: function Render(args) {
    const [value, setValue] = useState(args.value);

    return <EditableField {...args} value={value} onSave={setValue} />;
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement);

    // Test clicking to edit
    const field = canvas.getByText("Cancel test");
    await userEvent.click(field);

    // Wait for popover to open
    await new Promise((resolve) => setTimeout(resolve, 100));

    // Test editing
    const input = screen.getByDisplayValue("Cancel test");
    await userEvent.clear(input);
    await userEvent.type(input, "This should be cancelled");

    // Test cancel button
    const cancelButton = screen.getByText("Cancel");
    await userEvent.click(cancelButton);

    // Test that original value is restored and popover closes
    await new Promise((resolve) => setTimeout(resolve, 100));
    expect(canvas.getByText("Cancel test")).toBeInTheDocument();
    expect(canvas.queryByText("Edit Value")).not.toBeInTheDocument();
  },
};
