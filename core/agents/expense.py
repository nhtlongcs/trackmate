from datetime import datetime, timezone

from agno.agent import Agent
from agno.models.google import Gemini
from pydantic import BaseModel
from rich.prompt import Prompt

from config.settings import settings


class Expense(BaseModel):
    date: datetime | None
    category: str | None
    name: str | None
    amount: float | None
    currency: str | None


class ExpenseResult(BaseModel):
    data: Expense | None
    continue_question: str | None


def create_agent():
    agent = Agent(
        model=Gemini(
            id="gemini-2.0-flash",
            api_key=settings.GEMINI_API_KEY,
        ),
        response_model=ExpenseResult,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        num_history_responses=5,
        # read_chat_history=True,  # cannot be used with response_model or any tools calling
        description="""Act like a financial management assistant.""",
        instructions=[
            """Given a chatting message of the transaction, extract the information respect the JSON schema and below rules:
            1. If the transaction is not likely about financial transaction, ask the user about what expense he made. Also provide an example answer.
            2. If the field is date time, return in YYYY-MM-DD format. Any missing date parts could be assumed to be the most recent.
            """,
        ],
    )
    return agent


async def extract_expense_info(message: str) -> Expense | None:
    """Use this function to extract expense detail from a chat message
    
    Args:
        message: a chat message

    Returns:
        expense: an expense detail or None if cannot be extracted
    """
    agent = create_agent()

    # TODO: add a more clever way to ask question
    question: str | None = None
    resp: ExpenseResult | None = None
    while True:
        if question:
            message = Prompt.ask(question)
        result = agent.run(message)
        resp = result.content
        if resp is None:
            # TODO: maybe network error or something. Should add exception handling
            break

        # Ask until get the valid transaction
        # TODO: add another way, e.g., exit/quit for user to give up asking
        if not resp.continue_question:
            break
        question = resp.continue_question

    if resp:
        return resp.data
    return None
