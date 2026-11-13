import { Alert, type AlertActionProps } from "../../base/alert";
import type { Meta, StoryObj } from "@storybook/react-vite";
import { expect, within } from "@storybook/test";
import * as React from "react";

const meta: Meta<typeof Alert> = {
  title: "Base/Alert",
  component: Alert,
  tags: ["autodocs"],
  argTypes: {
    variant: {
      control: "select",
      options: ["default", "error", "warning"],
    },
    showIcon: {
      control: "boolean",
    },
    buttonVariant: {
      control: "select",
      options: ["default", "secondary", "outline", "ghost", "destructive"],
    },
  },
};

export default meta;
type Story = StoryObj<typeof Alert>;

export const Default: Story = {
  args: {
    title: "Information",
    description: "This is an informational alert with helpful details.",
  },
  render: (args) => <Alert {...args} />,
};

export const Error: Story = {
  args: {
    variant: "error",
    title: "Error Occurred",
    description: "Something went wrong. Please try again later.",
  },
  render: (args) => <Alert {...args} />,
};

export const Warning: Story = {
  args: {
    variant: "warning",
    title: "Warning",
    description: "This action may have unintended consequences.",
  },
  render: (args) => <Alert {...args} />,
};

export const TitleOnly: Story = {
  args: {
    title: "This alert has only a title, no description.",
  },
  render: (args) => <Alert {...args} />,
};

export const WithoutIcon: Story = {
  args: {
    title: "No Icon Alert",
    description: "This alert does not display an icon.",
    showIcon: false,
  },
  render: (args) => <Alert {...args} />,
};

export const WithActionButton: Story = {
  args: {
    title: "Action Required",
    description: "Please review and take action.",
    buttonLabel: "Take Action",
    onButtonClick: () => alert("Action button clicked!"),
  },
  render: (args) => <Alert {...args} />,
};

export const ErrorWithButton: Story = {
  args: {
    variant: "error",
    title: "Failed to Save",
    description: "Your changes could not be saved. Please retry.",
    buttonLabel: "Retry",
    buttonVariant: "destructive",
    onButtonClick: () => alert("Retry clicked!"),
  },
  render: (args) => <Alert {...args} />,
};

export const WarningWithButton: Story = {
  args: {
    variant: "warning",
    title: "Unsaved Changes",
    description: "You have unsaved changes that will be lost.",
    buttonLabel: "Save Now",
    buttonVariant: "default",
    onButtonClick: () => alert("Save clicked!"),
  },
  render: (args) => <Alert {...args} />,
};

export const AllVariants: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert
        title="Default Alert"
        description="This is the default informational style."
      />
      <Alert
        variant="error"
        title="Error Alert"
        description="This indicates an error or failure state."
      />
      <Alert
        variant="warning"
        title="Warning Alert"
        description="This indicates a warning or caution."
      />
    </div>
  ),
};

export const AllVariantsWithButtons: Story = {
  render: () => (
    <div className="flex flex-col gap-4">
      <Alert
        title="Default Alert"
        description="This is the default informational style."
        buttonLabel="Learn More"
      />
      <Alert
        variant="error"
        title="Error Alert"
        description="This indicates an error or failure state."
        buttonLabel="Retry"
        buttonVariant="destructive"
      />
      <Alert
        variant="warning"
        title="Warning Alert"
        description="This indicates a warning or caution."
        buttonLabel="Dismiss"
        buttonVariant="outline"
      />
    </div>
  ),
};

const variantExamples = {
  default: {
    title: "A new parser version is available",
    description:
      "It reads tables more accurately. Your saved settings carry over.",
    actions: ["Switch now", "Read the changelog", "Remind me later"],
  },
  error: {
    title: "Your card was declined",
    description:
      "We couldn't charge your card for the automatic credit reload, so your balance stays at 0.",
    actions: [
      "Use a different card",
      "Try again with this card",
      "Turn off auto-reload",
    ],
  },
  warning: {
    title: "Credits are running low",
    description: "Jobs pause when your balance reaches 0.",
    actions: ["Buy credits", "Change reload amount", "Dismiss"],
  },
} as const;

