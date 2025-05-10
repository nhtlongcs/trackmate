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

    SAMPLE_SPREADSHEET_ID = "1XFsUe0t2K9MG6hlvPMAAoHPNST0AMaTghINYLgqYzbQ"
    SAMPLE_RANGE_NAME = "Expenses!A:I"
    # persistent user's preference, e.g., config, while chatting
    memory_db = SqliteMemoryDb(table_name="memory", db_file="./data/memory.db")
    memory = Memory(db=memory_db)
    
    # import pdb; pdb.set_trace()
    agent = Agent(
        user_id=user,
        session_id=session,
        model=Gemini(id="gemini-2.0-flash-exp", api_key=settings.GEMINI_API_KEY),
        tools=[
            GoogleSheetsTools(
                creds_path=settings.GOOGLE_APPLICATION_CREDENTIALS,
                token_path=Path(settings.CACHE_DIR) / "token.json",
                spreadsheet_id=SAMPLE_SPREADSHEET_ID,
                spreadsheet_range=SAMPLE_RANGE_NAME,
                update=True,
            )

        ],
        # spreadsheet_id='1XFsUe0t2K9MG6hlvPMAAoHPNST0AMaTghINYLgqYzbQ',
        instructions=[
            "You help users interact with Google Sheets using tools that use the Google Sheets API",
            "Before asking for spreadsheet details, first attempt the operation as the user may have already configured the ID and range in the constructor",
        ],
        storage=storage,
        memory=memory,
        add_memory_references=True,
        enable_user_memories=True,
        add_history_to_messages=True,
        num_history_runs=5,

    )
    return agent


