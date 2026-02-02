import {
  ChevronDown,
  ChevronRight,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";
import { useState } from "react";
import { Button } from "@/base/button";
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from "@/base/collapsible";
import { cn } from "@/lib/utils";

export type ChatEvent = {
  title: string;
  description?: string;
  status: "pending" | "success" | "error";
  // eslint-disable-next-line @typescript-eslint/no-explicit-any -- data is arbitrary from external sources
  data?: any;
};

export function ChatEvent({
  event,
  className,
  renderData,
}: {
  event: ChatEvent;
  className?: string;
  renderData?: (data: ChatEvent["data"]) => React.ReactNode;
}) {
  const [isDataOpen, setIsDataOpen] = useState(false);

  const getStatusIcon = () => {
    switch (event.status) {
      case "pending":
        return <Loader2 className="h-4 w-4 animate-spin text-warning" />;
      case "success":
        return <CheckCircle className="h-4 w-4 text-success" />;
      case "error":
        return <XCircle className="h-4 w-4 text-destructive" />;
    }
  };

  const getStatusColor = () => {
    switch (event.status) {
      case "pending":
        return "border-warning";
      case "success":
        return "border-success";
      case "error":
        return "border-destructive";
    }
  };

  return (
    <div className={cn("border-l-2 py-2 pl-4", getStatusColor(), className)}>
      {/* Header with title and status */}
      <div className="chat-event-header flex items-start justify-between">
        <div className="flex-1">
          <h3 className="text-sm font-medium">{event.title}</h3>
          {event.description && (
            <p className="text-muted-foreground mt-1 text-xs">
              {event.description}
            </p>
          )}
        </div>
        <div className="ml-2 flex items-center space-x-1">
          {getStatusIcon()}
          <span className="text-xs capitalize">{event.status}</span>
        </div>
      </div>

      {/* Data section if data exists */}
      {event.data && (
        <div className="chat-event-data mt-3">
          <Collapsible open={isDataOpen} onOpenChange={setIsDataOpen}>
            <CollapsibleTrigger asChild>
              <Button
                variant="ghost"
                size="sm"
                startIcon={isDataOpen ? <ChevronDown /> : <ChevronRight />}
                label={isDataOpen ? "Hide data" : "Show data"}
              />
            </CollapsibleTrigger>
            <CollapsibleContent>
              {renderData ? (
                renderData(event.data)
              ) : (
                <pre className="bg-muted mt-2 max-h-40 overflow-auto rounded p-2 text-xs">
                  {JSON.stringify(event.data, null, 2)}
                </pre>
              )}
            </CollapsibleContent>
          </Collapsible>
        </div>
      )}
    </div>
  );
}
