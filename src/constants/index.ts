import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Wallet,
  Tag,
  Goal,
  CreditCard,
} from "lucide-react";

export const mainMenuItems = [
  { title: "Dashboard", url: "/dashboard", icon: LayoutDashboard },
  { title: "Transactions", url: "/transactions", icon: Receipt },
  { title: "Categories", url: "/categories", icon: Tag },
  { title: "Accounts", url: "/accounts", icon: Wallet },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Goals & Savings", url: "/goals", icon: Goal },
];
