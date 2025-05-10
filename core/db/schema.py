from typing import Annotated, Optional

from pydantic import BaseModel, Field, StringConstraints

SQL_USER_SCHEMA = """
CREATE TABLE IF NOT EXISTS user (
    id INTEGER PRIMARY KEY,
    name TEXT NOT NULL,
    note TEXT,
)
"""
SQL_FUND_SCHEMA = """
CREATE TABLE IF NOT EXISTS fund (
    id INTEGER PRIMARY KEY,
    fund_name TEXT NOT NULL UNIQUE,
    created_at TEXT,
    updated_at TEXT,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    note TEXT,
)
"""
SQL_CATEGORY_SCHEMA = """
CREATE TABLE IF NOT EXISTS category (
    id INTEGER PRIMARY KEY,
    category_name TEXT NOT NULL UNIQUE,
    fund_id INTEGER NOT NULL,
    created_at TEXT,
    updated_at TEXT,
    note TEXT,
    FOREIGN KEY(fund_id) REFERENCES fund(id),
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
    created_at TEXT,
    updated_at TEXT,
    by INTEGER NOT NULL,
    note TEXT,
    FOREIGN KEY(fund_id) REFERENCES fund(id),
    FOREIGN KEY(category_id) REFERENCES category(id),
    FOREIGN KEY(by) REFERENCES user(id)
)
"""


class User(BaseModel):
    username: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Unique username, primary key")
    name: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Full name")
    note: Optional[str] = Field(None, description="Optional note about user")


class Fund(BaseModel):
    id: int = Field(description="Fund ID, primary key")
    name: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Fund name, primary key")
    created_at: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Creation timestamp (ISO format)")
    updated_at: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Update timestamp (ISO format)")
    by: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Username of creator (foreign key)")
    note: Optional[str] = Field(None, description="Optional note about fund")


class Category(BaseModel):
    id: int = Field(description="Category ID, primary key")
    name: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Category name, primary key")
    fund_name: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Fund name (foreign key)")
    created_at: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Creation timestamp (ISO format)")
    updated_at: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Update timestamp (ISO format)")
    by: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Username of creator (foreign key)")
    note: Optional[str] = Field(None, description="Optional note about category")


class Transaction(BaseModel):
    id: int = Field(description="Transaction ID, primary key")
    datetime: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Timestamp of transaction (ISO format)")
    amount: float = Field(gt=0, description="Amount, must be positive")
    currency: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
            max_length=8,
        ),
    ] = Field(description="Currency code")
    fund_name: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Fund name (foreign key)")
    category_name: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Category name (foreign key)")
    note: Optional[str] = Field(None, description="Optional note about transaction")
    created_at: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Creation timestamp (ISO format)")
    updated_at: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Update timestamp (ISO format)")
    by: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Username of creator (foreign key)")
