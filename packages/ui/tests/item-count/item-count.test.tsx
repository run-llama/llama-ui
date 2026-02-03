import { waitFor, render, screen } from "@testing-library/react";
import { describe, it, expect, vi } from "vitest";
import { ItemCount } from "../../src/item-count/item-count";
import { ApiProvider } from "../../src/lib";
import { createAgentDataConfig } from "../../src/lib/clients";
import type { ApiClients } from "../../src/lib/api-provider";

/**
 * Creates a mock that simulates the actual LlamaCloud SDK response structure.
 * The SDK's PaginatedCursorPost class stores the raw response in a 'body' property.
 * The total_size field is only accessible via body.total_size.
 */
function createMockCloudClient(totalSize: number = 3) {
  return {
    beta: {
      agentData: {
        search: vi.fn().mockResolvedValue({
          items: [],
          next_page_token: "",
          body: {
            items: [],
            next_page_token: "",
            total_size: totalSize,
          },
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

  it("should display count from API response body.total_size", async () => {
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

  it("should display 0 when body.total_size is not available", async () => {
    const mockCloudClient = {
      beta: {
        agentData: {
          search: vi.fn().mockResolvedValue({
            items: [],
            next_page_token: "",
            body: {
              items: [],
              next_page_token: "",
              // No total_size
            },
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

  it("should pass filter to API", async () => {
    const mockCloudClient = createMockCloudClient(10);
    const mockClients = createTestMockClients(mockCloudClient);
    const filter = { status: { eq: "pending_review" } };

    renderItemCount({ title: "Needs Review", filter }, mockClients);

    await waitFor(() => {
      expect(mockCloudClient.beta.agentData.search).toHaveBeenCalledWith(
        expect.objectContaining({
          filter,
          page_size: 0,
          include_total: true,
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
          search: vi.fn().mockRejectedValue(new Error("Network error")),
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
