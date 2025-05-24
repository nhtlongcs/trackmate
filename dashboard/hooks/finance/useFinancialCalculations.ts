// hooks/useFinancialCalculations.ts
import { useMemo } from "react";
import {
    EnrichedTransaction, FinancialMetrics, SpendingProjectionData,
    MonthComparisonData, CategoryValue, MonthlyTrend, MonthlyCategoryTrend,
    Category, DateRange, Transaction // Added Transaction for monthComparison
} from "@/types";
import {
    startOfYear, startOfMonth, endOfMonth, endOfYear, isWithinInterval,
    differenceInDays, subMonths, format
} from "date-fns";

// --- Financial Metrics ---
export const useFinancialMetrics = (enrichedTransactions: EnrichedTransaction[]): FinancialMetrics => {
    return useMemo(() => {
        const incomeTransactions = enrichedTransactions.filter(t => t.type === "income");
        const expenseTransactions = enrichedTransactions.filter(t => t.type === "expense");
        const totalIncome = incomeTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const totalExpenses = Math.abs(expenseTransactions.reduce((sum, t) => sum + t.amount, 0));
        const netWorth = totalIncome - totalExpenses;
        const expenseToIncomeRatio = totalIncome > 0 ? (totalExpenses / totalIncome) * 100 : 0;
        const totalTransactionAmountSum = enrichedTransactions.reduce((sum, t) => sum + Math.abs(t.amount), 0);
        const avgTransactionAmount = enrichedTransactions.length > 0 ? totalTransactionAmountSum / enrichedTransactions.length : 0;
        const avgIncomeAmount = incomeTransactions.length > 0 ? totalIncome / incomeTransactions.length : 0;
        const avgExpenseAmount = expenseTransactions.length > 0 ? totalExpenses / expenseTransactions.length : 0;
        const savingsRate = totalIncome > 0 ? ((totalIncome - totalExpenses) / totalIncome) * 100 : 0;

        return {
            totalIncome, totalExpenses, netWorth, expenseToIncomeRatio,
            avgTransactionAmount, avgIncomeAmount, avgExpenseAmount,
            incomeCount: incomeTransactions.length, expenseCount: expenseTransactions.length,
            savingsRate
        };
    }, [enrichedTransactions]);
};

// --- Spending Projection ---
export const useSpendingProjection = (
    enrichedTransactions: EnrichedTransaction[],
    dateRange: DateRange
): SpendingProjectionData | null => {
    return useMemo(() => {
        if (dateRange.preset !== "month" && dateRange.preset !== "year") return null;
        if (!dateRange.from || !dateRange.to) return null;

        const now = new Date();
        const periodStart = dateRange.from;
        const periodEnd = dateRange.to;
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
        const progressPercentage = (daysElapsed / totalDaysInPeriod) * 100;

        const dailyBreakdown: SpendingProjectionData['dailyBreakdown'] = [];
        let cumulativeActual = 0;

        for (let i = 0; i < totalDaysInPeriod; i++) {
            const date = new Date(periodStart);
            date.setDate(date.getDate() + i);
            const daySpending = Math.abs(enrichedTransactions
                .filter(t => new Date(t.datetime).toDateString() === date.toDateString() && t.type === "expense")
                .reduce((sum, t) => sum + t.amount, 0));

            if (date <= currentDateInPeriod) cumulativeActual += daySpending;

            dailyBreakdown.push({
                day: i + 1, date: format(date, "yyyy-MM-dd"),
                actual: date <= currentDateInPeriod ? cumulativeActual : null,
                projected: dailyAverage * (i + 1),
                isToday: date.toDateString() === now.toDateString() && date <= periodEnd && date >= periodStart,
                isFuture: date > currentDateInPeriod,
            });
        }
        return {
            current: currentPeriodExpenses, projected: projectedTotal, remaining: projectedRemaining,
            dailyAverage, daysElapsed, remainingDays, progressPercentage,
            periodType: dateRange.preset as "month" | "year", dailyBreakdown
        };
    }, [dateRange, enrichedTransactions]);
};

