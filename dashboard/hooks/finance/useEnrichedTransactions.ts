// hooks/useEnrichedTransactions.ts
import { useMemo } from "react";
import { Transaction, EnrichedTransaction, User, Fund, Category } from "@/types";

export const useEnrichedTransactions = (
    filteredTransactions: Transaction[],
    users: User[],
    funds: Fund[],
    categories: Category[]
): EnrichedTransaction[] => {
    return useMemo(() => {
        return filteredTransactions.map((transaction) => ({
            ...transaction,
            fund_name: funds.find((f) => f.id === transaction.fund_id)?.fund_name || "Unknown Fund",
            category_name: categories.find((c) => c.id === transaction.category_id)?.category_name || "Unknown Category",
            user_name: users.find((u) => u.username === transaction.by)?.name || transaction.by || "Unknown User",
        }));
    }, [filteredTransactions, funds, categories, users]);
};