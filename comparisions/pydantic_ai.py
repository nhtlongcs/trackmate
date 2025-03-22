import pretty_errors
import rich
from dotenv import load_dotenv
import os
load_dotenv()
from pydantic_ai import Agent, RunContext
from pydantic import BaseModel, Field
from tavily import TavilyClient

assert os.getenv("GEMINI_API_KEY"), "GEMINI_API_KEY not set"
assert os.getenv("TAVILY_API_KEY"), "TAVILY_API_KEY not set"

# Define dependencies and results
class State(BaseModel):
    tavily_api_key: str

    search_result: str | None = Field(description='Result of the web search', default=None)

    research_notes: str | None = Field(description='Notes recorded', default=None)

    report_content: str | None = Field(description='Report written', default=None)

    review: str | None = Field(description='Review', default=None)

# Create agents
search_agent = Agent(
    'google-gla:gemini-1.5-flash',
    deps_type=State,
    result_type=State,
    system_prompt='You are a search agent that provides concise web search results.'
)

record_notes_agent = Agent(
    'google-gla:gemini-1.5-flash',
    deps_type=State,
    result_type=State,
    system_prompt='You are a notes agent that records notes.'
)

write_report_agent = Agent(
    'google-gla:gemini-1.5-flash',
    deps_type=State,
    result_type=State,
    system_prompt='You are a report agent that writes reports.'
)

review_report_agent = Agent(
    'google-gla:gemini-1.5-flash',
    deps_type=State,
    result_type=State,
    system_prompt='You are a review agent that reviews reports.'
)

# Define tools
@search_agent.tool
def search_web(ctx: RunContext[State], query: str) -> str:
    """Performs a web search using TavilyClient."""
    client = TavilyClient(api_key=ctx.deps.tavily_api_key)
    return str(client.search(query))

@record_notes_agent.tool
async def record_notes(ctx: RunContext[State], notes: str, notes_title: str) -> str:
    """Records notes on a given topic."""
    if ctx.deps.research_notes is None:
        ctx.deps.research_notes = f"{notes_title}: {notes}\n"
    else:
        ctx.deps.research_notes += f"{notes_title}: {notes}\n"
    return "Notes recorded."

@write_report_agent.tool
async def write_report(ctx: RunContext[State], report_content: str) -> str:
    """Writes a report on a given topic."""
    ctx.deps.report_content = report_content
    return "Report written."

@review_report_agent.tool
async def review_report(ctx: RunContext[State], review: str) -> str:
    """Reviews a report and provides feedback."""
    if ctx.deps.review is None:
        ctx.deps.review = review
    else:
        ctx.deps.review += review
    return "Report reviewed."

# Main function
async def main():
    state = State(tavily_api_key=os.getenv("TAVILY_API_KEY"))
    result = await search_agent.run('What is the capital of France?', deps=state)
    print(result.data)

    # Run agents
    await record_notes_agent.run('Record notes on the history of the internet.', deps=state)
    await write_report_agent.run('Write a report on the history of the internet.', deps=state)
    await review_report_agent.run('Review the report on the history of the internet.', deps=state)

    # # Print final state
    rich.print(state.report_content)

if __name__ == "__main__":
    import asyncio
    asyncio.run(main())
