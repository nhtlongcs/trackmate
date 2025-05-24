import {
    Coffee, Heart, Tv, Wallet, Briefcase, CreditCard, LucideIcon
  } from "lucide-react";
  
  export const COLORS = [ "#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8", "#82CA9D", "#FFC658", "#FF7C7C", "#8DD1E1", "#D084D0", ];
  export const INCOME_COLORS = ["#10b981", "#059669", "#047857", "#065f46"];
  
  // Category icons mapping
  export const getCategoryIcon = (categoryName: string): LucideIcon => {
    const name = categoryName.toLowerCase();
    if (name.includes("dining") || name.includes("restaurant")) return Coffee;
    if (name.includes("groceries") || name.includes("grocery")) return CreditCard; // Changed to avoid conflict
    if (name.includes("healthcare") || name.includes("health")) return Heart;
    if (name.includes("subscriptions") || name.includes("subscription")) return Tv;
    if (name.includes("savings")) return Wallet;
    if (name.includes("salary") || name.includes("freelance")) return Briefcase;
    return CreditCard; // Default icon
  };
  
  // CSV parsing function
  export const parseCSV = (csvText: string): string[][] => {
    const lines = csvText.trim().split("\n");
    return lines.map((line) => {
      const result: string[] = [];
      let current = "";
      let inQuotes = false;
      for (let i = 0; i < line.length; i++) {
        const char = line[i];
        if (char === '"') {
          inQuotes = !inQuotes;
        } else if (char === "\t" && !inQuotes) {
          result.push(current.trim());
          current = "";
        } else {
          current += char;
        }
      }
      result.push(current.trim());
      return result;
    });
  };
  
  // You might keep validateAndParseTransactions here or move it to the hook if it uses state setters.
  // For now, let's keep it here, but it will need a way to report errors.
  // It's probably better inside the hook or the main component. We'll move it to the hook.