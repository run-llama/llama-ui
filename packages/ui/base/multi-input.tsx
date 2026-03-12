import * as React from "react";
import { useMemo } from "react";
import CreatableSelect from "react-select/creatable";
import { cn } from "../lib/utils";
import { useControllableState } from "./utils/hooks/use-controllable-state";

interface Option {
  readonly label: string;
  readonly value: string;
}

export type MultiInputProps = Omit<
  React.HTMLProps<HTMLInputElement>,
  | "ref"
  | "as"
  | "size"
  | "value"
  | "defaultValue"
  | "onChange"
  | "onValueChange"
  | "children"
  | "onKeyDown"
  | "onKeyUp"
  | "onKeyPress"
  | "onFocus"
  | "onBlur"
  | "onInput"
  | "onInvalid"
  | "onSubmit"
  | "onReset"
  | "onSelect"
  | "onSelectStart"
  | "onSelectEnd"
> & {
  defaultValue?: string;
  value?: string; // string of comma separated values
  onValueChange?: (value: string) => void;
  maxOptions?: number; // New prop for limiting the number of options
};

const components = {
  DropdownIndicator: null,
};

export const MultiInput = ({
  value,
  defaultValue,
  onValueChange,
  name,
  maxOptions,
  ...props
}: MultiInputProps) => {
  const [inputs, setInputs] = useControllableState<string>({
    prop: value,
    defaultProp: defaultValue,
    onChange: onValueChange,
  });
  const options = useMemo<Option[]>(
    () =>
      inputs
        ?.split(",")
        .filter((v) => v.trim() !== "")
        .map((v) => ({
          label: v,
          value: v,
        })) ?? [],
    [inputs]
  );
  return (
    <>
      <CreatableSelect<Option, true>
        {...props}
        unstyled
        isMulti
        value={options}
        onChange={(newOptions) => {
          if (maxOptions && newOptions.length > maxOptions) {
            newOptions = newOptions.slice(0, maxOptions);
          }
          const data = newOptions.map((s) => s.value).join(",");
          setInputs(data);
        }}
        backspaceRemovesValue={true}
        hideSelectedOptions={true}
        isClearable={false}
        components={components}
        noOptionsMessage={() => null}
        isOptionDisabled={() =>
          maxOptions ? options.length >= maxOptions : false
        }
        classNames={{
          control: ({ isFocused }) =>
            cn(
              "flex min-h-9 w-full rounded-md border border-input bg-background text-sm shadow-xs transition-colors",
              isFocused && "outline-none ring-[3px] ring-ring/50"
            ),
          valueContainer: () => "flex flex-wrap items-center gap-1 px-3 py-1",
          multiValue: () =>
            "inline-flex items-center rounded-md border border-input px-1.5 py-0.5 text-xs font-medium text-foreground",
          multiValueLabel: () => "",
          multiValueRemove: () =>
            "ml-0.5 cursor-pointer rounded-full text-muted-foreground hover:text-foreground",
          input: () =>
            "flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground",
          placeholder: () => "text-muted-foreground",
        }}
      />
      <input name={name} type="hidden" value={inputs ?? value} />
    </>
  );
};
