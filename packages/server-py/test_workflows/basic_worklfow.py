import asyncio
from workflows.context import Context
from workflows import Workflow, step
from workflows.events import Event, StartEvent, StopEvent
from enum import Enum
from logging import getLogger

logger = getLogger(__name__)

class Operation(Enum):
    SUM = "sum"
    SUBTRACT = "subtract"
    MULTIPLY = "multiply"
    DIVIDE = "divide"

class CalculatorInput(StartEvent):
    a: int
    b: int
    operation: Operation

class ProgressEvent(Event):
    step: str
    progress: int
    message: str

class CalculateRequestEvent(Event):
    a: int
    b: int

class CalculateResponseEvent(Event):
    result: int

class CalculatorOutput(StopEvent):
    results: int

class CalculatorWorkflow(Workflow):
    @step
    async def initialize(self, ctx: Context, ev: CalculatorInput) -> CalculateRequestEvent:
        logger.info("Starting sum workflow")
        ctx.write_event_to_stream(
            ProgressEvent(
                step="start",
                progress=10,
                message="Starting sum workflow"
            )
        )
        await asyncio.sleep(1.0)
        return CalculateRequestEvent(a=ev.a, b=ev.b, operation=ev.operation)
    
    @step
    async def sum(self, ctx: Context, ev: CalculateRequestEvent) -> CalculateResponseEvent:
        logger.info("Calculating result")
        await asyncio.sleep(1.0)
        ctx.write_event_to_stream(
            ProgressEvent(
                step="calculate",
                progress=50,
                message="Calculating result"
            )
        )
        if ev.operation == Operation.SUM:
            result = ev.a + ev.b
        elif ev.operation == Operation.SUBTRACT:
            result = ev.a - ev.b
        elif ev.operation == Operation.MULTIPLY:
            result = ev.a * ev.b
        elif ev.operation == Operation.DIVIDE:
            result = ev.a / ev.b
        return CalculateResponseEvent(result=result)

    @step
    async def finalize(self, ctx: Context, ev: CalculateResponseEvent) -> CalculatorOutput:
        logger.info("Finalizing result")
        await asyncio.sleep(1.0)
        return CalculatorOutput(results=ev.result)
