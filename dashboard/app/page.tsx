// src/app/page.tsx
"use client";
import React, { useState } from "react"; // Add useState for Calendar Popover
import { useFinancialData } from "@/hooks/useFinancialData";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Calendar } from "@/components/ui/calendar";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { CalendarIcon, Upload, Search, AlertCircle } from "lucide-react";

import { FinancialOverview } from "@/components/financial/FinancialOverview";
import { SpendingAnalysis } from "@/components/financial/SpendingAnalysis";
import { CategorySpending } from "@/components/financial/CategorySpending";
import { IncomeExpenseTrend } from "@/components/financial/IncomeExpenseTrend";
import { CategoryPieCharts } from "@/components/financial/CategoryPieCharts";
import { FinancialHealth } from "@/components/financial/FinancialHealth";
import { TransactionTable } from "@/components/financial/TransactionTable";

import { Category, Fund, Transaction, User } from "@/types";

export default function FinancialDashboard() {
  const {
    transactions,
    users,
    funds,
    dateRange,
    setDateRange,
    searchTerm,
    setSearchTerm,
    dataErrors,
    setDateRangePreset,
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
  } = useFinancialData();

  // --- default state ---
  const [selectedFund, setSelectedFund] = useState<string>("all");
  const [selectedUser, setSelectedUser] = useState<string>("all");
  const [isCalendarOpen, setIsCalendarOpen] = useState(false); // Local state for popover
  // --- default state ---

  return (
    <div className="min-h-screen bg-gray-50 p-6">
      <div className="max-w-7xl mx-auto space-y-6">
        {/* Header */}
        <div className="flex flex-col space-y-4 md:flex-row md:items-center md:justify-between md:space-y-0">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">
              Financial Dashboard
            </h1>
            <p className="text-muted-foreground">
              Comprehensive financial overview
            </p>
          </div>
          <div className="flex flex-col space-y-2">
            <div className="flex items-center space-x-2">
              <Upload className="h-4 w-4" />
              <span className="text-sm font-medium">
                Upload Transactions CSV
              </span>
            </div>
            <Input
              type="file"
              accept=".csv"
              onChange={(e) => handleFileUpload(e, "transactions")}
              className="text-sm file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
            />
          </div>
        </div>

        {/* Data Errors */}
        {dataErrors.length > 0 && (
          <Alert>
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              <div className="space-y-1">
                <p className="font-medium">Data validation errors:</p>
                {dataErrors.map((error, index) => (
                  <p key={index} className="text-sm">
                    • {error}
                  </p>
                ))}
              </div>
            </AlertDescription>
          </Alert>
        )}

        {/* Controls */}
        <div className="flex flex-col space-y-4 lg:flex-row lg:items-center lg:space-y-0 lg:space-x-4">
          {/* Time Range Controls */}
          <div className="flex flex-wrap gap-2">
            <Button
              variant={dateRange.preset === "all" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRangePreset("all")}
            >
              All Time
            </Button>
            <Button
              variant={dateRange.preset === "month" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRangePreset("month")}
            >
              This Month
            </Button>
            <Button
              variant={dateRange.preset === "year" ? "default" : "outline"}
              size="sm"
              onClick={() => setDateRangePreset("year")}
            >
              This Year
            </Button>
            <Popover open={isCalendarOpen} onOpenChange={setIsCalendarOpen}>
              <PopoverTrigger asChild>
                <Button variant="outline" size="sm">
                  <CalendarIcon className="mr-2 h-4 w-4" /> Custom Range
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <div className="p-4 space-y-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">From Date</label>
                    <Calendar
                      mode="single"
                      selected={dateRange.from}
                      onSelect={(date) =>
                        date &&
                        setDateRange((prev) => ({
                          ...prev,
                          from: date,
                          preset: "custom",
                        }))
                      }
                      initialFocus
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">To Date</label>
                    <Calendar
                      mode="single"
                      selected={dateRange.to}
                      onSelect={(date) =>
                        date &&
                        setDateRange((prev) => ({
                          ...prev,
                          to: date,
                          preset: "custom",
                        }))
                      }
                    />
                  </div>
                  <Button
                    onClick={() => setIsCalendarOpen(false)}
                    className="w-full"
                  >
                    Apply Range
                  </Button>
                </div>
              </PopoverContent>
            </Popover>
          </div>
          {/* Filters and Search */}
          <div className="flex flex-col space-y-2 md:flex-row md:space-y-0 md:space-x-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10 w-[200px]"
              />
            </div>
            <Select value={selectedFund} onValueChange={setSelectedFund}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select fund" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Funds</SelectItem>
                {funds.map((fund) => (
                  <SelectItem key={fund.id} value={fund.id.toString()}>
                    {fund.fund_name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <Select value={selectedUser} onValueChange={setSelectedUser}>
              <SelectTrigger className="w-[180px]">
                <SelectValue placeholder="Select user" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Users</SelectItem>
                {users.map((user) => (
                  <SelectItem key={user.username} value={user.username}>
                    {user.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>

        {/* Financial Overview */}
        <FinancialOverview metrics={financialMetrics} />

        {/* Spent This Month/Year */}
        {monthComparison && spendingProjection && (
          <SpendingAnalysis
            monthComparison={monthComparison}
            spendingProjection={spendingProjection}
          />
        )}

        {/* Main Dashboard Content */}
        <div className="space-y-6">
          <CategorySpending
            spendingByCategory={spendingByCategory}
            monthlyTrendWithCategories={monthlyTrendWithCategories}
            selectedCategory={selectedCategory}
            selectedCategoryTrend={selectedCategoryTrend}
            onCategoryClick={handleCategoryClick}
          />

          <IncomeExpenseTrend monthlyFinancialTrend={monthlyFinancialTrend} />

          <CategoryPieCharts
            spendingByCategory={spendingByCategory}
            incomeByCategory={incomeByCategory}
          />

          <FinancialHealth metrics={financialMetrics} />

          <TransactionTable
            transactions={transactions}
            searchTerm={searchTerm}
          />
        </div>
      </div>
    </div>
  );
}
