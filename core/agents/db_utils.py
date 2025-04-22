try:
    import pretty_errors  # noqa
except ImportError:
    pass

import duckdb
from pathlib import Path

from schema import (
    SQL_USER_SCHEMA,
    SQL_FUND_SCHEMA,
    SQL_CATEGORY_SCHEMA,
    SQL_TRANSACTION_SCHEMA,
)


# write safe excute, add created_at, updated_at, by
def safe_execute(conn, command, params=None):
    cursor = conn.cursor()
    try:
        # created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        # updated_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
        # by = "system"
        # TODO: Insert created_at, updated_at, by into command
        cursor.execute(command, params)
        conn.commit()
    except Exception as e:
        raise e


def display_table(db_path, table_name):
    from tabulate import tabulate

    conn = duckdb.connect(str(db_path))
    cursor = conn.cursor()
    headers = cursor.execute(
        f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table_name}'"
    ).fetchall()
    headers = [header[0] for header in headers]
    cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
    print(tabulate(cursor.fetchall(), headers=headers, tablefmt="fancy_grid"))
    conn.close()


def display_db(db_path):
    display_table(db_path, "user")
    display_table(db_path, "fund")
    display_table(db_path, "category")
    display_table(db_path, "transaction")

def init_blank_db(db_path):
    conn = duckdb.connect(str(db_path))
    cursor = conn.cursor()
    # Create database tables
    cursor.execute(SQL_USER_SCHEMA)
    cursor.execute(SQL_FUND_SCHEMA)
    cursor.execute(SQL_CATEGORY_SCHEMA)
    cursor.execute(SQL_TRANSACTION_SCHEMA)
    conn.close()

def init_test_db(db_path):
    import datetime

    conn = duckdb.connect(str(db_path))
    cursor = conn.cursor()

    # Create database tables
    cursor.execute(SQL_USER_SCHEMA)
    cursor.execute(SQL_FUND_SCHEMA)
    cursor.execute(SQL_CATEGORY_SCHEMA)
    cursor.execute(SQL_TRANSACTION_SCHEMA)
    users = [("nhtlong", "Long"), ("vinhloiit", "Vinh Loi"), ("tester", "System")]

    # Insert users
    test_user = "tester"
    created_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    updated_at = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    for username, name in users:
        safe_execute(
            conn,
            "INSERT INTO user (username, name) SELECT ?, ? WHERE NOT EXISTS (SELECT 1 FROM user WHERE username=?)",
            (username, name, username),
        )

    # Insert default funds if not exists
    default_funds = [
        ("Chi tiêu", ["ăn uống", "di chuyển"]),
        ("Tiết kiệm", ["du lịch singapore", "mua nhà", "mua xe"]),
    ]

    # Insert funds
    for fund_id, (fund_name, categories) in enumerate(default_funds):
        safe_execute(
            conn,
            "INSERT INTO fund (id, fund_name, created_at, updated_at, by) SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM fund WHERE fund_name=?)",
            (fund_id, fund_name, created_at, updated_at, test_user, fund_name),
        )
        for category_name in categories:
            category_id = (
                cursor.execute("SELECT COUNT(1) FROM category").fetchone()[0] + 1
            )
            safe_execute(
                conn,
                "INSERT INTO category (id, category_name, fund_id, created_at, updated_at, by) SELECT ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM category WHERE category_name=? AND fund_id=?)",
                (
                    category_id,
                    category_name,
                    fund_id,
                    created_at,
                    updated_at,
                    test_user,
                    category_name,
                    fund_id,
                ),
            )

    # Insert default transactions
    default_transactions = [
        (
            "2025-04-16 13:05:43",
            100000.0,
            "VND",
            1,
            1,
            "Lunch",
            created_at,
            updated_at,
            test_user,
        ),
    ]
    for transaction in default_transactions:
        transaction_id = (
            cursor.execute("SELECT COUNT(1) FROM transaction").fetchone()[0] + 1
        )
        safe_execute(
            conn,
            "INSERT INTO transaction (id, datetime, amount, currency, fund_id, category_id, note, created_at, updated_at, by) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM transaction WHERE id=?)",
            (transaction_id,) + transaction + (transaction_id,),
        )
    conn.close()

def test():
    __DB_PATH = Path(__file__).parent / "trackmate.duckdb"
    init_test_db(__DB_PATH)
    print("Database initialized at", __DB_PATH)
    display_db(__DB_PATH)

if __name__ == "__main__":
    test()