// --- Month Comparison ---
export const useMonthComparison = (
    rawTransactions: Transaction[], // Use raw for full historical data
    dateRange: DateRange
): MonthComparisonData | null => {
    return useMemo(() => {
        if (dateRange.preset !== "month" && dateRange.preset !== "year") return null;
        if (!dateRange.from || !dateRange.to) return null;

        const currentPeriodStart = dateRange.from;
        const currentPeriodEnd = dateRange.to;
        let lastPeriodStart: Date;
        let lastPeriodEnd: Date;

        if (dateRange.preset === "month") {
            lastPeriodStart = startOfMonth(subMonths(currentPeriodStart, 1));
            lastPeriodEnd = endOfMonth(subMonths(currentPeriodStart, 1));
        } else {
            lastPeriodStart = startOfYear(subMonths(currentPeriodStart, 12));
            lastPeriodEnd = endOfYear(subMonths(currentPeriodStart, 12));
        }

        const getSpending = (start: Date, end: Date) => Math.abs(rawTransactions
            .filter(t => t.type === 'expense' && isWithinInterval(new Date(t.datetime), { start, end }))
            .reduce((sum, t) => sum + t.amount, 0));

        const currentSpending = getSpending(currentPeriodStart, currentPeriodEnd);
        const lastPeriodSpending = getSpending(lastPeriodStart, lastPeriodEnd);

        const historicalSpending: Record<string, number> = {};
        rawTransactions.filter(t => t.type === 'expense').forEach(t => {
            const date = new Date(t.datetime);
            const key = dateRange.preset === 'month' ? format(date, 'yyyy-MM') : format(date, 'yyyy');
            historicalSpending[key] = (historicalSpending[key] || 0) + Math.abs(t.amount);
        });

        const values = Object.values(historicalSpending);
        const averageSpending = values.length > 0 ? values.reduce((s, v) => s + v, 0) / values.length : 0;
        const differenceFromLast = currentSpending - lastPeriodSpending;
        const differenceFromAverage = currentSpending - averageSpending;

        return {
            current: currentSpending, previous: lastPeriodSpending, average: averageSpending,
            differenceFromLast, differenceFromAverage,
            isIncreaseFromLast: differenceFromLast > 0, isIncreaseFromAverage: differenceFromAverage > 0,
            periodType: dateRange.preset as "month" | "year",
        };
    }, [rawTransactions, dateRange]);
};

// --- Spending By Category ---
export const useSpendingByCategory = (enrichedTransactions: EnrichedTransaction[]): CategoryValue[] => {
    return useMemo(() => {
        const categorySpending: Record<string, number> = {};
        enrichedTransactions
            .filter(t => t.type === "expense")
            .forEach(t => {
                categorySpending[t.category_name] = (categorySpending[t.category_name] || 0) + Math.abs(t.amount);
            });
        return Object.entries(categorySpending)
            .map(([name, value]) => ({ name, value }))
            .sort((a, b) => b.value - a.value);
    }, [enrichedTransactions]);
};

// --- Income By Category ---
export const useIncomeByCategory = (enrichedTransactions: EnrichedTransaction[]): CategoryValue[] => {
     return useMemo(() => {
        // const categoryIncome: Record<string, number> = {};
        // enrichedTransactions
        //     .filter(t => t.type === "income")
        //     .forEach(t => {
        //         categoryIncome[t.category_name] = (categoryIncome[t.category_name] || 0) + Math.abs(t.amount);
        //     });
        // return Object.entries(categoryIncome)
        //     .map(([name, value]) => ({ name, value }))
        //     .sort((a, b) => b.value - a.value);
        const expenseTransactions = enrichedTransactions.filter((t) => t.type === "expense")
        const categorySpending = expenseTransactions.reduce(
        (acc, transaction) => {
            const category = transaction.category_name
            acc[category] = (acc[category] || 0) + Math.abs(transaction.amount)
            return acc
        },
        {} as Record<string, number>,
        )

        return Object.entries(categorySpending)
        .map(([name, value]) => ({ name, value }))
        .sort((a, b) => b.value - a.value)
    }, [enrichedTransactions]);
};

// --- Monthly Financial Trend ---
export const useMonthlyFinancialTrend = (enrichedTransactions: EnrichedTransaction[]): MonthlyTrend[] => {
    return useMemo(() => {
        const monthlyData: Record<string, { month: string; income: number; expenses: number; dateObject: Date }> = {};
        enrichedTransactions.forEach((t) => {
            const date = new Date(t.datetime);
            const monthYear = format(date, "MMM yyyy");
            const monthDateObject = startOfMonth(date);

            if (!monthlyData[monthYear]) {
                monthlyData[monthYear] = { month: monthYear, income: 0, expenses: 0, dateObject: monthDateObject };
            }
            if (t.type === "income") monthlyData[monthYear].income += Math.abs(t.amount);
            else monthlyData[monthYear].expenses += Math.abs(t.amount);
        });

        return Object.values(monthlyData)
            .map(d => ({ ...d, netWorth: d.income - d.expenses, budgetThreshold: 1000 })) // Add netWorth and budget
            .sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime());
    }, [enrichedTransactions]);
};

