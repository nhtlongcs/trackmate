import json
from pathlib import Path

import duckdb
import pandas as pd
from agno.tools.googlesheets import GoogleSheetsTools
from tabulate import tabulate

from config.logger import logger
from config.settings import settings
from db.schema import (
    SQL_CATEGORY_SCHEMA,
    SQL_TRANSACTION_SCHEMA,
    SQL_USER_SCHEMA,
    SQL_WALLET_SCHEMA,
)


# write safe excute, add created_at, updated_at, by
def safe_execute(conn: duckdb.DuckDBPyConnection, command: str, params=None):
    cursor = conn.cursor()
    try:
        # created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        # updated_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        # by = "system"
        # TODO: Insert created_at, updated_at, by into command
        cursor.execute(command, params)
        conn.commit()
    except Exception as e:
        conn.rollback()
        raise e


def display_table(db_path, table_name):
    conn = duckdb.connect(str(db_path))
    cursor = conn.cursor()
    headers = cursor.execute(
        f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table_name}'"
    ).fetchall()
    headers = [header[0] for header in headers]
    cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
    print(tabulate(cursor.fetchall(), headers=headers, tablefmt="fancy_grid"))
    conn.close()


def display_table_conn(conn: duckdb.DuckDBPyConnection, table_name):
    data = conn.sql(f"SELECT * FROM {table_name} LIMIT 3")
    print(data)


def display_db(db_path):
    display_table(db_path, "user")
    display_table(db_path, "wallet")
    display_table(db_path, "category")
    display_table(db_path, "transaction")


def init_blank_db(db_path):
    conn = duckdb.connect(str(db_path))
    cursor = conn.cursor()
    # Create database tables
    cursor.execute(SQL_USER_SCHEMA)
    cursor.execute(SQL_WALLET_SCHEMA)
    cursor.execute(SQL_CATEGORY_SCHEMA)
    cursor.execute(SQL_TRANSACTION_SCHEMA)
    conn.close()


def _create_db_from_sheet(
    conn: duckdb.DuckDBPyConnection,
    data: dict[str, pd.DataFrame],
):
    # remove all tables
    conn.execute("DROP TABLE IF EXISTS transaction")
    conn.execute("DROP TABLE IF EXISTS category")
    conn.execute("DROP TABLE IF EXISTS wallet")
    conn.execute("DROP TABLE IF EXISTS user")
    # Create database tables
    conn.execute(SQL_USER_SCHEMA)
    conn.execute(SQL_WALLET_SCHEMA)
    conn.execute(SQL_CATEGORY_SCHEMA)
    conn.execute(SQL_TRANSACTION_SCHEMA)
    # Insert data into tables
    conn.register("v_expenses", data["expenses_df"])
    conn.register("v_users", data["users_df"])
    conn.register("v_wallets", data["wallets_df"])
    conn.register("v_categories", data["categories_df"])
    conn.sql(
        """
        INSERT INTO user (username, name, note)
        SELECT username, name, note FROM v_users
        """
    )
    conn.sql(
        """
        INSERT INTO wallet (id, wallet_name, created_at, updated_at, by, note)
        SELECT id, wallet_name, created_at, updated_at, by, note FROM v_wallets
        """
    )
    conn.sql(
        """
        INSERT INTO category (id, category_name, wallet_id, created_at, updated_at, by, note)
        SELECT id, category_name, wallet_id, created_at, updated_at, by, note FROM v_categories
        """
    )
    conn.sql(
        """
        INSERT INTO transaction (
            id,
            datetime,
            amount,
            currency,
            vnd_rate,
            wallet_id,
            category_id,
            created_at,
            updated_at,
            by,
            note
        )
        SELECT
            id,
            datetime,
            amount,
            currency,
            vnd_rate,
            wallet_id,
            category_id,
            created_at,
            updated_at,
            by,
            note
        FROM v_expenses
        """
    )
    display_table_conn(conn, "user")
    display_table_conn(conn, "wallet")
    display_table_conn(conn, "category")
    display_table_conn(conn, "transaction")

    # Unregister as we store all data into local tables
    conn.unregister("v_expenses")
    conn.unregister("v_users")
    conn.unregister("v_wallets")
    conn.unregister("v_categories")

    conn.commit()


def read_google_sheet_table(
    tool: GoogleSheetsTools,
    spreadsheet_id: str,
    spreadsheet_range: str,
) -> pd.DataFrame:
    table_str = tool.read_sheet(
        spreadsheet_id=spreadsheet_id,
        spreadsheet_range=spreadsheet_range,
    )
    table = json.loads(table_str)
    df = pd.DataFrame(table[1:], columns=table[0])
    return df


def sync_google_sheet_data(conn: duckdb.DuckDBPyConnection, spreadsheet_id: str):
    # TODO: temporally hardcode due to specific post-processing
    ranges: dict[str, str] = {
        "expenses": "Expenses!A:Z",
        "wallets": "Wallets!A:Z",
        "users": "Users!A:Z",
        "categories": "Categories!A:Z",
    }
    googlesheet_tool = GoogleSheetsTools(
        creds_path=settings.GOOGLE_APPLICATION_CREDENTIALS,
        token_path=Path(settings.CACHE_DIR) / "token.json",
        update=True,
    )
    logger.info("Loading data from Google Sheets...")
    expenses_df = read_google_sheet_table(
        googlesheet_tool, spreadsheet_id, ranges["expenses"]
    )
    wallets_df = read_google_sheet_table(
        googlesheet_tool, spreadsheet_id, ranges["wallets"]
    )
    users_df = read_google_sheet_table(
        googlesheet_tool, spreadsheet_id, ranges["users"]
    )
    categories_df = read_google_sheet_table(
        googlesheet_tool, spreadsheet_id, ranges["categories"]
    )
    data = {
        "expenses_df": expenses_df,
        "wallets_df": wallets_df,
        "users_df": users_df,
        "categories_df": categories_df,
    }
    _create_db_from_sheet(conn, data)
