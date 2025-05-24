import { Transaction } from "@/app/types";
import { sampleCategories, sampleFunds, sampleUsers } from "./sampleData";

// Generate sample transactions for demonstration
export const generateSampleTransactions = (): Transaction[] => {
  const transactions: Transaction[] = [
    {
      id: 1,
      datetime: "2024-10-16T14:45:25.690048",
      amount: -32.53,
      currency: "EUR",
      fund_id: 4,
      category_id: 8,
      created_at: "2024-10-16T15:45:25.690048",
      updated_at: "2024-10-16T15:56:25.690048",
      by: "mark.crawford",
      note: "Tuition payment",
      type: "expense",
    },
  ];

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
      note: isIncome ? "Income transaction" : "Expense transaction",
      type: isIncome ? "income" : "expense",
    });
  }

  return transactions;
};
