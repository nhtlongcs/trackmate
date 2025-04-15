import asyncio

from agents.expense import extract_expense_info


async def main():
    # data = await extract_expense_info("Hello, I'm good")
    # print(data)

    data = await extract_expense_info("I bought a t-shirt at 300$ yesterday")
    print(data)
    # date=datetime.datetime(2025, 4, 13, 9, 11, 24, 4309, tzinfo=TzInfo(UTC)) category='clothing' name='t-shirt' amount=300.0 currency='USD'
    await asyncio.sleep(1.0)

    # data = await extract_expense_info("I spent 100$")
    # print(data)
    # What expense did you make? For example, Starbucks.: food
    # date=datetime.datetime(2025, 4, 14, 9, 12, 1, 678130, tzinfo=TzInfo(UTC)) category='food' name='food' amount=100.0 currency='USD'

    data = await extract_expense_info("Hôm qua đi chợ 500 ngàn")
    print(data)
    # date=datetime.datetime(2025, 4, 13, 0, 0, tzinfo=TzInfo(UTC)) category='grocery' name='market' amount=500000.0 currency='VND'
    await asyncio.sleep(1.0)

    # data = await extract_expense_info("I bought a t-shirt at 300$ last monday")
    # print(data)
    # await asyncio.sleep(1.0)
    # data = await extract_expense_info("I bought a t-shirt at 300$ on Oct 12")
    # print(data)
    # await asyncio.sleep(1.0)
    # data = await extract_expense_info("I will buy a t-shirt at 300$ next monday")
    # print(data)


if __name__ == "__main__":
    asyncio.run(main())
