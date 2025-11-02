import { LucideIcon } from "lucide-react";

export interface Transaction {
  id: string;
  title: string;
  category_id: string;
  account_id: string;
  amount: number;
  date: string;
  type: "income" | "expense" | "savings" | "transfer";
  user_id: string;
  payment_method?: string | null;
  category?: Category;
  goal_id?: string;
  from_account_id?: string;
  to_account_id?: string;
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
  user_id?: string;
}

export interface Notification {
  id: string;
  user_id: string;
  type: string;
  message: string;
  related_id?: string | null;
  created_at: string;
  updated_at?: string;
  is_read: boolean;
}

export interface Account {
  id: string;
  user_id: string;
  name: string;
  type: "bank" | "credit_card" | "cash" | "e_wallet" | "investment";
  balance: number;
  credit_limit: number;
  available_limit: number;
  institution: string;
  created_at: string;
  updated_at: string;
  connection_id?: string | null;
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
  user_id: string;
  name: string;
  target_amount: number;
  current_amount: number;
  target_date?: string;
  created_at: string;
  updated_at: string;
  status: "active" | "completed" | "paused";
  // UI properties (not in database)
  icon?: React.ComponentType<{ className?: string }>;
  color?: string;
}

export interface Budget {
  category: string;
  spent: number;
  limit: number;
  icon: React.ComponentType<{ className?: string }>;
  color: string;
}
