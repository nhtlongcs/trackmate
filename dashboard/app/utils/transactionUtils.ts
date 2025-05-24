import { Transaction, EnrichedTransaction, User, Fund, Category } from "@/app/types";
import { differenceInDays, startOfMonth, endOfMonth, startOfYear, endOfYear, subMonths, format } from "date-fns";

// Category icons mapping
export const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes("dining") || name.includes("restaurant")) return "utensils";
  if (name.includes("groceries") || name.includes("grocery")) return "shopping-cart";
  if (name.includes("healthcare") || name.includes("health")) return "heart";
  if (name.includes("subscriptions") || name.includes("subscription")) return "tv";
  if (name.includes("savings")) return "piggy-bank";
  if (name.includes("salary") || name.includes("freelance")) return "briefcase";
  return "credit-card"; // Default icon
};

// Enrich transactions with additional data
export const enrichTransactions = (
  transactions: Transaction[],
  users: User[],
  funds: Fund[],
  categories: Category[]
): EnrichedTransaction[] => {
  const userMap = new Map(users.map(user => [user.username, user.name]));
  const fundMap = new Map(funds.map(fund => [fund.id, fund.fund_name]));
  const categoryMap = new Map(categories.map(cat => [cat.id, cat.category_name]));

  return transactions.map(transaction => ({
    ...transaction,
    fund_name: fundMap.get(transaction.fund_id) || 'Unknown',
    category_name: categoryMap.get(transaction.category_id) || 'Uncategorized',
    user_name: userMap.get(transaction.by) || transaction.by,
  }));
};

// Filter transactions based on date range and other criteria
export const filterTransactions = (
  transactions: EnrichedTransaction[],
  dateRange: { from: Date; to: Date },
  selectedFund: string,
  selectedUser: string,
  searchTerm: string
): EnrichedTransaction[] => {
  return transactions.filter((transaction) => {
    const transactionDate = new Date(transaction.datetime);
    const isInDateRange = transactionDate >= dateRange.from && transactionDate <= dateRange.to;
    
    const fundMatch = selectedFund === "all" || transaction.fund_id.toString() === selectedFund;
    const userMatch = selectedUser === "all" || transaction.by === selectedUser;
    
    const searchTermLower = searchTerm.toLowerCase();
    const searchMatch = 
      !searchTerm ||
      transaction.note.toLowerCase().includes(searchTermLower) ||
      transaction.category_name.toLowerCase().includes(searchTermLower) ||
      transaction.fund_name.toLowerCase().includes(searchTermLower) ||
      transaction.user_name.toLowerCase().includes(searchTermLower);

    return isInDateRange && fundMatch && userMatch && searchMatch;
  });
};

// Calculate financial metrics
export const calculateFinancialMetrics = (
  transactions: EnrichedTransaction[]
) => {
  const incomeTransactions = transactions.filter((t) => t.type === "income");
  const expenseTransactions = transactions.filter((t) => t.type === "expense");

  const totalIncome = incomeTransactions.reduce((sum, t) => sum + t.amount, 0);
  const totalExpenses = Math.abs(
    expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
  );

  const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

  return {
    savingsRate,
    avgIncomeAmount: incomeTransactions.length > 0 ? totalIncome / incomeTransactions.length : 0,
    avgExpenseAmount: expenseTransactions.length > 0 ? totalExpenses / expenseTransactions.length : 0,
    incomeCount: incomeTransactions.length,
    expenseCount: expenseTransactions.length,
  };
};

