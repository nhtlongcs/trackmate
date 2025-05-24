// src/components/financial/CategorySpending.tsx
"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
  Line,
} from "recharts";
import { X } from "lucide-react";
import { CategoryValue, MonthlyCategoryTrend } from "@/app/types";
import { getCategoryIcon, COLORS } from "@/app/lib/utils";

interface CategorySpendingProps {
  spendingByCategory: CategoryValue[];
  monthlyTrendWithCategories: MonthlyCategoryTrend[];
  selectedCategory: string | null;
  selectedCategoryTrend: { month: string; amount: number }[];
  onCategoryClick: (categoryName: string) => void;
}

export const CategorySpending: React.FC<CategorySpendingProps> = ({
  spendingByCategory,
  monthlyTrendWithCategories,
  selectedCategory,
  selectedCategoryTrend,
  onCategoryClick,
}) => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="text-lg">
              {selectedCategory
                ? `${selectedCategory} Spending Over Time`
                : "Monthly Spending by Category"}
            </CardTitle>
            <CardDescription>
              {selectedCategory
                ? `Detailed view of ${selectedCategory} expenses`
                : "Click on a category icon to view detailed trends"}
            </CardDescription>
          </div>
          {selectedCategory && (
            <Button
              variant="outline"
              size="sm"
              onClick={() => onCategoryClick(selectedCategory)} // Effectively deselects
              className="flex items-center space-x-2"
            >
              <X className="h-4 w-4" />
              <span>Back to All Categories</span>
            </Button>
          )}
        </div>
      </CardHeader>
      <CardContent>
        {/* Category Icons */}
        {!selectedCategory && (
          <div className="flex flex-wrap gap-3 mb-6 p-4 bg-gray-50 rounded-lg">
            {spendingByCategory.map((category, index) => {
              const IconComponent = getCategoryIcon(category.name);
              return (
                <button
                  key={category.name}
                  onClick={() => onCategoryClick(category.name)}
                  className="flex items-center space-x-2 px-3 py-2 bg-white rounded-lg border hover:border-blue-300 hover:shadow-md transition-all duration-200 cursor-pointer"
                  title={`Click to view ${category.name} trends`}
                >
                  <IconComponent
                    className="h-5 w-5"
                    style={{ color: COLORS[index % COLORS.length] }}
                  />
                  <span className="text-sm font-medium">{category.name}</span>
                  <span className="text-xs text-muted-foreground">
                    €{category.value.toFixed(0)}
                  </span>
                </button>
              );
            })}
          </div>
        )}
        <ResponsiveContainer width="100%" height={400}>
          {selectedCategory ? (
            <BarChart
              data={selectedCategoryTrend}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#666" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#666" }}
                tickFormatter={(value) => `€${value}`}
              />
              <Tooltip
                formatter={(value) => [
                  `€${Number(value).toFixed(2)}`,
                  selectedCategory,
                ]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Bar
                dataKey="amount"
                fill={
                  COLORS[
                    spendingByCategory.findIndex(
                      (c) => c.name === selectedCategory
                    ) % COLORS.length
                  ] || COLORS[0] // Fallback color
                }
                radius={[4, 4, 0, 0]}
              />
            </BarChart>
          ) : (
            <BarChart
              data={monthlyTrendWithCategories}
              margin={{ top: 20, right: 30, left: 20, bottom: 5 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="month"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#666" }}
              />
              <YAxis
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#666" }}
                tickFormatter={(value) => `€${value}`}
              />
              <Tooltip
                formatter={(value, name) => [
                  `€${Number(value).toFixed(2)}`,
                  name,
                ]}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              <Legend />
              {/* Stacked bars for each category */}
              {spendingByCategory.map((category, index) => (
                <Bar
                  key={category.name}
                  dataKey={category.name}
                  stackId="spending"
                  fill={COLORS[index % COLORS.length]}
                  radius={
                    index === spendingByCategory.length - 1
                      ? [4, 4, 0, 0]
                      : [0, 0, 0, 0]
                  }
                />
              ))}
              {/* Budget threshold line */}
              <Line
                type="monotone"
                dataKey="budgetThreshold"
                stroke="#ef4444"
                strokeWidth={2}
                strokeDasharray="8 8"
                dot={false}
                name="Budget Threshold"
              />
            </BarChart>
          )}
        </ResponsiveContainer>
      </CardContent>
    </Card>
  );
};
