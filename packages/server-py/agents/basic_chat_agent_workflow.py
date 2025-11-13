"""
Basic Chat Agent using LlamaIndex FunctionAgent with simple tools.

This module implements a simple chat agent with multiple tools:
- calculate: Perform basic arithmetic operations
- get_current_time: Get current date and time
- reverse_string: Reverse a text string
"""

import os
from datetime import datetime

from llama_index.core.agent.workflow import FunctionAgent
from llama_index.core.agent.workflow import AgentWorkflow
from llama_index.llms.openai import OpenAI


# Define tool functions
def calculate(expression: str) -> str:
    """
    Evaluate a mathematical expression safely.
    
    Args:
        expression: A string containing a mathematical expression (e.g., "2 + 3 * 4")
        
    Returns:
        The result of the calculation as a string
        
    Example:
        calculate("10 + 5") -> "15"
        calculate("(2 + 3) * 4") -> "20"
    """
    try:
        # Use eval with restricted globals/locals for safety
        # Only allow basic math operations
        allowed_names = {
            "__builtins__": {},
            "abs": abs,
            "round": round,
            "min": min,
            "max": max,
            "pow": pow,
        }
        result = eval(expression, allowed_names, {})
        return str(result)
    except Exception as e:
        return f"Error calculating expression: {str(e)}"


def get_current_time() -> str:
    """
    Get the current date and time.
    
    Returns:
        Current date and time in a readable format
        
    Example:
        get_current_time() -> "2024-11-10 15:30:45"
    """
    now = datetime.now()
    return now.strftime("%Y-%m-%d %H:%M:%S")


def reverse_string(text: str) -> str:
    """
    Reverse a text string.
    
    Args:
        text: The string to reverse
        
    Returns:
        The reversed string
        
    Example:
        reverse_string("hello") -> "olleh"
    """
    return text[::-1]


class BasicChatAgentWorkflow(AgentWorkflow):
    """
    A simple chat agent powered by LlamaIndex FunctionAgent.
    
    This agent can:
    - Perform basic calculations
    - Get current time
    - Reverse strings
    - Maintain conversation context
    
    Attributes:
        agent: The underlying FunctionAgent instance
        context: The conversation context for maintaining chat history
    """
    
    def __init__(
        self,
        model: str = "gpt-4o-mini",
        temperature: float = 0.7,
        api_key: str | None = '',
        verbose: bool = False,
    ):
        """
        Initialize the BasicChatAgent.
        
        Args:
            model: The OpenAI model to use (default: "gpt-4o-mini")
            temperature: The temperature for LLM responses (default: 0.7)
            api_key: OpenAI API key (if None, will use OPENAI_API_KEY env var)
            verbose: Whether to enable verbose logging (default: False)
        """
        # Set up OpenAI API key
        if api_key:
            os.environ["OPENAI_API_KEY"] = api_key
        
        # Initialize LLM
        self.llm = OpenAI(model=model, temperature=temperature)
        
        # Define system prompt
        system_prompt = """You are a helpful AI assistant with access to several tools.
You can:
- Perform mathematical calculations using the 'calculate' tool
- Get the current date and time using the 'get_current_time' tool
- Reverse text strings using the 'reverse_string' tool

Use these tools when appropriate to help answer user questions.
Be friendly, clear, and concise in your responses."""
        
        # Initialize FunctionAgent with tools
        self.agent = FunctionAgent(
            tools=[calculate, get_current_time, reverse_string],
            llm=self.llm,
            system_prompt=system_prompt,
            verbose=verbose,
        )
        
        super().__init__(
            agents=[self.agent],
            verbose=verbose,
        )


# Example usage
async def main():
    """Example usage of BasicChatAgent."""
    # Initialize agent
    workflow = BasicChatAgentWorkflow(verbose=True)
    response = await workflow.run(
        "Calculate 100 + 200, tell me the time, and reverse the word 'hello'"
    )
    print(response)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())

