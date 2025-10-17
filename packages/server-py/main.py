import asyncio
from workflows.server import WorkflowServer
from test_workflows.basic_worklfow import CalculatorWorkflow

async def main() -> None:
    server = WorkflowServer()

    # Register workflows
    server.add_workflow("calculator", CalculatorWorkflow())

    await server.serve(host="127.0.0.1", port=8000)


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass