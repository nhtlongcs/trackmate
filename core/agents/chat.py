from pathlib import Path

from agno.agent import Agent
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory
from agno.models.google import Gemini
from agno.storage.sqlite import SqliteStorage
from agno.tools.googlesheets import GoogleSheetsTools

from config.settings import settings


def create_agent(user: str | None = None, session: str | None = None):
    # persistent chat sessions
    storage = SqliteStorage(table_name="agent_sessions", db_file="./data/memory.db")

    # persistent user's preference, e.g., config, while chatting
    memory_db = SqliteMemoryDb(table_name="memory", db_file="./data/memory.db")
    memory = Memory(db=memory_db)

    agent = Agent(
        user_id=user,
        session_id=session,
        model=Gemini(id="gemini-2.0-flash", api_key=settings.GEMINI_API_KEY),
        tools=[
            GoogleSheetsTools(
                creds_path=settings.GOOGLE_APPLICATION_CREDENTIALS,
                token_path=Path(settings.CACHE_DIR) / "token.json",
            )
        ],
        instructions=[
            "You help users interact with Google Sheets using tools that use the Google Sheets API",
            "Before asking for spreadsheet details, first attempt the operation as the user may have already configured the ID and range in the constructor",
        ],
        storage=storage,
        memory=memory,
        add_memory_references=True,
        enable_user_memories=True,
    )
    return agent
