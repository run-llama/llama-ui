/// <reference types="@testing-library/jest-dom/vitest" />
import { waitFor, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ItemCount } from "../../src/item-count/item-count";
import { ApiProvider } from "../../src/lib";
import { createAgentDataConfig } from "../../src/lib/clients";
import type { ApiClients } from "../../src/lib/api-provider";

/**
 * Creates a mock that simulates the LlamaCloud SDK aggregate response.
 * The aggregate API returns items via getPaginatedItems() method,
 * with each item having a count property.
 */
function createMockCloudClient(count: number = 3) {
  return {
    beta: {
      agentData: {
        aggregate: vi.fn().mockResolvedValue({
          getPaginatedItems: () => [{ group_key: {}, count }],
        }),
      },
    },
  };
}

function createTestMockClients(
  mockCloudClient: ReturnType<typeof createMockCloudClient>
): ApiClients {
  return {
    cloudApiClient: mockCloudClient as any,
    agentDataConfig: createAgentDataConfig({
      deploymentName: "test-deployment",
      collection: "test-collection",
    }),
  };
}

function renderItemCount(
  props: React.ComponentProps<typeof ItemCount>,
  mockClients: ApiClients
) {
  return render(
    <ApiProvider clients={mockClients}>
      <ItemCount {...props} />
    </ApiProvider>
  );
}

describe("ItemCount", () => {
  it("should display loading state initially", () => {
    const mockClients = createTestMockClients(createMockCloudClient(5));
    renderItemCount({ title: "Test Count" }, mockClients);

    expect(screen.getByText("Loading...")).toBeInTheDocument();
  });

  it("should display count from aggregate API response", async () => {
    const expectedCount = 42;
    const mockClients = createTestMockClients(
      createMockCloudClient(expectedCount)
    );
    renderItemCount({ title: "Test Count" }, mockClients);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("42")).toBeInTheDocument();
  });

  it("should display 0 when count is not available", async () => {
    const mockCloudClient = {
      beta: {
        agentData: {
          aggregate: vi.fn().mockResolvedValue({
            getPaginatedItems: () => [],
          }),
        },
      },
    };
    const mockClients = createTestMockClients(mockCloudClient as any);
    renderItemCount({ title: "Test Count" }, mockClients);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("0")).toBeInTheDocument();
  });

  it("should pass filter to aggregate API", async () => {
    const mockCloudClient = createMockCloudClient(10);
    const mockClients = createTestMockClients(mockCloudClient);
    const filter = { status: { eq: "pending_review" } };

    renderItemCount({ title: "Needs Review", filter }, mockClients);

    await waitFor(() => {
      expect(mockCloudClient.beta.agentData.aggregate).toHaveBeenCalledWith(
        expect.objectContaining({
          filter,
          count: true,
          group_by: [],
        })
      );
    });
  });

  it("should display different variants correctly", async () => {
    const mockClients = createTestMockClients(createMockCloudClient(15));

    render(
      <ApiProvider clients={mockClients}>
        <ItemCount title="Awaiting" variant="awaiting" />
      </ApiProvider>
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("15")).toBeInTheDocument();
    expect(screen.getByText("Awaiting")).toBeInTheDocument();
  });

  it("should display subtitle when provided", async () => {
    const mockClients = createTestMockClients(createMockCloudClient(5));
    renderItemCount(
      { title: "Test Count", subtitle: "Items needing review" },
      mockClients
    );

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText("Items needing review")).toBeInTheDocument();
  });

  it("should handle API errors gracefully", async () => {
    const mockCloudClient = {
      beta: {
        agentData: {
          aggregate: vi.fn().mockRejectedValue(new Error("Network error")),
        },
      },
    };
    const mockClients = createTestMockClients(mockCloudClient as any);
    renderItemCount({ title: "Test Count" }, mockClients);

    await waitFor(() => {
      expect(screen.queryByText("Loading...")).not.toBeInTheDocument();
    });

    expect(screen.getByText(/Error: Network error/)).toBeInTheDocument();
  });
});
