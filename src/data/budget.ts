import {
  ShoppingBag,
  Home,
  Utensils,
  Car,
  Sparkles,
  Heart,
} from "lucide-react";

import { Budget } from "@/types";

export const budgets: Budget[] = [
  {
    category: "Food & Dining",
    spent: 420,
    limit: 600,
    icon: Utensils,
    color: "text-primary",
  },
  {
    category: "Shopping",
    spent: 280,
    limit: 400,
    icon: ShoppingBag,
    color: "text-primary",
  },
  {
    category: "Housing",
    spent: 1200,
    limit: 1200,
    icon: Home,
    color: "text-primary",
  },
  {
    category: "Transport",
    spent: 180,
    limit: 300,
    icon: Car,
    color: "text-primary",
  },
  {
    category: "Entertainment",
    spent: 95,
    limit: 200,
    icon: Sparkles,
    color: "text-primary",
  },
  {
    category: "Healthcare",
    spent: 50,
    limit: 150,
    icon: Heart,
    color: "text-primary",
  },
];