// --- Monthly Trend With Categories ---
export const useMonthlyTrendWithCategories = (
    enrichedTransactions: EnrichedTransaction[],
    categories: Category[],
    dateRange: DateRange
): MonthlyCategoryTrend[] => {
    return useMemo(() => {
        // const monthlyData: Record<string, MonthlyCategoryTrend & { dateObject: Date }> = {};
        const budgetThreshold = 1000;
        // const expenseCategories = categories.filter(c => c.type === 'expense').map(c => c.category_name);

        // enrichedTransactions
        //     .filter((t) => t.type === "expense")
        //     .forEach((t) => {
        //         const date = new Date(t.datetime);
        //         const monthYear = format(date, "MMM yyyy");
        //         const monthDateObject = startOfMonth(date);

        //         if (!monthlyData[monthYear]) {
        //             monthlyData[monthYear] = { month: monthYear, budgetThreshold, dateObject: monthDateObject } as any;
        //             expenseCategories.forEach(cat => { monthlyData[monthYear][cat] = 0; });
        //         }
        //         if (monthlyData[monthYear][t.category_name] !== undefined) {
        //             monthlyData[monthYear][t.category_name] = (monthlyData[monthYear][t.category_name] as number) + Math.abs(t.amount);
        //         }
        //     });

        // return Object.values(monthlyData).sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime());

        if (dateRange.preset === "month") {
            // For month view, show daily data
            const dailyData: Record<string, any> = {}
            const startDate = dateRange.from
            const endDate = dateRange.to
    
            // Initialize all days in the month
            for (let d = new Date(startDate); d <= endDate; d.setDate(d.getDate() + 1)) {
            const dayKey = d.getDate().toString()
            dailyData[dayKey] = {
                day: dayKey,
                date: d.toISOString().split("T")[0],
                budgetThreshold: budgetThreshold / 30, // Daily budget threshold
            }
            categories.forEach((cat) => {
                dailyData[dayKey][cat.category_name] = 0
            })
            }
    
            enrichedTransactions
            .filter((t) => t.type === "expense")
            .forEach((transaction) => {
                const transactionDate = new Date(transaction.datetime)
                const dayKey = transactionDate.getDate().toString()
                const category = transaction.category_name
                const amount = Math.abs(transaction.amount)
    
                if (dailyData[dayKey]) {
                dailyData[dayKey][category] = (dailyData[dayKey][category] || 0) + amount
                }
            })
    
            return Object.values(dailyData).sort((a: any, b: any) => Number.parseInt(a.day) - Number.parseInt(b.day))
        } else {
            // For other views, show monthly data
            const monthlyData: Record<string, any> = {}
    
            enrichedTransactions
            .filter((t) => t.type === "expense")
            .forEach((transaction) => {
                const month = new Date(transaction.datetime).toLocaleDateString("en-US", { year: "numeric", month: "short" })
                const category = transaction.category_name
                const amount = Math.abs(transaction.amount)
    
                if (!monthlyData[month]) {
                monthlyData[month] = { month, budgetThreshold }
                spendingByCategory.forEach((cat) => {
                    monthlyData[month][cat.name] = 0
                })
                }
    
                monthlyData[month][category] = (monthlyData[month][category] || 0) + amount
            })
    
            return Object.values(monthlyData).sort(
            (a: any, b: any) => new Date(a.month).getTime() - new Date(b.month).getTime(),
            )
        }
    }, [enrichedTransactions, categories]);
};

// --- Selected Category Trend ---
export const useSelectedCategoryTrend = (
    enrichedTransactions: EnrichedTransaction[],
    selectedCategory: string | null
): { month: string; amount: number; }[] => {
     return useMemo(() => {
        if (!selectedCategory) return [];
        const monthlyData: Record<string, { month: string; amount: number; dateObject: Date }> = {};

        enrichedTransactions
            .filter(t => t.type === "expense" && t.category_name === selectedCategory)
            .forEach((t) => {
                const date = new Date(t.datetime);
                const monthYear = format(date, "MMM yyyy");
                const monthDateObject = startOfMonth(date);

                if (!monthlyData[monthYear]) {
                    monthlyData[monthYear] = { month: monthYear, amount: 0, dateObject: monthDateObject };
                }
                monthlyData[monthYear].amount += Math.abs(t.amount);
            });

        return Object.values(monthlyData)
            .sort((a, b) => a.dateObject.getTime() - b.dateObject.getTime())
            .map(({ month, amount }) => ({ month, amount }));
    }, [enrichedTransactions, selectedCategory]);
};