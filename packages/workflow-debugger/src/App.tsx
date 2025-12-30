import { ApiProvider, createWorkflowsClient } from "@llamaindex/ui";
import { WorkflowDebugger } from "./components/workflow-debugger";
import { ErrorBoundary } from "./components/error-boundary";
import { getDefaultWorkflowUrl } from "./lib/get-default-url";

function App() {
  const url = getDefaultWorkflowUrl();
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
