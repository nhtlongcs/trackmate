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
