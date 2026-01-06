import asyncio
from workflows.context import Context
from workflows import Workflow, step
from workflows.events import Event, StartEvent, StopEvent
from logging import getLogger

logger = getLogger(__name__)

class SubtractInput(StartEvent):
    a: int
    b: int
    absolute_value: bool | None = None


class ProgressEvent(Event):
    step: str
    progress: int
    message: str

class CalculateRequestEvent(Event):
    a: int
    b: int
    absolute_value: bool | None = None

class CalculateResponseEvent(Event):
    result: int

class SubtractOutput(StopEvent):
    results: int

class SubtractWorkflow(Workflow):
    @step
    async def initialize(self, ctx: Context, ev: SubtractInput) -> CalculateRequestEvent:
        logger.info("Starting Subtract workflow")
        ctx.write_event_to_stream(
            ProgressEvent(
                step="start",
                progress=10,
                message="Starting Subtract workflow"
            )
        )
        await asyncio.sleep(1.0)
        return CalculateRequestEvent(a=ev.a, b=ev.b, absolute_value=ev.absolute_value)
    
    @step
    async def Subtract(self, ctx: Context, ev: CalculateRequestEvent) -> CalculateResponseEvent:
        logger.info("Calculating result")
        await asyncio.sleep(1.0)
        ctx.write_event_to_stream(
            ProgressEvent(
                step="calculate",
                progress=50,
                message="Calculating result"
            )
        )
        result = ev.a - ev.b
        if ev.absolute_value:
            result = abs(result)
        return CalculateResponseEvent(result=result)

    @step
    async def finalize(self, ctx: Context, ev: CalculateResponseEvent) -> SubtractOutput:
        logger.info("Finalizing result")
        await asyncio.sleep(1.0)
        return SubtractOutput(results=ev.result)
