import { http, HttpResponse } from "msw";

// Mock the LlamaCloud file upload API
export const handlers = {
  // File upload endpoint - can be overridden in stories
  upload: http.post("https://api.cloud.llamaindex.ai/api/v1/files", async ({ request }) => {
    const formData = await request.formData();
    const file = formData.get("upload_file") as File;

    if (!file) {
      return new HttpResponse("No file provided", { status: 400 });
    }

    // Simulate processing delay
    await new Promise((resolve) =>
      setTimeout(resolve, 1000 + Math.random() * 2000),
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
  }),

  // File content and other endpoints
  fileContent: [
    // Mock file content URL endpoint
    http.get("https://api.cloud.llamaindex.ai/api/v1/files/:id/content", ({ params }) => {
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
              }),
            );
          },
          500 + Math.random() * 1000,
        ),
      );
    }),

    // Mock error scenarios for testing
    http.post("https://api.cloud.llamaindex.ai/api/v1/files/error", () => {
      return new HttpResponse("Internal Server Error", { status: 500 });
    }),
  ],
};
