import {
  LayoutDashboard,
  Receipt,
  BarChart3,
  Wallet,
  PiggyBank,
  Tag,
} from "lucide-react";

export const mainMenuItems = [
  { title: "Dashboard", url: "/", icon: LayoutDashboard },
  { title: "Transactions", url: "/transactions", icon: Receipt },
  { title: "Reports", url: "/reports", icon: BarChart3 },
  { title: "Accounts", url: "/accounts", icon: Wallet },
  { title: "Budgets & Goals", url: "/budgets", icon: PiggyBank },
  { title: "Categories", url: "/categories", icon: Tag },
];
