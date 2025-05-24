// src/components/financial/CategoryPieCharts.tsx
"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { PieChart, Pie, Cell, Tooltip, ResponsiveContainer } from "recharts";
import { CategoryValue } from "@/app/types";
import { COLORS, INCOME_COLORS } from "@/app/lib/utils";

interface CategoryPieChartsProps {
  spendingByCategory: CategoryValue[];
  incomeByCategory: CategoryValue[];
}

export const CategoryPieCharts: React.FC<CategoryPieChartsProps> = ({
  spendingByCategory,
  incomeByCategory,
}) => {
  const pieLabel = ({ name, percent }: { name: string; percent: number }) =>
    `${name} ${(percent * 100).toFixed(0)}%`;

  return (
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
                label={pieLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {spendingByCategory.map((entry, index) => (
                  <Cell
                    key={`cell-expense-${index}`}
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
                label={pieLabel}
                outerRadius={80}
                fill="#8884d8"
                dataKey="value"
              >
                {incomeByCategory.map((entry, index) => (
                  <Cell
                    key={`cell-income-${index}`}
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
  );
};
