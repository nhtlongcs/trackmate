
import { Transaction } from "@/app/types";
import { sampleCategories } from "./categories";
import { sampleFunds } from "./funds";
import { sampleUsers } from "./users";

export const sampleTransactions: Transaction[] = [
  { id: 1, datetime: "2024-10-16T14:45:25.690048", amount: -32.53, currency: "EUR", fund_id: 4, category_id: 8, created_at: "2024-10-16T15:45:25.690048", updated_at: "2024-10-16T15:56:25.690048", by: "mark.crawford", note: "Tuition payment", type: "expense" },
];


export const generateSampleTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [...sampleTransactions];
  const expenseCategories = sampleCategories
    .filter((c) => c.type === "expense")
    .map((c) => c.id);
  const incomeCategories = sampleCategories
    .filter((c) => c.type === "income")
    .map((c) => c.id);
  const fundIds = sampleFunds.map((f) => f.id);
  const usernames = sampleUsers.map((u) => u.username);
  // Generate transactions for 2024
  for (let i = 2; i <= 50; i++) {
    const randomDate = new Date(
      2024,
      Math.floor(Math.random() * 12),
      Math.floor(Math.random() * 28) + 1
    );
    const isIncome = Math.random() < 0.3; // 30% chance of income
    transactions.push({
      id: i,
      datetime: randomDate.toISOString(),
      amount: isIncome
        ? Math.random() * 2000 + 500
        : -(Math.random() * 500 + 10),
      currency: "EUR",
      fund_id: fundIds[Math.floor(Math.random() * fundIds.length)],
      category_id: isIncome
        ? incomeCategories[Math.floor(Math.random() * incomeCategories.length)]
        : expenseCategories[
            Math.floor(Math.random() * expenseCategories.length)
          ],
      created_at: randomDate.toISOString(),
      updated_at: randomDate.toISOString(),
      by: usernames[Math.floor(Math.random() * usernames.length)],
      note: `Transaction ${i}`,
      type: isIncome ? "income" : "expense",
    });
  }
  // Add specific transactions for April 2025 (10 transactions)
  const aprilTransactions = [
    { day: 1, amount: 3500, category: 11, note: "Monthly salary", type: "income" as const, },
    { day: 2, amount: -45.67, category: 8, note: "Grocery shopping", type: "expense" as const, },
    { day: 5, amount: -12.5, category: 6, note: "Netflix subscription", type: "expense" as const, },
    { day: 8, amount: -89.3, category: 1, note: "Restaurant dinner", type: "expense" as const, },
    { day: 12, amount: -156.78, category: 3, note: "Medical checkup", type: "expense" as const, },
    { day: 15, amount: 800, category: 12, note: "Freelance project", type: "income" as const, },
    { day: 18, amount: -67.89, category: 8, note: "Weekly groceries", type: "expense" as const, },
    { day: 22, amount: -34.56, category: 1, note: "Coffee shop", type: "expense" as const, },
    { day: 25, amount: -78.9, category: 8, note: "Grocery shopping", type: "expense" as const, },
    { day: 30, amount: -123.45, category: 1, note: "Weekend brunch", type: "expense" as const, },
  ];
  aprilTransactions.forEach((trans, index) => {
    transactions.push({
      id: 100 + index,
      datetime: new Date(2025, 3, trans.day, 14, 30, 0).toISOString(),
      amount: trans.amount,
      currency: "EUR",
      fund_id: fundIds[Math.floor(Math.random() * fundIds.length)],
      category_id: trans.category,
      created_at: new Date(2025, 3, trans.day, 14, 30, 0).toISOString(),
      updated_at: new Date(2025, 3, trans.day, 14, 30, 0).toISOString(),
      by: usernames[Math.floor(Math.random() * usernames.length)],
      note: trans.note,
      type: trans.type,
    });
  });
  // Add specific transactions for May 2025 (10 transactions up to May 20)
  const mayTransactions = [
    { day: 1, amount: 3500, category: 11, note: "Monthly salary", type: "income" as const, },
    { day: 3, amount: -52.34, category: 8, note: "Grocery shopping", type: "expense" as const, },
    { day: 6, amount: -15.99, category: 6, note: "YouTube Premium", type: "expense" as const, },
    { day: 9, amount: -95.67, category: 1, note: "Italian restaurant", type: "expense" as const, },
    { day: 12, amount: -134.56, category: 3, note: "Pharmacy visit", type: "expense" as const, },
    { day: 14, amount: -28.9, category: 2, note: "Stationery", type: "expense" as const, },
    { day: 15, amount: 1200, category: 12, note: "Freelance bonus", type: "income" as const, },
    { day: 16, amount: -73.45, category: 8, note: "Weekly groceries", type: "expense" as const, },
    { day: 18, amount: -41.23, category: 1, note: "Lunch meeting", type: "expense" as const, },
    { day: 20, amount: -156.78, category: 1, note: "Celebration dinner", type: "expense" as const, },
  ];
  mayTransactions.forEach((trans, index) => {
    transactions.push({
      id: 200 + index,
      datetime: new Date(2025, 4, trans.day, 15, 45, 0).toISOString(),
      amount: trans.amount,
      currency: "EUR",
      fund_id: fundIds[Math.floor(Math.random() * fundIds.length)],
      category_id: trans.category,
      created_at: new Date(2025, 4, trans.day, 15, 45, 0).toISOString(),
      updated_at: new Date(2025, 4, trans.day, 15, 45, 0).toISOString(),
      by: usernames[Math.floor(Math.random() * usernames.length)],
      note: trans.note,
      type: trans.type,
    });
  });
  return transactions;
};