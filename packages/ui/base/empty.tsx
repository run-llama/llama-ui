import * as React from "react";

import { Button } from "./button";

interface EmptyActionProps {
    /** Button label text */
    label: string;
    /** Callback function when button is clicked */
    onClick?: () => void;
    /** Optional icon to display before the label */
    icon?: React.ReactNode;
}

/**
 * Empty Props
 * - Content: icon, title, description (shown if provided)
 * - Actions: primaryAction, secondaryAction, tertiaryAction (shown if provided)
 */
interface EmptyProps {
    /** Main heading text */
    title?: string;
    /** Descriptive text below the title */
    description?: string;
    /** Icon to display in the container */
    icon?: React.ReactNode;
    /** Primary call-to-action button (displayed on the right) */
    primaryAction?: EmptyActionProps;
    /** Secondary action button (displayed left of primary) */
    secondaryAction?: EmptyActionProps;
    /** Tertiary action button (displayed below primary/secondary) */
    tertiaryAction?: EmptyActionProps;
}

/**
 * Empty - A centered empty state component for displaying when there's no content.
 *
 * Features:
 * - Customizable icon, title, and description (shown if provided)
 * - Optional action buttons (primary, secondary, tertiary) (shown if provided)
 *
 * Example:
 * ```tsx
 * <Empty
 *   icon={<FileText />}
 *   title="No documents"
 *   description="Create your first document to get started"
 *   primaryAction={{
 *     label: "Create Document",
 *     onClick: handleCreate,
 *     icon: <Plus />
 *   }}
 * />
 * ```
 */
function Empty({
    title,
    description,
    icon,
    primaryAction,
    secondaryAction,
    tertiaryAction,
}: EmptyProps) {
    const hasAnyAction = primaryAction || secondaryAction || tertiaryAction;

    return (
        <div className="flex flex-col items-center gap-6">
            {/* Content section */}
            <div className="flex w-full flex-col items-center gap-4">
                {/* Icon container */}
                {icon && (
                    <div className="flex size-10 items-center justify-center rounded-lg bg-muted">
                        {icon}
                    </div>
                )}

                {/* Text section */}
                <div className="flex max-w-[420px] flex-col items-center gap-2 text-center">
                    {title && (
                        <p className="w-full text-lg font-medium leading-7 text-foreground">
                            {title}
                        </p>
                    )}
                    {description && (
                        <p className="w-full text-sm font-normal leading-[1.625] text-muted-foreground">
                            {description}
                        </p>
                    )}
                </div>
            </div>

            {/* Footer section */}
            {hasAnyAction && (
                <div className="flex w-full flex-col items-center justify-center gap-2">
                    {/* Primary and Secondary buttons row */}
                    {(primaryAction || secondaryAction) && (
                        <div className="flex items-center gap-2">
                            {secondaryAction && (
                                <Button
                                    variant="outline"
                                    label={secondaryAction.label}
                                    startIcon={secondaryAction.icon}
                                    onClick={secondaryAction.onClick}
                                />
                            )}
                            {primaryAction && (
                                <Button
                                    variant="default"
                                    label={primaryAction.label}
                                    startIcon={primaryAction.icon}
                                    onClick={primaryAction.onClick}
                                />
                            )}
                        </div>
                    )}
                    {/* Tertiary button */}
                    {tertiaryAction && (
                        <Button
                            variant="ghost"
                            label={tertiaryAction.label}
                            startIcon={tertiaryAction.icon}
                            onClick={tertiaryAction.onClick}
                        />
                    )}
                </div>
            )}
        </div>
    );
}

export { Empty, type EmptyProps, type EmptyActionProps };
