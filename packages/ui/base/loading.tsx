import { Loader2 } from "lucide-react";

type LoadingStatusProps = {
  message?: string;
};
const LoadingStatus = (props: LoadingStatusProps) => (
  <div className="flex flex-row items-center space-x-2">
    <Loader2
      data-chromatic="ignore"
      className="size-5 animate-spin stroke-slate-500"
    />
    <div className="flex flex-col text-sm text-slate-500">
      <div>{props.message ?? "Loading"}</div>
    </div>
  </div>
);

export { LoadingStatus };
