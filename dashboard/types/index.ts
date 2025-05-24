// src/types/index.ts

export interface Transaction {
  id: number;
  datetime: string;
  amount: number;
  currency: string;
  fund_id: number;
  category_id: number;
  created_at: string;
  updated_at: string;
  by: string;
  note: string;
  type: "income" | "expense";
}

export interface User {
  username: string;
  name: string;
  note: string;
}

export interface Fund {
  id: number;
  fund_name: string;
  created_at: string;
  updated_at: string;
  by: string;
  note: string;
}

export interface Category {
  id: number;
  category_name: string;
  fund_id: number;
  created_at: string;
  updated_at: string;
  by: string;
  note: string;
  type: "income" | "expense";
}

export interface EnrichedTransaction extends Transaction {
  fund_name: string;
  category_name: string;
  user_name: string;
}

export interface FinancialMetrics {
  totalIncome: number;
  totalExpenses: number;
  netWorth: number;
  expenseToIncomeRatio: number;
  avgTransactionAmount: number;
  avgIncomeAmount: number;
  avgExpenseAmount: number;
  incomeCount: number;
  expenseCount: number;
  savingsRate: number;
}


export const defaultFinancialMetrics: FinancialMetrics = {
  totalIncome: 0,
  totalExpenses: 0,
  netWorth: 0,
  expenseToIncomeRatio: 0,
  avgTransactionAmount: 0,
  avgIncomeAmount: 0,
  avgExpenseAmount: 0,
  incomeCount: 0,
  expenseCount: 0,
  savingsRate: 0,
};


export interface SpendingProjectionData {
  current: number;
  projected: number;
  remaining: number;
  dailyAverage: number;
  daysElapsed: number;
  remainingDays: number;
  progressPercentage: number;
  periodType: "month" | "year";
  dailyBreakdown: {
    day: number;
    date: string;
    actual: number | null;
    projected: number;
    isToday: boolean;
    isFuture: boolean;
  }[];
}

export interface MonthComparisonData {
    current: number;
    previous: number;
    average: number;
    differenceFromLast: number;
    differenceFromAverage: number;
    isIncreaseFromLast: boolean;
    isIncreaseFromAverage: boolean;
    periodType: "month" | "year";
}

export interface CategoryValue {
    name: string;
    value: number;
}

export interface MonthlyTrend {
    month: string;
    income: number;
    expenses: number;
    netWorth: number;
    budgetThreshold: number;
}

export interface MonthlyCategoryTrend {
    month: string;
    budgetThreshold: number;
    [key: string]: any; // Categories will be dynamic keys
}