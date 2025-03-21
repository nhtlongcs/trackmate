import pretty_errors #noqa
import os
import pandas as pd
import asyncio
import duckdb
import sys
from dataclasses import dataclass
from datetime import date
from typing import Annotated, Union

import logfire
from annotated_types import MinLen
from devtools import debug
from pydantic import BaseModel, Field
from typing_extensions import TypeAlias

from tabulate import tabulate

from pydantic_ai import Agent, ModelRetry, RunContext
from pydantic_ai.format_as_xml import format_as_xml
from dotenv import load_dotenv  

load_dotenv()


logfire.configure(send_to_logfire=os.getenv('LOGFIRE_TOKEN'))

DB_SCHEMA = """
CREATE TABLE MYDB (
    created_at timestamptz,
    start_timestamp timestamptz,
    end_timestamp timestamptz,
    row_number int,
    trace_id text,
    span_id text,
    parent_span_id text,
    level log_level,
    span_name text,
    message text,
    attributes_json_schema text,
    tags text[],
    is_exception boolean,
    otel_status_message text,
    service_name text
);
"""
SQL_EXAMPLES = [
    {
        'request': 'show me records from yesterday',
        'response': "SELECT * FROM MYDB WHERE start_timestamp::date > CURRENT_TIMESTAMP - INTERVAL '1 day'",
    },
    {
        'request': 'show me error records',
        'response': "SELECT * FROM MYDB WHERE level = 'ERROR'",
    },
]


@dataclass
class Deps:
    df: pd.DataFrame

class Success(BaseModel):
    """Response when SQL could be successfully generated."""

    sql_query: Annotated[str, MinLen(1)]
    explanation: str = Field(
        '', description='Explanation of the SQL query, as markdown'
    )


class InvalidRequest(BaseModel):
    """Response the user input didn't include enough information to generate SQL."""

    error_message: str


Response: TypeAlias = Union[Success, InvalidRequest]
agent: Agent[Deps, Response] = Agent(
    os.getenv('PYDANTIC_AI_MODEL'), # https://ai.pydantic.dev/api/models/gemini/
    result_type=Response,
    deps_type=Deps,
    instrument=True,
)


@agent.system_prompt
async def system_prompt() -> str:
    return f"""\
Given the following SQL table of records, your job is to
write a SQL query that suits the user's request.

Database schema:

{DB_SCHEMA}

today's date = {date.today()}

{format_as_xml(SQL_EXAMPLES)}
"""


@agent.result_validator
async def validate_result(ctx: RunContext[Deps], result: Response) -> Response:
    if isinstance(result, InvalidRequest):
        return result
    # gemini often adds extraneous backslashes to SQL
    result.sql_query = result.sql_query.replace('\\', '')
    if not result.sql_query.upper().startswith('SELECT'):
        raise ModelRetry('Please create a SELECT query')
    MYDB = ctx.deps.df #noqa
    try:
        query_result = duckdb.sql(result.sql_query).df()
    except Exception as e:
        raise ModelRetry(f'Invalid query: {e}') from e
    else:
        return Success(sql_query=result.sql_query, query_result=query_result)


async def main():
    if len(sys.argv) == 1:
        prompt = 'show me logs with level "error" created in 2024'
    else:
        prompt = sys.argv[1]
    from data import data_df
    MYDB = data_df #noqa
    deps = Deps(data_df)
    result = await agent.run(prompt, deps=deps)
    debug(result.data.sql_query)
    print(duckdb.sql(result.data.sql_query).df())

if __name__ == '__main__':
    asyncio.run(main())