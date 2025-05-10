import duckdb
from tabulate import tabulate

from db.schema import (
    SQL_CATEGORY_SCHEMA,
    SQL_FUND_SCHEMA,
    SQL_TRANSACTION_SCHEMA,
    SQL_USER_SCHEMA,
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



def display_table_conn(conn, table_name):
    cursor = conn.cursor()
    headers = cursor.execute(
        f"SELECT COLUMN_NAME FROM INFORMATION_SCHEMA.COLUMNS WHERE TABLE_NAME = '{table_name}'"
    ).fetchall()
    headers = [header[0] for header in headers]
    cursor.execute(f"SELECT * FROM {table_name} LIMIT 3")
    print(tabulate(cursor.fetchall(), headers=headers, tablefmt="fancy_grid"))

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
