# Require: pandas, faker, dateutil
import pandas as pd
import random
from faker import Faker
from datetime import datetime, timedelta
from dateutil.parser import parse  # Add this at the top if not already

fake = Faker()

# Settings
NUM_USERS = 3
MAX_FUNDS_PER_USER = 3
CATEGORIES_POOL = ['Groceries', 'Rent', 'Utilities', 'Transportation', 'Dining', 'Savings', 'Healthcare', 'Subscriptions', 'Education', 'Misc']
CURRENCIES = ['USD', 'EUR', 'GBP', 'JPY']

user_data = []
for _ in range(NUM_USERS):
    name = fake.name()
    username = name.lower().replace(" ", ".")
    note = fake.sentence()
    user_data.append({'username': username, 'name': name, 'note': note})

df_users = pd.DataFrame(user_data)

fund_data = []
fund_id = 1
user_fund_map = {}
for user in df_users['username']:
    num_funds = random.randint(1, MAX_FUNDS_PER_USER)
    user_fund_map[user] = []
    for _ in range(num_funds):
        created_at = fake.date_time_this_decade()
        updated_at = created_at + timedelta(days=random.randint(1, 365))
        fund_name = f"{fake.word().capitalize()} Fund {fund_id}"
        note = fake.sentence()
        fund_data.append({
            'id': fund_id,
            'fund_name': fund_name,
            'created_at': created_at.isoformat(),
            'updated_at': updated_at.isoformat(),
            'by': user,
            'note': note
        })
        user_fund_map[user].append(fund_id)
        fund_id += 1

df_funds = pd.DataFrame(fund_data)

category_data = []
category_id = 1
category_fund_map = {}
used_names = set()

for fund in df_funds.itertuples():
    num_categories = random.randint(1, 3)
    for _ in range(num_categories):
        category_name = random.choice(CATEGORIES_POOL)
        while category_name in used_names:
            category_name = f"{category_name} {random.randint(1, 99)}"
        used_names.add(category_name)
        
        created_at = fake.date_time_between(start_date=parse(fund.created_at))
        updated_at = created_at + timedelta(days=random.randint(0, 100))
        note = fake.text(max_nb_chars=40)

        category_data.append({
            'id': category_id,
            'category_name': category_name,
            'fund_id': fund.id,
            'created_at': created_at.isoformat(),
            'updated_at': updated_at.isoformat(),
            'by': fund.by,
            'note': note
        })

        category_fund_map.setdefault(fund.id, []).append(category_id)
        category_id += 1

df_categories = pd.DataFrame(category_data)

transaction_data = []
income_notes = ["Salary", "Bonus", "Freelance payment", "Investment return", "Refund from utility company", "Reimbursement"]
expense_notes = ["Grocery shopping", "Monthly rent", "Dinner at restaurant", "Uber ride", "Netflix subscription", "Medical bill", "Electricity bill", "Phone bill", "Tuition payment", "Gym membership"]

for i in range(1, 1001):
    fund = df_funds.sample(1).iloc[0]
    valid_categories = category_fund_map.get(fund['id'], [])
    if not valid_categories:
        continue

    category_id = random.choice(valid_categories)
    dt = fake.date_time_between(start_date=datetime.fromisoformat(fund['created_at']), end_date='now')

    is_income = random.random() < 0.25  # 25% income, 75% spending
    if is_income:
        amount = round(random.uniform(500, 3000), 2)
        note = random.choice(income_notes)
    else:
        amount = round(-random.expovariate(1 / 150), 2)  # Negative for spending
        note = random.choice(expense_notes)

    currency = random.choice(CURRENCIES)
    created_at = dt + timedelta(minutes=random.randint(0, 60))
    updated_at = created_at + timedelta(minutes=random.randint(0, 60))
    by = fund['by']

    transaction_data.append({
        'id': i,
        'datetime': dt.isoformat(),
        'amount': amount,
        'currency': currency,
        'fund_id': fund['id'],
        'category_id': category_id,
        'created_at': created_at.isoformat(),
        'updated_at': updated_at.isoformat(),
        'by': by,
        'note': note
    })

df_transactions = pd.DataFrame(transaction_data)


df_users.to_csv('users.csv', index=False)
df_funds.to_csv('funds.csv', index=False)
df_categories.to_csv('categories.csv', index=False)
df_transactions.to_csv('transactions.csv', index=False)
print("Data generation complete")