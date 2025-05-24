"use client";

import {
  createContext,
  useContext,
  useState,
  useEffect,
  ReactNode,
  useCallback,
} from "react";
import { loadCSVData, parseCSV } from "@/app/utils/csvUtils";

export interface User {
  username: string;
  name: string;
  note?: string;
}

export interface Transaction {
  id: string;
  datetime: string;
  amount: number;
  currency: string;
  fund_id: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  by: string;
  note: string;
  type: "income" | "expense";
}

export interface Fund {
  id: string;
  fund_name: string;
  created_at: string;
  updated_at: string;
  by: string;
  note: string;
}

export interface Category {
  id: string;
  category_name: string;
  fund_id: string;
  created_at: string;
  updated_at: string;
  by: string;
  note: string;
  type: "income" | "expense";
}

interface DataContextType {
  users: User[];
  transactions: Transaction[];
  funds: Fund[];
  categories: Category[];
  loading: boolean;
  error: string | null;
  uploadCSV: (
    file: File,
    type: "users" | "transactions" | "funds" | "categories"
  ) => Promise<boolean>;
  refreshData: () => Promise<void>;
  getCategoriesByFund: (fundId: string) => Category[];
  getCategoriesByType: (type: "income" | "expense") => Category[];
  getFundById: (id: string) => Fund | undefined;
  getCategoryById: (id: string) => Category | undefined;
  getUserByUsername: (username: string) => User | undefined;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

export function DataProvider({ children }: { children: ReactNode }) {
  const [users, setUsers] = useState<User[]>([]);
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [funds, setFunds] = useState<Fund[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  const loadData = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [usersData, transactionsData, fundsData, categoriesData] =
        await Promise.all([
          loadCSVData<User>("users.csv"),
          loadCSVData<Transaction>("transactions.csv"),
          loadCSVData<Fund>("funds.csv"),
          loadCSVData<Category>("categories.csv"),
        ]);

      // Parse numeric fields
      const parsedTransactions = transactionsData.map(tx => ({
        ...tx,
        amount: parseFloat(tx.amount as unknown as string) || 0,
      }));

      setUsers(usersData);
      setTransactions(parsedTransactions);
      setFunds(fundsData);
      setCategories(categoriesData);
    } catch (err) {
      console.error("Error loading data:", err);
      setError("Failed to load data. Please check your connection and try again.");
    } finally {
      setLoading(false);
    }
  }, []);

  const uploadCSV = useCallback(async (
    file: File,
    type: "users" | "transactions" | "funds" | "categories"
  ) => {
    try {
      setLoading(true);
      setError(null);

      // Parse the CSV file
      const data = await parseCSV<any>(file);
      
      // Type-specific processing
      switch (type) {
        case "users":
          setUsers(data);
          break;
        case "transactions":
          // Ensure numeric fields are properly typed
          const parsedTransactions = data.map((tx: any) => ({
            ...tx,
            amount: parseFloat(tx.amount) || 0,
          }));
          setTransactions(parsedTransactions);
          break;
        case "funds":
          setFunds(data);
          break;
        case "categories":
          setCategories(data);
          break;
      }

      // In a real app, you would save this to the server here
      console.log(`Uploaded ${type} data:`, data);
      
      return true;
    } catch (err) {
      console.error(`Error uploading ${type} CSV:`, err);
      setError(`Failed to process ${type} data. Please check the file format.`);
      return false;
    } finally {
      setLoading(false);
    }
  }, []);

  // Helper functions
  const getCategoriesByFund = useCallback((fundId: string): Category[] => {
    return categories.filter(cat => cat.fund_id === fundId);
  }, [categories]);

  const getCategoriesByType = useCallback((type: "income" | "expense"): Category[] => {
    return categories.filter(cat => cat.type === type);
  }, [categories]);

  const getFundById = useCallback((id: string): Fund | undefined => {
    return funds.find(fund => fund.id === id);
  }, [funds]);

  const getCategoryById = useCallback((id: string): Category | undefined => {
    return categories.find(cat => cat.id === id);
  }, [categories]);

  const getUserByUsername = useCallback((username: string): User | undefined => {
    return users.find(user => user.username === username);
  }, [users]);

  // Load data on mount
  useEffect(() => {
    loadData();
  }, [loadData]);

  return (
    <DataContext.Provider
      value={{
        users,
        transactions,
        funds,
        categories,
        loading,
        error,
        uploadCSV,
        refreshData: loadData,
        getCategoriesByFund,
        getCategoriesByType,
        getFundById,
        getCategoryById,
        getUserByUsername,
      }}
    >
      {children}
    </DataContext.Provider>
  );
}

export function useData() {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error("useData must be used within a DataProvider");
  }
  return context;
}
