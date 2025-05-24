"use client";

import type React from "react";

import { useState, useMemo, useCallback } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Line,
  Legend,
  ComposedChart,
  LineChart,
} from "recharts";
import {
  CalendarIcon,
  Upload,
  Search,
  AlertCircle,
  Activity,
  TrendingUp,
  TrendingDown,
  Wallet,
  BarChart3,
  ArrowUpRight,
  ArrowDownRight,
  X,
  ShoppingCart,
  Coffee,
  Heart,
  Tv,
  CreditCard,
  Briefcase,
} from "lucide-react";
import {
  startOfYear,
  startOfMonth,
  endOfMonth,
  endOfYear,
  isWithinInterval,
  differenceInDays,
  subMonths,
} from "date-fns";

// Types for our data structures
interface Transaction {
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

interface User {
  username: string;
  name: string;
  note: string;
}

interface Fund {
  id: number;
  fund_name: string;
  created_at: string;
  updated_at: string;
  by: string;
  note: string;
}

interface Category {
  id: number;
  category_name: string;
  fund_id: number;
  created_at: string;
  updated_at: string;
  by: string;
  note: string;
  type: "income" | "expense";
}

interface EnrichedTransaction extends Transaction {
  fund_name: string;
  category_name: string;
  user_name: string;
}

// Sample data - in real implementation, this would come from CSV upload
const sampleTransactions: Transaction[] = [
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

const sampleUsers: User[] = [
  {
    username: "madison.delacruz",
    name: "Madison Delacruz",
    note: "By range property evening community discussion mention.",
  },
  {
    username: "mark.crawford",
    name: "Mark Crawford",
    note: "Reason listen rise home bill perhaps environmental special.",
  },
  {
    username: "edward.cardenas",
    name: "Edward Cardenas",
    note: "We because here.",
  },
];

const sampleFunds: Fund[] = [
  {
    id: 1,
    fund_name: "Activity Fund 1",
    created_at: "2023-07-18T21:49:59.062028",
    updated_at: "2023-12-03T21:49:59.062028",
    by: "madison.delacruz",
    note: "Model account dog treat.",
  },
  {
    id: 2,
    fund_name: "Also Fund 2",
    created_at: "2024-11-28T08:28:38.283423",
    updated_at: "2025-07-04T08:28:38.283423",
    by: "madison.delacruz",
    note: "Sound inside seat form government able commercial culture.",
  },
  {
    id: 3,
    fund_name: "Save Fund 3",
    created_at: "2024-08-11T18:39:33.531966",
    updated_at: "2024-12-17T18:39:33.531966",
    by: "mark.crawford",
    note: "Many again trouble pattern law.",
  },
  {
    id: 4,
    fund_name: "Really Fund 4",
    created_at: "2022-03-16T07:39:28.923811",
    updated_at: "2022-05-05T07:39:28.923811",
    by: "mark.crawford",
    note: "Energy across option officer.",
  },
  {
    id: 5,
    fund_name: "Home Fund 5",
    created_at: "2022-05-25T22:40:03.463395",
    updated_at: "2023-05-10T22:40:03.463395",
    by: "edward.cardenas",
    note: "Smile see adult look animal sell show.",
  },
];

const sampleCategories: Category[] = [
  // Expense categories
  {
    id: 1,
    category_name: "Dining",
    fund_id: 1,
    created_at: "2024-04-15T20:05:15.363851",
    updated_at: "2024-05-25T20:05:15.363851",
    by: "madison.delacruz",
    note: "Recently best ok star bed money.",
    type: "expense",
  },
  {
    id: 2,
    category_name: "Misc",
    fund_id: 2,
    created_at: "2025-03-25T08:48:38.738326",
    updated_at: "2025-05-14T08:48:38.738326",
    by: "madison.delacruz",
    note: "Subject not exactly. Several fly item.",
    type: "expense",
  },
  {
    id: 3,
    category_name: "Healthcare",
    fund_id: 2,
    created_at: "2025-02-27T10:31:04.451709",
    updated_at: "2025-03-20T10:31:04.451709",
    by: "madison.delacruz",
    note: "Loss part life year son meeting.",
    type: "expense",
  },
  {
    id: 4,
    category_name: "Savings",
    fund_id: 2,
    created_at: "2025-03-02T06:16:16.900849",
    updated_at: "2025-04-17T06:16:16.900849",
    by: "madison.delacruz",
    note: "Stage suddenly better up almost film.",
    type: "expense",
  },
  {
    id: 5,
    category_name: "Healthcare 75",
    fund_id: 3,
    created_at: "2025-01-18T15:32:27.180122",
    updated_at: "2025-04-07T15:32:27.180122",
    by: "mark.crawford",
    note: "Budget professional when matter.",
    type: "expense",
  },
  {
    id: 6,
    category_name: "Subscriptions",
    fund_id: 3,
    created_at: "2024-09-16T08:58:08.338175",
    updated_at: "2024-10-28T08:58:08.338175",
    by: "mark.crawford",
    note: "Those baby be fast choose scientist.",
    type: "expense",
  },
  {
    id: 7,
    category_name: "Misc 95",
    fund_id: 3,
    created_at: "2025-03-20T21:39:02.136155",
    updated_at: "2025-04-25T21:39:02.136155",
    by: "mark.crawford",
    note: "Ok stock cultural ten good.",
    type: "expense",
  },
  {
    id: 8,
    category_name: "Groceries",
    fund_id: 4,
    created_at: "2024-02-04T20:06:41.128517",
    updated_at: "2024-04-01T20:06:41.128517",
    by: "mark.crawford",
    note: "Go picture movie up by check nation.",
    type: "expense",
  },
  {
    id: 9,
    category_name: "Savings 73",
    fund_id: 5,
    created_at: "2023-02-28T08:49:18.336923",
    updated_at: "2023-05-02T08:49:18.336923",
    by: "edward.cardenas",
    note: "Chance response upon conference.",
    type: "expense",
  },
  {
    id: 10,
    category_name: "Dining 95",
    fund_id: 5,
    created_at: "2025-04-29T17:09:22.044437",
    updated_at: "2025-06-30T17:09:22.044437",
    by: "edward.cardenas",
    note: "Old pass air thus.",
    type: "expense",
  },
  // Income categories
  {
    id: 11,
    category_name: "Salary",
    fund_id: 1,
    created_at: "2024-01-01T00:00:00.000000",
    updated_at: "2024-01-01T00:00:00.000000",
    by: "madison.delacruz",
    note: "Monthly salary income.",
    type: "income",
  },
  {
    id: 12,
    category_name: "Freelance",
    fund_id: 2,
    created_at: "2024-01-01T00:00:00.000000",
    updated_at: "2024-01-01T00:00:00.000000",
    by: "mark.crawford",
    note: "Freelance project income.",
    type: "income",
  },
  {
    id: 13,
    category_name: "Investment",
    fund_id: 3,
    created_at: "2024-01-01T00:00:00.000000",
    updated_at: "2024-01-01T00:00:00.000000",
    by: "edward.cardenas",
    note: "Investment returns.",
    type: "income",
  },
  {
    id: 14,
    category_name: "Bonus",
    fund_id: 1,
    created_at: "2024-01-01T00:00:00.000000",
    updated_at: "2024-01-01T00:00:00.000000",
    by: "madison.delacruz",
    note: "Performance bonus.",
    type: "income",
  },
];

// Category icons mapping
const getCategoryIcon = (categoryName: string) => {
  const name = categoryName.toLowerCase();
  if (name.includes("dining") || name.includes("restaurant")) return Coffee;
  if (name.includes("groceries") || name.includes("grocery"))
    return ShoppingCart;
  if (name.includes("healthcare") || name.includes("health")) return Heart;
  if (name.includes("subscriptions") || name.includes("subscription"))
    return Tv;
  if (name.includes("savings")) return Wallet;
  if (name.includes("salary") || name.includes("freelance")) return Briefcase;
  return CreditCard; // Default icon
};

// Generate sample transactions for demonstration
const generateSampleTransactions = (): Transaction[] => {
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
    {
      day: 1,
      amount: 3500,
      category: 11,
      note: "Monthly salary",
      type: "income" as const,
    },
    {
      day: 2,
      amount: -45.67,
      category: 8,
      note: "Grocery shopping",
      type: "expense" as const,
    },
    {
      day: 5,
      amount: -12.5,
      category: 6,
      note: "Netflix subscription",
      type: "expense" as const,
    },
    {
      day: 8,
      amount: -89.3,
      category: 1,
      note: "Restaurant dinner",
      type: "expense" as const,
    },
    {
      day: 12,
      amount: -156.78,
      category: 3,
      note: "Medical checkup",
      type: "expense" as const,
    },
    {
      day: 15,
      amount: 800,
      category: 12,
      note: "Freelance project",
      type: "income" as const,
    },
    {
      day: 18,
      amount: -67.89,
      category: 8,
      note: "Weekly groceries",
      type: "expense" as const,
    },
    {
      day: 22,
      amount: -34.56,
      category: 1,
      note: "Coffee shop",
      type: "expense" as const,
    },
    {
      day: 25,
      amount: -78.9,
      category: 8,
      note: "Grocery shopping",
      type: "expense" as const,
    },
    {
      day: 30,
      amount: -123.45,
      category: 1,
      note: "Weekend brunch",
      type: "expense" as const,
    },
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
    {
      day: 1,
      amount: 3500,
      category: 11,
      note: "Monthly salary",
      type: "income" as const,
    },
    {
      day: 3,
      amount: -52.34,
      category: 8,
      note: "Grocery shopping",
      type: "expense" as const,
    },
    {
      day: 6,
      amount: -15.99,
      category: 6,
      note: "YouTube Premium",
      type: "expense" as const,
    },
    {
      day: 9,
      amount: -95.67,
      category: 1,
      note: "Italian restaurant",
      type: "expense" as const,
    },
    {
      day: 12,
      amount: -134.56,
      category: 3,
      note: "Pharmacy visit",
      type: "expense" as const,
    },
    {
      day: 14,
      amount: -28.9,
      category: 2,
      note: "Stationery",
      type: "expense" as const,
    },
    {
      day: 15,
      amount: 1200,
      category: 12,
      note: "Freelance bonus",
      type: "income" as const,
    },
    {
      day: 16,
      amount: -73.45,
      category: 8,
      note: "Weekly groceries",
      type: "expense" as const,
    },
    {
      day: 18,
      amount: -41.23,
      category: 1,
      note: "Lunch meeting",
      type: "expense" as const,
    },
    {
      day: 20,
      amount: -156.78,
      category: 1,
      note: "Celebration dinner",
      type: "expense" as const,
    },
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

const COLORS = [
  "#0088FE",
  "#00C49F",
  "#FFBB28",
  "#FF8042",
  "#8884D8",
  "#82CA9D",
  "#FFC658",
  "#FF7C7C",
  "#8DD1E1",
  "#D084D0",
];

const INCOME_COLORS = ["#10b981", "#059669", "#047857", "#065f46"];

export default function FinancialDashboard() {
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>(
    generateSampleTransactions()
  );
  const [users, setUsers] = useState<User[]>(sampleUsers);
  const [funds, setFunds] = useState<Fund[]>(sampleFunds);
  const [categories, setCategories] = useState<Category[]>(sampleCategories);

  const [selectedFund, setSelectedFund] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [searchTerm, setSearchTerm] = useState<string>("");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false);
  const [dataErrors, setDataErrors] = useState<string[]>([]);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);

  const [dateRange, setDateRange] = useState<{
    from: Date;
    to: Date;
    preset: string;
  }>({
    from: new Date(2025, 4, 1), // May 1, 2025
    to: new Date(2025, 4, 31), // May 31, 2025
    preset: "month",
  });

  // CSV parsing functions
  const parseCSV = useCallback((csvText: string): string[][] => {
    const lines = csvText.trim().split("\n");
    return lines.map((line) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;

      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "\t" && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  }, []);

  const validateAndParseTransactions = useCallback(
    (data: string[][]): Transaction[] => {
      const errors: string[] = [];
      const validTransactions: Transaction[] = [];

      if (data.length < 2) {
        errors.push(
          "Transaction file must have at least a header and one data row"
        );
        setDataErrors(errors);
        return [];
      }

      const headers = data[0];
      const expectedHeaders = [
        "id",
        "datetime",
        "amount",
        "currency",
        "fund_id",
        "category_id",
        "created_at",
        "updated_at",
        "by",
        "note",
        "type",
      ];

      for (const header of expectedHeaders) {
        if (!headers.includes(header)) {
          errors.push(`Missing required header: ${header}`);
        }
      }

      if (errors.length > 0) {
        setDataErrors(errors);
        return [];
      }

      for (let i = 1; i < data.length; i++) {
        const row = data[i];
        try {
          const transaction: Transaction = {
            id: Number.parseInt(row[headers.indexOf("id")]),
            datetime: row[headers.indexOf("datetime")],
            amount: Number.parseFloat(row[headers.indexOf("amount")]),
            currency: row[headers.indexOf("currency")],
            fund_id: Number.parseInt(row[headers.indexOf("fund_id")]),
            category_id: Number.parseInt(row[headers.indexOf("category_id")]),
            created_at: row[headers.indexOf("created_at")],
            updated_at: row[headers.indexOf("updated_at")],
            by: row[headers.indexOf("by")],
            note: row[headers.indexOf("note")],
            type: row[headers.indexOf("type")] as "income" | "expense",
          };

          if (
            isNaN(transaction.id) ||
            isNaN(transaction.amount) ||
            isNaN(transaction.fund_id) ||
            isNaN(transaction.category_id)
          ) {
            errors.push(`Invalid data in row ${i + 1}`);
            continue;
          }

          validTransactions.push(transaction);
        } catch (error) {
          errors.push(`Error parsing row ${i + 1}: ${error}`);
        }
      }

      setDataErrors(errors);
      return validTransactions;
    },
    []
  );

  // File upload handlers
  const handleFileUpload = useCallback(
    (
      event: React.ChangeEvent<HTMLInputElement>,
      type: "transactions" | "users" | "funds" | "categories"
    ) => {
      const file = event.target.files?.[0];
      if (!file) return;

      const reader = new FileReader();
      reader.onload = (e) => {
        const csvText = e.target?.result as string;
        const data = parseCSV(csvText);

        switch (type) {
          case "transactions":
            const newTransactions = validateAndParseTransactions(data);
            if (newTransactions.length > 0) {
              setTransactions(newTransactions);
            }
            break;
          // Add similar handlers for other file types
          default:
            break;
        }
      };
      reader.readAsText(file);
    },
    [parseCSV, validateAndParseTransactions]
  );

  // Date range management
  const setDateRangePreset = useCallback((preset: string) => {
    const now = new Date();
    let from: Date;
    let to: Date;

    switch (preset) {
      case "all":
        from = new Date(2020, 0, 1); // Far back date
        to = new Date(2030, 11, 31); // Far future date
        break;
      case "month":
        from = startOfMonth(now);
        to = endOfMonth(now);
        break;
      case "year":
        from = startOfYear(now);
        to = endOfYear(now);
        break;
      default:
        from = startOfYear(now);
        to = now;
    }

    setDateRange({ from, to, preset });
  }, []);

  // Data filtering and enrichment
  const filteredTransactions = useMemo(() => {
    return transactions.filter((transaction) => {
      const fundMatch =
        selectedFund === "all" ||
        transaction.fund_id.toString() === selectedFund;
      const userMatch =
        selectedUser === "all" || transaction.by === selectedUser;
      const transactionDate = new Date(transaction.datetime);
      const dateMatch =
        dateRange.preset === "all" ||
        isWithinInterval(transactionDate, {
          start: dateRange.from,
          end: dateRange.to,
        });
      const searchMatch =
        searchTerm === "" ||
        transaction.note.toLowerCase().includes(searchTerm.toLowerCase()) ||
        transaction.by.toLowerCase().includes(searchTerm.toLowerCase());

      return fundMatch && userMatch && dateMatch && searchMatch;
    });
  }, [transactions, selectedFund, selectedUser, dateRange, searchTerm]);

  const enrichedTransactions = useMemo((): EnrichedTransaction[] => {
    return filteredTransactions.map((transaction) => ({
      ...transaction,
      fund_name:
        funds.find((f) => f.id === transaction.fund_id)?.fund_name ||
        "Unknown Fund",
      category_name:
        categories.find((c) => c.id === transaction.category_id)
          ?.category_name || "Unknown Category",
      user_name:
        users.find((u) => u.username === transaction.by)?.name ||
        "Unknown User",
    }));
  }, [filteredTransactions, funds, categories, users]);

  // Financial calculations
  const financialMetrics = useMemo(() => {
    const incomeTransactions = enrichedTransactions.filter(
      (t) => t.type === "income"
    );
    const expenseTransactions = enrichedTransactions.filter(
      (t) => t.type === "expense"
    );

    const totalIncome = incomeTransactions.reduce(
      (sum, t) => sum + Math.abs(t.amount),
      0
    );
    const totalExpenses = Math.abs(
      expenseTransactions.reduce((sum, t) => sum + t.amount, 0)
    );
    const netWorth = totalIncome - totalExpenses;
    const expenseToIncomeRatio =
      totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
    const avgTransactionAmount =
      enrichedTransactions.length > 0
        ? enrichedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0) /
          enrichedTransactions.length
        : 0;
    const avgIncomeAmount =
      incomeTransactions.length > 0
        ? totalIncome / incomeTransactions.length
        : 0;
    const avgExpenseAmount =
      expenseTransactions.length > 0
        ? totalExpenses / expenseTransactions.length
        : 0;

    return {
      totalIncome,
      totalExpenses,
      netWorth,
      expenseToIncomeRatio,
      avgTransactionAmount,
      avgIncomeAmount,
      avgExpenseAmount,
      incomeCount: incomeTransactions.length,
      expenseCount: expenseTransactions.length,
      savingsRate:
        totalIncome > 0
          ? ((totalIncome - totalExpenses) / totalIncome) * 100
          : 0,
    };
  }, [enrichedTransactions]);

  // Spending calculations
  const totalSpending = useMemo(() => {
    return Math.abs(
      enrichedTransactions
        .filter((t) => t.type === "expense")
        .reduce((sum, t) => sum + t.amount, 0)
    );
  }, [enrichedTransactions]);

  // Projection calculations
  const spendingProjection = useMemo(() => {
    if (dateRange.preset !== "month" && dateRange.preset !== "year") {
      return null;
    }

    const now = new Date();
    const periodStart = dateRange.from;
    const periodEnd = dateRange.to;
    const currentDate = now > periodEnd ? periodEnd : now;

    const daysElapsed = differenceInDays(currentDate, periodStart) + 1;
    const totalDaysInPeriod = differenceInDays(periodEnd, periodStart) + 1;

    if (daysElapsed <= 0) return null;

    const dailyAverage = totalSpending / daysElapsed;
    const projectedTotal = dailyAverage * totalDaysInPeriod;
    const remainingDays = totalDaysInPeriod - daysElapsed;
    const projectedRemaining = dailyAverage * remainingDays;

    // Calculate progress percentage
    const progressPercentage = (daysElapsed / totalDaysInPeriod) * 100;

    // Daily spending breakdown for chart with cumulative data
    const dailyBreakdown = [];
    let cumulativeActual = 0;

    for (let i = 0; i < totalDaysInPeriod; i++) {
      const date = new Date(periodStart);
      date.setDate(date.getDate() + i);

      const dayTransactions = enrichedTransactions.filter((t) => {
        const tDate = new Date(t.datetime);
        return (
          tDate.toDateString() === date.toDateString() && t.type === "expense"
        );
      });

      const daySpending = Math.abs(
        dayTransactions.reduce((sum, t) => sum + t.amount, 0)
      );

      if (i < daysElapsed) {
        cumulativeActual += daySpending;
      }

      dailyBreakdown.push({
        day: i + 1,
        date: date.toISOString().split("T")[0],
        actual: i < daysElapsed ? cumulativeActual : null,
        projected: dailyAverage * (i + 1),
        isToday: i === daysElapsed - 1,
        isFuture: i >= daysElapsed,
      });
    }

    return {
      current: totalSpending,
      projected: projectedTotal,
      remaining: projectedRemaining,
      dailyAverage,
      daysElapsed,
      remainingDays,
      progressPercentage,
      periodType: dateRange.preset === "month" ? "month" : "year",
      dailyBreakdown,
    };
  }, [totalSpending, dateRange, enrichedTransactions]);

  // Month comparison calculations
  const monthComparison = useMemo(() => {
    if (dateRange.preset !== "month" && dateRange.preset !== "year")
      return null;

    const currentPeriod = new Date();
    const lastPeriod =
      dateRange.preset === "month"
        ? subMonths(currentPeriod, 1)
        : new Date(
            currentPeriod.getFullYear() - 1,
            currentPeriod.getMonth(),
            1
          );

    const currentPeriodTransactions = transactions.filter((t) => {
      const date = new Date(t.datetime);
      if (dateRange.preset === "month") {
        return (
          date.getMonth() === currentPeriod.getMonth() &&
          date.getFullYear() === currentPeriod.getFullYear() &&
          t.type === "expense"
        );
      } else {
        return (
          date.getFullYear() === currentPeriod.getFullYear() &&
          t.type === "expense"
        );
      }
    });

    const lastPeriodTransactions = transactions.filter((t) => {
      const date = new Date(t.datetime);
      if (dateRange.preset === "month") {
        return (
          date.getMonth() === lastPeriod.getMonth() &&
          date.getFullYear() === lastPeriod.getFullYear() &&
          t.type === "expense"
        );
      } else {
        return (
          date.getFullYear() === lastPeriod.getFullYear() &&
          t.type === "expense"
        );
      }
    });

    // Calculate average from all historical data
    const allExpenseTransactions = transactions.filter(
      (t) => t.type === "expense"
    );
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
  }, [transactions, dateRange.preset]);

  // Category spending analysis
  const spendingByCategory = useMemo(() => {
    const expenseTransactions = enrichedTransactions.filter(
      (t) => t.type === "expense"
    );
    const categorySpending = expenseTransactions.reduce((acc, transaction) => {
      const category = transaction.category_name;
      acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categorySpending)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [enrichedTransactions]);

  // Income by category analysis
  const incomeByCategory = useMemo(() => {
    const incomeTransactions = enrichedTransactions.filter(
      (t) => t.type === "income"
    );
    const categoryIncome = incomeTransactions.reduce((acc, transaction) => {
      const category = transaction.category_name;
      acc[category] = (acc[category] || 0) + Math.abs(transaction.amount);
      return acc;
    }, {} as Record<string, number>);

    return Object.entries(categoryIncome)
      .map(([name, value]) => ({ name, value }))
      .sort((a, b) => b.value - a.value);
  }, [enrichedTransactions]);

  // Monthly trend data with income and expenses
  const monthlyFinancialTrend = useMemo(() => {
    const monthlyData: Record<string, any> = {};

    enrichedTransactions.forEach((transaction) => {
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
  }, [enrichedTransactions]);

  // Monthly trend with categories for stacked bar chart
  const monthlyTrendWithCategories = useMemo(() => {
    const monthlyData: Record<string, any> = {};
    const budgetThreshold = 1000; // Set budget threshold

    enrichedTransactions
      .filter((t) => t.type === "expense")
      .forEach((transaction) => {
        const month = new Date(transaction.datetime).toLocaleDateString(
          "en-US",
          { year: "numeric", month: "short" }
        );
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
  }, [enrichedTransactions, spendingByCategory]);

  // Selected category trend data
  const selectedCategoryTrend = useMemo(() => {
    if (!selectedCategory) return [];

    const monthlyData: Record<string, number> = {};

    enrichedTransactions
      .filter(
        (t) => t.type === "expense" && t.category_name === selectedCategory
      )
      .forEach((transaction) => {
        const month = new Date(transaction.datetime).toLocaleDateString(
          "en-US",
          { year: "numeric", month: "short" }
        );
        const amount = Math.abs(transaction.amount);
        monthlyData[month] = (monthlyData[month] || 0) + amount;
      });

    return Object.entries(monthlyData)
      .map(([month, amount]) => ({ month, amount }))
      .sort(
        (a, b) => new Date(a.month).getTime() - new Date(b.month).getTime()
      );
  }, [enrichedTransactions, selectedCategory]);

  // Handle category selection
  const handleCategoryClick = useCallback(
    (categoryName: string) => {
      setSelectedCategory(
        selectedCategory === categoryName ? null : categoryName
      );
    },
    [selectedCategory]
  );

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Financial Dashboard
            </h1>
            <p className="text-muted-foreground">
              Comprehensive financial overview with interactive analytics
            </p>
          </div>

          {/* File Upload Section */}
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span className="text-sm font-medium">Upload CSV Files</span>
            </div>
            <input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e, "transactions")}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>

        {/* Data Errors */}
        {dataErrors.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Data validation errors:</p>
                {dataErrors.map((error, index) => (
                  <p key={index} className="text-sm">
                    • {error}
                  </p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
          {/* Time Range Controls */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={dateRange.preset === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRangePreset("all")}
            >
              All Time
            </Button>
            <Button
              variant={dateRange.preset === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRangePreset("month")}
            >
              This Month
            </Button>
            <Button
              variant={dateRange.preset === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRangePreset("year")}
            >
              This Year
            </Button>

            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" />
                  Custom Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Date</label>
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) =>
                        date &&
                        setDateRange((prev) => ({
                          ...prev,
                          from: date,
                          preset: "custom",
                        }))
                      }
                      initialFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To Date</label>
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) =>
                        date &&
                        setDateRange((prev) => ({
                          ...prev,
                          to: date,
                          preset: "custom",
                        }))
                      }
                    />
                  </div>
                  <Button
                    onClick={() => setIsCalendarOpen(false)}
                    className="w-full"
                  >
                    Apply Range
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>

          {/* Filters and Search */}
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search transactions..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>

            <Select value={selectedFund} onValueChange={setSelectedFund}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select fund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funds</SelectItem>
                {funds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id.toString()}>
                    {fund.fund_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.username} value={user.username}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Financial Overview Cards */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
          {/* Net Worth - Prominent Display */}
          <Card className="md:col-span-2 lg:col-span-2 border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-lg font-medium">Net Worth</CardTitle>
              <Wallet className="h-5 w-5 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-3xl font-bold ${
                  financialMetrics.netWorth >= 0
                    ? "text-green-600"
                    : "text-red-600"
                }`}
              >
                {financialMetrics.netWorth >= 0 ? "+" : ""}€
                {financialMetrics.netWorth.toFixed(2)}
              </div>
              <div className="flex items-center space-x-2 mt-2">
                {financialMetrics.netWorth >= 0 ? (
                  <ArrowUpRight className="h-4 w-4 text-green-600" />
                ) : (
                  <ArrowDownRight className="h-4 w-4 text-red-600" />
                )}
                <p className="text-sm text-muted-foreground">
                  {financialMetrics.savingsRate.toFixed(1)}% savings rate
                </p>
              </div>
            </CardContent>
          </Card>

          {/* Total Income */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Income
              </CardTitle>
              <TrendingUp className="h-4 w-4 text-green-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-600">
                €{financialMetrics.totalIncome.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {financialMetrics.incomeCount} transactions
              </p>
            </CardContent>
          </Card>

          {/* Total Expenses */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Total Expenses
              </CardTitle>
              <TrendingDown className="h-4 w-4 text-red-600" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-red-600">
                €{financialMetrics.totalExpenses.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">
                {financialMetrics.expenseCount} transactions
              </p>
            </CardContent>
          </Card>

          {/* Expense Ratio */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Expense Ratio
              </CardTitle>
              <BarChart3 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div
                className={`text-2xl font-bold ${
                  financialMetrics.expenseToIncomeRatio > 80
                    ? "text-red-600"
                    : financialMetrics.expenseToIncomeRatio > 60
                    ? "text-yellow-600"
                    : "text-green-600"
                }`}
              >
                {financialMetrics.expenseToIncomeRatio.toFixed(1)}%
              </div>
              <p className="text-xs text-muted-foreground">of income spent</p>
            </CardContent>
          </Card>

          {/* Average Transaction */}
          <Card className="border-0 shadow-lg">
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">
                Avg Transaction
              </CardTitle>
              <Activity className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                €{financialMetrics.avgTransactionAmount.toFixed(2)}
              </div>
              <p className="text-xs text-muted-foreground">per transaction</p>
            </CardContent>
          </Card>
        </div>

        {/* Spent This Month/Year Card */}
        {monthComparison && (
          <Card className="border-0 shadow-lg">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl">
                Spent this {monthComparison.periodType}
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              {/* Main spending amount */}
              <div className="text-4xl font-bold">
                €{monthComparison.current.toFixed(2)}
              </div>

              {/* Comparison with last period and average */}
              <div className="space-y-2">
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm flex items-center ${
                      monthComparison.isIncreaseFromLast
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {monthComparison.isIncreaseFromLast ? "▲" : "▼"} €
                    {Math.abs(monthComparison.differenceFromLast).toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    compared with last {monthComparison.periodType}
                  </span>
                </div>
                <div className="flex items-center space-x-2">
                  <span
                    className={`text-sm flex items-center ${
                      monthComparison.isIncreaseFromAverage
                        ? "text-red-500"
                        : "text-green-500"
                    }`}
                  >
                    {monthComparison.isIncreaseFromAverage ? "▲" : "▼"} €
                    {Math.abs(monthComparison.differenceFromAverage).toFixed(2)}
                  </span>
                  <span className="text-sm text-muted-foreground">
                    compared with average {monthComparison.periodType}
                  </span>
                </div>
              </div>

              {/* Spending projection chart */}
              {spendingProjection && (
                <div className="mt-6">
                  <ResponsiveContainer width="100%" height={300}>
                    <LineChart data={spendingProjection.dailyBreakdown}>
                      <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                      <XAxis
                        dataKey="day"
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#666" }}
                        label={{
                          value: `Day of ${spendingProjection.periodType}`,
                          position: "insideBottom",
                          offset: -5,
                        }}
                      />
                      <YAxis
                        axisLine={false}
                        tickLine={false}
                        tick={{ fontSize: 12, fill: "#666" }}
                        tickFormatter={(value) => `€${value}`}
                      />
                      <Tooltip
                        formatter={(value, name) => [
                          `€${Number(value).toFixed(2)}`,
                          name === "actual"
                            ? "Actual spending"
                            : "Projected spending",
                        ]}
                        labelFormatter={(day) => `Day ${day}`}
                        contentStyle={{
                          backgroundColor: "white",
                          border: "1px solid #e5e7eb",
                          borderRadius: "8px",
                          boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                        }}
                      />
                      {/* Actual spending line (green) */}
                      <Line
                        type="monotone"
                        dataKey="actual"
                        stroke="#10b981"
                        strokeWidth={3}
                        dot={false}
                        connectNulls={false}
                      />
                      {/* Projected spending line (gray dotted) */}
                      <Line
                        type="monotone"
                        dataKey="projected"
                        stroke="#9ca3af"
                        strokeWidth={2}
                        strokeDasharray="5 5"
                        dot={false}
                      />
                    </LineChart>
                  </ResponsiveContainer>

                  {/* End of period estimate */}
                  <div className="mt-4 text-center">
                    <span className="text-sm text-muted-foreground">
                      End of {spendingProjection.periodType} estimate:
                    </span>
                    <span className="text-lg font-semibold ml-2">
                      €{spendingProjection.projected.toFixed(2)}
                    </span>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Main Dashboard Content */}
        <div className="space-y-6">
          {/* Interactive Monthly Category Spending Chart */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <div className="flex items-center justify-between">
                <div>
                  <CardTitle className="text-lg">
                    {selectedCategory
                      ? `${selectedCategory} Spending Over Time`
                      : "Monthly Spending by Category"}
                  </CardTitle>
                  <CardDescription>
                    {selectedCategory
                      ? `Detailed view of ${selectedCategory} expenses`
                      : "Click on a category icon to view detailed trends"}
                  </CardDescription>
                </div>
                {selectedCategory && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setSelectedCategory(null)}
                    className="flex items-center space-x-2"
                  >
                    <X className="h-4 w-4" />
                    <span>Back to All Categories</span>
                  </Button>
                )}
              </div>
            </CardHeader>
            <CardContent>
              {/* Category Icons */}
              {!selectedCategory && (
                <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
                  {spendingByCategory.map((category, index) => {
                    const IconComponent = getCategoryIcon(category.name);
                    return (
                      <button
                        key={category.name}
                        onClick={() => handleCategoryClick(category.name)}
                        className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                        title={`Click to view ${category.name} trends`}
                      >
                        <IconComponent
                          className="h-5 w-5"
                          style={{ color: COLORS[index % COLORS.length] }}
                        />
                        <span className="text-sm font-medium">
                          {category.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          €{category.value.toFixed(0)}
                        </span>
                      </button>
                    );
                  })}
                </div>
              )}

              <ResponsiveContainer width="100%" height={400}>
                {selectedCategory ? (
                  <BarChart
                    data={selectedCategoryTrend}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#666" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#666" }}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `€${Number(value).toFixed(2)}`,
                        selectedCategory,
                      ]}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Bar
                      dataKey="amount"
                      fill={
                        COLORS[
                          spendingByCategory.findIndex(
                            (c) => c.name === selectedCategory
                          ) % COLORS.length
                        ]
                      }
                      radius={[4, 4, 0, 0]}
                    />
                  </BarChart>
                ) : (
                  <BarChart
                    data={monthlyTrendWithCategories}
                    margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                    <XAxis
                      dataKey="month"
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#666" }}
                    />
                    <YAxis
                      axisLine={false}
                      tickLine={false}
                      tick={{ fontSize: 12, fill: "#666" }}
                      tickFormatter={(value) => `€${value}`}
                    />
                    <Tooltip
                      formatter={(value, name) => [
                        `€${Number(value).toFixed(2)}`,
                        name,
                      ]}
                      contentStyle={{
                        backgroundColor: "white",
                        border: "1px solid #e5e7eb",
                        borderRadius: "8px",
                        boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                      }}
                    />
                    <Legend />

                    {/* Stacked bars for each category */}
                    {spendingByCategory.map((category, index) => (
                      <Bar
                        key={category.name}
                        dataKey={category.name}
                        stackId="spending"
                        fill={COLORS[index % COLORS.length]}
                        radius={
                          index === spendingByCategory.length - 1
                            ? [4, 4, 0, 0]
                            : [0, 0, 0, 0]
                        }
                      />
                    ))}

                    {/* Budget threshold line */}
                    <Line
                      type="monotone"
                      dataKey="budgetThreshold"
                      stroke="#ef4444"
                      strokeWidth={2}
                      strokeDasharray="8 8"
                      dot={false}
                    />
                  </BarChart>
                )}
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Income vs Expenses Trend */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle className="text-lg">
                Income vs Expenses Trend
              </CardTitle>
              <CardDescription>
                Monthly financial performance with net worth tracking
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={400}>
                <ComposedChart
                  data={monthlyFinancialTrend}
                  margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
                  <XAxis
                    dataKey="month"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#666" }}
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fontSize: 12, fill: "#666" }}
                    tickFormatter={(value) => `€${value}`}
                  />
                  <Tooltip
                    formatter={(value, name) => [
                      `€${Number(value).toFixed(2)}`,
                      name === "income"
                        ? "Income"
                        : name === "expenses"
                        ? "Expenses"
                        : "Net Worth",
                    ]}
                    contentStyle={{
                      backgroundColor: "white",
                      border: "1px solid #e5e7eb",
                      borderRadius: "8px",
                      boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                    }}
                  />
                  <Legend />

                  <Bar
                    dataKey="income"
                    fill="#10b981"
                    name="Income"
                    radius={[4, 4, 0, 0]}
                  />
                  <Bar
                    dataKey="expenses"
                    fill="#ef4444"
                    name="Expenses"
                    radius={[4, 4, 0, 0]}
                  />
                  <Line
                    type="monotone"
                    dataKey="netWorth"
                    stroke="#3b82f6"
                    strokeWidth={3}
                    name="Net Worth"
                    dot={{ fill: "#3b82f6", strokeWidth: 2, r: 4 }}
                  />
                </ComposedChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Category Analysis */}
          <div className="grid gap-4 md:grid-cols-2">
            {/* Expense Categories */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Expense Categories</CardTitle>
                <CardDescription>Spending distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={spendingByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {spendingByCategory.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={COLORS[index % COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `€${Number(value).toFixed(2)}`,
                        "Amount",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>

            {/* Income Categories */}
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle>Income Sources</CardTitle>
                <CardDescription>Income distribution</CardDescription>
              </CardHeader>
              <CardContent>
                <ResponsiveContainer width="100%" height={300}>
                  <PieChart>
                    <Pie
                      data={incomeByCategory}
                      cx="50%"
                      cy="50%"
                      labelLine={false}
                      label={({ name, percent }) =>
                        `${name} ${(percent * 100).toFixed(0)}%`
                      }
                      outerRadius={80}
                      fill="#8884d8"
                      dataKey="value"
                    >
                      {incomeByCategory.map((entry, index) => (
                        <Cell
                          key={`cell-${index}`}
                          fill={INCOME_COLORS[index % INCOME_COLORS.length]}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) => [
                        `€${Number(value).toFixed(2)}`,
                        "Amount",
                      ]}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </CardContent>
            </Card>
          </div>

          {/* Financial Health Indicators */}
          <div className="grid gap-4 md:grid-cols-3">
            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Savings Rate</CardTitle>
                <CardDescription>Percentage of income saved</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div
                    className={`text-3xl font-bold ${
                      financialMetrics.savingsRate >= 20
                        ? "text-green-600"
                        : financialMetrics.savingsRate >= 10
                        ? "text-yellow-600"
                        : "text-red-600"
                    }`}
                  >
                    {financialMetrics.savingsRate.toFixed(1)}%
                  </div>
                  <div className="w-full bg-gray-200 rounded-full h-3">
                    <div
                      className={`h-3 rounded-full transition-all duration-300 ${
                        financialMetrics.savingsRate >= 20
                          ? "bg-green-600"
                          : financialMetrics.savingsRate >= 10
                          ? "bg-yellow-600"
                          : "bg-red-600"
                      }`}
                      style={{
                        width: `${Math.min(
                          financialMetrics.savingsRate,
                          100
                        )}%`,
                      }}
                    />
                  </div>
                  <p className="text-sm text-muted-foreground">
                    {financialMetrics.savingsRate >= 20
                      ? "Excellent"
                      : financialMetrics.savingsRate >= 10
                      ? "Good"
                      : "Needs Improvement"}
                  </p>
                </div>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Average Income</CardTitle>
                <CardDescription>Per transaction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-600">
                  €{financialMetrics.avgIncomeAmount.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {financialMetrics.incomeCount} income transactions
                </p>
              </CardContent>
            </Card>

            <Card className="border-0 shadow-lg">
              <CardHeader>
                <CardTitle className="text-lg">Average Expense</CardTitle>
                <CardDescription>Per transaction</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-red-600">
                  €{financialMetrics.avgExpenseAmount.toFixed(2)}
                </div>
                <p className="text-sm text-muted-foreground mt-2">
                  {financialMetrics.expenseCount} expense transactions
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Transaction History */}
          <Card className="border-0 shadow-lg">
            <CardHeader>
              <CardTitle>Recent Transactions</CardTitle>
              <CardDescription>
                {enrichedTransactions.length} transactions found
                {searchTerm && ` matching "${searchTerm}"`}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Date</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Amount</TableHead>
                    <TableHead>Category</TableHead>
                    <TableHead>Fund</TableHead>
                    <TableHead>User</TableHead>
                    <TableHead>Note</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {enrichedTransactions
                    .sort(
                      (a, b) =>
                        new Date(b.datetime).getTime() -
                        new Date(a.datetime).getTime()
                    )
                    .slice(0, 10)
                    .map((transaction) => (
                      <TableRow key={transaction.id}>
                        <TableCell>
                          {new Date(transaction.datetime).toLocaleDateString()}
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={
                              transaction.type === "income"
                                ? "default"
                                : "destructive"
                            }
                          >
                            {transaction.type}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <span
                            className={
                              transaction.type === "income"
                                ? "text-green-600 font-semibold"
                                : "text-red-600 font-semibold"
                            }
                          >
                            {transaction.type === "income" ? "+" : ""}€
                            {Math.abs(transaction.amount).toFixed(2)}
                          </span>
                        </TableCell>
                        <TableCell>{transaction.category_name}</TableCell>
                        <TableCell>{transaction.fund_name}</TableCell>
                        <TableCell>{transaction.user_name}</TableCell>
                        <TableCell className="max-w-[200px] truncate">
                          {transaction.note}
                        </TableCell>
                      </TableRow>
                    ))}
                </TableBody>
              </Table>
              {enrichedTransactions.length > 10 && (
                <p className="text-sm text-muted-foreground mt-4 text-center">
                  Showing first 10 transactions. Use filters to narrow down
                  results.
                </p>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
