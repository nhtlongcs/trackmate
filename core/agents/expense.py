from datetime import date, datetime
from textwrap import dedent

from agno.agent import Agent
from agno.memory.v2.memory import Memory
from agno.models.google import Gemini
from agno.team import Team
from agno.tools.duckdb import DuckDbTools
from pydantic import BaseModel
from rich.prompt import Prompt

from config.settings import settings
from db.schema import (
    SQL_CATEGORY_SCHEMA,
    SQL_FUND_SCHEMA,
    SQL_TRANSACTION_SCHEMA,
)


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


def create_agent_v2(db_path: str, username: str):
    duckdb_tool = DuckDbTools(db_path=db_path)
    category_table = duckdb_tool.run_query(
        """
        SELECT
            category.id AS category_id,
            category.category_name,
            fund.id AS fund_id,
            fund.fund_name
        FROM
            fund
            LEFT OUTER JOIN category ON (fund.id = category.fund_id)
        """
    )
    team = Team(
        name="Expense Team",
        model=Gemini(
            id="gemini-2.0-flash-exp",
            api_key=settings.GEMINI_API_KEY,
        ),
        memory=Memory(),
        description=f"""
        A team to clarify user spending messages, generate and execute SQL queries on expense data. 

        Given the following duckdb table of records, your job is to
        write a SQL query / or response that suits the user's request.

        You can create query on database using Executor if needed.
        
        Database schema:

        {SQL_FUND_SCHEMA}
        {SQL_CATEGORY_SCHEMA}
        {SQL_TRANSACTION_SCHEMA}
        
        Created Categories/Funds
        {category_table}

        today's date = {date.today()}

        my username = {username}
        """,
        tools=[],
        members=[
            Agent(
                name="Think",
                model=Gemini(
                    id="gemini-2.0-flash-exp",
                    api_key=settings.GEMINI_API_KEY,
                ),
                description="Understand user input, thinking, clarify vague requests, give assumptions",
                instructions=dedent("""
                    Your job is to interpret user messages related to expenses. Handle:
                    - References like 'bữa trưa hôm trước' → find matching recent transactions.
                    - Non-existent categories → suggest alternatives or ask to create new ones.
                    - If assumptions are made, ask user: 'Bạn có muốn mình hiểu là ...?'

                    Make some assumption on common question. Dont need to clarify if that is simple.
                    Output next steps I need to do to complete user input, suitable for converting to SQL. Output an question if you need to verify anything. 
                """),
                reasoning=True,
            ),
            Agent(
                name="Executor",
                model=Gemini(
                    id="gemini-2.0-flash-exp",
                    api_key=settings.GEMINI_API_KEY,
                ),
                description="Run the SQL using DuckDB and return clean results or confirmation.",
                tools=[duckdb_tool],
                instructions=dedent("""
                    You receive SQL queries to run on the database via DuckDB.
                    - If it's a SELECT query, format the output in a readable table.
                    - If it's an INSERT or UPDATE, confirm execution and describe what changed.
                """),
            ),
        ],
        add_datetime_to_instructions=True,
        enable_agentic_context=True,  # Allow the agent to maintain a shared context and send that to members.
        share_member_interactions=True,  # Share all member responses with subsequent member requests.
        show_members_responses=True,
        enable_user_memories=True,
        enable_team_history=True,
        markdown=True,
    )

    return team


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