def create_agent_v5(user: str | None = None, session: str | None = None):
    from agno.team import Team
    from agno.tools.duckdb import DuckDbTools
    from datetime import date, datetime
    from textwrap import dedent
    import json 
    import pandas as pd
    import rich

    # persistent user's preference, e.g., config, while chatting
    memory_db = SqliteMemoryDb(table_name="memory", db_file="./data/memory.db")
    memory = Memory(db=memory_db)

    duckdb_tool = DuckDbTools(db_path=f"./data/{user}_expenses.db")

    SPREADSHEET_ID = "1XFsUe0t2K9MG6hlvPMAAoHPNST0AMaTghINYLgqYzbQ"
    EXPENSES_RANGE_NAME = "Expenses!A:Z"
    FUND_RANGE_NAME = "Funds!A:Z"
    USER_RANGE = "Users!A:Z"
    CATEGORIES_RANGE = "Categories!A:Z"
    googlesheet_tool = GoogleSheetsTools(
                creds_path=settings.GOOGLE_APPLICATION_CREDENTIALS,
                token_path=Path(settings.CACHE_DIR) / "token.json",
                update=True,
    )
    print("Loading data from Google Sheets...")
    expenses_table = googlesheet_tool.read_sheet(
        spreadsheet_id=SPREADSHEET_ID,
        spreadsheet_range=EXPENSES_RANGE_NAME
    )
    expenses_table = json.loads(expenses_table)
    expenses_table = pd.DataFrame(expenses_table[1:], columns=expenses_table[0])
    expenses_table = expenses_table.rename(columns={"ExpenseID": "id", 
                                                    "Date": "datetime", 
                                                    "Amount": "amount", 
                                                    "Currency": "currency", 
                                                    "FundID": "fund_id", 
                                                    "CategoryID": "category_id", 
                                                    "UserID": "by", 
                                                    "Notes": "note"})
    fund_table = googlesheet_tool.read_sheet(
        spreadsheet_id=SPREADSHEET_ID,
        spreadsheet_range=FUND_RANGE_NAME
    )
    fund_table = json.loads(fund_table)
    for i in range(1, len(fund_table)):
        assert len(fund_table[0]) >= len(fund_table[i]), f"Row {i} has more columns than header"
        fund_table[i] = fund_table[i] + [None] * (len(fund_table[0]) - len(fund_table[i]))
    fund_table = pd.DataFrame(fund_table[1:], columns=fund_table[0])
    fund_table = fund_table.rename(columns={"FundID": "id", 
                                            "Fund": "fund_name", 
                                            "Amount": "amount", 
                                            "Currency": "currency",
                                            "Description": "note"})
    
    user_table = googlesheet_tool.read_sheet(
        spreadsheet_id=SPREADSHEET_ID,
        spreadsheet_range=USER_RANGE
    )
    user_table = json.loads(user_table)
    user_table = pd.DataFrame(user_table[1:], 
    columns=user_table[0])
    user_table = user_table.rename(columns={"UserID": "id", 
                                            "Name": "name"})

    category_table = googlesheet_tool.read_sheet(
        spreadsheet_id=SPREADSHEET_ID,
        spreadsheet_range=CATEGORIES_RANGE
    )

    category_table = json.loads(category_table)
    category_table = pd.DataFrame(category_table[1:], columns=category_table[0])
    category_table = category_table.rename(columns={"CategoryID": "id", 
                                                    "CategoryName": "category_name", 
                                                    "FundID": "fund_id",
                                                    "Description": "note"})
    def create_db_from_sheet():
        import duckdb
        from db.utils import display_table_conn
        from db.schema import (
            SQL_CATEGORY_SCHEMA,
            SQL_FUND_SCHEMA,
            SQL_TRANSACTION_SCHEMA,
            SQL_USER_SCHEMA,
        )
        conn = duckdb.connect(f"./data/{user}_expenses.db")
        # remove all tables
        conn.execute("DROP TABLE IF EXISTS transaction")
        conn.execute("DROP TABLE IF EXISTS category")
        conn.execute("DROP TABLE IF EXISTS fund")
        conn.execute("DROP TABLE IF EXISTS user")
        # Create tables
        cursor = conn.cursor()
        # Create database tables
        cursor.execute(SQL_USER_SCHEMA)
        cursor.execute(SQL_FUND_SCHEMA)
        cursor.execute(SQL_CATEGORY_SCHEMA)
        cursor.execute(SQL_TRANSACTION_SCHEMA)
        # Insert data into tables
        for i, row in user_table.iterrows():
            cursor.execute(
                f"INSERT INTO user (id, name) VALUES (?, ?)",
                (
                    row["id"],
                    row["name"],
                )
            )
        for i, row in fund_table.iterrows():
            cursor.execute(
                f"INSERT INTO fund (id, fund_name, amount, currency, note) VALUES (?, ?, ?, ?, ?)",
                (
                    row["id"],
                    row["fund_name"],
                    row["amount"],
                    row["currency"],
                    row["note"],
                )
            )
        for i, row in category_table.iterrows():
            cursor.execute(
                f"INSERT INTO category (id, category_name, fund_id, note) VALUES (?, ?, ?, ?)",
                (
                    row["id"],
                    row["category_name"],
                    row["fund_id"],
                    row["note"],
                )
            )
        for i, row in expenses_table.iterrows():
            cursor.execute(
                f"INSERT INTO transaction (id, datetime, amount, currency, fund_id, category_id, created_at, updated_at, by, note) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)",
                (
                    row["id"],
                    row["datetime"],
                    row["amount"],
                    row["currency"],
                    row["fund_id"],
                    row["category_id"],
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
                    row['by'],
                    row["note"],
                )
            )
        display_table_conn(conn, "user")
        display_table_conn(conn, "fund")
        display_table_conn(conn, "category")
        display_table_conn(conn, "transaction")
        conn.commit()
        conn.close()

    create_db_from_sheet()


    # import pdb; pdb.set_trace()
    username = "1"
    return Team(
        name="Minimal Expense Planner",
        model=Gemini(id="gemini-2.0-flash-exp", api_key=settings.GEMINI_API_KEY),
        memory=Memory(),
        description=f"""
        Hệ thống gồm 2 tác nhân: Planner và Executor.
        - Planner hiểu và lên kế hoạch xử lý yêu cầu liên quan đến chi tiêu.
        - Executor thực thi kế hoạch đó bằng SQL trên DuckDB.
        Ngày hôm nay: {date.today()}
        Người dùng: {username}
        """,
        members=[
            Agent(
                name="Planner",
                model=Gemini(id="gemini-2.0-flash-exp", api_key=settings.GEMINI_API_KEY),
                reasoning=True,
                tools=[],
                description="Hiểu yêu cầu người dùng, lấy thông tin cần thiết, và tạo kế hoạch SQL phù hợp.",
                instructions=dedent("""
                    Phân tích yêu cầu chi tiêu (ví dụ: số tiền, loại chi tiêu, ngày, quỹ).
                    Nếu thiếu thông tin → hỏi người dùng.

                    Sau khi đủ:
                    - Tạo SQL (INSERT/SELECT/UPDATE) phù hợp
                    - Truyền câu SQL đó cho Executor
                    - Giải thích ý định để Executor rõ hành động
                    Bắt buộc phải gọi Executor để thực thi SQL.
                """),
            ),
            Agent(
                name="Executor",
                model=Gemini(id="gemini-2.0-flash-exp", api_key=settings.GEMINI_API_KEY),
                tools=[duckdb_tool],
                description="Thực thi câu SQL mà Planner yêu cầu và phản hồi kết quả.",
                instructions=dedent("""
                    Bạn nhận yêu cầu từ Planner dưới dạng SQL và mục đích.
                    - Nếu là SELECT → hiển thị bảng kết quả đẹp
                    - Nếu là INSERT/UPDATE/DELETE → xác nhận đã thực hiện, ghi rõ ảnh hưởng

                    Không tự tạo kế hoạch hay SQL – chỉ thực hiện đúng yêu cầu từ Planner.
                """),
            ),
        ],
        enable_agentic_context=True,
        share_member_interactions=True,
        show_members_responses=True,
        enable_user_memories=True,
        enable_team_history=True,
        markdown=True,
        reasoning=True,
        add_datetime_to_instructions=True,
    )
