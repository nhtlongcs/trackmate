// hooks/useFinancialState.ts
import { useState, useCallback } from "react";
import { Transaction, User, Fund, Category } from "@/types";
import { parseCSV } from "@/lib/utils";
import { generateSampleTransactions } from "@/samples/transactions";
import { sampleUsers } from "@/samples/users";
import { sampleFunds } from "@/samples/funds";
import { sampleCategories } from "@/samples/categories";

const validateAndParseTransactions = (data: string[][]): { transactions: Transaction[], errors: string[] } => {
    const errors: string[] = [];
    const validTransactions: Transaction[] = [];

    if (data.length < 2) {
        errors.push("Transaction file must have at least a header and one data row.");
        return { transactions: [], errors };
    }

    const headers = data[0].map(h => h.trim().toLowerCase());
    const expectedHeaders = ["id", "datetime", "amount", "currency", "fund_id", "category_id", "created_at", "updated_at", "by", "note", "type"];

    for (const header of expectedHeaders) {
        if (!headers.includes(header)) {
            errors.push(`Missing required header: ${header}.`);
        }
    }

    if (errors.length > 0) {
        return { transactions: [], errors };
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
                errors.push(`Row ${i + 1}: Invalid transaction type "${transaction.type}".`);
                continue;
            }
            if (isNaN(transaction.id) || isNaN(transaction.amount) || isNaN(transaction.fund_id) || isNaN(transaction.category_id)) {
                errors.push(`Row ${i + 1}: Invalid numerical data.`);
                continue;
            }
            if (isNaN(new Date(transaction.datetime).getTime())) {
                errors.push(`Row ${i + 1}: Invalid datetime format.`);
                continue;
            }
            validTransactions.push(transaction);
        } catch (error: any) {
            errors.push(`Error parsing row ${i + 1}: ${error.message}`);
        }
    }

    if (validTransactions.length === 0 && errors.length === 0) {
        errors.push("No valid transactions found in the file.");
    }

    return { transactions: validTransactions, errors };
};

export const useFinancialState = () => {
    const [transactions, setTransactions] = useState<Transaction[]>(generateSampleTransactions());
    const [users, setUsers] = useState<User[]>(sampleUsers);
    const [funds, setFunds] = useState<Fund[]>(sampleFunds);
    const [categories, setCategories] = useState<Category[]>(sampleCategories);
    const [dataErrors, setDataErrors] = useState<string[]>([]);

    const handleFileUpload = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (e) => {
            const csvText = e.target?.result as string;
            const data = parseCSV(csvText);
            const { transactions: newTransactions, errors } = validateAndParseTransactions(data);

            if (errors.length > 0) {
                setDataErrors(errors);
            } else {
                setTransactions(newTransactions);
                setDataErrors([]);
            }
        };
        reader.onerror = () => {
            setDataErrors(["Error reading the file."]);
        };
        reader.readAsText(file);
    }, []);

    return {
        transactions,
        users,
        funds,
        categories,
        dataErrors,
        setDataErrors,
        handleFileUpload,
        setTransactions, // If needed for direct updates elsewhere
    };
};