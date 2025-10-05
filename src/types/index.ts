import { LucideIcon } from "lucide-react";

export interface Transaction {
  id: string;
  title: string;
  category: string;
  amount: number;
  date: string;
  type: "income" | "expense";
}

export interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlyBudget: number;
  spent: number;
  transactions: number;
}

export interface Account {
  id: string;
  name: string;
  type: "checking" | "savings" | "credit" | "investment";
  balance: number;
  institution: string;
  lastFour: string;
}

export interface MetricCardProps {
  title: string;
  value: string;
  change: string;
  changeType: "positive" | "negative" | "neutral";
  icon: LucideIcon;
  iconColor: string;
}

export interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  icon: React.ComponentType<{ className?: string }>;
}

export interface Goal {
  id: string;
  title: string;
  target: number;
  current: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
  deadline: string;
}

export interface Budget {
  category: string;
  spent: number;
  limit: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}
