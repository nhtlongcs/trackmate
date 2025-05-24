import { useState, useMemo, useCallback } from "react";
import {
  Transaction, User, Fund, Category, EnrichedTransaction,
  FinancialMetrics, SpendingProjectionData, MonthComparisonData,
  CategoryValue, MonthlyTrend, MonthlyCategoryTrend
} from "@/types";
import {
    startOfYear, startOfMonth, endOfMonth, endOfYear, isWithinInterval,
    differenceInDays, subMonths, format // Added format for monthlyFinancialTrend
} from "date-fns";
import { parseCSV } from "@/lib/utils";

// --- sample data ---
import { generateSampleTransactions } from "@/samples/transactions";
import { sampleUsers } from "@/samples/users";
import { sampleFunds } from "@/samples/funds";
import { sampleCategories } from "@/samples/categories";
// --- sample data ---

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
        setDataErrors([]); // Clear previous errors

        if (data.length < 2) {
            errors.push("Transaction file must have at least a header and one data row.");
            setDataErrors(errors);
            return [];
        }
        const headers = data[0].map(h => h.trim().toLowerCase()); // Normalize headers
        const expectedHeaders = [ "id", "datetime", "amount", "currency", "fund_id", "category_id", "created_at", "updated_at", "by", "note", "type", ];

        for (const header of expectedHeaders) {
            if (!headers.includes(header)) {
                errors.push(`Missing required header: ${header}.`);
            }
        }

        // Check for extra headers or mismatched headers
        if (headers.length !== expectedHeaders.length) {
            // errors.push(`Header mismatch. Expected ${expectedHeaders.length} columns, got ${headers.length}.`);
        }


        if (errors.length > 0) {
            setDataErrors(errors);
            return [];
        }

        for (let i = 1; i < data.length; i++) {
            const row = data[i];
             if (row.length !== expectedHeaders.length) {
                errors.push(`Row ${i + 1}: Expected ${expectedHeaders.length} columns, but got ${row.length}. Skipping row.`);
                continue;
            }
            try {
                const transactionData: any = {};
                headers.forEach((header, index) => {
                    transactionData[header] = row[index];
                });

                const transaction: Transaction = {
                    id: Number.parseInt(transactionData.id),
                    datetime: transactionData.datetime,
                    amount: Number.parseFloat(transactionData.amount),
                    currency: transactionData.currency,
                    fund_id: Number.parseInt(transactionData.fund_id),
                    category_id: Number.parseInt(transactionData.category_id),
                    created_at: transactionData.created_at,
                    updated_at: transactionData.updated_at,
                    by: transactionData.by,
                    note: transactionData.note,
                    type: transactionData.type as "income" | "expense",
                };

                if (!["income", "expense"].includes(transaction.type)) {
                     errors.push(`Row ${i + 1}: Invalid transaction type "${transaction.type}". Must be "income" or "expense".`);
                     continue;
                }
                if ( isNaN(transaction.id) || isNaN(transaction.amount) || isNaN(transaction.fund_id) || isNaN(transaction.category_id) ) {
                    errors.push(`Row ${i + 1}: Invalid numerical data (id, amount, fund_id, or category_id).`);
                    continue;
                }
                 if (!transaction.datetime || isNaN(new Date(transaction.datetime).getTime())) {
                    errors.push(`Row ${i + 1}: Invalid datetime format for "${transaction.datetime}".`);
                    continue;
                }
                validTransactions.push(transaction);
            } catch (error: any) {
                errors.push(`Error parsing row ${i + 1}: ${error.message}`);
            }
        }
        if (errors.length > 0) {
            setDataErrors(errors);
        } else if (validTransactions.length === 0) {
            setDataErrors(["No valid transactions found in the uploaded file."]);
        } else {
            setDataErrors([]); // Clear errors if successful
        }
        return validTransactions;
    }, []);

    const handleFileUpload = useCallback((
        event: React.ChangeEvent<HTMLInputElement>,
        type: "transactions" // Simplified for now
    ) => {
        const file = event.target.files?.[0];
        if (!file) return;
        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target?.result as string;
            const data = parseCSV(csvText);
            if (type === "transactions") {
                const newTransactions = validateAndParseTransactions(data);
                if (newTransactions.length > 0) {
                    setTransactions(newTransactions);
                    setDataErrors([]); // Clear errors on successful load
                } else if (dataErrors.length === 0) { // If validateAndParseTransactions didn't set errors but returned empty
                    setDataErrors(["No valid transactions could be parsed from the file."]);
                }
            }
        };
        reader.onerror = () => {
            setDataErrors(["Error reading the file."]);
        };
        reader.readAsText(file);
    }, [validateAndParseTransactions, dataErrors]); // Added dataErrors

    const setDateRangePreset = useCallback((preset: string) => {
        const now = new Date(); // Use current date for "This Month" / "This Year"
        let from: Date;
        let to: Date;
        switch (preset) {
            case "all": from = new Date(2000, 0, 1); to = new Date(2070, 11, 31); break; // Wider range for "all"
            case "month": from = startOfMonth(now); to = endOfMonth(now); break;
            case "year": from = startOfYear(now); to = endOfYear(now); break;
            default: // Default to current month if preset is unrecognized
                from = startOfMonth(now); to = endOfMonth(now); preset="month";
        }
        setDateRange({ from, to, preset });
    }, []);

    const filteredTransactions = useMemo(() => {
        return transactions.filter((transaction) => {
            const fundMatch = selectedFund === "all" || transaction.fund_id.toString() === selectedFund;
            const userMatch = selectedUser === "all" || transaction.by === selectedUser;

            const transactionDate = new Date(transaction.datetime);
             if (isNaN(transactionDate.getTime())) return false; // Invalid date in transaction

            const dateMatch = dateRange.preset === "all" ||
                (dateRange.from && dateRange.to && isWithinInterval(transactionDate, { start: dateRange.from, end: dateRange.to }));

            const searchTermLower = searchTerm.toLowerCase();
            const searchMatch = searchTerm === "" ||
                transaction.note?.toLowerCase().includes(searchTermLower) ||
                transaction.by?.toLowerCase().includes(searchTermLower) ||
                (categories.find(c => c.id === transaction.category_id)?.category_name || "").toLowerCase().includes(searchTermLower) ||
                (funds.find(f => f.id === transaction.fund_id)?.fund_name || "").toLowerCase().includes(searchTermLower);

            return fundMatch && userMatch && dateMatch && searchMatch;
        });
    }, [transactions, selectedFund, selectedUser, dateRange, searchTerm, categories, funds]);

    const enrichedTransactions = useMemo((): EnrichedTransaction[] => {
        return filteredTransactions.map((transaction) => ({
            ...transaction,
            fund_name: funds.find((f) => f.id === transaction.fund_id)?.fund_name || "Unknown Fund",
            category_name: categories.find((c) => c.id === transaction.category_id)?.category_name || "Unknown Category",
            user_name: users.find((u) => u.username === transaction.by)?.name || transaction.by || "Unknown User", // Fallback to username if name not found
        }));
    }, [filteredTransactions, funds, categories, users]);

    const financialMetrics = useMemo((): FinancialMetrics => {
        const incomeTransactions = enrichedTransactions.filter(t => t.type === "income");
        const expenseTransactions = enrichedTransactions.filter(t => t.type === "expense");

        const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const totalExpenses = Math.abs(expenseTransactions.reduce((sum, t) => sum + t.amount, 0)); // Expenses are negative
        const netWorth = totalIncome - totalExpenses;

        const expenseToIncomeRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;

        const totalTransactionAmountSum = enrichedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const avgTransactionAmount = enrichedTransactions.length > 0 ? totalTransactionAmountSum / enrichedTransactions.length : 0;

        const avgIncomeAmount = incomeTransactions.length > 0 ? totalIncome / incomeTransactions.length : 0;
        const avgExpenseAmount = expenseTransactions.length > 0 ? totalExpenses / expenseTransactions.length : 0;
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;


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
            savingsRate: savingsRate,
        };
    }, [enrichedTransactions]);

    const totalSpending = useMemo(() => {
        return Math.abs(
            enrichedTransactions
                .filter((t) => t.type === "expense")
                .reduce((sum, t) => sum + t.amount, 0) // amount is negative for expenses
        );
    }, [enrichedTransactions]);

    const spendingProjection = useMemo((): SpendingProjectionData | null => {
        if (dateRange.preset !== "month" && dateRange.preset !== "year") {
            return null;
        }
        if (!dateRange.from || !dateRange.to) return null;

        const now = new Date();
        const periodStart = dateRange.from;
        const periodEnd = dateRange.to;

        // Ensure currentDate does not exceed periodEnd, especially for future periods
        const currentDateInPeriod = now > periodEnd ? periodEnd : (now < periodStart ? periodStart : now);

        const daysElapsed = differenceInDays(currentDateInPeriod, periodStart) + 1;
        const totalDaysInPeriod = differenceInDays(periodEnd, periodStart) + 1;

        if (daysElapsed <= 0 || totalDaysInPeriod <=0) return null;

        const currentPeriodExpenses = enrichedTransactions.filter(t => {
            const tDate = new Date(t.datetime);
            return t.type === 'expense' && isWithinInterval(tDate, { start: periodStart, end: currentDateInPeriod });
        }).reduce((sum, t) => sum + Math.abs(t.amount), 0);


        const dailyAverage = daysElapsed > 0 ? currentPeriodExpenses / daysElapsed : 0;
        const projectedTotal = dailyAverage * totalDaysInPeriod;
        const remainingDays = Math.max(0, totalDaysInPeriod - daysElapsed);
        const projectedRemaining = dailyAverage * remainingDays;
        const progressPercentage = totalDaysInPeriod > 0 ? (daysElapsed / totalDaysInPeriod) * 100 : 0;

        const dailyBreakdown: SpendingProjectionData['dailyBreakdown'] = [];
        let cumulativeActual = 0;

        for (let i = 0; i < totalDaysInPeriod; i++) {
            const date = new Date(periodStart);
            date.setDate(date.getDate() + i);

            const dayTransactions = enrichedTransactions.filter((t) => {
                const tDate = new Date(t.datetime);
                return tDate.toDateString() === date.toDateString() && t.type === "expense";
            });
            const daySpending = Math.abs(dayTransactions.reduce((sum, t) => sum + t.amount, 0));

            if (date <= currentDateInPeriod) { // Calculate cumulative for past and current days
                cumulativeActual += daySpending;
            }

            dailyBreakdown.push({
                day: i + 1,
                date: format(date, "yyyy-MM-dd"),
                actual: date <= currentDateInPeriod ? cumulativeActual : null,
                projected: dailyAverage * (i + 1),
                isToday: date.toDateString() === now.toDateString() && date <= periodEnd && date >= periodStart,
                isFuture: date > currentDateInPeriod,
            });
        }

        return {
            current: currentPeriodExpenses,
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


    const monthComparison = useMemo((): MonthComparisonData | null => {
        if (dateRange.preset !== "month" && dateRange.preset !== "year") return null;
        if (!dateRange.from || !dateRange.to) return null;

        const currentPeriodStart = dateRange.from;
        const currentPeriodEnd = dateRange.to;

        let lastPeriodStart: Date;
        let lastPeriodEnd: Date;

        if (dateRange.preset === "month") {
            lastPeriodStart = startOfMonth(subMonths(currentPeriodStart, 1));
            lastPeriodEnd = endOfMonth(subMonths(currentPeriodStart, 1));
        } else { // year
            lastPeriodStart = startOfYear(subMonths(currentPeriodStart, 12)); // sub 12 months to get previous year
            lastPeriodEnd = endOfYear(subMonths(currentPeriodStart, 12));
        }

        const getCurrentPeriodSpending = (start: Date, end: Date) => {
            return Math.abs(transactions
                .filter(t => {
                    const date = new Date(t.datetime);
                    return t.type === 'expense' && isWithinInterval(date, { start, end });
                })
                .reduce((sum, t) => sum + t.amount, 0));
        };

        const currentSpending = getCurrentPeriodSpending(currentPeriodStart, currentPeriodEnd);
        const lastPeriodSpending = getCurrentPeriodSpending(lastPeriodStart, lastPeriodEnd);

        // Average spending calculation based on the period type
        const historicalSpending: Record<string, number> = {};
        transactions.filter(t => t.type === 'expense').forEach(t => {
            const date = new Date(t.datetime);
            const key = dateRange.preset === 'month' ? format(date, 'yyyy-MM') : format(date, 'yyyy');
            historicalSpending[key] = (historicalSpending[key] || 0) + Math.abs(t.amount);
        });

        const averageSpendingValues = Object.values(historicalSpending);
        const averageSpending = averageSpendingValues.length > 0 ? averageSpendingValues.reduce((sum, val) => sum + val, 0) / averageSpendingValues.length : 0;

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
            periodType: dateRange.preset as "month" | "year",
        };
    }, [transactions, dateRange]);

    const spendingByCategory = useMemo((): CategoryValue[] => {
        const expenseTransactions = enrichedTransactions.filter(t => t.type === "expense");
        const categorySpending: Record<string, number> = {};
        expenseTransactions.forEach(transaction => {
            const category = transaction.category_name;
            categorySpending[category] = (categorySpending[category] || 0) + Math.abs(transaction.amount);
        });
        return Object.entries(categorySpending)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [enrichedTransactions]);

    const incomeByCategory = useMemo((): CategoryValue[] => {
        const incomeTransactions = enrichedTransactions.filter(t => t.type === "income");
        const categoryIncome: Record<string, number> = {};
        incomeTransactions.forEach(transaction => {
            const category = transaction.category_name;
            categoryIncome[category] = (categoryIncome[category] || 0) + Math.abs(transaction.amount);
        });
        return Object.entries(categoryIncome)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [enrichedTransactions]);

    const monthlyFinancialTrend = useMemo((): MonthlyTrend[] => {
        const monthlyData: Record<string, { month: string; income: number; expenses: number; netWorth: number; budgetThreshold: number; dateObject: Date }> = {};

        enrichedTransactions.forEach((transaction) => {
            const date = new Date(transaction.datetime);
            const monthYear = format(date, "MMM yyyy"); // e.g., "Jan 2024"
            const monthDateObject = startOfMonth(date); // For sorting

            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { month: monthYear, income: 0, expenses: 0, netWorth: 0, budgetThreshold: 1000, dateObject: monthDateObject };
            }
            if (transaction.type === "income") {
                monthlyData[monthYear].income += Math.abs(transaction.amount);
            } else {
                monthlyData[monthYear].expenses += Math.abs(transaction.amount);
            }
        });

        return Object.values(monthlyData)
            .map(data => ({ ...data, netWorth: data.income - data.expenses }))
            .sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime());
    }, [enrichedTransactions]);


    const monthlyTrendWithCategories = useMemo((): MonthlyCategoryTrend[] => {
        const monthlyData: Record<string, MonthlyCategoryTrend & { dateObject: Date }> = {};
        const budgetThreshold = 1000;

        const expenseCategories = categories.filter(c => c.type === 'expense').map(c => c.category_name);

        enrichedTransactions
            .filter((t) => t.type === "expense")
            .forEach((transaction) => {
                const date = new Date(transaction.datetime);
                const monthYear = format(date, "MMM yyyy");
                const monthDateObject = startOfMonth(date);
                const category = transaction.category_name;
                const amount = Math.abs(transaction.amount);

                if (!monthlyData[monthYear]) {
                    monthlyData[monthYear] = { month: monthYear, budgetThreshold, dateObject: monthDateObject } as MonthlyCategoryTrend & { dateObject: Date };
                    expenseCategories.forEach(catName => {
                         monthlyData[monthYear][catName] = 0;
                    });
                }
                 // Ensure category exists as a key before adding to it
                if (monthlyData[monthYear][category] === undefined) {
                    monthlyData[monthYear][category] = 0;
                }
                monthlyData[monthYear][category] = (monthlyData[monthYear][category] || 0) + amount;
            });

        return Object.values(monthlyData).sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime());
    }, [enrichedTransactions, categories]); // Added categories dependency

    const selectedCategoryTrend = useMemo(() => {
        if (!selectedCategory) return [];
        const monthlyData: Record<string, { month: string; amount: number; dateObject: Date }> = {};

        enrichedTransactions
            .filter(t => t.type === "expense" && t.category_name === selectedCategory)
            .forEach((transaction) => {
                const date = new Date(transaction.datetime);
                const monthYear = format(date, "MMM yyyy");
                const monthDateObject = startOfMonth(date);
                const amount = Math.abs(transaction.amount);

                if (!monthlyData[monthYear]) {
                    monthlyData[monthYear] = { month: monthYear, amount: 0, dateObject: monthDateObject };
                }
                monthlyData[monthYear].amount += amount;
            });

        return Object.values(monthlyData)
            .sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime())
            .map(({month, amount}) => ({month, amount})); // Return only month and amount for the chart
    }, [enrichedTransactions, selectedCategory]);


    const handleCategoryClick = useCallback((categoryName: string) => {
        setSelectedCategory(prevSelectedCategory => prevSelectedCategory === categoryName ? null : categoryName);
    }, []);

    return {
        transactions: enrichedTransactions,
        rawTransactions: transactions, // Keep raw for some calculations if needed
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
        setDataErrors, // Allow clearing errors from UI if needed
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
