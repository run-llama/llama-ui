import * as React from "react";
import { cva, type VariantProps } from "class-variance-authority";
import { Eye, EyeOff } from "lucide-react";

import { cn } from "@/lib/utils";

const inputVariants = cva(
  "flex w-full min-w-0 rounded-md border border-input bg-transparent text-base shadow-xs transition-[color,box-shadow] outline-none ring-offset-background file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-foreground placeholder:text-muted-foreground selection:bg-primary selection:text-primary-foreground dark:bg-input/30 disabled:pointer-events-none disabled:cursor-not-allowed disabled:opacity-50 focus-visible:border-ring focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 aria-invalid:border-destructive aria-invalid:ring-destructive/20 dark:aria-invalid:ring-destructive/40",
  {
    variants: {
      size: {
        default: "h-10 px-3 py-2 md:text-sm",
        xs: "h-8 px-2.5 py-1.5 text-xs",
      },
    },
    defaultVariants: {
      size: "default",
    },
  },
);

export interface InputProps
  extends Omit<React.ComponentPropsWithoutRef<"input">, "size">,
    VariantProps<typeof inputVariants> {}

const Input = React.forwardRef<HTMLInputElement, InputProps>(
  ({ className, size, type = "text", ...props }, ref) => {
    const [showPassword, setShowPassword] = React.useState(false);
    const isPassword = type === "password";

    React.useEffect(() => {
      if (!isPassword && showPassword) {
        setShowPassword(false);
      }
    }, [isPassword, showPassword]);

    const inputType = isPassword && showPassword ? "text" : type;
    const inputClasses = cn(
      inputVariants({ size }),
      isPassword && "pr-10",
      className,
    );

    const inputElement = (
      <input
        ref={ref}
        type={inputType}
        data-slot="input"
        className={inputClasses}
        {...props}
      />
    );

    if (!isPassword) {
      return inputElement;
    }

    return (
      <div className="relative">
        {inputElement}
        <button
          type="button"
          className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
          onClick={() => setShowPassword((prev) => !prev)}
          aria-label={showPassword ? "Hide password" : "Show password"}
          aria-pressed={showPassword}
          disabled={props.disabled}
        >
          {showPassword ? (
            <Eye className="size-4" aria-hidden="true" />
          ) : (
            <EyeOff className="size-4" aria-hidden="true" />
          )}
        </button>
      </div>
    );
  },
);

Input.displayName = "Input";

export { Input, inputVariants };
