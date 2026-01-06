import asyncio
from workflows.context import Context
from workflows import Workflow, step
from workflows.events import Event, StartEvent, StopEvent
from logging import getLogger

logger = getLogger(__name__)

class SumInput(StartEvent):
    a: int
    b: int

class ProgressEvent(Event):
    step: str
    progress: int
    message: str

class CalculateRequestEvent(Event):
    a: int
    b: int

class CalculateResponseEvent(Event):
    result: int

class SumOutput(StopEvent):
    results: int

class SumWorkflow(Workflow):
    @step
    async def initialize(self, ctx: Context, ev: SumInput) -> CalculateRequestEvent:
        logger.info("Starting sum workflow")
        ctx.write_event_to_stream(
            ProgressEvent(
                step="start",
                progress=10,
                message="Starting sum workflow"
            )
        )
        await asyncio.sleep(1.0)
        return CalculateRequestEvent(a=ev.a, b=ev.b)
    
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
        result = ev.a + ev.b
        return CalculateResponseEvent(result=result)

    @step
    async def finalize(self, ctx: Context, ev: CalculateResponseEvent) -> SumOutput:
        logger.info("Finalizing result")
        await asyncio.sleep(1.0)
        return SumOutput(results=ev.result)
