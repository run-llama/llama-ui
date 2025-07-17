import { CheckIcon, XIcon } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useMemo } from "react";

export function ReviewStatusBadge({ value }: { value: string }) {
  const statusConfig = {
    pending_review: {
      label: "Awaiting Review",
      variant: "secondary" as const,
      className: "bg-amber-100 text-amber-600 hover:bg-amber-200",
    },
    approved: {
      label: "Approved",
      variant: "default" as const,
      className: "bg-green-100 text-green-600 hover:bg-green-200",
    },
    rejected: {
      label: "Rejected",
      variant: "destructive" as const,
      className: "bg-red-100 text-red-600 hover:bg-red-200",
    },
  };

  const config = statusConfig[value as keyof typeof statusConfig] || {
    label: value,
    variant: "outline" as const,
    className: "",
  };

  return (
    <Badge variant={config.variant} className={config.className}>
      {config.label}
    </Badge>
  );
}

export function SyncedIcon({ value }: { value: boolean }) {
  return value ? (
    <CheckIcon className="w-4 h-4 text-green-600" />
  ) : (
    <XIcon className="w-4 h-4 text-red-600" />
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
