import duckdb
from agno.tools.toolkit import Toolkit


class DataRetrievalTools(Toolkit):
    def __init__(self, conn: duckdb.DuckDBPyConnection, **kwargs):
        self._conn = conn
        super().__init__(name="data_retrieval_tool", **kwargs)
        self.register(self.find_category_id_by_name)
        self.register(self.find_wallet_id_by_name)

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
