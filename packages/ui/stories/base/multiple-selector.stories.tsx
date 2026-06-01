import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { MultipleSelector, type Option } from "../../base/multiple-selector";
import { ThemeComparison } from "./theme-comparison";
import { filterSupportedCodeLanguageOptions } from "../../src/lib/supported-code-languages";

const frameworkOptions: Option[] = [
  { value: "react", label: "React" },
  { value: "vue", label: "Vue" },
  { value: "angular", label: "Angular" },
  { value: "svelte", label: "Svelte" },
  { value: "next", label: "Next.js" },
  { value: "nuxt", label: "Nuxt" },
  { value: "remix", label: "Remix" },
  { value: "astro", label: "Astro" },
];

const allLanguageOptions: Option[] = [
  { value: "typescript", label: "TypeScript", group: "Typed" },
  { value: "javascript", label: "JavaScript", group: "Dynamic" },
  { value: "python", label: "Python", group: "Dynamic" },
  { value: "rust", label: "Rust", group: "Typed" },
  { value: "go", label: "Go", group: "Typed" },
  { value: "ruby", label: "Ruby", group: "Dynamic" },
];

const languageOptions = filterSupportedCodeLanguageOptions(allLanguageOptions);

const meta: Meta<typeof MultipleSelector> = {
  title: "Base/MultipleSelector",
  component: MultipleSelector,
  tags: ["autodocs"],
};

export default meta;
type Story = StoryObj<typeof MultipleSelector>;

export const Default: Story = {
  render: () => (
    <ThemeComparison>
      <div className="w-80">
        <MultipleSelector
          defaultOptions={frameworkOptions}
          placeholder="Select frameworks..."
        />
      </div>
    </ThemeComparison>
  ),
};

export const WithPreselected: Story = {
  render: () => (
    <ThemeComparison>
      <div className="w-80">
        <MultipleSelector
          defaultOptions={frameworkOptions}
          value={[
            { value: "react", label: "React" },
            { value: "next", label: "Next.js" },
          ]}
          placeholder="Select frameworks..."
        />
      </div>
    </ThemeComparison>
  ),
};

/** Creatable mode lets users type and create new options on the fly. */
export const Creatable: Story = {
  render: () => (
    <ThemeComparison>
      <div className="w-80">
        <MultipleSelector
          defaultOptions={frameworkOptions}
          placeholder="Select or create tags..."
          creatable
        />
      </div>
    </ThemeComparison>
  ),
};

/** Limit selections to a maximum count. */
export const MaxSelected: Story = {
  render: () => (
    <ThemeComparison>
      <div className="w-80">
        <MultipleSelector
          defaultOptions={frameworkOptions}
          placeholder="Pick up to 3..."
          maxSelected={3}
          onMaxSelected={(max) => alert(`Maximum of ${max} reached`)}
        />
      </div>
    </ThemeComparison>
  ),
};

/** Options grouped by a key. */
export const Grouped: Story = {
  render: () => (
    <ThemeComparison>
      <div className="w-80">
        <MultipleSelector
          defaultOptions={languageOptions}
          groupBy="group"
          placeholder="Select languages..."
        />
      </div>
    </ThemeComparison>
  ),
};

/** Disabled state prevents all interaction. */
export const Disabled: Story = {
  render: () => (
    <ThemeComparison>
      <div className="w-80">
        <MultipleSelector
          defaultOptions={frameworkOptions}
          value={[
            { value: "react", label: "React" },
            { value: "vue", label: "Vue" },
          ]}
          placeholder="Disabled selector"
          disabled
        />
      </div>
    </ThemeComparison>
  ),
};

/** Fixed options cannot be removed by the user. */
export const FixedOptions: Story = {
  render: () => (
    <ThemeComparison>
      <div className="w-80">
        <MultipleSelector
          defaultOptions={frameworkOptions}
          value={[
            { value: "react", label: "React", fixed: true },
            { value: "next", label: "Next.js" },
          ]}
          placeholder="React is fixed..."
        />
      </div>
    </ThemeComparison>
  ),
};

/** Simulates async search with a loading indicator. */
export const AsyncSearch: Story = {
  render: () => (
    <ThemeComparison>
      <div className="w-80">
        <MultipleSelector
          placeholder="Search frameworks..."
          triggerSearchOnFocus
          onSearch={async (query) => {
            await new Promise((r) => setTimeout(r, 500));
            return frameworkOptions.filter((o) =>
              o.label.toLowerCase().includes(query.toLowerCase())
            );
          }}
          loadingIndicator={
            <p className="py-2 text-center text-sm text-muted-foreground">
              Searching...
            </p>
          }
          emptyIndicator={
            <p className="text-center text-sm text-muted-foreground">
              No results found.
            </p>
          }
        />
      </div>
    </ThemeComparison>
  ),
};

/** Placeholder hides once items are selected. */
export const HidePlaceholderWhenSelected: Story = {
  render: () => (
    <ThemeComparison>
      <div className="w-80">
        <MultipleSelector
          defaultOptions={frameworkOptions}
          placeholder="This hides after selection..."
          hidePlaceholderWhenSelected
        />
      </div>
    </ThemeComparison>
  ),
};

const ControlledExample = () => {
  const [value, setValue] = React.useState<Option[]>([
    { value: "react", label: "React" },
  ]);

  return (
    <div className="flex w-80 flex-col gap-3">
      <MultipleSelector
        defaultOptions={frameworkOptions}
        value={value}
        onChange={setValue}
        placeholder="Controlled selector..."
      />
      <p className="text-xs text-muted-foreground">
        Selected: {value.map((v) => v.label).join(", ") || "none"}
      </p>
    </div>
  );
};

/** Controlled value with external state. */
export const Controlled: Story = {
  render: () => (
    <ThemeComparison>
      <ControlledExample />
    </ThemeComparison>
  ),
};
