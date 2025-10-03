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