// Calculate month-over-month comparison
export const calculateMonthComparison = (
  transactions: EnrichedTransaction[],
  dateRange: { from: Date; to: Date; preset: string }
) => {
  const currentPeriod = { from: dateRange.from, to: dateRange.to };
  const lastPeriod = {
    from: subMonths(dateRange.from, dateRange.preset === "month" ? 1 : 12),
    to: subMonths(dateRange.to, dateRange.preset === "month" ? 1 : 12),
  };

  const currentPeriodTransactions = transactions.filter((t) => {
    const date = new Date(t.datetime);
    return date >= currentPeriod.from && date <= currentPeriod.to && t.type === "expense";
  });

  const lastPeriodTransactions = transactions.filter((t) => {
    const date = new Date(t.datetime);
    return date >= lastPeriod.from && date <= lastPeriod.to && t.type === "expense";
  });

  // Calculate average from all historical data
  const allExpenseTransactions = transactions.filter((t) => t.type === "expense");
  const monthlyData: Record<string, number> = {};

  allExpenseTransactions.forEach((t) => {
    const date = new Date(t.datetime);
    const key =
      dateRange.preset === "month"
        ? `${date.getFullYear()}-${date.getMonth()}`
        : `${date.getFullYear()}`;
    monthlyData[key] = (monthlyData[key] || 0) + Math.abs(t.amount);
  });

  const averageSpending =
    Object.values(monthlyData).length > 0
      ? Object.values(monthlyData).reduce((sum, val) => sum + val, 0) /
        Object.values(monthlyData).length
      : 0;

  const currentSpending = Math.abs(
    currentPeriodTransactions.reduce((sum, t) => sum + t.amount, 0)
  );
  const lastPeriodSpending = Math.abs(
    lastPeriodTransactions.reduce((sum, t) => sum + t.amount, 0)
  );

  const differenceFromLast = currentSpending - lastPeriodSpending;
  const differenceFromAverage = currentSpending - averageSpending;

  return {
    current: currentSpending,
    previous: lastPeriodSpending,
    average: averageSpending,
    differenceFromLast,
    differenceFromAverage,
    isIncreaseFromLast: differenceFromLast > 0,
    isIncreaseFromAverage: differenceFromAverage > 0,
    periodType: dateRange.preset === "month" ? "month" : "year",
  };
};


// Calculate spending projection for the selected period
export const calculateSpendingProjection = (
  transactions: EnrichedTransaction[],
  dateRange: { from: Date; to: Date }
): number => {
  const expenseTransactions = transactions.filter(
    (t) => t.type === "expense"
  );

  if (expenseTransactions.length === 0) return 0;

  const periodDays = differenceInDays(dateRange.to, dateRange.from) + 1;
  const totalSpent = expenseTransactions.reduce(
    (sum, t) => sum + Math.abs(t.amount),
    0
  );

  // Calculate average daily spending and project for the period
  const dailyAverage = totalSpent / periodDays;
  return dailyAverage * 30; // Projected monthly spending
};

// Get spending grouped by category
export const getSpendingByCategory = (
  transactions: EnrichedTransaction[],
  limit: number = 5
): Array<{ name: string; value: number; icon: string }> => {
  const expenseTransactions = transactions.filter(
    (t) => t.type === "expense"
  );

  const categoryMap = new Map<string, number>();

  expenseTransactions.forEach((t) => {
    const category = t.category_name || 'Uncategorized';
    const amount = Math.abs(t.amount);
    categoryMap.set(category, (categoryMap.get(category) || 0) + amount);
  });

  // Convert to array, sort by amount (descending), and limit results
  return Array.from(categoryMap.entries())
    .map(([name, value]) => ({
      name,
      value,
      icon: getCategoryIcon(name),
    }))
    .sort((a, b) => b.value - a.value)
    .slice(0, limit);
};

// Get monthly financial trend data
export const getMonthlyFinancialTrend = (
  transactions: EnrichedTransaction[],
  months: number = 6
): Array<{ month: string; income: number; expenses: number }> => {
  const result: Array<{ month: string; income: number; expenses: number }> = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const monthKey = format(monthStart, 'MMM yyyy');

    const monthTransactions = transactions.filter((t) => {
      const transactionDate = new Date(t.datetime);
      return transactionDate >= monthStart && transactionDate <= monthEnd;
    });

    const income = monthTransactions
      .filter((t) => t.type === 'income')
      .reduce((sum, t) => sum + t.amount, 0);

    const expenses = Math.abs(
      monthTransactions
        .filter((t) => t.type === 'expense')
        .reduce((sum, t) => sum + t.amount, 0)
    );

    result.push({
      month: monthKey,
      income,
      expenses,
    });
  }

  return result;
};

// Get category trend data over time
export const getCategoryTrend = (
  transactions: EnrichedTransaction[],
  categoryName: string,
  months: number = 6
): Array<{ month: string; value: number }> => {
  const result: Array<{ month: string; value: number }> = [];
  const now = new Date();

  for (let i = months - 1; i >= 0; i--) {
    const date = subMonths(now, i);
    const monthStart = startOfMonth(date);
    const monthEnd = endOfMonth(date);
    const monthKey = format(monthStart, 'MMM yyyy');

    const monthAmount = transactions
      .filter((t) => {
        const transactionDate = new Date(t.datetime);
        return (
          transactionDate >= monthStart &&
          transactionDate <= monthEnd &&
          t.type === 'expense' &&
          t.category_name === categoryName
        );
      })
      .reduce((sum, t) => sum + Math.abs(t.amount), 0);

    result.push({
      month: monthKey,
      value: monthAmount,
    });
  }

  return result;
};