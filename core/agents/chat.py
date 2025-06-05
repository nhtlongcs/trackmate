from pathlib import Path
from textwrap import dedent

from agno.agent import Agent
from agno.memory.v2.db.sqlite import SqliteMemoryDb
from agno.memory.v2.memory import Memory
from agno.models.google import Gemini
from agno.storage.sqlite import SqliteStorage
from agno.tools.duckdb import DuckDbTools
from agno.tools.googlesheets import GoogleSheetsTools
from agno.tools.reasoning import ReasoningTools

from config.logger import logger
from config.settings import settings
from db.utils import sync_google_sheet_data

from .tools import DataRetrievalTools


def create_agent(
    user: str | None = None,
    session: str | None = None,
    debug: bool = False,
):
    # persistent chat sessions
    storage = SqliteStorage(table_name="agent_sessions", db_file="./data/memory.db")

    # persistent user's preference, e.g., config, while chatting
    memory_db = SqliteMemoryDb(table_name="memory", db_file="./data/memory.db")
    memory = Memory(db=memory_db)

    agent = Agent(
        user_id=user,
        session_id=session,
        debug_mode=debug,
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


def create_agent_v2(
    user: str | None = None,
    session: str | None = None,
    debug: bool = False,
):
    # persistent user's preference, e.g., config, while chatting
    memory_db = SqliteMemoryDb(table_name="memory", db_file="./data/memory.db")
    memory = Memory(db=memory_db)

    duckdb_tool = DuckDbTools(db_path=f"./data/{user}_expenses.db")
    logger.info("Syncing data from spreadsheet to local before processing")
    sync_google_sheet_data(
        duckdb_tool.connection,
        spreadsheet_id="1JfOz-mr299P9-TPKuazX6ApOa8fIlP3OQcmzsbFcFMQ",
    )

    db_context: str = dedent(
        f"""
        Đây là các table được định nghĩa trong hệ thống. Chỉ sử dụng những table sau:

        {duckdb_tool.describe_table("transaction")}
        {duckdb_tool.describe_table("category")}
        {duckdb_tool.describe_table("wallet")}
        {duckdb_tool.describe_table("user")}
        """
    )
    context = {
        "username": user,
        "db": db_context,
    }

    return Agent(
        name="Expense Agency",
        model=Gemini(id="gemini-2.0-flash-exp", api_key=settings.GEMINI_API_KEY),
        memory=memory,
        tools=[
            duckdb_tool,
            DataRetrievalTools(duckdb_tool.connection),
            ReasoningTools(
                think=True,
                analyze=True,
                add_instructions=False,
            ),
        ],
        debug_mode=debug,
        description="Hiểu yêu cầu người dùng, lấy thông tin cần thiết, thực thi SQL phù hợp.",
        instructions=dedent(
            """
            Phân tích yêu cầu chi tiêu (ví dụ: số tiền, loại chi tiêu, ngày, quỹ).
            Nếu thiếu thông tin → hỏi người dùng.

            Sau khi đủ:
            1. Tạo SQL (INSERT/SELECT/UPDATE) phù hợp
            2. Giải thích hành động của câu SQL
            3. Thực hiện câu lệnh SQL
            """
            # - Truyền câu SQL đó cho Executor
            # - Giải thích ý định để Executor rõ hành động
            # Lưu ý:
            # - Nếu là SELECT → hiển thị bảng kết quả đẹp
            # - Nếu là INSERT/UPDATE/DELETE → xác nhận đã thực hiện, ghi rõ ảnh hưởng
        ),
        stream_intermediate_steps=True,
        add_datetime_to_instructions=True,
        add_history_to_messages=True,
        add_context=True,
        context=context,
    )
