"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { FinancialMetrics, defaultFinancialMetrics } from "@/app/types";

interface FinancialHealthProps {
  metrics: FinancialMetrics;
}

export const FinancialHealth: React.FC<FinancialHealthProps> = ({
  metrics = defaultFinancialMetrics,
}) => {
  return (
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
                metrics.savingsRate >= 20
                  ? "text-green-600"
                  : metrics.savingsRate >= 10
                  ? "text-yellow-600"
                  : "text-red-600"
              }`}
            >
              {(metrics.savingsRate ?? 0).toFixed(1)}%
            </div>
            <div className="w-full bg-gray-200 rounded-full h-3">
              <div
                className={`h-3 rounded-full transition-all duration-300 ${
                  metrics.savingsRate >= 20
                    ? "bg-green-600"
                    : metrics.savingsRate >= 10
                    ? "bg-yellow-600"
                    : "bg-red-600"
                }`}
                style={{
                  width: `${Math.max(0, Math.min(metrics.savingsRate, 100))}%`,
                }}
              />
            </div>
            <p className="text-sm text-muted-foreground">
              {metrics.savingsRate >= 20
                ? "Excellent"
                : metrics.savingsRate >= 10
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
            €{(metrics.avgIncomeAmount ?? 0).toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {metrics.incomeCount} income transactions
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
            €{(metrics.avgExpenseAmount ?? 0).toFixed(2)}
          </div>
          <p className="text-sm text-muted-foreground mt-2">
            {metrics.expenseCount} expense transactions
          </p>
        </CardContent>
      </Card>
    </div>
  );
};
