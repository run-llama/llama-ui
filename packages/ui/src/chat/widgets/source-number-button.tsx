import { cn } from "@/lib/utils";

export function SourceNumberButton({
  index,
  className,
}: {
  index: number;
  className?: string;
}) {
  return (
    <span
      className={cn(
        "inline-flex h-5 w-5 items-center justify-center rounded-full bg-muted text-xs text-foreground",
        className
      )}
    >
      {index + 1}
    </span>
  );
}
