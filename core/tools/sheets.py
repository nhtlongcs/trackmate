import re
from typing import Self

import pandas as pd
from googleapiclient.discovery import Resource, build

from auth.google import auth_google_installed_app_flow


class GoogleSheetTool:
    """
    Google Sheet Tool

    References:
        API Docs: https://developers.google.com/workspace/sheets/api/quickstart/python
    """

    SCOPES = [
        "https://www.googleapis.com/auth/spreadsheets",
    ]

    def __init__(self):
        self.service = self._init_service()

    def _init_service(self) -> Resource:
        creds = auth_google_installed_app_flow(self.SCOPES)
        builder = build("sheets", "v4", credentials=creds)
        return builder.spreadsheets()

    @staticmethod
    def get_sheet_id_from_url(url: str) -> str | None:
        """Extract Spreadsheet ID from an URL

        Args:
            url: Google Sheet document URL

        Returns:
            Spreadsheet ID or None if the url is invalid

        Examples:
            >>> GoogleSheetTool.get_sheet_id_from_url("https://docs.google.com/spreadsheets/d/1l6tE-VfONOKlHoOsGops7pW_GBca1Yzj5wsTHpiqDwg/edit?gid=1623561206#gid=1623561206")
            1l6tE-VfONOKlHoOsGops7pW_GBca1Yzj5wsTHpiqDwg
        """
        matches = re.findall(r"""/spreadsheets/d/([a-zA-Z0-9-_]+)""", url)
        if len(matches) == 1:
            return matches[0]
        return None

    def read_sheet_values(
        self: Self,
        sheet_id: str,
        range_name: str,
    ) -> pd.DataFrame:
        """Get Google Sheet Range values

        Args:
            sheet_id: ID of the sheet
            range_name: Logical range within a sheet. Example: A1, A1:A4, Sheet1!A1:E4, 'Sheet 2'!A1:E4.

        Returns:
            A pd.DataFrame contains the data
        """
        # Ref: https://googleapis.github.io/google-api-python-client/docs/dyn/sheets_v4.spreadsheets.values.html#get
        result: dict = (
            self.service.values()
            .get(spreadsheetId=sheet_id, range=range_name)
            .execute()
        )
        values = result.get("values", [])

        if not values:
            return pd.DataFrame()

        return pd.DataFrame.from_records(values)

    def write_sheet_values(
        self: Self,
        sheet_id: str,
        range_name: str,
        values: pd.DataFrame,
    ) -> pd.DataFrame:
        """Write Google Sheet Range values

        Args:
            sheet_id: ID of the sheet
            range_name: Logical range within a sheet. Example: A1, A1:A4, Sheet1!A1:E4, 'Sheet 2'!A1:E4.
            values: DataFrame contains data to be written.
        """
        # Ref: https://googleapis.github.io/google-api-python-client/docs/dyn/sheets_v4.spreadsheets.values.html#update
        # TODO: Handle passed values outer the provided range will cause error
        data = {
            "majorDimension": "ROWS",
            "range": range_name,
            "values": values.values.tolist(),
        }

        self.service.values().update(
            spreadsheetId=sheet_id,
            range=range_name,
            body=data,
            valueInputOption="RAW",  # "RAW" or "USER_ENTERED"
        ).execute()

    def delete_sheet_values(
        self: Self,
        sheet_id: str,
        range_name: str,
    ):
        """Clear Google Sheet Range values

        Args:
            sheet_id: ID of the sheet
            range_name: Logical range within a sheet. Example: A1, A1:A4, Sheet1!A1:E4, 'Sheet 2'!A1:E4.
        """
        # Ref: https://googleapis.github.io/google-api-python-client/docs/dyn/sheets_v4.spreadsheets.values.html#clear
        self.service.values().clear(
            spreadsheetId=sheet_id,
            range=range_name,
        ).execute()
