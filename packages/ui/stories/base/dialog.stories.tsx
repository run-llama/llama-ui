import * as React from "react";
import type { Meta, StoryObj } from "@storybook/react-vite";

import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTrigger,
  type DialogBreakpoint,
  type DialogAction,
} from "../../base/dialog";
import { Button } from "../../base/button";

// Wrapper component for Storybook controls
interface DialogPlaygroundProps {
  breakpoint: DialogBreakpoint;
  headerTitle?: string;
  headerDescription?: string;
  primary?: DialogAction;
  secondary?: DialogAction;
  tertiary?: DialogAction;
  showSlot: boolean;
}

const DialogPlayground = ({
  breakpoint,
  headerTitle,
  headerDescription,
  primary,
  secondary,
  tertiary,
  showSlot,
}: DialogPlaygroundProps) => {
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" label="Open Dialog" />
      </DialogTrigger>
      <DialogContent breakpoint={breakpoint}>
        <DialogHeader
          title={headerTitle}
          description={headerDescription}
          breakpoint={breakpoint}
        />
        {showSlot && (
          <div className="flex min-h-[200px] items-center justify-center rounded-md border-2 border-dashed border-purple-300 bg-purple-50 p-4">
            <span className="text-sm text-gray-700">
              Slot (swap it with your content)
            </span>
          </div>
        )}
        <DialogFooter
          primary={primary}
          secondary={secondary}
          tertiary={tertiary}
          breakpoint={breakpoint}
        />
      </DialogContent>
    </Dialog>
  );
};

const meta: Meta<typeof DialogPlayground> = {
  title: "Base/Dialog",
  component: DialogPlayground,
  tags: ["autodocs"],
  argTypes: {
    breakpoint: {
      control: { type: "select" },
      options: ["lg", "sm"],
    },
    headerTitle: {
      control: "text",
    },
    headerDescription: {
      control: "text",
    },
    primary: {
      control: "object",
    },
    secondary: {
      control: "object",
    },
    tertiary: {
      control: "object",
    },
    showSlot: {
      control: "boolean",
    },
  },
};

// eslint-disable-next-line no-restricted-syntax
export default meta;
type Story = StoryObj<typeof DialogPlayground>;

export const Playground: Story = {
  args: {
    breakpoint: "lg",
    headerTitle: "Dialog title",
    headerDescription: "This is a dialog description.",
    primary: { label: "Confirm" },
    secondary: { label: "Cancel" },
    tertiary: { label: "Learn more" },
    showSlot: true,
  },
};

// Story showcasing asDialogClose - buttons that auto-close the dialog
const DialogWithAutoClose = () => {
  const [lastAction, setLastAction] = React.useState<string>("");

  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" label="Open Dialog" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader
            title="Auto-close Example"
            description="Both buttons will close the dialog automatically using asDialogClose."
          />
          <DialogFooter
            secondary={{ label: "Cancel", asDialogClose: true }}
            primary={{
              label: "Confirm",
              asDialogClose: true,
              onClick: () => setLastAction("Confirmed!"),
            }}
          />
        </DialogContent>
      </Dialog>
      {lastAction && (
        <p className="text-sm text-muted-foreground">
          Last action: {lastAction}
        </p>
      )}
    </div>
  );
};

export const AutoCloseButtons: Story = {
  render: () => <DialogWithAutoClose />,
  parameters: {
    docs: {
      description: {
        story:
          "Use `asDialogClose: true` on DialogAction to automatically close the dialog when the button is clicked.",
      },
    },
  },
};

// Story showcasing form submission with type="submit" and form attribute
const DialogWithForm = () => {
  const [submittedData, setSubmittedData] = React.useState<string>("");

  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" label="Open Form Dialog" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader
            title="Form Submission"
            description="The Save button uses type='submit' and form='my-form' to submit the form."
          />
          <form
            id="my-form"
            onSubmit={(e) => {
              e.preventDefault();
              const formData = new FormData(e.currentTarget);
              setSubmittedData(formData.get("username") as string);
            }}
          >
            <div className="space-y-2">
              <label htmlFor="username" className="text-sm font-medium">
                Username
              </label>
              <input
                id="username"
                name="username"
                className="w-full rounded-md border px-3 py-2"
                placeholder="Enter username"
              />
            </div>
          </form>
          <DialogFooter
            secondary={{ label: "Cancel", asDialogClose: true }}
            primary={{
              label: "Save",
              type: "submit",
              form: "my-form",
            }}
          />
        </DialogContent>
      </Dialog>
      {submittedData && (
        <p className="text-sm text-muted-foreground">
          Submitted: {submittedData}
        </p>
      )}
    </div>
  );
};

