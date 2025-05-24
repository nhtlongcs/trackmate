import { parse as parseCsv } from 'csv-parse/sync';
import type { Options as CsvParseOptions } from 'csv-parse';
import * as yup from 'yup';

// Define the expected CSV structure for transactions
export interface CsvTransaction {
  id: string;
  datetime: string;
  amount: string;
  currency: string;
  fund_id: string;
  category_id: string;
  created_at: string;
  updated_at: string;
  by: string;
  note: string;
}

export interface CsvValidationResult {
  data: any[];
  errors: string[];
  isValid: boolean;
}

/**
 * Represents a single record in a CSV file
 */
export type CsvRecord = Record<string, string>;

// Validation schema for transactions
const transactionSchema = yup.object().shape<Record<keyof CsvTransaction, any>>({
  id: yup.string().required('ID is required'),
  datetime: yup
    .string()
    .required('Date/Time is required')
    .test('is-iso-date', 'Invalid date format (expected ISO 8601)', (value: string) => {
      if (!value) return false;
      return !isNaN(Date.parse(value));
    }),
  amount: yup
    .string()
    .required('Amount is required')
    .test('is-number', 'Amount must be a valid number', (value: string) => {
      return !isNaN(parseFloat(value || ''));
    }),
  currency: yup
    .string()
    .required('Currency is required')
    .length(3, 'Currency code must be 3 characters')
    .uppercase(),
  fund_id: yup
    .string()
    .required('Fund ID is required')
    .test('is-number', 'Fund ID must be a number', (value: string) => !isNaN(Number(value))),
  category_id: yup
    .string()
    .required('Category ID is required')
    .test('is-number', 'Category ID must be a number', (value: string) => !isNaN(Number(value))),
  created_at: yup
    .string()
    .required('Created at is required')
    .test('is-iso-date', 'Invalid date format (expected ISO 8601)', (value: string) => {
      if (!value) return false;
      return !isNaN(Date.parse(value));
    }),
  updated_at: yup
    .string()
    .required('Updated at is required')
    .test('is-iso-date', 'Invalid date format (expected ISO 8601)', (value: string) => {
      if (!value) return false;
      return !isNaN(Date.parse(value));
    }),
  by: yup
    .string()
    .required('Creator is required')
    .min(3, 'Creator name must be at least 3 characters'),
  note: yup.string().default(''),
});

/**
 * Parse CSV text into an array of objects
 */
export const parseCSV = (csvText: string): CsvRecord[] => {
  try {
    const parseOptions: CsvParseOptions = {
      columns: true,
      skip_empty_lines: true,
      trim: true,
      // @ts-ignore - The type definition for cast is too strict
      cast: (value: unknown, context: { column?: string | number }) => {
        // Convert empty strings to empty string for note field
        if (typeof context.column === 'string' && context.column === 'note' && value === '') return '';
        return String(value);
      },
    };

    return parseCsv(csvText, parseOptions) as CsvRecord[];
  } catch (error) {
    console.error('Error parsing CSV:', error);
    throw new Error('Failed to parse CSV file');
  }
};

/**
 * Validate CSV data against the transaction schema
 */
export const validateCsvData = async (data: CsvRecord[]): Promise<CsvValidationResult> => {
  const result: CsvValidationResult = {
    data: [],
    errors: [],
    isValid: true,
  };

  if (!data || !Array.isArray(data) || data.length === 0) {
    result.errors.push('No data to validate');
    result.isValid = false;
    return result;
  }

  const seenIds = new Set<string>();

  for (let i = 0; i < data.length; i++) {
    const row = data[i];
    const rowNumber = i + 2; // +2 because: +1 for 0-based index, +1 for header row

    try {
      // Validate against schema
      const validatedRow = await transactionSchema.validate(row, {
        abortEarly: false,
        stripUnknown: true,
      });

      // Check for duplicate IDs
      if (seenIds.has(validatedRow.id)) {
        throw new Error(`Duplicate ID found: ${validatedRow.id}`);
      }
      seenIds.add(validatedRow.id);

      result.data.push(validatedRow);
    } catch (error) {
      result.isValid = false;
      if (error instanceof yup.ValidationError) {
        error.errors.forEach((err) => {
          result.errors.push(`Row ${rowNumber}: ${err}`);
        });
      } else if (error instanceof Error) {
        result.errors.push(`Row ${rowNumber}: ${error.message}`);
      } else {
        result.errors.push(`Row ${rowNumber}: Unknown error occurred`);
      }
    }
  }

  return result;
};

