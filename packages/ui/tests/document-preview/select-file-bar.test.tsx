import { render } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { SelectFileBar } from "../../src/document-preview/select-file-bar";

describe("SelectFileBar", () => {
  let consoleErrorSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    consoleErrorSpy = vi.spyOn(console, "error").mockImplementation(() => {});
  });

  afterEach(() => {
    consoleErrorSpy.mockRestore();
  });

  it("should not have hydration errors", () => {
    const files = [
      { fileName: "test1.pdf", index: 0 },
      { fileName: "test2.pdf", index: 1 },
    ];

    render(
      <SelectFileBar
        files={files}
        currentIndex={0}
        onSelect={vi.fn()}
        onRemove={vi.fn()}
      />
    );

    const errorMessages = consoleErrorSpy.mock.calls
      .flat()
      .join(" ")
      .toLowerCase();
    const hasHydrationError = errorMessages.includes("hydration");

    expect(hasHydrationError).toBe(false);
  });
});