export const FormSubmission: Story = {
  render: () => <DialogWithForm />,
  parameters: {
    docs: {
      description: {
        story:
          "Use `type: 'submit'` and `form: 'form-id'` to create a submit button that submits a form outside the DialogFooter.",
      },
    },
  },
};

// Story showcasing loading state
const DialogWithLoading = () => {
  const [isLoading, setIsLoading] = React.useState(false);

  const handleSave = () => {
    setIsLoading(true);
    setTimeout(() => setIsLoading(false), 2000);
  };

  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button variant="outline" label="Open Loading Dialog" />
      </DialogTrigger>
      <DialogContent>
        <DialogHeader
          title="Loading State"
          description="Click Save to see the loading state. The button will be disabled and show a spinner."
        />
        <DialogFooter
          secondary={{ label: "Cancel", disabled: isLoading }}
          primary={{
            label: isLoading ? "Saving..." : "Save",
            loading: isLoading,
            disabled: isLoading,
            onClick: handleSave,
          }}
        />
      </DialogContent>
    </Dialog>
  );
};

export const LoadingState: Story = {
  render: () => <DialogWithLoading />,
  parameters: {
    docs: {
      description: {
        story:
          "Use `loading: true` to show a loading spinner on the button. Combine with `disabled: true` to prevent clicks.",
      },
    },
  },
};

// Story showcasing destructive action
export const DestructiveAction: Story = {
  args: {
    breakpoint: "lg",
    headerTitle: "Delete Item",
    headerDescription:
      "Are you sure you want to delete this item? This action cannot be undone.",
    primary: { label: "Delete", isDestructive: true, asDialogClose: true },
    secondary: { label: "Cancel", asDialogClose: true },
    showSlot: false,
  },
  parameters: {
    docs: {
      description: {
        story:
          "Use `isDestructive: true` to style the button as a destructive action (red variant).",
      },
    },
  },
};

// Story showcasing all features combined
const DialogWithAllFeatures = () => {
  const [isLoading, setIsLoading] = React.useState(false);
  const [result, setResult] = React.useState<string>("");

  return (
    <div className="space-y-4">
      <Dialog>
        <DialogTrigger asChild>
          <Button variant="outline" label="Open Full-Featured Dialog" />
        </DialogTrigger>
        <DialogContent>
          <DialogHeader
            title="Complete Example"
            description="This dialog demonstrates all DialogAction features working together."
          />
          <form
            id="complete-form"
            onSubmit={(e) => {
              e.preventDefault();
              setIsLoading(true);
              setTimeout(() => {
                const formData = new FormData(e.currentTarget);
                setResult(`Saved: ${formData.get("name")}`);
                setIsLoading(false);
              }, 1500);
            }}
          >
            <div className="space-y-2">
              <label htmlFor="name" className="text-sm font-medium">
                Name
              </label>
              <input
                id="name"
                name="name"
                className="w-full rounded-md border px-3 py-2"
                placeholder="Enter name"
                defaultValue="John Doe"
              />
            </div>
          </form>
          <DialogFooter
            tertiary={{ label: "Learn more", onClick: () => alert("Help!") }}
            secondary={{
              label: "Cancel",
              asDialogClose: true,
              disabled: isLoading,
            }}
            primary={{
              label: isLoading ? "Saving..." : "Save",
              type: "submit",
              form: "complete-form",
              loading: isLoading,
              disabled: isLoading,
            }}
          />
        </DialogContent>
      </Dialog>
      {result && <p className="text-sm text-muted-foreground">{result}</p>}
    </div>
  );
};

export const AllFeatures: Story = {
  render: () => <DialogWithAllFeatures />,
  parameters: {
    docs: {
      description: {
        story:
          "A complete example combining form submission, loading states, and auto-close functionality.",
      },
    },
  },
};
