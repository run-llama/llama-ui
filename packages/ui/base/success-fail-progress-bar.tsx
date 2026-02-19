type SuccessFailProgressBarProps = {
  successful: number;
  failed: number;
  total: number;
};

export const SuccessFailProgressBar = (props: SuccessFailProgressBarProps) => {
  const successfulPercentage =
    props.total > 0 ? (props.successful / props.total) * 100 : 0;
  const failedPercentage =
    props.total > 0 ? (props.failed / props.total) * 100 : 0;
  const totalPercentage = successfulPercentage + failedPercentage;
  const isFinished = props.successful + props.failed === props.total;

  return (
    <div className="flex flex-col gap-2">
      <div className="relative h-8 w-full overflow-hidden rounded-lg bg-slate-300">
        <div
          style={{ width: `${successfulPercentage}%` }}
          className="absolute left-0 top-0 h-full bg-green-500"
        />
        <div
          style={{
            width: `${failedPercentage}%`,
            marginLeft: `${successfulPercentage}%`,
          }}
          className="absolute left-0 top-0 h-full bg-red-500"
        />
      </div>
      <p className="text-center text-xs text-muted-foreground">
        {isFinished ? "Finished" : "In Progress"} ({totalPercentage.toFixed(1)}
        %)
      </p>
    </div>
  );
};
