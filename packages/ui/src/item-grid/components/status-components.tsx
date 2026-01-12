import { CheckIcon, XIcon } from "lucide-react";
import { Badge } from "@/base/badge";
import { useMemo } from "react";

export function ReviewStatusBadge({ value }: { value: string }) {
  const statusConfig = {
    pending_review: {
      label: "Awaiting Review",
      variant: "default" as const,
    },
    approved: {
      label: "Approved",
      variant: "success" as const,
    },
    rejected: {
      label: "Rejected",
      variant: "destructive" as const,
    },
  };

  const config = statusConfig[value as keyof typeof statusConfig] || {
    label: value,
    variant: "secondary",
  };

  return <Badge variant={config.variant} label={config.label} />;
}

export function SyncedIcon({ value }: { value: boolean }) {
  return value ? (
    <CheckIcon className="w-4 h-4 text-success" />
  ) : (
    <XIcon className="w-4 h-4 text-destructive" />
  );
}

export function FormattedDate({ value }: { value: string }) {
  const time = useMemo(() => {
    const date = new Date(value);
    return date.toLocaleString();
  }, [value]);
  return (
    <span className="text-base-foreground text-sm font-normal leading-none">
      {time}
    </span>
  );
}
