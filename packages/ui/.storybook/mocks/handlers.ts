import { http, HttpResponse, delay } from "msw";

// Mock the LlamaCloud file upload API
let taskCounter = 1;

// Mock agent data for item grid
const mockAgentData = Array.from({ length: 50 }, (_, index) => ({
  id: `item-${index + 1}`,
  data: {
    data: {
      file_name: `document_${index + 1}.pdf`,
      part_number: `PN-${(index + 1).toString().padStart(4, "0")}`,
      description: `Sample description for item ${index + 1}`,
      category: ["Electronics", "Automotive", "Industrial"][index % 3],
      price: Math.floor(Math.random() * 1000) + 100,
    },
    original_data: {
      file_name: `document_${index + 1}.pdf`,
      part_number: `PN-${(index + 1).toString().padStart(4, "0")}`,
      description: `Sample description for item ${index + 1}`,
      category: ["Electronics", "Automotive", "Industrial"][index % 3],
      price: Math.floor(Math.random() * 1000) + 100,
    },
    file_name: `document_${index + 1}.pdf`,
    status: ["approved", "pending", "rejected"][index % 3],
    extraction_summary: {
      high_confidence: Math.floor(Math.random() * 10) + 5,
      low_confidence: Math.floor(Math.random() * 3),
      total: Math.floor(Math.random() * 13) + 8,
    },
  },
  created_at: new Date(
    Date.now() - Math.random() * 30 * 24 * 60 * 60 * 1000
  ).toISOString(),
  updated_at: new Date(
    Date.now() - Math.random() * 7 * 24 * 60 * 60 * 1000
  ).toISOString(),
}));

export const handlers = {
  // File upload endpoint - can be overridden in stories
  upload: http.post(
    "https://api.cloud.llamaindex.ai/api/v1/files",
    async ({ request }) => {
      const formData = await request.formData();
      const file = formData.get("upload_file") as File;

      if (!file) {
        return new HttpResponse("No file provided", { status: 400 });
      }

      // Simulate processing delay
      await new Promise((resolve) =>
        setTimeout(resolve, 1000 + Math.random() * 2000)
      );

      // Generate a mock file ID
      const fileId = `mock-file-${Date.now()}-${Math.random().toString(36).substring(2, 11)}`;

      return HttpResponse.json({
        id: fileId,
        name: file.name,
        size: file.size,
        type: file.type,
        status: "uploaded",
      });
    }
  ),

  // File content and other endpoints
  fileContent: [
    // Mock file content URL endpoint
    http.get(
      "https://api.cloud.llamaindex.ai/api/v1/files/:id/content",
      ({ params }) => {
        const { id } = params;

        // Generate a mock URL for the file content
        const mockUrl = `https://mock-storage.llamaindex.ai/files/${id}`;

        // Simulate a delay for realism
        return new Promise((resolve) =>
          setTimeout(
            () => {
              resolve(
                HttpResponse.json({
                  url: mockUrl,
                })
              );
            },
            500 + Math.random() * 1000
          )
        );
      }
    ),

    // Mock error scenarios for testing
    http.post("https://api.cloud.llamaindex.ai/api/v1/files/error", () => {
      return new HttpResponse("Internal Server Error", { status: 500 });
    }),
  ],

  // Agent Data handlers for ItemGrid
  agentData: [
    // Search/list items
    http.post(
      "https://api.llamaindex.cloud/api/v1/beta/agent-data/:search",
      async ({ request }) => {
        console.log("MSW: Intercepted agent data search request");

        const requestBody = (await request.json()) as any;
        const {
          offset = 0,
          page_size: pageSize = 20,
          order_by: orderBy,
          filter,
        } = requestBody;

        await delay(500); // Simulate network delay

        let filteredData = [...mockAgentData];

        // Apply filters
        if (filter) {
          Object.entries(filter).forEach(
            ([key, filterOperation]: [string, any]) => {
              if (filterOperation.includes) {
                filteredData = filteredData.filter((item) =>
                  filterOperation.includes.some((value: string) =>
                    String(
                      item.data[key as keyof typeof item.data] || ""
                    ).includes(value)
                  )
                );
              }
            }
          );
        }

        // Apply sorting
        if (orderBy) {
          const [field, direction] = orderBy.split(" ");
          filteredData.sort((a, b) => {
            const aValue =
              field === "created_at" || field === "updated_at"
                ? new Date(a[field as keyof typeof a] as string).getTime()
                : a.data[field as keyof typeof a.data] || "";
            const bValue =
              field === "created_at" || field === "updated_at"
                ? new Date(b[field as keyof typeof b] as string).getTime()
                : b.data[field as keyof typeof b.data] || "";

            if (direction === "desc") {
              return aValue < bValue ? 1 : -1;
            }
            return aValue > bValue ? 1 : -1;
          });
        }

        const totalSize = filteredData.length;
        const items = filteredData.slice(offset, offset + pageSize);

        const response = {
          items,
          total_size: totalSize,
        };

        console.log("MSW: Returning agent data search response:", {
          total_size: totalSize,
          items_count: items.length,
          requestBody,
          response,
        });
        return HttpResponse.json(response);
      }
    ),

    // Get single item
    http.get(
      "https://api.llamaindex.cloud/api/v1/beta/agent-data/:itemId",
      async ({ params }) => {
        const { itemId } = params;
        console.log("MSW: Intercepted get item request for:", itemId);

        await delay(300);

        const item = mockAgentData.find((item) => item.id === itemId);
        if (!item) {
          return new HttpResponse("Item not found", { status: 404 });
        }

        return HttpResponse.json(item);
      }
    ),

    // Update item
    http.put(
      "https://api.llamaindex.cloud/api/v1/beta/agent-data/:itemId",
      async ({ params, request }) => {
        const { itemId } = params;
        const updateData = (await request.json()) as any;
        console.log(
          "MSW: Intercepted update item request for:",
          itemId,
          updateData
        );

        await delay(400);

        const itemIndex = mockAgentData.findIndex((item) => item.id === itemId);
        if (itemIndex === -1) {
          return new HttpResponse("Item not found", { status: 404 });
        }

        // Update the item
        mockAgentData[itemIndex] = {
          ...mockAgentData[itemIndex],
          data: {
            ...mockAgentData[itemIndex].data,
            ...updateData,
          },
          updated_at: new Date().toISOString(),
        };

        return HttpResponse.json(mockAgentData[itemIndex]);
      }
    ),

    // Delete item
    http.delete(
      "https://api.llamaindex.cloud/api/v1/beta/agent-data/:itemId",
      async ({ params }) => {
        const { itemId } = params;
        console.log("MSW: Intercepted delete item request for:", itemId);

        await delay(300);

        const itemIndex = mockAgentData.findIndex((item) => item.id === itemId);
        if (itemIndex === -1) {
          return new HttpResponse("Item not found", { status: 404 });
        }

        // Remove the item from mock data
        mockAgentData.splice(itemIndex, 1);

        return new HttpResponse(null, { status: 204 });
      }
    ),
  ],
};
