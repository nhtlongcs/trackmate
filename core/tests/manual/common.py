import datetime

import duckdb

from db.utils import init_blank_db, safe_execute


def init_test_db(db_path):
    conn = duckdb.connect(str(db_path))
    cursor = conn.cursor()

    # Create database tables
    init_blank_db(db_path)

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

    # Insert default wallets if not exists
    default_wallets = [
        ("Chi tiêu", ["ăn uống", "di chuyển"]),
        ("Tiết kiệm", ["du lịch singapore", "mua nhà", "mua xe"]),
    ]

    # Insert wallets
    for wallet_id, (wallet_name, categories) in enumerate(default_wallets):
        safe_execute(
            conn,
            "INSERT INTO wallet (id, wallet_name, created_at, updated_at, by) SELECT ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM wallet WHERE wallet_name=?)",
            (wallet_id, wallet_name, created_at, updated_at, test_user, wallet_name),
        )
        for category_name in categories:
            category_id = (
                cursor.execute("SELECT COUNT(1) FROM category").fetchone()[0] + 1
            )
            safe_execute(
                conn,
                "INSERT INTO category (id, category_name, wallet_id, created_at, updated_at, by) SELECT ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM category WHERE category_name=? AND wallet_id=?)",
                (
                    category_id,
                    category_name,
                    wallet_id,
                    created_at,
                    updated_at,
                    test_user,
                    category_name,
                    wallet_id,
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
            "INSERT INTO transaction (id, datetime, amount, currency, wallet_id, category_id, note, created_at, updated_at, by) SELECT ?, ?, ?, ?, ?, ?, ?, ?, ?, ? WHERE NOT EXISTS (SELECT 1 FROM transaction WHERE id=?)",
            (transaction_id,) + transaction + (transaction_id,),
        )
    conn.close()
