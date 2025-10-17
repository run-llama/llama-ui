import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, userEvent, waitFor, within } from "@storybook/test";

import { FileUploader, FileType } from "../../src/file-upload";

const meta: Meta<typeof FileUploader> = {
  title: "Components/FileUploader/Interactions",
  component: FileUploader,
  parameters: {
    layout: "padded",
  },
  args: {
    inputFields: [{ key: "partNumber", label: "Part Number", required: true }],
    allowedFileTypes: [FileType.PDF, FileType.JPEG, FileType.PNG],
    maxFileSizeBytes: 10 * 1000 * 1000,
    onSuccess: async () => undefined,
  },
};

export default meta;

type Story = StoryObj<typeof FileUploader>;

export const RequiredFieldValidation: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: /upload file/i }));

    const dialog = await canvas.findByRole("dialog");
    const dialogScope = within(dialog);

    const submitButton = dialogScope.getByRole("button", {
      name: /upload & process/i,
    });
    await userEvent.click(submitButton);

    const errorMessage = await dialogScope.findByText(
      "Part Number is required"
    );
    await expect(errorMessage).toBeInTheDocument();

    const partNumberInput = dialogScope.getByLabelText("Part Number");
    await userEvent.type(partNumberInput, "PN-12345");

    await waitFor(() => {
      expect(
        dialogScope.queryByText("Part Number is required")
      ).not.toBeInTheDocument();
    });

    await userEvent.click(dialogScope.getByRole("button", { name: /cancel/i }));
  },
};

export const UrlEntryDisablesDropzone: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: /upload file/i }));

    const dialog = await canvas.findByRole("dialog");
    const dialogScope = within(dialog);

    await userEvent.click(dialogScope.getByRole("tab", { name: /file url/i }));

    const urlInput = await dialogScope.findByPlaceholderText(
      "Paste the file link here"
    );
    await userEvent.type(urlInput, "https://example.com/manual.pdf");

    await userEvent.click(
      dialogScope.getByRole("tab", { name: /upload file/i })
    );

    const dropzone = dialogScope.getByRole("button", {
      name: /upload file \(drag or click\)/i,
    });

    await waitFor(() => {
      expect(dropzone).toHaveAttribute("aria-disabled", "true");
    });

    await userEvent.click(dialogScope.getByRole("tab", { name: /file url/i }));
    await userEvent.clear(urlInput);

    await userEvent.click(
      dialogScope.getByRole("tab", { name: /upload file/i })
    );

    await waitFor(() => {
      expect(dropzone).toHaveAttribute("aria-disabled", "false");
    });

    await userEvent.click(dialogScope.getByRole("button", { name: /cancel/i }));
  },
};

export const FileSelectionDisablesUrl: Story = {
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);

    await userEvent.click(canvas.getByRole("button", { name: /upload file/i }));

    const dialog = await canvas.findByRole("dialog");
    const dialogScope = within(dialog);

    const fileInput =
      dialog.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput) {
      throw new Error("Expected hidden file input to exist");
    }

    const file = new File(["content"], "blueprint.pdf", {
      type: "application/pdf",
    });
    await userEvent.upload(fileInput, file);

    await dialogScope.findByText("blueprint.pdf");

    await userEvent.click(dialogScope.getByRole("tab", { name: /file url/i }));
    const urlInput = await dialogScope.findByPlaceholderText(
      "Paste the file link here"
    );

    await waitFor(() => {
      expect(urlInput).toBeDisabled();
    });

    await userEvent.click(dialogScope.getByRole("button", { name: /cancel/i }));
  },
};

export const MultipleFileUploads: Story = {
  args: {
    multiple: true,
    inputFields: [],
  },
  play: async ({ canvasElement }) => {
    const canvas = within(canvasElement.ownerDocument.body);

    await userEvent.click(
      canvas.getByRole("button", { name: /upload files/i })
    );

    const dialog = await canvas.findByRole("dialog");
    const dialogScope = within(dialog);

    const fileInput =
      dialog.querySelector<HTMLInputElement>('input[type="file"]');
    if (!fileInput) {
      throw new Error("Expected hidden file input to exist");
    }

    const specSheet = new File(["spec"], "spec-sheet.pdf", {
      type: "application/pdf",
    });
    const assemblyDiagram = new File(["diagram"], "assembly.png", {
      type: "image/png",
    });

    await userEvent.upload(fileInput, [specSheet, assemblyDiagram]);

    await dialogScope.findByText("spec-sheet.pdf");
    await dialogScope.findByText("assembly.png");

    const submitButton = await dialogScope.findByRole("button", {
      name: /upload 2 files & process/i,
    });
    await expect(submitButton).toBeEnabled();

    await userEvent.click(dialogScope.getByRole("button", { name: /cancel/i }));
  },
};
