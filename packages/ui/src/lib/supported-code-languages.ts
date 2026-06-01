import type { Option } from "../../base/multiple-selector";

export const SUPPORTED_CODE_LANGUAGE_VALUES = ["python", "javascript"] as const;

export type SupportedCodeLanguage =
  (typeof SUPPORTED_CODE_LANGUAGE_VALUES)[number];

const supportedCodeLanguageSet = new Set<string>(
  SUPPORTED_CODE_LANGUAGE_VALUES
);

export function isSupportedCodeLanguage(
  language: string
): language is SupportedCodeLanguage {
  return supportedCodeLanguageSet.has(language);
}

export function filterSupportedCodeLanguageOptions<
  T extends Pick<Option, "value">,
>(options: readonly T[]): T[] {
  return options.filter((option) => isSupportedCodeLanguage(option.value));
}
