import pretty_errors #noqa
import pandas as pd
from faker import Faker
from dotenv import load_dotenv

import pandas as pd
import duckdb

load_dotenv()

fake = Faker()
num_rows = 100
data = {
    'created_at': [fake.date_time_this_decade().strftime('%m/%d/%Y') for _ in range(num_rows)],
    'row_number': list(range(1, num_rows + 1)),
    'start_timestamp': [fake.date_time_this_decade().strftime('%m/%d/%Y') for _ in range(num_rows)],
    'end_timestamp': [fake.date_time_this_decade().strftime('%m/%d/%Y') for _ in range(num_rows)],
    'trace_id': [fake.uuid4() for _ in range(num_rows)],
    'span_id': [fake.uuid4() for _ in range(num_rows)],
    'parent_span_id': [fake.uuid4() for _ in range(num_rows)],
    'level': [fake.random_element(elements=('INFO', 'ERROR', 'DEBUG')) for _ in range(num_rows)],
    'span_name': [fake.word() for _ in range(num_rows)],
    'message': [fake.sentence() for _ in range(num_rows)],
    'attributes_json_schema': [fake.json() for _ in range(num_rows)],
    'tags': [[fake.word() for _ in range(3)] for _ in range(num_rows)],
    'is_exception': [fake.boolean() for _ in range(num_rows)],
    'otel_status_message': [fake.sentence() for _ in range(num_rows)],
    'service_name': [fake.company() for _ in range(num_rows)]
}
data_df = pd.DataFrame(data)

if __name__ == '__main__':
    print(duckdb.sql("SELECT * FROM data_df WHERE LEVEL::VARCHAR = 'ERROR'").df().head())