import { describe, it, expect, vi } from "vitest";
import { render } from "@testing-library/react";
import { ApiProvider, createMockClients } from "../../src/lib";
import { ExtractedDataItemGrid } from "../../src/item-grid/extracted-data-item-grid";
import type { FilterOperation } from "llama-cloud-services/beta/agent";
import type { ReactNode } from "react";

function renderWithProvider(ui: ReactNode, clients = createMockClients()) {
  return render(<ApiProvider clients={clients}>{ui}</ApiProvider>);
}

describe("ExtractedDataItemGrid baseFilter", () => {
  it("passes baseFilter through to search API", async () => {
    const clients = createMockClients();
    const spy = vi.spyOn(clients.agentDataClient, "search");

    const baseFilter: Record<string, FilterOperation> = {
      status: { includes: ["approved"] },
    };

    renderWithProvider(
      <ExtractedDataItemGrid
        customColumns={[]}
        builtInColumns={{}}
        defaultPageSize={5}
        baseFilter={baseFilter}
      />,
      clients
    );

    // Wait a microtask tick for effects to run
    await Promise.resolve();

    expect(spy).toHaveBeenCalled();
    const call = spy.mock.calls.at(-1) as any[];
    expect(call?.[0]?.filter).toMatchObject(baseFilter);
  });
});
