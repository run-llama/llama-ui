from workflows.context import Context
from workflows import Workflow, step
from workflows.events import Event, StartEvent, StopEvent
from enum import Enum

class Operation(Enum):
    SUM = "sum"
    SUBTRACT = "subtract"
    MULTIPLY = "multiply"
    DIVIDE = "divide"

class CalculatorInput(StartEvent):
    a: int
    b: int
    operation: Operation

class CalculatorOutput(StopEvent):
    result: int

class ProgressEvent(Event):
    step: str
    progress: int
    message: str

class CalculateRequestEvent(Event):
    a: int
    b: int

class CalculateResponseEvent(Event):
    result: int

class CalculatorWorkflow(Workflow):
    @step
    async def initialize(self, ctx: Context, ev: CalculatorInput) -> CalculateRequestEvent:
        ctx.write_event_to_stream(
            ProgressEvent(
                step="start",
                progress=10,
                message="Starting sum workflow"
            )
        )
    
    @step
    async def sum(self, ctx: Context, ev: CalculateRequestEvent) -> CalculateResponseEvent:
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
        return CalculatorOutput(result=ev.result)
