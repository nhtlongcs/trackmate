"use client";
import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { SpendingProjectionData, MonthComparisonData } from "@/types";

interface SpendingAnalysisProps {
  monthComparison: MonthComparisonData;
  spendingProjection: SpendingProjectionData;
}

export const SpendingAnalysis: React.FC<SpendingAnalysisProps> = ({
  monthComparison,
  spendingProjection,
}) => {
  if (!monthComparison || !spendingProjection) {
    return null; // Or some loading/error state
  }

  return (
    <Card className="border-0 shadow-lg">
      <CardHeader className="pb-4">
        <CardTitle className="text-xl">
          Spent this {monthComparison.periodType}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Main spending amount */}
        <div className="text-4xl font-bold">
          €{monthComparison.current.toFixed(2)}
        </div>
        {/* Comparison with last period and average */}
        <div className="space-y-2">
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm flex items-center ${
                monthComparison.isIncreaseFromLast
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {monthComparison.isIncreaseFromLast ? "▲" : "▼"} €
              {Math.abs(monthComparison.differenceFromLast).toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">
              compared with last {monthComparison.periodType}
            </span>
          </div>
          <div className="flex items-center space-x-2">
            <span
              className={`text-sm flex items-center ${
                monthComparison.isIncreaseFromAverage
                  ? "text-red-500"
                  : "text-green-500"
              }`}
            >
              {monthComparison.isIncreaseFromAverage ? "▲" : "▼"} €
              {Math.abs(monthComparison.differenceFromAverage).toFixed(2)}
            </span>
            <span className="text-sm text-muted-foreground">
              compared with average {monthComparison.periodType}
            </span>
          </div>
        </div>
        {/* Spending projection chart */}
        <div className="mt-6">
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={spendingProjection.dailyBreakdown}>
              <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
              <XAxis
                dataKey="day"
                axisLine={false}
                tickLine={false}
                tick={{ fontSize: 12, fill: "#666" }}
                label={{
                  value: `Day of ${spendingProjection.periodType}`,
                  position: "insideBottom",
                  offset: -5,
                }}
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
                  name === "actual" ? "Actual spending" : "Projected spending",
                ]}
                labelFormatter={(day) => `Day ${day}`}
                contentStyle={{
                  backgroundColor: "white",
                  border: "1px solid #e5e7eb",
                  borderRadius: "8px",
                  boxShadow: "0 4px 6px -1px rgba(0, 0, 0, 0.1)",
                }}
              />
              {/* Actual spending line (green) */}
              <Line
                type="monotone"
                dataKey="actual"
                stroke="#10b981"
                strokeWidth={3}
                dot={false}
                connectNulls={false} // Important: don't connect if actual is null
              />
              {/* Projected spending line (gray dotted) */}
              <Line
                type="monotone"
                dataKey="projected"
                stroke="#9ca3af"
                strokeWidth={2}
                strokeDasharray="5 5"
                dot={false}
              />
            </LineChart>
          </ResponsiveContainer>
          {/* End of period estimate */}
          <div className="mt-4 text-center">
            <span className="text-sm text-muted-foreground">
              End of {spendingProjection.periodType} estimate:
            </span>
            <span className="text-lg font-semibold ml-2">
              €{spendingProjection.projected.toFixed(2)}
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
