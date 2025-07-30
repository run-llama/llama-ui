import { http, HttpResponse, delay } from "msw";

// Mock the LlamaCloud file upload API
let taskCounter = 1;

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

  // Workflow Task handlers
  workflowTask: [
    // Mock task creation
    http.post('*/deployments/:deployment_name/tasks/create', async ({ params, request }) => {
      console.log('MSW: Intercepted task creation request', { params, url: request.url });
      
      // Log the request body to understand what's being sent
      try {
        await request.text();
        console.log('MSW: Request body received');
      } catch {
        console.log('MSW: Could not read request body');
      }
      
      await delay(300); // Simulate network delay
      
      const taskId = `task-${taskCounter++}`;
      const sessionId = `session-${taskCounter}`;
      const serviceId = `service-${taskCounter}`;
      
      // Return the raw API response (the client library will wrap it in 'data')
      const response = {
        task_id: taskId,
        session_id: sessionId,  
        service_id: serviceId,
        input: '{"demo": "data"}',
      };
      
      console.log('MSW: Returning task creation response (raw format):', response);
      return HttpResponse.json(response);
    }),

    // Mock task events streaming
    http.get('*/deployments/:deployment_name/tasks/:task_id/events', async (info) => {
      const { task_id: taskId, deployment_name: deploymentName } = info.params;
      console.log('MSW: Intercepted task events request', { 
        params: info.params, 
        taskId, 
        deploymentName,
        url: info.request.url 
      });
      
      // Create a readable stream for Server-Sent Events
      const stream = new ReadableStream({
        start(controller) {
          // Generate different number of events based on task ID to make comparison easier
          const allEvents = [
            { type: 'AgentStream', data: { message: 'Starting file analysis...' } },
            { type: 'AgentStream', data: { message: 'Processing uploaded file...' } },
            { type: 'AgentStream', data: { message: 'Extracting part number information...' } },
            { type: 'AgentStream', data: { message: 'Validating extracted data...' } },
            { type: 'AgentStream', data: { message: 'Generating final report...' } },
            { type: 'AgentStream', data: { message: 'Performing quality checks...' } },
            { type: 'AgentStream', data: { message: 'Updating database records...' } },
            { type: 'AgentStream', data: { message: 'Sending notifications...' } },
            { type: 'AgentStream', data: { message: 'Creating backup...' } },
            { type: 'AgentStream', data: { message: 'Analysis completed successfully!' } },
          ];
          
          // Generate random number of events (3-8) to make comparison easier
          const eventCount = Math.floor(Math.random() * 6) + 3; // Random between 3-8
          
          const events = allEvents.slice(0, eventCount);
          console.log(`MSW: Generating ${eventCount} events for task ${taskId}`);
          
          let eventsSent = 0;
          
          const sendNextEvent = () => {
            if (eventsSent >= events.length) {
              setTimeout(() => controller.close(), 100);
              return;
            }
            
            const event = events[eventsSent];
            const rawEvent = {
              __is_pydantic: true,
              value: event.data,
              qualified_name: event.type,
            };
            
            console.log(`MSW: Sending event ${eventsSent + 1}/${events.length}:`, rawEvent);
            controller.enqueue(new TextEncoder().encode(JSON.stringify(rawEvent) + '\n'));
            
            eventsSent++;
            setTimeout(sendNextEvent, 1000); // Send next event after 1000ms
          };
          
          // Start sending events after 500ms delay
          setTimeout(sendNextEvent, 500);
        },
      });
      
      return new Response(stream, {
        headers: {
          'Content-Type': 'text/plain',
          'Cache-Control': 'no-cache',
          'Connection': 'keep-alive',
        },
      });
    }),

    // Mock get tasks
    http.get('*/deployments/:deployment_name/tasks', async ({ params }) => {
      const { deployment_name: deploymentName } = params;
      console.log('MSW: Intercepted get tasks list request for deployment:', deploymentName);
      
      // Return all created tasks so getExistingTask can find them
      const allTasks = [];
      
      // Add any tasks that were created through the create task endpoint
      if (deploymentName?.toString().includes('demo-deployment')) {
        allTasks.push({
          task_id: 'task-1',
          session_id: 'session-1',
          service_id: 'service',
          input: '{"demo": "data"}',
        });
      }
      
      console.log('MSW: Returning tasks list:', allTasks);
      return HttpResponse.json(allTasks);
    }),
  ],
};
