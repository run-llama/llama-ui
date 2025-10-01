import { useState, useEffect } from "react";
import {
  useWorkflowsClient,
  useWorkflowRun,
  Button,
  Textarea,
  Skeleton,
} from "@llamaindex/ui";
import { PanelRightClose } from "lucide-react";
import { JsonSchemaEditor } from "./json-schema-editor";
import { getWorkflowsByNameSchema } from "@llamaindex/workflows-client";

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
  onCollapse?: () => void;
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
  onCollapse,
}: WorkflowConfigPanelProps) {
  const [schema, setSchema] = useState<Schema | null>(null);
  const [formData, setFormData] = useState<{ [key: string]: JSONValue }>({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [rawInput, setRawInput] = useState<string>("");
  const [rawInputError, setRawInputError] = useState<string | null>(null);
  const [rawJsonErrors, setRawJsonErrors] = useState<
    Record<string, string | null>
  >({});

  const workflowsClient = useWorkflowsClient();
  const { runWorkflow, isCreating, error: runError } = useWorkflowRun();

  useEffect(() => {
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
        setRawJsonErrors({});
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to fetch schema");
        setSchema(null);
      } finally {
        setLoading(false);
      }
    };

    if (selectedWorkflow) {
      fetchSchema();
    } else {
      setSchema(null);
      setFormData({});
      setRawInput("");
      setRawInputError(null);
      setRawJsonErrors({});
    }
  }, [selectedWorkflow, workflowsClient]);

  const handleRunWorkflow = async () => {
    if (!selectedWorkflow) return;

    try {
      const handler = await runWorkflow(selectedWorkflow, formData);
      onRunStart(handler.handler_id);

      // Auto-collapse the config panel after starting a run
      if (onCollapse) {
        onCollapse();
      }
    } catch (err) {
      console.error("Failed to run workflow:", err);
    }
  };

  const hasSchemaFields = Boolean(
    schema?.properties && Object.keys(schema.properties).length > 0,
  );

  if (!selectedWorkflow) {
    return (
      <div className="h-full flex flex-col">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="font-semibold text-sm">Workflow Configuration</h2>
          {onCollapse && (
            <Button
              variant="ghost"
              size="sm"
              onClick={onCollapse}
              title="Hide configuration panel (Ctrl+B)"
            >
              <PanelRightClose className="h-4 w-4" />
            </Button>
          )}
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
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="font-semibold text-sm">Configure: {selectedWorkflow}</h2>
        {onCollapse && (
          <Button
            variant="ghost"
            size="sm"
            onClick={onCollapse}
            title="Hide configuration panel (Ctrl+B)"
          >
            <PanelRightClose className="h-4 w-4" />
          </Button>
        )}
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
              {hasSchemaFields ? (
                <JsonSchemaEditor
                  schema={schema}
                  values={formData}
                  onChange={setFormData}
                  onErrorsChange={setRawJsonErrors}
                />
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

      {/* Footer with Run Button */}
      {!loading && !error && (
        <div className="p-4 border-t border-border">
          {Object.values(rawJsonErrors).some((e) => e) && (
            <p className="text-xs text-destructive mb-2">
              Fix invalid JSON fields before running.
            </p>
          )}
          <Button
            onClick={handleRunWorkflow}
            disabled={isCreating || Object.values(rawJsonErrors).some((e) => e)}
            className="w-full"
          >
            {isCreating ? "Starting..." : "Run Workflow"}
          </Button>
        </div>
      )}
    </div>
  );
}
