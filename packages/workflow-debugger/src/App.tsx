import { ApiProvider, createWorkflowsClient } from "@llamaindex/ui";
import { WorkflowDebugger } from "./components/workflow-debugger";
import { ErrorBoundary } from "./components/error-boundary";

function App() {
  // Get origin from window.location (safe in Vite client-side app)
  const url =
    typeof window !== "undefined"
      ? window.location.origin
      : "http://localhost:8000";
  const client = createWorkflowsClient({ baseUrl: url });

  return (
    <ErrorBoundary>
      <ApiProvider clients={{ workflowsClient: client }}>
        <WorkflowDebugger />
      </ApiProvider>
    </ErrorBoundary>
  );
}

export default App;
