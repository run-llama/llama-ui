import { describe, expect, it } from "vitest";
import {
  filterSupportedCodeLanguageOptions,
  isSupportedCodeLanguage,
  SUPPORTED_CODE_LANGUAGE_VALUES,
} from "../../src/lib/supported-code-languages";

describe("supported code languages", () => {
  it("allows only Python and JavaScript", () => {
    expect(SUPPORTED_CODE_LANGUAGE_VALUES).toEqual(["python", "javascript"]);
  });

  it("identifies supported code languages", () => {
    expect(isSupportedCodeLanguage("python")).toBe(true);
    expect(isSupportedCodeLanguage("javascript")).toBe(true);
    expect(isSupportedCodeLanguage("typescript")).toBe(false);
    expect(isSupportedCodeLanguage("go")).toBe(false);
  });

  it("filters option lists down to supported languages without reordering", () => {
    const options = [
      { value: "typescript", label: "TypeScript" },
      { value: "javascript", label: "JavaScript" },
      { value: "php", label: "PHP" },
      { value: "python", label: "Python" },
      { value: "csharp", label: "C#" },
    ];

    expect(filterSupportedCodeLanguageOptions(options)).toEqual([
      { value: "javascript", label: "JavaScript" },
      { value: "python", label: "Python" },
    ]);
  });
});
