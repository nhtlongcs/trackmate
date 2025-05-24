"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import {
  format,
  subMonths,
  startOfMonth,
  endOfMonth,
  parseISO,
} from "date-fns";

// Import components
import { DashboardHeader } from "./components/dashboard/Header";
import { FinancialMetrics } from "./components/dashboard/FinancialMetrics";
import { FinancialTrend } from "./components/dashboard/FinancialTrend";
import { CategoryAnalysis } from "./components/dashboard/CategoryAnalysis";
import { SpendingProjection } from "./components/dashboard/SpendingProjection";
import { TransactionHistory } from "./components/dashboard/TransactionHistory";

// Import types and utilities
import {
  Transaction,
  User,
  Fund,
  Category,
  EnrichedTransaction,
  DateRange,
} from "./types";
import { generateSampleTransactions as generateTransactions } from "./data/generateData";
import { sampleUsers, sampleFunds, sampleCategories } from "./data/sampleData";
import {
  enrichTransactions,
  filterTransactions,
  calculateFinancialMetrics,
  calculateMonthComparison,
  calculateSpendingProjection,
  getSpendingByCategory,
  getMonthlyFinancialTrend,
  getCategoryTrend,
} from "./utils/transactionUtils";

export default function Dashboard() {
  // State management
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [enrichedTransactions, setEnrichedTransactions] = useState<
    EnrichedTransaction[]
  >([]);
  const [filteredTransactions, setFilteredTransactions] = useState<
    EnrichedTransaction[]
  >([]);
  const [users, setUsers] = useState<User[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFund, setSelectedFund] = useState("all");
  const [selectedUser, setSelectedUser] = useState("all");
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [dateRange, setDateRange] = useState<DateRange>({
    from: startOfMonth(new Date()),
    to: endOfMonth(new Date()),
    preset: "month",
  });

  // Initialize with sample data
  useEffect(() => {
    const loadSampleData = async () => {
      try {
        setIsLoading(true);

        // Generate sample transactions
        const generatedTransactions = generateTransactions();
        setTransactions(generatedTransactions);

        // Set other sample data
        setUsers(sampleUsers);
        setFunds(sampleFunds);
        setCategories(sampleCategories);

        // Enrich transactions with additional data
        const enriched = enrichTransactions(
          generatedTransactions,
          sampleUsers,
          sampleFunds,
          sampleCategories
        );

        setEnrichedTransactions(enriched);
        setFilteredTransactions(enriched);
      } catch (error) {
        console.error("Error loading sample data:", error);
      } finally {
        setIsLoading(false);
      }
    };

    loadSampleData();
  }, []);

  // Filter transactions based on filters
  useEffect(() => {
    if (enrichedTransactions.length === 0) return;

    const filtered = filterTransactions(
      enrichedTransactions,
      dateRange,
      selectedFund,
      selectedUser,
      searchTerm
    );

    // Apply category filter if selected
    const categoryFiltered = selectedCategory
      ? filtered.filter((t) => t.category_name === selectedCategory)
      : filtered;

    setFilteredTransactions(categoryFiltered);
  }, [
    enrichedTransactions,
    searchTerm,
    selectedFund,
    selectedUser,
    dateRange,
    selectedCategory,
  ]);

  // Calculate financial metrics
  const financialMetrics = useMemo(
    () => calculateFinancialMetrics(filteredTransactions),
    [filteredTransactions]
  );

  // Calculate derived metrics
  const totalIncome =
    financialMetrics.avgIncomeAmount * financialMetrics.incomeCount;
  const totalExpenses =
    financialMetrics.avgExpenseAmount * financialMetrics.expenseCount;
  const netWorth = totalIncome - totalExpenses;

  // Calculate month comparison
  const monthComparison = useMemo(() => {
    const currentMonth = {
      from: dateRange.from,
      to: dateRange.to,
      preset: dateRange.preset || "month",
    };

    return calculateMonthComparison(enrichedTransactions, currentMonth);
  }, [enrichedTransactions, dateRange]);

  // Prepare financial trend data
  const financialTrendData = useMemo(() => {
    const trend = getMonthlyFinancialTrend(enrichedTransactions, 6);
    return trend.map((item) => ({
      month: item.month,
      income: item.income,
      expenses: item.expenses,
      netWorth: item.income - item.expenses,
    }));
  }, [enrichedTransactions]);

  // Calculate spending projection
  const spendingProjection = useMemo(() => {
    return calculateSpendingProjection(filteredTransactions, dateRange);
  }, [filteredTransactions, dateRange]);

  // Get spending by category
  const spendingByCategory = useMemo(
    () => getSpendingByCategory(filteredTransactions),
    [filteredTransactions]
  );

  // For now, using empty array for income by category as the function doesn't support it
  const incomeByCategory: { name: string; value: number; icon: string }[] = [];

  // Get category trend for selected category
  const selectedCategoryTrend = useMemo(() => {
    if (!selectedCategory) return [];
    const trend = getCategoryTrend(enrichedTransactions, selectedCategory);
    return trend.map((item) => ({
      month: item.month,
      amount: item.value,
    }));
  }, [enrichedTransactions, selectedCategory]);

  // Handle file upload
  const handleFileUpload = useCallback(
    async (event: React.ChangeEvent<HTMLInputElement>, type: string) => {
      const file = event.target.files?.[0];
      if (!file) return;

      try {
        setIsLoading(true);
        const text = await file.text();

        // Here you would parse and validate the uploaded file
        console.log(`Uploaded ${type} file:`, text);

        // TODO: Add proper file parsing and validation
        // For now, we'll just show a success message
        alert(
          `${
            type.charAt(0).toUpperCase() + type.slice(1)
          } file uploaded successfully!`
        );
      } catch (error) {
        console.error(`Error processing ${type} file:`, error);
        alert(`Failed to process ${type} file. Please try again.`);
      } finally {
        setIsLoading(false);
        // Reset the file input
        event.target.value = "";
      }
    },
    []
  );

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-t-2 border-b-2 border-blue-500 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading dashboard data...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 space-y-8">
      {/* Header with filters */}
      <DashboardHeader
        searchTerm={searchTerm}
        setSearchTerm={setSearchTerm}
        selectedFund={selectedFund}
        setSelectedFund={setSelectedFund}
        selectedUser={selectedUser}
        setSelectedUser={setSelectedUser}
        dateRange={dateRange}
        setDateRange={setDateRange}
        funds={funds}
        users={users}
        handleFileUpload={handleFileUpload}
      />

      {/* Financial Metrics */}
      <FinancialMetrics
        totalIncome={totalIncome}
        totalExpenses={totalExpenses}
        netWorth={netWorth}
        monthComparison={monthComparison}
      />

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
        {/* Financial Trend */}
        <FinancialTrend monthlyFinancialTrend={financialTrendData} />

        {/* Spending Projection */}
        <SpendingProjection
          spendingProjection={spendingProjection}
          monthComparison={monthComparison}
        />
      </div>

      {/* Category Analysis */}
      <CategoryAnalysis
        spendingByCategory={spendingByCategory}
        incomeByCategory={incomeByCategory}
        selectedCategory={selectedCategory}
        onCategorySelect={setSelectedCategory}
        selectedCategoryTrend={selectedCategoryTrend}
      />

      {/* Transaction History */}
      <TransactionHistory
        transactions={filteredTransactions}
        searchTerm={searchTerm}
      />
    </div>
  );
}
