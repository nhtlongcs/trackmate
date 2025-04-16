try:
    import pretty_errors  # noqa
except ImportError:
    pass

SQL_USER_SCHEMA = """
CREATE TABLE IF NOT EXISTS user (
    username TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    note TEXT,
)
"""
SQL_FUND_SCHEMA = """
CREATE TABLE IF NOT EXISTS fund (
    id INTEGER PRIMARY KEY,
    fund_name TEXT NOT NULL UNIQUE,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    by TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY(by) REFERENCES user(username)
)
"""
SQL_CATEGORY_SCHEMA = """
CREATE TABLE IF NOT EXISTS category (
    id INTEGER PRIMARY KEY,
    category_name TEXT NOT NULL UNIQUE,
    fund_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    by TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY(fund_id) REFERENCES fund(id),
    FOREIGN KEY(by) REFERENCES user(username)
)
"""

SQL_TRANSACTION_SCHEMA = """
CREATE TABLE IF NOT EXISTS transaction (
    id INTEGER PRIMARY KEY,
    datetime TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    fund_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    by TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY(fund_id) REFERENCES fund(id),
    FOREIGN KEY(category_id) REFERENCES category(id),
    FOREIGN KEY(by) REFERENCES user(username)
)
"""

from typing import Optional
from pydantic import BaseModel, Field, constr, field_validator


class User(BaseModel):
    username: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Unique username, primary key"
    )
    name: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Full name"
    )
    note: Optional[str] = Field(None, description="Optional note about user")


class Fund(BaseModel):
    id: int = Field(..., description="Fund ID, primary key")
    name: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Fund name, primary key"
    )
    created_at: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Creation timestamp (ISO format)"
    )
    updated_at: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Update timestamp (ISO format)"
    )
    by: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Username of creator (foreign key)"
    )
    note: Optional[str] = Field(None, description="Optional note about fund")


class Category(BaseModel):
    id: int = Field(..., description="Category ID, primary key")
    name: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Category name, primary key"
    )
    fund_name: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Fund name (foreign key)"
    )
    created_at: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Creation timestamp (ISO format)"
    )
    updated_at: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Update timestamp (ISO format)"
    )
    by: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Username of creator (foreign key)"
    )
    note: Optional[str] = Field(None, description="Optional note about category")


class Transaction(BaseModel):
    id: int = Field(..., description="Transaction ID, primary key")
    datetime: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Timestamp of transaction (ISO format)"
    )
    amount: float = Field(..., gt=0, description="Amount, must be positive")
    currency: constr(strip_whitespace=True, min_length=1, max_length=8) = Field(
        ..., description="Currency code"
    )
    fund_name: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Fund name (foreign key)"
    )
    category_name: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Category name (foreign key)"
    )
    note: Optional[str] = Field(None, description="Optional note about transaction")
    created_at: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Creation timestamp (ISO format)"
    )
    updated_at: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Update timestamp (ISO format)"
    )
    by: constr(strip_whitespace=True, min_length=1) = Field(
        ..., description="Username of creator (foreign key)"
    )

    @field_validator("amount")
    def amount_positive(cls, v):
        if v <= 0:
            raise ValueError("Amount must be positive")
        return v


def test():
    test_user = User(id=1, username="test", name="Test User", note="This is a test user")
    test_fund = Fund(
        id=1,
        name="Test Fund",
        created_at="2023-01-01T00:00:00",
        updated_at="2023-01-01T00:00:00",
        by="test",
        note="This is a test fund",
    )
    test_category = Category(
        id=1,
        name="Test Category",
        fund_name="Test Fund",
        created_at="2023-01-01T00:00:00",
        updated_at="2023-01-01T00:00:00",
        by="test",
        note="This is a test category",
    )
    test_transaction = Transaction(
        id=1,
        datetime="2023-01-01T00:00:00",
        amount=100.0,
        currency="VND",
        fund_name="Test Fund",
        category_name="Test Category",
        note="This is a test transaction",
        created_at="2023-01-01T00:00:00",
        updated_at="2023-01-01T00:00:00",
        by="test",
    )


if __name__ == "__main__":
    test()
