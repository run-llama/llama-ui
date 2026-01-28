import { describe, it, expect, vi } from "vitest";
import { render, screen, waitFor } from "@testing-library/react";
import { ApiProvider, createMockClients } from "../../src/lib";
import { ExtractedDataItemGrid } from "../../src/item-grid/extracted-data-item-grid";
import type { FilterOperation } from "@/src/lib/agent-data";
import type { ReactNode } from "react";

function renderWithProvider(ui: ReactNode, clients = createMockClients()) {
  return render(<ApiProvider clients={clients}>{ui}</ApiProvider>);
}

describe("ExtractedDataItemGrid baseFilter", () => {
  it("passes filter through to search API", async () => {
    const clients = createMockClients();
    if (!clients.agentDataClient) {
      throw new Error("AgentDataClient not found");
    }
    const spy = vi.spyOn(clients.agentDataClient, "search");

    const filter: Record<string, FilterOperation> = {
      status: { includes: ["approved"] },
    };

    renderWithProvider(
      <ExtractedDataItemGrid
        customColumns={[]}
        builtInColumns={{}}
        defaultPageSize={5}
        filter={filter}
      />,
      clients
    );

    // Wait for loading to complete (ensures all state updates are done)
    await waitFor(() => {
      expect(screen.queryByText("Loading items...")).toBeNull();
    });

    expect(spy).toHaveBeenCalled();
    const call = spy.mock.calls.at(-1) as any[];
    expect(call?.[0]?.filter).toMatchObject(filter);
  });
});
