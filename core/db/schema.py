from typing import Annotated, Optional

from pydantic import BaseModel, Field, StringConstraints

SQL_USER_SCHEMA = """
CREATE TABLE IF NOT EXISTS user (
    username TEXT PRIMARY KEY,
    name TEXT NOT NULL,
    note TEXT,
)
"""
SQL_WALLET_SCHEMA = """
CREATE TABLE IF NOT EXISTS wallet (
    id INTEGER PRIMARY KEY,
    wallet_name TEXT NOT NULL UNIQUE,
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
    wallet_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    by TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY(wallet_id) REFERENCES wallet(id),
    FOREIGN KEY(by) REFERENCES user(username)
)
"""

SQL_TRANSACTION_SCHEMA = """
CREATE TABLE IF NOT EXISTS transaction (
    id INTEGER PRIMARY KEY,
    datetime TEXT NOT NULL,
    amount REAL NOT NULL,
    currency TEXT NOT NULL,
    vnd_rate REAL NOT NULL DEFAULT 1.0,
    wallet_id INTEGER NOT NULL,
    category_id INTEGER NOT NULL,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    by TEXT NOT NULL,
    note TEXT,
    FOREIGN KEY(wallet_id) REFERENCES wallet(id),
    FOREIGN KEY(category_id) REFERENCES category(id),
    FOREIGN KEY(by) REFERENCES user(username)
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


class Wallet(BaseModel):
    id: int = Field(description="Wallet ID, primary key")
    name: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Wallet name, primary key")
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
    note: Optional[str] = Field(None, description="Optional note about wallet")


class Category(BaseModel):
    id: int = Field(description="Category ID, primary key")
    name: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Category name, primary key")
    wallet_name: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Wallet name (foreign key)")
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
    wallet_name: Annotated[
        str,
        StringConstraints(
            strip_whitespace=True,
            min_length=1,
        ),
    ] = Field(description="Wallet name (foreign key)")
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
