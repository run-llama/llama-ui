import asyncio
import logging
from workflows.server import WorkflowServer
from test_workflows.sum import SumWorkflow
from test_workflows.subtract import SubtractWorkflow
from agents.basic_chat_agent_workflow import BasicChatAgentWorkflow

# Configure logging to output to stdout
logging.basicConfig(
    level=logging.DEBUG,
    format='[%(asctime)s] %(levelname)s [%(name)s] %(message)s',
    datefmt='%Y-%m-%d %H:%M:%S',
    force=True  # Override any existing configuration
)

async def main() -> None:
    server = WorkflowServer()

    # Register workflows
    server.add_workflow("sum", SumWorkflow())
    server.add_workflow("subtract", SubtractWorkflow())
    server.add_workflow("basic_chat_agent_workflow", BasicChatAgentWorkflow())

    # Enable auto-reload for development
    await server.serve(
        host="127.0.0.1",
        port=8000,
        uvicorn_config={"reload": True}
    )


if __name__ == "__main__":
    try:
        asyncio.run(main())
    except KeyboardInterrupt:
        pass