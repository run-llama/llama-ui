type ProgressBarProps = {
  label?: string;
  max: number;
  value: number;
  unit?: string;
};

export const ProgressBar = (props: ProgressBarProps) => {
  const percentage = (props.value / props.max) * 100;

  return (
    <div className="flex flex-col">
      {props.label && (
        <span className="text-2-5xs text-slate-400">{props.label}</span>
      )}
      <div className="h-2 w-full overflow-hidden rounded-lg bg-slate-200">
        <div
          style={{ width: `${percentage}%` }}
          className="h-full bg-slate-500"
        ></div>
      </div>
      <div className="">
        <span className="text-xs">
          {props.value} / {props.max} {props.unit}
        </span>
      </div>
    </div>
  );
};
