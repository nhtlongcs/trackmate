// src/components/financial/FinancialOverview.tsx
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Wallet,
  TrendingUp,
  TrendingDown,
  BarChart3,
  Activity,
  ArrowUpRight,
  ArrowDownRight,
} from "lucide-react";
import { FinancialMetrics, defaultFinancialMetrics } from "@/app/types";

interface FinancialOverviewProps {
  metrics: FinancialMetrics;
}

export const FinancialOverview: React.FC<FinancialOverviewProps> = ({
  metrics = defaultFinancialMetrics,
}) => {
  return (
    <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-6">
      {/* Net Worth */}
      <Card className="md:col-span-2 lg:col-span-2 border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-lg font-medium">Net Worth</CardTitle>
          <Wallet className="h-5 w-5 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-3xl font-bold ${
              (metrics.netWorth ?? 0) >= 0 ? "text-green-600" : "text-red-600"
            }`}
          >
            {(metrics.netWorth ?? 0) >= 0 ? "+" : ""}€
            {(metrics.netWorth ?? 0).toFixed(2)}
          </div>
          <div className="flex items-center space-x-2 mt-2">
            {metrics.netWorth >= 0 ? (
              <ArrowUpRight className="h-4 w-4 text-green-600" />
            ) : (
              <ArrowDownRight className="h-4 w-4 text-red-600" />
            )}
            <p className="text-sm text-muted-foreground">
              {(metrics.savingsRate ?? 0).toFixed(1)}% savings rate
            </p>
          </div>
        </CardContent>
      </Card>
      {/* Total Income */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Income</CardTitle>
          <TrendingUp className="h-4 w-4 text-green-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-green-600">
            €{(metrics.totalIncome ?? 0).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.incomeCount ?? 0} transactions
          </p>
        </CardContent>
      </Card>
      {/* Total Expenses */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Total Expenses</CardTitle>
          <TrendingDown className="h-4 w-4 text-red-600" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold text-red-600">
            €{(metrics.totalExpenses ?? 0).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">
            {metrics.expenseCount ?? 0} transactions
          </p>
        </CardContent>
      </Card>
      {/* Expense Ratio */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Expense Ratio</CardTitle>
          <BarChart3 className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div
            className={`text-2xl font-bold ${
              metrics.expenseToIncomeRatio > 80
                ? "text-red-600"
                : metrics.expenseToIncomeRatio > 60
                ? "text-yellow-600"
                : "text-green-600"
            }`}
          >
            {(metrics.expenseToIncomeRatio ?? 0).toFixed(1)}%
          </div>
          <p className="text-xs text-muted-foreground">of income spent</p>
        </CardContent>
      </Card>
      {/* Average Transaction */}
      <Card className="border-0 shadow-lg">
        <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
          <CardTitle className="text-sm font-medium">Avg Transaction</CardTitle>
          <Activity className="h-4 w-4 text-muted-foreground" />
        </CardHeader>
        <CardContent>
          <div className="text-2xl font-bold">
            €{(metrics.avgTransactionAmount ?? 0).toFixed(2)}
          </div>
          <p className="text-xs text-muted-foreground">per transaction</p>
        </CardContent>
      </Card>
    </div>
  );
};
