import { LucideIcon } from "lucide-react";

export interface Transaction {
  id: string;
  title: string;
  category_id: string;
  amount: number;
  date: string;
  type: "income" | "expense";
  user_id: string;
  category?: Category; // JOINで取得する場合
}

export interface Category {
  id: string;
  name: string;
  type: "income" | "expense";
  icon?: string;
  color?: string;
  monthly_budget?: number;
  created_at?: string;
  updated_at?: string;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: "bank" | "credit_card" | "cash" | "e_wallet" | "investment";
  balance: number;
  institution: string;
  created_at: string;
  updated_at: string;
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
