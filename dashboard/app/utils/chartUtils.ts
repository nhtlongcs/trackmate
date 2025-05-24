import { EnrichedTransaction } from "@/app/types";

export const COLORS = [
  "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", 
  "#82CA9D", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D"
];

export const INCOME_COLORS = ["#10b981", "#059669", "#047857", "#065f46"];

// Generate data for monthly financial trend
export const generateMonthlyFinancialTrend = (transactions: EnrichedTransaction[]) => {
  const monthlyData: Record<string, any> = {};

  transactions.forEach((transaction) => {
    const month = new Date(transaction.datetime).toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
    });

    if (!monthlyData[month]) {
      monthlyData[month] = {
        month,
        income: 0,
        expenses: 0,
        netWorth: 0,
        budgetThreshold: 1000,
      };
    }

    if (transaction.type === "income") {
      monthlyData[month].income += Math.abs(transaction.amount);
    } else {
      monthlyData[month].expenses += Math.abs(transaction.amount);
    }

    monthlyData[month].netWorth =
      monthlyData[month].income - monthlyData[month].expenses;
  });

  return Object.values(monthlyData).sort(
    (a: any, b: any) =>
      new Date(a.month).getTime() - new Date(b.month).getTime()
  );
};

// Generate data for monthly trend with categories
export const generateMonthlyTrendWithCategories = (
  transactions: EnrichedTransaction[],
  spendingByCategory: Array<{ name: string; value: number }>
) => {
  const monthlyData: Record<string, any> = {};
  const budgetThreshold = 1000;

  transactions
    .filter((t) => t.type === "expense")
    .forEach((transaction) => {
      const month = new Date(transaction.datetime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      const category = transaction.category_name;
      const amount = Math.abs(transaction.amount);

      if (!monthlyData[month]) {
        monthlyData[month] = { month, budgetThreshold };
        spendingByCategory.forEach((cat) => {
          monthlyData[month][cat.name] = 0;
        });
      }

      monthlyData[month][category] =
        (monthlyData[month][category] || 0) + amount;
    });

  return Object.values(monthlyData).sort(
    (a: any, b: any) =>
      new Date(a.month).getTime() - new Date(b.month).getTime()
  );
};

// Generate data for selected category trend
export const generateSelectedCategoryTrend = (
  transactions: EnrichedTransaction[],
  selectedCategory: string | null
) => {
  if (!selectedCategory) return [];

  const monthlyData: Record<string, number> = {};

  transactions
    .filter(
      (t) => t.type === "expense" && t.category_name === selectedCategory
    )
    .forEach((transaction) => {
      const month = new Date(transaction.datetime).toLocaleDateString("en-US", {
        year: "numeric",
        month: "short",
      });
      const amount = Math.abs(transaction.amount);
      monthlyData[month] = (monthlyData[month] || 0) + amount;
    });

  return Object.entries(monthlyData)
    .map(([month, amount]) => ({ month, amount }))
    .sort(
      (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
    );
};

// Generate spending projection data
export const generateSpendingProjection = (
  transactions: EnrichedTransaction[],
  dateRange: { from: Date; to: Date; preset: string }
) => {
  const today = new Date();
  const isCurrentMonth = 
    dateRange.from.getMonth() === today.getMonth() && 
    dateRange.from.getFullYear() === today.getFullYear();

  if (!isCurrentMonth || dateRange.preset !== "month") return null;

  const daysInMonth = new Date(
    today.getFullYear(),
    today.getMonth() + 1,
    0
  ).getDate();
  const todayDate = today.getDate();
  
  // Get expenses for the current month
  const currentMonthExpenses = transactions
    .filter(t => t.type === "expense" && 
      new Date(t.datetime).getMonth() === today.getMonth() &&
      new Date(t.datetime).getFullYear() === today.getFullYear()
    )
    .map(t => ({
      day: new Date(t.datetime).getDate(),
      amount: Math.abs(t.amount)
    }));

  // Calculate daily average spending
  const totalSpentSoFar = currentMonthExpenses.reduce((sum, t) => sum + t.amount, 0);
  const dailyAverage = totalSpentSoFar / todayDate;
  
  // Generate daily breakdown
  const dailyBreakdown = [];
  for (let day = 1; day <= daysInMonth; day++) {
    const dayExpenses = currentMonthExpenses
      .filter(t => t.day === day)
      .reduce((sum, t) => sum + t.amount, 0);
    
    const projected = day > todayDate ? dailyAverage : null;
    
    dailyBreakdown.push({
      day,
      actual: day <= todayDate ? dayExpenses || 0 : null,
      projected
    });
  }

  // Calculate end of month projection
  const remainingDays = daysInMonth - todayDate;
  const projectedRemaining = dailyAverage * remainingDays;
  const projectedTotal = totalSpentSoFar + projectedRemaining;

  return {
    projected: projectedTotal,
    dailyBreakdown,
    periodType: "month"
  };
};
