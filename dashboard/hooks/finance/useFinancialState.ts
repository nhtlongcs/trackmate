// hooks/useFinancialState.ts
import { useState, useCallback } from "react";
import { Transaction, User, Fund, Category } from "@/types";
import { processCsvFile, CsvValidationResult, CsvRecord } from "@/lib/csvUtils";
import { generateSampleTransactions } from "@/samples/transactions";
import { sampleUsers } from "@/samples/users";
import { sampleFunds } from "@/samples/funds";
import { sampleCategories } from "@/samples/categories";

// Extended interfaces to match the expected types
interface ExtendedCategory extends Omit<Category, 'category_name' | 'fund_id' | 'by' | 'note'> {
  name: string;
}

interface ExtendedFund extends Omit<Fund, 'fund_name' | 'by' | 'note'> {
  name: string;
}

interface ExtendedUser extends Omit<User, 'username' | 'note'> {
  name: string;
  email: string;
}

// Helper to convert CSV data to our data models
const mapCsvToModel = {
  transactions: (data: CsvRecord[]): Transaction[] => {
    return data.map((item, index) => ({
      id: Number(item.id) || Date.now() + index,
      datetime: item.datetime || new Date().toISOString(),
      amount: parseFloat(item.amount || '0'),
      currency: item.currency || 'USD',
      fund_id: Number(item.fund_id) || 1,
      category_id: Number(item.category_id) || 1,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      by: item.by || 'system',
      note: item.note || '',
      type: (item.type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
    }));
  },
  categories: (data: CsvRecord[]): Category[] => {
    return data.map((item, index) => ({
      id: Number(item.id) || Date.now() + index,
      category_name: item.name || `Category ${index + 1}`,
      type: (item.type === 'income' ? 'income' : 'expense') as 'income' | 'expense',
      fund_id: Number(item.fund_id) || 1,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      by: item.by || 'system',
      note: item.note || '',
    }));
  },
  funds: (data: CsvRecord[]): Fund[] => {
    return data.map((item, index) => ({
      id: Number(item.id) || Date.now() + index,
      fund_name: item.name || `Fund ${index + 1}`,
      created_at: item.created_at || new Date().toISOString(),
      updated_at: item.updated_at || new Date().toISOString(),
      by: item.by || 'system',
      note: item.note || '',
    }));
  },
  users: (data: CsvRecord[]): User[] => {
    return data.map((item, index) => ({
      username: item.username || `user${index + 1}`,
      name: item.name || `User ${index + 1}`,
      note: item.note || '',
    }));
  },
};

// Process uploaded CSV files and update state
const processUploadedFiles = async (files: Record<string, File> | File): Promise<Record<string, CsvValidationResult>> => {
  // If a single file is provided, convert it to the expected format
  if (files instanceof File) {
    files = { transactions: files };
  }

  const results: Record<string, CsvValidationResult> = {
    transactions: { data: [], errors: [], isValid: true },
    categories: { data: [], errors: [], isValid: true },
    funds: { data: [], errors: [], isValid: true },
    users: { data: [], errors: [], isValid: true },
  };

  // Process each file in parallel
  await Promise.all(
    Object.entries(files).map(async ([type, file]) => {
      if (['transactions', 'categories', 'funds', 'users'].includes(type)) {
        try {
          const result = await processCsvFile(file, type as 'transactions' | 'categories' | 'funds' | 'users');
          
          // Map the CSV data to the appropriate type using our mapper
          const mapper = mapCsvToModel[type as keyof typeof mapCsvToModel];
          if (mapper) {
            const mappedData = mapper(result.data);
            results[type as keyof typeof results] = {
              data: mappedData,
              errors: result.errors,
              isValid: result.isValid,
            };
          } else {
            throw new Error(`No mapper found for type: ${type}`);
          }
        } catch (error) {
          console.error(`Error processing ${type} file:`, error);
          results[type as keyof typeof results] = {
            data: [],
            errors: [`Failed to process ${type} file: ${error instanceof Error ? error.message : 'Unknown error'}`],
            isValid: false,
          };
        }
      }
    })
  );

  return results;
};

export const useFinancialState = () => {
    // State for financial data
    const [transactions, setTransactions] = useState<Transaction[]>(generateSampleTransactions());
    const [users, setUsers] = useState<User[]>(sampleUsers);
    const [funds, setFunds] = useState<Fund[]>(sampleFunds);
    const [categories, setCategories] = useState<Category[]>(sampleCategories);
    const [dataErrors, setDataErrors] = useState<string[]>([]);
    const [isLoading, setIsLoading] = useState(false);
    
    // Memoize the state setters to avoid unnecessary re-renders
    const stateSetters = {
        setTransactions,
        setUsers,
        setFunds,
        setCategories,
        setDataErrors,
        setIsLoading
    };

    const handleFileUpload = useCallback(async (files: Record<string, File> | React.ChangeEvent<HTMLInputElement>) => {
        // Handle single file input (from file input)
        if ('target' in files) {
            const input = files.target as HTMLInputElement;
            if (!input.files || input.files.length === 0) {
                return { success: false, errors: ['No files selected'] };
            }
            
            const file = input.files[0];
            try {
                const results = await processUploadedFiles({ transactions: file });
                if (results.transactions.isValid) {
                    const mappedTransactions = mapCsvToModel.transactions(results.transactions.data as CsvRecord[]);
                    stateSetters.setTransactions(prev => [...prev, ...mappedTransactions]);
                    return { success: true, errors: [] };
                } else {
                    stateSetters.setDataErrors(prev => [...prev, ...results.transactions.errors]);
                    return { success: false, errors: results.transactions.errors };
                }
            } catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Failed to process file';
                stateSetters.setDataErrors(prev => [...prev, errorMessage]);
                return { success: false, errors: [errorMessage] };
            }
        }
        
        // Handle multiple files from the upload modal
        try {
            stateSetters.setIsLoading(true);
            stateSetters.setDataErrors([]);
            
            const results = await processUploadedFiles(files);
            const allErrors: string[] = [];
            
            // Process each file type and update state
            if (results.transactions.data.length > 0 && results.transactions.isValid) {
                const mappedTransactions = mapCsvToModel.transactions(results.transactions.data as CsvRecord[]);
                stateSetters.setTransactions(prev => [...prev, ...mappedTransactions]);
            }
            if (results.categories.data.length > 0 && results.categories.isValid) {
                const mappedCategories = mapCsvToModel.categories(results.categories.data as CsvRecord[]);
                stateSetters.setCategories(prev => [...prev, ...mappedCategories]);
            }
            if (results.funds.data.length > 0 && results.funds.isValid) {
                const mappedFunds = mapCsvToModel.funds(results.funds.data as CsvRecord[]);
                stateSetters.setFunds(prev => [...prev, ...mappedFunds]);
            }
            if (results.users.data.length > 0 && results.users.isValid) {
                const mappedUsers = mapCsvToModel.users(results.users.data as CsvRecord[]);
                stateSetters.setUsers(prev => [...prev, ...mappedUsers]);
            }
            
            // Collect all errors from all file types
            Object.entries(results).forEach(([type, result]) => {
                if (result.errors && result.errors.length > 0) {
                    allErrors.push(...result.errors.map(err => `[${type.toUpperCase()}] ${err}`));
                }
            });
            
            if (allErrors.length > 0) {
                stateSetters.setDataErrors(prev => [...prev, ...allErrors]);
            }
            
            return { 
                success: allErrors.length === 0 && 
                       Object.values(results).every(result => result.isValid),
                errors: allErrors 
            };
            
        } catch (error) {
            console.error('Error processing files:', error);
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            stateSetters.setDataErrors(prev => [...prev, `Error processing files: ${errorMessage}`]);
            return { success: false, errors: [errorMessage] };
        } finally {
            stateSetters.setIsLoading(false);
        }
    }, [stateSetters]);

    // Handle single file upload (for backward compatibility)
    const handleSingleFileUpload = useCallback(async (event: React.ChangeEvent<HTMLInputElement>) => {
        if (!event.target.files || event.target.files.length === 0) {
            return { success: false, errors: ['No file selected'] };
        }
        
        try {
            const file = event.target.files[0];
            const results = await processUploadedFiles({ transactions: file });
            
            if (results.transactions.data.length > 0 && results.transactions.isValid) {
                const mappedTransactions = mapCsvToModel.transactions(results.transactions.data as CsvRecord[]);
                stateSetters.setTransactions(prev => [...prev, ...mappedTransactions]);
                
                // Return success only if there are no errors
                if (results.transactions.errors.length === 0) {
                    return { success: true, errors: [] };
                }
            }
            
            // If we get here, there were either no valid transactions or there were errors
            if (results.transactions.errors.length > 0) {
                stateSetters.setDataErrors(prev => [...prev, ...results.transactions.errors]);
                return { success: false, errors: results.transactions.errors };
            }
            
            return { success: false, errors: ['No valid transaction data found in the file'] };
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
            stateSetters.setDataErrors(prev => [...prev, errorMessage]);
            return { success: false, errors: [errorMessage] };
        }
    }, [stateSetters]);

    return {
        // State values
        transactions,
        users,
        funds,
        categories,
        dataErrors,
        isLoading,
        
        // State setters
        setTransactions: stateSetters.setTransactions,
        setUsers: stateSetters.setUsers,
        setFunds: stateSetters.setFunds,
        setCategories: stateSetters.setCategories,
        setDataErrors: stateSetters.setDataErrors,
        setIsLoading: stateSetters.setIsLoading,
        
        // Handler functions
        handleFileUpload,
        handleSingleFileUpload,
    };
};