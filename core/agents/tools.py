import json

import duckdb
from agno.tools.toolkit import Toolkit

from db.utils import push_google_sheet_data


class DataRetrievalTools(Toolkit):
    def __init__(self, conn: duckdb.DuckDBPyConnection, **kwargs):
        self._conn = conn
        super().__init__(name="data_retrieval_tool", **kwargs)
        self.register(self.find_category_id_by_name)
        self.register(self.find_wallet_id_by_name)
        self.register(self.find_default_wallet)
        self.register(self.find_default_category)
        self.register(self.push_google_sheet_data)

    def find_category_id_by_name(self, category_name: str) -> str:
        """Use this tool to find category's id given a category name

        Args:
            category_name: category name to find the id

        Returns:
            a list of best match category ids
        """
        df = self._conn.execute(
            "SELECT * FROM category c WHERE LOWER(c.category_name) = LOWER(?)",
            [category_name],
        ).df()
        return df.to_json(
            orient="records",
            force_ascii=False,
        )

    def find_wallet_id_by_name(self, wallet_name: str) -> str:
        """Use this tool to find wallet's id given a wallet name

        Args:
            wallet_name: wallet name to find the id

        Returns:
            a list of best match wallet ids
        """
        df = self._conn.execute(
            "SELECT * FROM wallet f WHERE LOWER(f.wallet_name) = LOWER(?)",
            [wallet_name],
        ).df()
        return df.to_json(
            orient="records",
            force_ascii=False,
        )

    def find_default_wallet(self) -> str:
        """Use this tool to find default wallet for a transaction

        Returns:
            a json contains wallet id and wallet name
        """

        df = self._conn.execute(
            "SELECT id, wallet_name FROM wallet w WHERE w.is_default = TRUE"
        ).df()

        if len(df) == 1:
            obj = {"id": int(df["id"].iloc[0]), "name": df["wallet_name"].iloc[0]}
            out = json.dumps(obj, ensure_ascii=False)
            return out

        if len(df) == 0:
            msg = "Don't have default wallet setting. Ask user"
            return msg

        if len(df) > 1:
            msg = "There are many default wallet settings. Ask user"
            return msg

    def find_default_category(self) -> str:
        """Use this tool to find default category for a transaction

        Returns:
            a json contains category id and category name
        """

        df = self._conn.execute(
            "SELECT id, category_name FROM category c WHERE c.is_default = TRUE"
        ).df()

        if len(df) == 1:
            obj = {"id": int(df["id"].iloc[0]), "name": df["category_name"].iloc[0]}
            out = json.dumps(obj, ensure_ascii=False)
            return out

        if len(df) == 0:
            msg = "Don't have default category setting. Ask user"
            return msg

        if len(df) > 1:
            msg = "There are many default category settings. Ask user"
            return msg

    def push_google_sheet_data(self, spreadsheet_id: str) -> str:
        """Use this tool to push all local data to Google Sheet

        Args:
            spreadsheet_id: spreadsheet_id of the google sheet

        Returns:
            a string indicate google sheet status
        """
        return push_google_sheet_data(self._conn, spreadsheet_id)
