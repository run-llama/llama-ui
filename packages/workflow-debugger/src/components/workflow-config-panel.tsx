import { useState, useEffect, useRef, useCallback } from "react";
import {
  useWorkflowsClient,
  useWorkflowRun,
  useWorkflowHandler,
  Button,
  Textarea,
  Skeleton,
  Input,
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@llamaindex/ui";
import { CodeBlock } from "./code-block";
import {
  getResultsByHandlerId,
  getWorkflowsByNameSchema,
} from "@llamaindex/workflows-client";
export type JSONValue =
  | null
  | string
  | number
  | boolean
  | { [key: string]: JSONValue }
  | Array<JSONValue>;
interface WorkflowConfigPanelProps {
  selectedWorkflow: string | null;
  onRunStart: (handlerId: string) => void;
  activeHandlerId: string | null;
}

interface SchemaProperty {
  type: string;
  title?: string;
  description?: string;
}

interface Schema {
  properties?: Record<string, SchemaProperty>;
  required?: string[];
}

export function WorkflowConfigPanel({
  selectedWorkflow,
  onRunStart,
  activeHandlerId,
}: WorkflowConfigPanelProps) {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [formData, setFormData] = useState<{ [key: string]: JSONValue }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [finalResult, setFinalResult] = useState<JSONValue | null>(null);
  const [resultLoading, setResultLoading] = useState(false);
  const [finalResultError, setFinalResultError] = useState<string | null>(null);
  const [rawInput, setRawInput] = useState<string>("");
  const [rawInputError, setRawInputError] = useState<string | null>(null);

  const workflowsClient = useWorkflowsClient();
  const { runWorkflow, isCreating, error: runError } = useWorkflowRun();
  const { handler, events } = useWorkflowHandler(
    activeHandlerId ?? "",
    !!activeHandlerId,
  );

  // Throttle configuration for result fetching
  const RESULT_FETCH_THROTTLE_MS = 1000;
  const lastResultFetchAtRef = useRef<number>(0);
  const pendingResultFetchTimeoutRef = useRef<ReturnType<
    typeof setTimeout
  > | null>(null);

  // Clear any pending throttled fetch when handler changes or on unmount
  useEffect(() => {
    return () => {
      if (pendingResultFetchTimeoutRef.current) {
        clearTimeout(pendingResultFetchTimeoutRef.current);
        pendingResultFetchTimeoutRef.current = null;
      }
    };
  }, [activeHandlerId]);

  useEffect(() => {
    if (selectedWorkflow) {
      fetchSchema();
    } else {
      setSchema(null);
      setFormData({});
      setRawInput("");
      setRawInputError(null);
    }
  }, [selectedWorkflow, workflowsClient]);

  // Clear final result when switching handlers
  useEffect(() => {
    setFinalResult(null);
    setResultLoading(false);
    setFinalResultError(null);
  }, [activeHandlerId]);

  // Check for completion and fetch final result
  useEffect(() => {
    if (!activeHandlerId || !handler) return;
    const isCompleted =
      handler.status === "complete" || handler.status === "failed";
    const hasStopEvent = events.some((e) => e.type.endsWith(".StopEvent"));

    if (
      (isCompleted || hasStopEvent) &&
      !finalResult &&
      !resultLoading &&
      !finalResultError
    ) {
      fetchFinalResult();
    }
  }, [
    handler,
    events,
    activeHandlerId,
    finalResult,
    resultLoading,
    finalResultError,
  ]);

  const fetchSchema = async () => {
    if (!selectedWorkflow) return;

    try {
      setLoading(true);
      setError(null);
      const { data, error } = await getWorkflowsByNameSchema({
        client: workflowsClient,
        path: { name: selectedWorkflow },
      });
      if (data) {
        setSchema((data as { start?: Schema | null })?.start ?? null);
      } else {
        throw new Error(error ? String(error) : "Failed to fetch schema");
      }
      setFormData({});
      setRawInput(JSON.stringify({}, null, 2));
      setRawInputError(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to fetch schema");
      setSchema(null);
    } finally {
      setLoading(false);
    }
  };

  const doFetchFinalResult = async (): Promise<void> => {
    if (!activeHandlerId) return;

    try {
      lastResultFetchAtRef.current = Date.now();
      setResultLoading(true);
      setFinalResultError(null);
      const { data, error } = await getResultsByHandlerId({
        client: workflowsClient,
        path: { handler_id: activeHandlerId },
      });
      if (data) {
        setFinalResult((data as { result?: JSONValue | null })?.result ?? null);
      } else if (error) {
        console.error("Failed to fetch final result:", error);
        setFinalResult(null);
        setFinalResultError(typeof error === "string" ? error : String(error));
      }
    } catch (error) {
      console.error("Failed to fetch final result:", error);
      setFinalResult(null);
      setFinalResultError(
        error instanceof Error ? error.message : "Failed to fetch final result",
      );
    } finally {
      setResultLoading(false);
    }
  };

  const fetchFinalResult = useCallback((): void => {
    if (!activeHandlerId) return;

    const now = Date.now();
    const elapsed = now - (lastResultFetchAtRef.current || 0);

    if (elapsed < RESULT_FETCH_THROTTLE_MS) {
      const waitMs = RESULT_FETCH_THROTTLE_MS - elapsed;
      if (!pendingResultFetchTimeoutRef.current) {
        pendingResultFetchTimeoutRef.current = setTimeout(() => {
          pendingResultFetchTimeoutRef.current = null;
          void doFetchFinalResult();
        }, waitMs);
      }
      return;
    }

    void doFetchFinalResult();
  }, [activeHandlerId, workflowsClient]);

  const handleFieldChange = (fieldName: string, value: JSONValue) => {
    setFormData((prev) => ({
      ...prev,
      [fieldName]: value,
    }));
  };

  const handleRunWorkflow = async () => {
    if (!selectedWorkflow) return;

    try {
      const handler = await runWorkflow(selectedWorkflow, formData);
      onRunStart(handler.handler_id);
    } catch (err) {
      console.error("Failed to run workflow:", err);
    }
  };

  const renderFormField = (fieldName: string, fieldSchema: SchemaProperty) => {
    const isRequired = schema?.required?.includes(fieldName) || false;
    const fieldTitle = fieldSchema.title || fieldName;
    const fieldType = fieldSchema.type || "string";
    const fieldDescription = fieldSchema.description || "";

    const fieldId = `field-${fieldName}`;

    if (fieldType === "string") {
      return (
        <div key={fieldName} className="space-y-2">
          <label htmlFor={fieldId} className="text-sm font-medium">
            {fieldTitle}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
          <Textarea
            id={fieldId}
            value={(formData[fieldName] as string) || ""}
            onChange={(e) => handleFieldChange(fieldName, e.target.value)}
            placeholder={
              fieldDescription || `Enter ${fieldTitle.toLowerCase()}`
            }
            rows={3}
          />
          {fieldDescription && (
            <p className="text-xs text-muted-foreground">{fieldDescription}</p>
          )}
        </div>
      );
    } else if (fieldType === "number" || fieldType === "integer") {
      return (
        <div key={fieldName} className="space-y-2">
          <label htmlFor={fieldId} className="text-sm font-medium">
            {fieldTitle}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
          <Input
            id={fieldId}
            type="number"
            value={(formData[fieldName] as number) || 0}
            onChange={(e) =>
              handleFieldChange(fieldName, parseFloat(e.target.value) || "")
            }
            placeholder={
              fieldDescription || `Enter ${fieldTitle.toLowerCase()}`
            }
            step={fieldType === "integer" ? "1" : "any"}
          />
          {fieldDescription && (
            <p className="text-xs text-muted-foreground">{fieldDescription}</p>
          )}
        </div>
      );
    } else if (fieldType === "boolean") {
      return (
        <div key={fieldName} className="space-y-2">
          <label htmlFor={fieldId} className="text-sm font-medium">
            {fieldTitle}
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
          <Select
            onValueChange={(value) =>
              handleFieldChange(fieldName, value === "true")
            }
          >
            <SelectTrigger>
              <SelectValue placeholder="Select..." />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="true">True</SelectItem>
              <SelectItem value="false">False</SelectItem>
            </SelectContent>
          </Select>
          {fieldDescription && (
            <p className="text-xs text-muted-foreground">{fieldDescription}</p>
          )}
        </div>
      );
    } else {
      // Default to textarea for complex types
      return (
        <div key={fieldName} className="space-y-2">
          <label htmlFor={fieldId} className="text-sm font-medium">
            {fieldTitle} (JSON)
            {isRequired && <span className="text-destructive ml-1">*</span>}
          </label>
          <Textarea
            id={fieldId}
            value={
              formData[fieldName]
                ? JSON.stringify(formData[fieldName], null, 2)
                : ""
            }
            onChange={(e) => {
              try {
                const parsed = JSON.parse(e.target.value);
                handleFieldChange(fieldName, parsed);
              } catch {
                // Keep the raw string for now
                handleFieldChange(fieldName, e.target.value);
              }
            }}
            placeholder={
              fieldDescription ||
              `Enter ${fieldTitle.toLowerCase()} (JSON format)`
            }
            className="font-mono"
            rows={3}
          />
          {fieldDescription && (
            <p className="text-xs text-muted-foreground">{fieldDescription}</p>
          )}
        </div>
      );
    }
  };

  if (!selectedWorkflow) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border">
          <h2 className="font-semibold text-sm">Workflow Configuration</h2>
        </div>
        <div className="flex-1 flex items-center justify-center">
          <p className="text-muted-foreground text-center">
            Select a workflow to configure and run
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <div className="p-4 border-b border-border">
        <h2 className="font-semibold text-sm">Configure: {selectedWorkflow}</h2>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4">
        {loading && (
          <div className="space-y-4">
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
            <Skeleton className="h-4 w-32" />
            <Skeleton className="h-20 w-full" />
          </div>
        )}

        {error && (
          <div className="text-destructive text-sm p-3 bg-destructive/10 border border-destructive/20 rounded">
            Error loading schema: {error}
          </div>
        )}

        {runError && (
          <div className="text-destructive text-sm p-3 bg-destructive/10 border border-destructive/20 rounded">
            Error running workflow:{" "}
            {typeof runError === "string"
              ? runError
              : runError.message || "Unknown error"}
          </div>
        )}

        {!loading && !error && (
          <>
            {/* Form Fields */}
            <div className="space-y-4">
              {schema?.properties &&
              Object.keys(schema.properties).length > 0 ? (
                Object.entries(schema.properties).map(
                  ([fieldName, fieldSchema]) =>
                    renderFormField(fieldName, fieldSchema),
                )
              ) : (
                <div className="space-y-2">
                  <label htmlFor="raw-input" className="text-sm font-medium">
                    Input (JSON)
                  </label>
                  <Textarea
                    id="raw-input"
                    value={rawInput}
                    onChange={(e) => {
                      setRawInput(e.target.value);
                      try {
                        const parsed = JSON.parse(e.target.value);
                        setFormData(parsed);
                        setRawInputError(null);
                      } catch {
                        // Keep editing raw input until valid JSON
                        setRawInputError("Invalid JSON");
                      }
                    }}
                    placeholder='{"key": "value"}'
                    className={`font-mono ${rawInputError ? "border-destructive focus-visible:ring-destructive" : ""}`}
                    rows={8}
                  />
                  {rawInputError && (
                    <p className="text-xs text-destructive mt-1">
                      {rawInputError}
                    </p>
                  )}
                </div>
              )}
            </div>
          </>
        )}
      </div>

      {/* Final Result */}
      {(finalResult || finalResultError || resultLoading) && (
        <div className="p-4 border-t border-border">
          <h4 className="font-medium text-sm mb-2">Final Result</h4>
          {resultLoading ? (
            <div className="bg-muted p-3 rounded">
              <div className="text-sm text-muted-foreground">
                Loading result...
              </div>
            </div>
          ) : finalResultError ? (
            <div className="text-destructive text-sm p-3 bg-destructive/10 border border-destructive/20 rounded">
              Failed to load final result: {finalResultError}
            </div>
          ) : (
            <CodeBlock
              language="json"
              value={JSON.stringify(finalResult, null, 2)}
              className="rounded border overflow-hidden"
            />
          )}
        </div>
      )}

      {/* Footer with Run Button */}
      {!loading && !error && (
        <div className="p-4 border-t border-border">
          <Button
            onClick={handleRunWorkflow}
            disabled={isCreating}
            className="w-full"
          >
            {isCreating ? "Starting..." : "Run Workflow"}
          </Button>
        </div>
      )}
    </div>
  );
}
