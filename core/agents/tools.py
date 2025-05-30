import duckdb
from agno.tools.toolkit import Toolkit


class DataRetrievalTools(Toolkit):
    def __init__(self, conn: duckdb.DuckDBPyConnection, **kwargs):
        self._conn = conn
        super().__init__(name="data_retrieval_tool", **kwargs)
        self.register(self.find_category_id_by_name)
        self.register(self.find_fund_id_by_name)

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

    def find_fund_id_by_name(self, fund_name: str) -> str:
        """Use this tool to find fund's id given a fund name

        Args:
            fund_name: fund name to find the id

        Returns:
            a list of best match fund ids
        """
        df = self._conn.execute(
            "SELECT * FROM fund f WHERE LOWER(f.fund_name) = LOWER(?)",
            [fund_name],
        ).df()
        return df.to_json(
            orient="records",
            force_ascii=False,
        )
