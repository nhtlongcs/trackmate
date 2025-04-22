from pathlib import Path

from agents.expense import create_agent_v2
from config.settings import settings
from db.utils import display_db
from tests.manual.common import init_test_db


def test():
    db_path = Path(settings.DATA_DIR) / "trackmate.duckdb"
    username = "tester"

    agent = create_agent_v2(db_path, username)

    init_test_db(db_path)
    print("Database initialized at", db_path)
    display_db(db_path)

    agent.cli_app(
        exit_on=["bye", "quit", "exit"],
        debug=True,
        stream_intermediate_steps=True,
        show_full_reasoning=True,
    )


if __name__ == "__main__":
    test()
