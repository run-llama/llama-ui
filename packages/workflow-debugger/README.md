# Workflow Debugger

Frontend to to LlamaIndex Workflows server: https://github.com/run-llama/workflows-py

![Workflow Debugger](./ui_sample.png)

## Usage

The `Workflow Debugger` is automatically configured in a `WorkflowServer` to open a UI at the `/` path.

To use it, first, ensure that `llama-index-workflows` is installed:

```bash
pip install llama-index-workflows
```

Then, start a server with a workflow:

```python
import asyncio
from workflows import Workflow, step
from workflows.context import Context
from workflows.events import (
    Event,
    StartEvent,
    StopEvent,
)
from workflows.server import WorkflowServer

class ProcessingInput(StartEvent):
    things: list[str]

class ProcessedOutput(StopEvent):
    results: list[str]

class ProgressEvent(Event):
    step: str
    progress: int
    message: str


class ProcessingWorkflow(Workflow):
    """Example workflow that demonstrates event streaming with progress updates."""

    @step
    async def process(
        self,
        ctx: Context,
        ev: ProcessingInput
    ) -> ProcessedOutput:
        things = ev.things

        ctx.write_event_to_stream(
            ProgressEvent(
                step="start",
                progress=0,
                message=f"Starting processing of {len(things)} things",
            )
        )

        results = []
        for i, item in enumerate(things):
            # Simulate processing time
            await asyncio.sleep(1.0)

            # Emit progress event
            progress = int((i + 1) / len(things) * 100)
            ctx.write_event_to_stream(
                ProgressEvent(
                    step="processing",
                    progress=progress,
                    message=f"Processed {item} ({i + 1}/{len(things)})",
                )
            )

            results.append(f"processed_{item}")

        ctx.write_event_to_stream(
            ProgressEvent(
                step="complete",
                progress=100,
                message="Processing completed successfully",
            )
        )

        return ProcessedOutput(results=results)

async def main() -> None:
    server = WorkflowServer()

    # Register workflows
    server.add_workflow("processor", ProcessingWorkflow())

    await server.serve(host="127.0.0.1", port=8000)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass
```

From there, you can open your browser at `http://127.0.0.1:8000` to see the UI.

To use the debugger:

- select your workflow from the dropdown menu in the top middle
- input your payload to kick off the workflow (e.g. `["item1", "item2", "item3"]`)
- click the "Run Workflow" button to start the workflow
- the visualizer will display the workflow execution in real-time and allow you to see the streamed events
