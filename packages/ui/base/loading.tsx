import { Loader2 } from "lucide-react";

type LoadingStatusProps = {
  message?: string;
};
const LoadingStatus = (props: LoadingStatusProps) => (
  <div className="flex flex-row items-center space-x-2">
    <Loader2
      data-chromatic="ignore"
      className="size-5 animate-spin text-muted-foreground"
    />
    <div className="flex flex-col text-sm text-muted-foreground">
      <div>{props.message ?? "Loading"}</div>
    </div>
  </div>
);

export { LoadingStatus };
