import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";
import * as React from "react";

import { cn } from "../lib/utils";

const inputVariants = cva(
  [
    "flex h-9 w-full rounded-md border border-input bg-background px-3 py-1 text-sm leading-none shadow-xs transition-colors",
    "file:h-7 file:border-0 file:bg-transparent file:pe-2 file:text-sm file:font-medium",
    "placeholder:text-muted-foreground",
    "focus-visible:outline-none focus-visible:ring-[3px] focus-visible:ring-ring/50",
    "disabled:cursor-not-allowed disabled:opacity-50",
    "aria-invalid:border-destructive aria-invalid:focus-visible:ring-destructive/20",
  ],
  {
    variants: {
      variant: {
        default: "",
        error: "border-destructive focus-visible:ring-destructive/20",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  }
);

export interface InputProps
  extends Omit<
      React.ComponentProps<"input">,
      "size" | "className" | "children"
    >,
    VariantProps<typeof inputVariants> {
  ref?: React.Ref<HTMLInputElement | null>;
  /**
   * Optional icon to display at the start of the input
   */
  icon?: React.ReactNode;
}

/**
 * Input - A styled text input field component.
 *
 * Features:
 * - Built-in password visibility toggle for password inputs
 * - Support for all HTML input types
 * - Icon support via props
 * - Accessible focus and error states
 *
 * Special Handling:
 * - Password inputs automatically show/hide toggle button on focus/hover
 * - File inputs have custom styling with flex layout
 * - Invalid inputs (aria-invalid) or "error" variant show destructive ring color
 *
 * Example:
 * ```tsx
 * <Input type="email" placeholder="Enter email" />
 * <Input type="password" placeholder="Enter password" />
 * <Input icon={<Search />} placeholder="Search..." />
 * <Input type="file" icon={<Upload />} />
 * ```
 */
const Input = ({ ref, variant, type, icon, ...props }: InputProps) => {
  const [showPassword, setShowPassword] = React.useState(false);
  const [fileName, setFileName] = React.useState<string>("");

  const togglePasswordVisibility = () => {
    setShowPassword(!showPassword);
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.currentTarget.files;
    if (files?.[0]?.name) {
      setFileName(files[0].name);
    } else {
      setFileName("");
    }
    props.onChange?.(e);
  };

  const inputType = type === "password" && showPassword ? "text" : type;
  const isPassword = type === "password";
  const isFile = type === "file";
  const hasIcon = !!icon;

  // Custom file input with flex layout
  if (isFile) {
    return (
      <label
        className={cn(
          inputVariants({ variant }),
          "border-input bg-background text-foreground flex h-9 w-full items-center gap-2 overflow-hidden rounded-md border px-3 py-1 text-sm transition-colors",
          "focus-within:ring-ring/50 focus-within:outline-none focus-within:ring-[3px]",
          "has-[:disabled]:cursor-not-allowed has-[:disabled]:opacity-50"
        )}
      >
        <input
          ref={ref}
          type="file"
          className="sr-only"
          onChange={handleFileChange}
          {...props}
        />
        <button
          type="button"
          className="pointer-events-none flex flex-shrink-0 items-center justify-center px-1.5 py-px font-medium"
          tabIndex={-1}
        >
          Choose file
        </button>
        {icon && (
          <div className="text-muted-foreground relative flex h-4 w-4 flex-shrink-0 items-center justify-center [&>svg]:size-4">
            {icon}
          </div>
        )}
        <span className="text-muted-foreground relative line-clamp-1 flex-1">
          {fileName || "No file chosen"}
        </span>
      </label>
    );
  }

  const inputElement = (
    <input
      className={cn(
        inputVariants({ variant }),
        hasIcon && !isFile && "pl-9",
        isPassword && "pr-10"
      )}
      ref={ref}
      type={inputType}
      {...props}
    />
  );

  if (hasIcon || isPassword) {
    return (
      <div className="group relative w-full">
        {icon && (
          <div
            className={cn(
              "text-muted-foreground pointer-events-none absolute top-1/2 flex size-4 -translate-y-1/2 items-center justify-center [&>svg]:size-full",
              "left-3"
            )}
          >
            {icon}
          </div>
        )}
        {inputElement}
        {isPassword && (
          <button
            type="button"
            className="text-muted-foreground hover:text-foreground absolute right-3 top-1/2 -translate-y-1/2 opacity-0 transition-opacity group-focus-within:opacity-100 group-hover:opacity-100"
            onClick={togglePasswordVisibility}
            tabIndex={-1}
          >
            {showPassword ? (
              <EyeOff className="size-4" />
            ) : (
              <Eye className="size-4" />
            )}
          </button>
        )}
      </div>
    );
  }

  return inputElement;
};

Input.displayName = "Input";

export { Input, inputVariants };
