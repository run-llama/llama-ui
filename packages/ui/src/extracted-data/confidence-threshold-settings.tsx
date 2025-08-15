import { Label } from "@/base/label";
import { Slider } from "@/base/slider";
import { cn } from "@/lib/utils";
import { useUIConfigStore } from "@/src/store/ui-config-store";
import { useEffect } from "react";

export interface ConfidenceThresholdSettingsProps {
  onThresholdChange?: (value: number) => void;
  min?: number;
  max?: number;
  step?: number;
  className?: string;
  defaultThreshold?: number;
}

export function ConfidenceThresholdSettings({
  onThresholdChange,
  defaultThreshold,
  min = 0,
  max = 100,
  step = 1,
  className,
}: ConfidenceThresholdSettingsProps) {
  const { confidenceThreshold, setConfidenceThreshold } = useUIConfigStore(
    (state) => ({
      confidenceThreshold: state.confidenceThreshold,
      setConfidenceThreshold: state.setConfidenceThreshold,
    })
  );
  const roundedConfidenceThreshold = Math.round(confidenceThreshold * 100);

  useEffect(() => {
    if (defaultThreshold) {
      setConfidenceThreshold(defaultThreshold);
    }
  }, [defaultThreshold, setConfidenceThreshold]);

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
