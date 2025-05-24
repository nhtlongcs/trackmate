// hooks/useFilters.ts
import { useState, useMemo, useCallback } from "react";
import { Transaction, Fund, Category, DateRange } from "@/types";
import {
    startOfYear, startOfMonth, endOfMonth, endOfYear, isWithinInterval
} from "date-fns";

export const useFilters = (
    transactions: Transaction[],
    categories: Category[],
    funds: Fund[]
) => {
    const [selectedFund, setSelectedFund] = useState<string>("all");
    const [selectedUser, setSelectedUser] = useState<string>("all");
    const [searchTerm, setSearchTerm] = useState<string>("");
    const [dateRange, setDateRange] = useState<DateRange>({
        from: startOfMonth(new Date()), // Default to current month start
        to: endOfMonth(new Date()),   // Default to current month end
        preset: "month",
    });

    const setDateRangePreset = useCallback((preset: string) => {
        const now = new Date();
        let from: Date;
        let to: Date;
        switch (preset) {
            case "all": from = new Date(2000, 0, 1); to = new Date(2070, 11, 31); break;
            case "month": from = startOfMonth(now); to = endOfMonth(now); break;
            case "year": from = startOfYear(now); to = endOfYear(now); break;
            default: from = startOfMonth(now); to = endOfMonth(now); preset="month";
        }
        setDateRange({ from, to, preset });
    }, []);

    const filteredTransactions = useMemo(() => {
        return transactions.filter((transaction) => {
            const fundMatch = selectedFund === "all" || transaction.fund_id.toString() === selectedFund;
            const userMatch = selectedUser === "all" || transaction.by === selectedUser;
            const transactionDate = new Date(transaction.datetime);

            if (isNaN(transactionDate.getTime())) return false;

            const dateMatch = dateRange.preset === "all" ||
                isWithinInterval(transactionDate, { start: dateRange.from, end: dateRange.to });

            const searchTermLower = searchTerm.toLowerCase();
            const searchMatch = searchTerm === "" ||
                transaction.note?.toLowerCase().includes(searchTermLower) ||
                transaction.by?.toLowerCase().includes(searchTermLower) ||
                (categories.find(c => c.id === transaction.category_id)?.category_name || "").toLowerCase().includes(searchTermLower) ||
                (funds.find(f => f.id === transaction.fund_id)?.fund_name || "").toLowerCase().includes(searchTermLower);

            return fundMatch && userMatch && dateMatch && searchMatch;
        });
    }, [transactions, selectedFund, selectedUser, dateRange, searchTerm, categories, funds]);

    return {
        selectedFund,
        setSelectedFund,
        selectedUser,
        setSelectedUser,
        searchTerm,
        setSearchTerm,
        dateRange,
        setDateRange,
        setDateRangePreset,
        filteredTransactions,
    };
};