import { useWorkflowsClient } from "@/src/lib/api-provider";
import { useMemo } from "react";
import { useSnapshot } from "valtio";
import {
  createActions,
  HandlersState,
  createState as createHandlersState,
} from "../store/handlers";
import { getOrCreate } from "@/src/shared/store";
import {
  createActions as createWorkflowsActions,
  createState as createWorkflowsState,
  WorkflowsState,
} from "../store/workflows";
import {
  createActions as createWorkflowActions,
  createState as createWorkflowState,
  WorkflowState,
} from "../store/workflow";
import {
  createActions as createHandlerActions,
  createState as createHandlerState,
  HandlerState,
} from "../store/handler";

export function useHandlers() {
  const client = useWorkflowsClient();
  const state = getOrCreate<HandlersState>("handlers", () =>
    createHandlersState()
  );
  const actions = useMemo(() => createActions(state, client), [state, client]);
  return {
    state: useSnapshot(state),
    ...actions,
  };
}

export function useWorkflows() {
  const client = useWorkflowsClient();
  const state = getOrCreate<WorkflowsState>("workflows", () =>
    createWorkflowsState()
  );
  const actions = useMemo(
    () => createWorkflowsActions(state, client),
    [state, client]
  );
  return {
    state: useSnapshot(state),
    ...actions,
  };
}

export function useWorkflow(name: string) {
  const client = useWorkflowsClient();
  const state = getOrCreate<WorkflowState>(`workflow:${name}`, () =>
    createWorkflowState(name)
  );
  const actions = useMemo(
    () => createWorkflowActions(state, client),
    [state, client]
  );
  return {
    state: useSnapshot(state),
    ...actions,
  };
}

export function useHandler(handlerId: string | null) {
  const client = useWorkflowsClient();
  const state = getOrCreate<HandlerState>(`handler:${handlerId}`, () =>
    createHandlerState()
  );
  const actions = useMemo(
    () => createHandlerActions(state, client),
    [state, client]
  );
  return {
    state: useSnapshot(state),
    ...actions,
  };
}
