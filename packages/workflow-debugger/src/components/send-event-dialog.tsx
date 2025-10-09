import { useState, useEffect, useMemo } from "react";
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
  useWorkflowsClient,
} from "@llamaindex/ui";
import { Send } from "lucide-react";
import { JsonSchemaEditor } from "./json-schema-editor";
import type { JSONValue } from "./workflow-config-panel";
import { postEventsByHandlerId } from "@llamaindex/workflows-client";

interface EventSchema {
  title?: string;
  type?: string;
  properties?: Record<string, unknown>;
  required?: string[];
}

interface SendEventDialogProps {
  handlerId: string | null;
  workflowName: string | null;
  disabled?: boolean;
}

export function SendEventDialog({
  handlerId,
  workflowName,
  disabled,
}: SendEventDialogProps) {
  const [open, setOpen] = useState(false);
  const [eventSchemas, setEventSchemas] = useState<EventSchema[]>([]);
  const [selectedEventType, setSelectedEventType] = useState<string | null>(
    null,
  );
  const [eventData, setEventData] = useState<Record<string, JSONValue>>({});
  const [loading, setLoading] = useState(false);
  const [schemaErrors, setSchemaErrors] = useState<Record<
    string,
    string | null
  > | null>(null);
  const [sending, setSending] = useState(false);
  const [sendError, setSendError] = useState<string | null>(null);
  const [sendSuccess, setSendSuccess] = useState(false);

  const workflowsClient = useWorkflowsClient();

  // Fetch event schemas when dialog opens
  useEffect(() => {
    if (!open || !workflowName) return;

    const fetchEventSchemas = async () => {
      setLoading(true);
      setSendError(null);
      try {
        const response = await fetch(
          `${workflowsClient.getConfig().baseUrl}/workflows/${workflowName}/events`,
        );
        if (!response.ok) {
          throw new Error(`Failed to fetch event schemas: ${response.status}`);
        }
        const data = (await response.json()) as { events?: EventSchema[] };
        setEventSchemas(data.events || []);

        // Auto-select first event if available
        if (data.events && data.events.length > 0) {
          const firstEvent = data.events[0];
          setSelectedEventType(firstEvent.title || null);
        }
      } catch (error) {
        console.error("Failed to fetch event schemas:", error);
        setSendError(
          error instanceof Error ? error.message : "Failed to fetch events",
        );
        setEventSchemas([]);
      } finally {
        setLoading(false);
      }
    };

    void fetchEventSchemas();
  }, [open, workflowName, workflowsClient]);

  // Reset state when dialog closes
  useEffect(() => {
    if (!open) {
      setSelectedEventType(null);
      setEventData({});
      setSchemaErrors(null);
      setSendError(null);
      setSendSuccess(false);
    }
  }, [open]);

  // Reset event data when event type changes
  useEffect(() => {
    setEventData({});
    setSendError(null);
    setSendSuccess(false);
  }, [selectedEventType]);

  const selectedSchema = useMemo(() => {
    if (!selectedEventType) return null;
    return (
      eventSchemas.find((schema) => schema.title === selectedEventType) || null
    );
  }, [selectedEventType, eventSchemas]);

  const hasSchemaErrors = useMemo(() => {
    if (!schemaErrors) return false;
    return Object.values(schemaErrors).some((error) => error !== null);
  }, [schemaErrors]);

  const handleSendEvent = async () => {
    if (!handlerId || !selectedEventType) return;

    setSending(true);
    setSendError(null);
    setSendSuccess(false);

    try {
      const payload = {
        type: selectedEventType,
        data: eventData,
      };

      const { error } = await postEventsByHandlerId({
        client: workflowsClient,
        path: { handler_id: handlerId },
        body: {
          event: JSON.stringify(payload),
        },
      });

      if (error) {
        throw new Error(
          typeof error === "string" ? error : JSON.stringify(error),
        );
      }

      setSendSuccess(true);

      // Close dialog after a short delay to show success message
      setTimeout(() => {
        setOpen(false);
      }, 1000);
    } catch (error) {
      console.error("Failed to send event:", error);
      setSendError(
        error instanceof Error ? error.message : "Failed to send event",
      );
    } finally {
      setSending(false);
    }
  };

  const canSend =
    !sending &&
    !hasSchemaErrors &&
    selectedEventType &&
    handlerId &&
    !sendSuccess;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button
          variant="outline"
          size="sm"
          disabled={disabled || !handlerId || !workflowName}
          title={
            !handlerId
              ? "No active handler"
              : !workflowName
                ? "No workflow selected"
                : "Send event to workflow"
          }
        >
          <Send className="h-4 w-4 mr-2" />
          Send Event
        </Button>
      </DialogTrigger>
      <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Send Event to Workflow</DialogTitle>
          <DialogDescription>
            Send a custom event to the running workflow handler.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-4">
          {loading ? (
            <div className="text-center text-muted-foreground">
              Loading event types...
            </div>
          ) : eventSchemas.length === 0 ? (
            <div className="text-center text-muted-foreground">
              {sendError || "No events available for this workflow"}
            </div>
          ) : (
            <>
              {/* Event Type Selector */}
              <div className="space-y-2">
                <label className="text-sm font-medium">Event Type</label>
                <Select
                  value={selectedEventType || ""}
                  onValueChange={setSelectedEventType}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select event type..." />
                  </SelectTrigger>
                  <SelectContent>
                    {eventSchemas.map((schema) => (
                      <SelectItem
                        key={schema.title || "unknown"}
                        value={schema.title || ""}
                      >
                        {schema.title || "Unnamed Event"}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              {/* Event Data Editor */}
              {selectedSchema && (
                <div className="space-y-2">
                  <label className="text-sm font-medium">Event Data</label>
                  <JsonSchemaEditor
                    schema={{
                      properties: selectedSchema.properties as Record<
                        string,
                        {
                          type?: string;
                          title?: string;
                          description?: string;
                        }
                      >,
                      required: selectedSchema.required,
                    }}
                    values={eventData}
                    onChange={setEventData}
                    onErrorsChange={setSchemaErrors}
                    className="space-y-3 border border-border rounded-lg p-4 bg-muted/30"
                  />
                </div>
              )}

              {/* Error Messages */}
              {sendError && (
                <div className="text-destructive text-sm p-3 bg-destructive/10 border border-destructive/20 rounded">
                  {sendError}
                </div>
              )}

              {/* Success Message */}
              {sendSuccess && (
                <div className="text-green-600 text-sm p-3 bg-green-50 border border-green-200 rounded">
                  Event sent successfully!
                </div>
              )}
            </>
          )}
        </div>

        <DialogFooter>
          <Button variant="outline" onClick={() => setOpen(false)}>
            Cancel
          </Button>
          <Button onClick={handleSendEvent} disabled={!canSend}>
            {sending ? "Sending..." : "Send Event"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
