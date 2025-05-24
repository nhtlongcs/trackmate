import { useState, useCallback } from "react";
import { useFinancialState } from "@/hooks/finance/useFinancialState";
import { useFilters } from "@/hooks/finance/useFilters";
import { useEnrichedTransactions } from "@/hooks/finance/useEnrichedTransactions";
import {
    useFinancialMetrics,
    useSpendingProjection,
    useMonthComparison,
    useSpendingByCategory,
    useIncomeByCategory,
    useMonthlyFinancialTrend,
    useMonthlyTrendWithCategories,
    useSelectedCategoryTrend,
} from "@/hooks/finance/useFinancialCalculations";

export const useFinancialData = () => {
    // 1. Core State & Loading
    const {
        transactions: rawTransactions,
        users,
        funds,
        categories,
        dataErrors,
        setDataErrors,
        handleFileUpload,
    } = useFinancialState();

    // 2. Filters & Filtered Transactions
    const {
        selectedFund, setSelectedFund,
        selectedUser, setSelectedUser,
        searchTerm, setSearchTerm,
        dateRange, setDateRange,
        setDateRangePreset,
        filteredTransactions,
    } = useFilters(rawTransactions, categories, funds);

    // 3. Enriched Transactions
    const enrichedTransactions = useEnrichedTransactions(
        filteredTransactions,
        users,
        funds,
        categories
    );

    // 4. Calculations
    const financialMetrics = useFinancialMetrics(enrichedTransactions);
    const spendingProjection = useSpendingProjection(enrichedTransactions, dateRange);
    const monthComparison = useMonthComparison(rawTransactions, dateRange); // Needs raw for history
    const spendingByCategory = useSpendingByCategory(enrichedTransactions);
    const incomeByCategory = useIncomeByCategory(enrichedTransactions);
    const monthlyFinancialTrend = useMonthlyFinancialTrend(enrichedTransactions);
    const monthlyTrendWithCategories = useMonthlyTrendWithCategories(enrichedTransactions, categories, dateRange);

    // 5. Category Selection & Trend
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const selectedCategoryTrend = useSelectedCategoryTrend(enrichedTransactions, selectedCategory);
    const handleCategoryClick = useCallback((categoryName: string) => {
        setSelectedCategory(prev => prev === categoryName ? null : categoryName);
    }, []);

    // 6. Return the combined API
    return {
        transactions: enrichedTransactions, // Export enriched as primary
        rawTransactions,
        users,
        funds,
        categories,
        selectedFund,
        setSelectedFund,
        selectedUser,
        setSelectedUser,
        searchTerm,
        setSearchTerm,
        dateRange,
        setDateRange,
        setDateRangePreset,
        dataErrors,
        setDataErrors,
        handleFileUpload,
        financialMetrics,
        spendingProjection,
        monthComparison,
        spendingByCategory,
        incomeByCategory,
        monthlyFinancialTrend,
        monthlyTrendWithCategories,
        selectedCategory,
        selectedCategoryTrend,
        handleCategoryClick,
    };
};