function toActions(labels: readonly string[]): AlertActionProps[] {
  return labels.map((label) => ({
    label,
    onClick: () => console.log(`${label} clicked`),
  }));
}

function VariantsWithActions({ count }: { count: 1 | 2 | 3 }) {
  return (
    <div className="flex flex-col gap-4">
      {(["default", "error", "warning"] as const).map((variant) => {
        const { title, description, actions } = variantExamples[variant];
        const [primary, secondary, tertiary] = toActions(
          actions.slice(0, count)
        );
        return (
          <Alert
            key={variant}
            variant={variant}
            title={title}
            description={description}
            primaryAction={primary}
            secondaryAction={secondary}
            tertiaryAction={tertiary}
          />
        );
      })}
    </div>
  );
}

async function expectActionLayout({
  canvasElement,
}: {
  canvasElement: HTMLElement;
}) {
  for (const alert of within(canvasElement).getAllByRole("alert")) {
    await expect(alert.scrollWidth).toBeLessThanOrEqual(alert.clientWidth);
    for (const text of alert.querySelectorAll("p")) {
      await expect(text.scrollWidth).toBeLessThanOrEqual(text.clientWidth);
    }
    const box = alert.getBoundingClientRect();
    const buttons = within(alert)
      .queryAllByRole("button")
      .map((button) => button.getBoundingClientRect());
    for (const button of buttons) {
      await expect(button.left).toBeGreaterThanOrEqual(box.left);
      await expect(button.right).toBeLessThanOrEqual(box.right);
    }
    const [primary, ...others] = buttons;
    for (const other of others) {
      await expect(other.top).toBeGreaterThanOrEqual(primary.top);
      if (other.top === primary.top) {
        await expect(other.right).toBeLessThanOrEqual(primary.left);
      }
    }
  }
}

export const OneAction: Story = {
  render: () => <VariantsWithActions count={1} />,
  play: expectActionLayout,
};

export const TwoActions: Story = {
  render: () => <VariantsWithActions count={2} />,
  play: expectActionLayout,
};

export const ThreeActions: Story = {
  render: () => <VariantsWithActions count={3} />,
  play: expectActionLayout,
};

const longTitle =
  "We couldn't reload your credits. The card charge didn't go through.";

export const PhoneWidth: Story = {
  render: () => {
    const [primary, secondary, tertiary] = toActions(
      variantExamples.error.actions
    );
    const [buyCredits, changeAmount] = toActions(
      variantExamples.warning.actions
    );
    return (
      <div className="flex w-[343px] flex-col gap-4">
        <Alert
          variant="error"
          title={longTitle}
          description={variantExamples.error.description}
          primaryAction={primary}
          secondaryAction={secondary}
          tertiaryAction={tertiary}
        />
        <Alert
          variant="error"
          title="Couldn't parse quarterly_financial_statements_2025_final_v3_reviewed.pdf"
          buttonLabel="Try again"
          onButtonClick={() => console.log("Try again clicked")}
        />
        <Alert
          variant="warning"
          title={variantExamples.warning.title}
          description={variantExamples.warning.description}
          primaryAction={buyCredits}
          secondaryAction={changeAmount}
        />
        <Alert title="Saved" primaryAction={{ label: "Undo" }} />
      </div>
    );
  },
  play: async ({ canvasElement }) => {
    await expectActionLayout({ canvasElement });
    const declined = within(canvasElement)
      .getByText(longTitle)
      .closest<HTMLElement>('[role="alert"]')!;
    const textBottom = within(declined)
      .getByText(variantExamples.error.description)
      .getBoundingClientRect().bottom;
    for (const button of within(declined).getAllByRole("button")) {
      await expect(button.getBoundingClientRect().top).toBeGreaterThan(
        textBottom
      );
    }
  },
};
