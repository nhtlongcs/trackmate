import pytest
import json
import duckdb
from agents.tools import DataRetrievalTools


@pytest.fixture
def category_tbl():
    conn = duckdb.connect(":memory:")
    conn.execute(
        """
        CREATE TABLE IF NOT EXISTS category (
            id INTEGER PRIMARY KEY,
            category_name TEXT NOT NULL UNIQUE
        )
        """
    )
    conn.execute(
        """
        INSERT INTO category(id, category_name)
        VALUES
            (1, 'Dining'),
            (2, 'Shopping'),
            (3, 'Food')
        """
    )
    yield conn
    conn.close()


@pytest.mark.parametrize(
    "name,id",
    [
        ("Dining", 1),
        ("dining", 1),
        ("dine", -1),
    ],
)
def test_data_retrieval_toolkit_category_name(category_tbl, name, id):
    tool = DataRetrievalTools(category_tbl)
    data = json.loads(tool.find_category_id_by_name(name))
    if id == -1:
        assert len(data) == 0
    else:
        assert len(data) == 1
        assert data[0]["id"] == id
