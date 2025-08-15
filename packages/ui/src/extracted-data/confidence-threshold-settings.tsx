import { Label } from "@/base/label";
import { Slider } from "@/base/slider";
import { cn } from "@/lib/utils";
import { useUIConfigStore } from "@/src/store/ui-config-store";

export interface ConfidenceThresholdSettingsProps {
  onThresholdChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
}

export function ConfidenceThresholdSettings({
  onThresholdChange,
  min = 0,
  max = 100,
  step = 1,
  className,
}: ConfidenceThresholdSettingsProps) {
  const { confidenceThreshold, setConfidenceThreshold } = useUIConfigStore();
  const roundedConfidenceThreshold = Math.round(confidenceThreshold * 100);

  return (
    <div
      className={cn(
        "flex flex-col gap-2 border rounded-xl p-4 shadow-md w-fit",
        className
      )}
    >
      <Label htmlFor="confidenceThreshold">
        Confidence Threshold ({roundedConfidenceThreshold}%)
      </Label>
      <Slider
        className="w-full max-w-md"
        name="confidenceThreshold"
        value={[roundedConfidenceThreshold]}
        onValueChange={(value) => {
          const threshold = value[0] / 100;
          setConfidenceThreshold(threshold);
          onThresholdChange?.(threshold);
        }}
        min={min}
        max={max}
        step={step}
      />
      <p className="text-sm text-muted-foreground">
        * Fields with confidence below {roundedConfidenceThreshold}% are
        highlighted with an orange background
      </p>
    </div>
  );
}