/**
 * Process a CSV file and validate its contents
 * @param file The CSV file to process
 * @param type The type of data in the CSV (default: 'transactions')
 */
export const processCsvFile = async (
  file: File,
  type: 'transactions' | 'categories' | 'funds' | 'users' = 'transactions'
): Promise<CsvValidationResult> => {
  try {
    // Read file content
    const fileContent = await readFileAsText(file);
    
    // Parse CSV
    const parsedData = parseCSV(fileContent);
    
    if (parsedData.length === 0) {
      return {
        data: [],
        errors: ['The uploaded file is empty'],
        isValid: false,
      };
    }
    
    // Use the appropriate validation based on the file type
    if (type === 'transactions') {
      return await validateCsvData(parsedData);
    }
    
    // For other types, return the parsed data as-is for now
    // TODO: Add specific validation for other types (categories, funds, users)
    return {
      data: parsedData,
      errors: [],
      isValid: true,
    };
  } catch (error) {
    console.error('Error processing CSV file:', error);
    return {
      data: [],
      errors: ['Failed to process CSV file: ' + (error instanceof Error ? error.message : 'Unknown error')],
      isValid: false,
    };
  }
};

/**
 * Helper function to read file as text
 */
const readFileAsText = (file: File): Promise<string> => {
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    
    reader.onload = (event) => {
      const content = event.target?.result as string;
      resolve(content);
    };
    
    reader.onerror = (error) => {
      reject(new Error('Error reading file: ' + error));
    };
    
    reader.readAsText(file);
  });
};

/**
 * Validate and parse CSV data
 */
export const validateAndParseCsv = (
  csvData: any[],
  schema: any
): CsvValidationResult => {
  const errors: string[] = [];
  const validData: any[] = [];
  const seenIds = new Set<string>();

  csvData.forEach((row, index) => {
    try {
      // Check for duplicate IDs
      if (row.id && seenIds.has(row.id)) {
        throw new Error(`Duplicate ID found: ${row.id}`);
      }
      seenIds.add(row.id);

      // Validate against schema
      const parsedRow = schema.validateSync(row, { strict: true, abortEarly: false });
      
      // Additional custom validations
      if (new Date(parsedRow.updated_at) < new Date(parsedRow.created_at)) {
        throw new Error('Updated at cannot be before created at');
      }
      
      validData.push(parsedRow);
    } catch (error: any) {
      const errorMessages = error.errors || [error.message];
      errorMessages.forEach((msg: string) => {
        errors.push(`Row ${index + 2}: ${msg}`);
      });
    }
  });

  return {
    data: validData,
    errors,
    isValid: errors.length === 0,
  };
};

/**
 * Convert parsed CSV data to application data model
 */
export const mapCsvToTransaction = (csvData: CsvTransaction): any => {
  return {
    id: parseInt(csvData.id, 10),
    datetime: new Date(csvData.datetime).toISOString(),
    amount: parseFloat(csvData.amount),
    currency: csvData.currency,
    fund_id: parseInt(csvData.fund_id, 10),
    category_id: parseInt(csvData.category_id, 10),
    created_at: new Date(csvData.created_at).toISOString(),
    updated_at: new Date(csvData.updated_at).toISOString(),
    by: csvData.by,
    note: csvData.note || '',
  };
};
