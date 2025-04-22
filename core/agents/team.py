from agno.team import Team
from agno.agent import Agent
from agno.models.google import Gemini
from agno.memory.v2.memory import Memory
from agno.tools.duckdb import DuckDbTools

from schema import (
    SQL_CATEGORY_SCHEMA, 
    SQL_FUND_SCHEMA, 
    SQL_TRANSACTION_SCHEMA,
)

from config.settings import settings
from datetime import date
from textwrap import dedent

FoundationModel = Gemini(id="gemini-2.0-flash-exp",api_key=settings.GEMINI_API_KEY)
# ReasoningModel = Gemini(id="gemini-2.0-flash-exp")

class Trackmate:
    def __init__(self, username: str, db_path: str):
        self.username = username
        self.__db_path = db_path
        duckdb_tool = DuckDbTools(db_path=db_path)
        category_table = duckdb_tool.run_query("SELECT category.id AS category_id, category.category_name, fund.id AS fund_id, fund.fund_name, FROM fund JOIN category ON fund.id = category.fund_id")
        self.__ExpenseTeam = Team(
            name="Expense Team",
            model=FoundationModel,
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

            my username = {self.username}
            """,
            tools=[],
            members=[
                Agent(
                    name="Think",
                    model=FoundationModel,
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
                    model=FoundationModel,
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

    def pretty_chat(self, user_message: str, debug: bool = False) -> str:
        return self.__ExpenseTeam.print_response(
            user_message, stream_intermediate_steps=debug, show_full_reasoning=debug
        )


def test():
    from db_utils import init_test_db
    init_test_db("./trackmate.duckdb")
    trackmate = Trackmate(username="tester", db_path="./trackmate.duckdb")
    while True:
        user_message = input("User: ")
        trackmate.pretty_chat(user_message, debug=True)


if __name__ == "__main__":
    test()
