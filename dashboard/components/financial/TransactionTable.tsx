"use client";
import React from "react";
import {
  Card,
  CardContent,
  CardHeader,
  CardTitle,
  CardDescription,
} from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { EnrichedTransaction } from "@/types";

interface TransactionTableProps {
  transactions: EnrichedTransaction[];
  searchTerm: string;
}

export const TransactionTable: React.FC<TransactionTableProps> = ({
  transactions,
  searchTerm,
}) => {
  return (
    <Card className="border-0 shadow-lg">
      <CardHeader>
        <CardTitle>Recent Transactions</CardTitle>
        <CardDescription>
          {transactions.length} transactions found
          {searchTerm && ` matching "${searchTerm}"`}
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Date</TableHead>
              <TableHead>Type</TableHead>
              <TableHead>Amount</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Fund</TableHead>
              <TableHead>User</TableHead>
              <TableHead>Note</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {transactions
              .sort(
                (a, b) =>
                  new Date(b.datetime).getTime() -
                  new Date(a.datetime).getTime()
              )
              .slice(0, 10) // Display only top 10, or implement pagination
              .map((transaction) => (
                <TableRow key={transaction.id}>
                  <TableCell>
                    {new Date(transaction.datetime).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <Badge
                      variant={
                        transaction.type === "income"
                          ? "default" // Assuming 'default' is styled for income (e.g., green)
                          : "destructive" // Assuming 'destructive' is styled for expense (e.g., red)
                      }
                      // Tailwind classes for custom badge colors if variants are not sufficient
                      className={
                        transaction.type === "income"
                          ? "bg-green-100 text-green-800"
                          : "bg-red-100 text-red-800"
                      }
                    >
                      {transaction.type}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <span
                      className={
                        transaction.type === "income"
                          ? "text-green-600 font-semibold"
                          : "text-red-600 font-semibold"
                      }
                    >
                      {transaction.type === "income" ? "+" : ""}€
                      {Math.abs(transaction.amount).toFixed(2)}
                    </span>
                  </TableCell>
                  <TableCell>{transaction.category_name}</TableCell>
                  <TableCell>{transaction.fund_name}</TableCell>
                  <TableCell>{transaction.user_name}</TableCell>
                  <TableCell className="max-w-[200px] truncate">
                    {transaction.note}
                  </TableCell>
                </TableRow>
              ))}
          </TableBody>
        </Table>
        {transactions.length === 0 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            No transactions found for the selected filters.
          </p>
        )}
        {transactions.length > 10 && (
          <p className="text-sm text-muted-foreground mt-4 text-center">
            Showing first 10 transactions. Use filters to narrow down results.
          </p>
        )}
      </CardContent>
    </Card>
  );
};
