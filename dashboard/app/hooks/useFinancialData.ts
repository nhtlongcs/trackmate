// src/hooks/useFinancialData.ts
import { useState, useMemo, useCallback } from "react";
import {
  Transaction, User, Fund, Category, EnrichedTransaction,
  FinancialMetrics, SpendingProjectionData, MonthComparisonData,
  CategoryValue, MonthlyTrend, MonthlyCategoryTrend
} from "@/app/types";
import {
  sampleTransactions as initialTransactions, sampleUsers, sampleFunds, sampleCategories, generateSampleTransactions
} from "@/app/lib/data";
import {
  startOfYear, startOfMonth, endOfMonth, endOfYear, isWithinInterval,
  differenceInDays, subMonths
} from "date-fns";
import { parseCSV } from "@/app/lib/utils";


export const useFinancialData = () => {
    const [transactions, setTransactions] = useState<Transaction[]>(generateSampleTransactions());
    const [users, setUsers] = useState<User[]>(sampleUsers);
    const [funds, setFunds] = useState<Fund[]>(sampleFunds);
    const [categories, setCategories] = useState<Category[]>(sampleCategories);
    const [selectedFund, setSelectedFund] = useState<string>("all");
    const [selectedUser, setSelectedUser] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [dataErrors, setDataErrors] = useState<string[]>([]);
    const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
    const [dateRange, setDateRange] = useState<{ from: Date; to: Date; preset: string; }>({
        from: new Date(2025, 4, 1), // May 1, 2025
        to: new Date(2025, 4, 31), // May 31, 2025
        preset: "month",
    });

    const validateAndParseTransactions = useCallback((data: string[][]): Transaction[] => {
        const errors: string[] = [];
        const validTransactions: Transaction[] = [];
        if (data.length < 2) {
            errors.push("Transaction file must have at least a header and one data row");
            setDataErrors(errors);
            return [];
        }
        const headers = data[0];
        const expectedHeaders = [ "id", "datetime", "amount", "currency", "fund_id", "category_id", "created_at", "updated_at", "by", "note", "type", ];

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
                if ( isNaN(transaction.id) || isNaN(transaction.amount) || isNaN(transaction.fund_id) || isNaN(transaction.category_id) ) {
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
    }, []);

    const handleFileUpload = useCallback((
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
                // Add similar handlers for other file types if needed
                default:
                    break;
            }
        };
        reader.readAsText(file);
    }, [parseCSV, validateAndParseTransactions]);

    const setDateRangePreset = useCallback((preset: string) => {
        const now = new Date();
        let from: Date;
        let to: Date;
        switch (preset) {
            case "all": from = new Date(2020, 0, 1); to = new Date(2030, 11, 31); break;
            case "month": from = startOfMonth(now); to = endOfMonth(now); break;
            case "year": from = startOfYear(now); to = endOfYear(now); break;
            default: from = startOfYear(now); to = now;
        }
        setDateRange({ from, to, preset });
    }, []);

    const filteredTransactions = useMemo(() => {
        return transactions.filter((transaction) => {
            const fundMatch = selectedFund === "all" || transaction.fund_id.toString() === selectedFund;
            const userMatch = selectedUser === "all" || transaction.by === selectedUser;
            const transactionDate = new Date(transaction.datetime);
            const dateMatch = dateRange.preset === "all" || isWithinInterval(transactionDate, { start: dateRange.from, end: dateRange.to });
            const searchMatch = searchTerm === "" || transaction.note.toLowerCase().includes(searchTerm.toLowerCase()) || transaction.by.toLowerCase().includes(searchTerm.toLowerCase());
            return fundMatch && userMatch && dateMatch && searchMatch;
        });
    }, [transactions, selectedFund, selectedUser, dateRange, searchTerm]);

    const enrichedTransactions = useMemo((): EnrichedTransaction[] => {
        return filteredTransactions.map((transaction) => ({
            ...transaction,
            fund_name: funds.find((f) => f.id === transaction.fund_id)?.fund_name || "Unknown Fund",
            category_name: categories.find((c) => c.id === transaction.category_id)?.category_name || "Unknown Category",
            user_name: users.find((u) => u.username === transaction.by)?.name || "Unknown User",
        }));
    }, [filteredTransactions, funds, categories, users]);

    // ... (Keep all the useMemo calculation functions here)
    // - financialMetrics
    // - totalSpending
    // - spendingProjection
    // - monthComparison
    // - spendingByCategory
    // - incomeByCategory
    // - monthlyFinancialTrend
    // - monthlyTrendWithCategories
    // - selectedCategoryTrend

     const financialMetrics = useMemo((): FinancialMetrics => { /* ... calculation ... */ return {} as FinancialMetrics }, [enrichedTransactions]);
     const totalSpending = useMemo(() => { /* ... calculation ... */ return 0; }, [enrichedTransactions]);
     const spendingProjection = useMemo((): SpendingProjectionData | null => { /* ... calculation ... */ return null; }, [totalSpending, dateRange, enrichedTransactions]);
     const monthComparison = useMemo((): MonthComparisonData | null => { /* ... calculation ... */ return null; }, [transactions, dateRange.preset]);
     const spendingByCategory = useMemo((): CategoryValue[] => { /* ... calculation ... */ return []; }, [enrichedTransactions]);
     const incomeByCategory = useMemo((): CategoryValue[] => { /* ... calculation ... */ return []; }, [enrichedTransactions]);
     const monthlyFinancialTrend = useMemo((): MonthlyTrend[] => { /* ... calculation ... */ return []; }, [enrichedTransactions]);
     const monthlyTrendWithCategories = useMemo((): MonthlyCategoryTrend[] => { /* ... calculation ... */ return []; }, [enrichedTransactions, spendingByCategory]);
     const selectedCategoryTrend = useMemo(() => { /* ... calculation ... */ return []; }, [enrichedTransactions, selectedCategory]);


    const handleCategoryClick = useCallback((categoryName: string) => {
        setSelectedCategory(selectedCategory === categoryName ? null : categoryName);
    }, [selectedCategory]);

    return {
        transactions: enrichedTransactions, // Return enriched for display
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
        isCalendarOpen: false, // Manage this state locally in the Controls component or pass setter
        setIsCalendarOpen: () => {}, // Placeholder
        dataErrors,
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