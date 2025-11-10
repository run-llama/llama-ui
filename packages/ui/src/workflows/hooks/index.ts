import { useWorkflowsClient } from "@/src/lib/api-provider";
import { useEffect, useMemo } from "react";
import { useSnapshot } from "valtio";
import {
  createActions,
  HandlersState,
  createState as createHandlersState,
  HandlersQuery,
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

export function useHandlers({
  query,
  sync = true,
}: {
  query?: HandlersQuery;
  sync?: boolean;
} = {}) {
  const client = useWorkflowsClient();
  const state = getOrCreate<HandlersState>(
    `handlers:${JSON.stringify(query)}`,
    () => createHandlersState({ query: query ?? {} })
  );
  const actions = useMemo(() => createActions(state, client), [state, client]);
  useEffect(() => {
    if (sync) {
      actions.sync();
    }
  }, [actions, sync]);
  return {
    state: useSnapshot(state),
    ...actions,
  };
}

export function useWorkflows({ sync = true }: { sync?: boolean } = {}) {
  const client = useWorkflowsClient();
  const state = getOrCreate<WorkflowsState>("workflows", () =>
    createWorkflowsState()
  );
  const actions = useMemo(
    () => createWorkflowsActions(state, client),
    [state, client]
  );
  useEffect(() => {
    if (sync) {
      actions.sync();
    }
  }, [actions, sync]);
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

/**
 *
 * @param handlerId - The handler ID to use. If null, the handler will be initialized with an empty state.
 * @param sync - Whether to sync the handler state. If true, the handler will be synced when the handler ID
 *              is changed. You can set to false and manually call sync if this is not the desired behavior.
 *              Default is `true`.
 * @returns A hook that returns the handler state and actions.
 */
export function useHandler(
  handlerId: string | null,
  { sync = true }: { sync?: boolean } = {}
) {
  const client = useWorkflowsClient();
  const state = getOrCreate<HandlerState>(`handler:${handlerId}`, () =>
    createHandlerState({ handler_id: handlerId ?? undefined })
  );
  const actions = useMemo(
    () => createHandlerActions(state, client),
    [state, client]
  );

  useEffect(() => {
    if (sync) {
      actions.sync();
    }
  }, [actions, sync, handlerId]);
  return {
    state: useSnapshot(state),
    ...actions,
  };
}
