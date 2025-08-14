import { Label } from "@/base/label";
import { Slider } from "@/base/slider";
import React, { createContext, useContext, ReactNode, useState } from "react";

interface DisplayControl {
  confidenceThreshold: number;
}

const DEFAULT_DISPLAY_CONTROL: DisplayControl = {
  confidenceThreshold: 0.9,
};

const ControlContext = createContext<DisplayControl | undefined>(undefined);

interface ConfigProviderProps {
  children: ReactNode;
  defaultControl?: DisplayControl;
}

export const ExtractedDataDisplayControl: React.FC<ConfigProviderProps> = ({
  children,
  defaultControl,
}) => {
  const [control, setControl] = useState<DisplayControl>(
    defaultControl ?? DEFAULT_DISPLAY_CONTROL
  );

  const roundedConfidenceThreshold = Math.round(
    control.confidenceThreshold * 100
  );

  return (
    <ControlContext.Provider value={control}>
      <div className="flex flex-col gap-6">
        <div className="flex flex-col gap-2">
          <div className="flex flex-col gap-2 border rounded-xl p-4 shadow-md w-fit">
            <Label htmlFor="confidenceThreshold">
              Confidence Threshold ({roundedConfidenceThreshold}%)
            </Label>
            <Slider
              className="w-full max-w-md"
              name="confidenceThreshold"
              value={[roundedConfidenceThreshold]}
              onValueChange={(value) =>
                setControl((prev) => ({
                  ...prev,
                  confidenceThreshold: value[0] / 100,
                }))
              }
              min={0}
              max={100}
              step={1}
            />
            <p className="text-sm text-muted-foreground">
              * Fields with confidence below {roundedConfidenceThreshold}% are
              highlighted with an orange background
            </p>
          </div>
        </div>

        <div>{children}</div>
      </div>
    </ControlContext.Provider>
  );
};

/**
 * If this hook is using in a component that wrapped by ExtractedDataDisplayControl, it will return the current control value.
 * It can be also used outside ExtractedDataDisplayControl, in that case, it will return the DEFAULT_DISPLAY_CONTROL
 */
export const useDisplayControl = (): DisplayControl => {
  const control = useContext(ControlContext);
  return control ?? DEFAULT_DISPLAY_CONTROL; // return default display control if context is undefined
};
