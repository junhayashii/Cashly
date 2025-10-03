import { Account } from "@/types";

export const initialAccounts: Account[] = [
  {
    id: "1",
    name: "Main Checking",
    type: "checking",
    balance: 12458.9,
    institution: "Chase Bank",
    lastFour: "4521",
  },
  {
    id: "2",
    name: "Emergency Savings",
    type: "savings",
    balance: 18420.0,
    institution: "Ally Bank",
    lastFour: "8834",
  },
  {
    id: "3",
    name: "Travel Credit Card",
    type: "credit",
    balance: -2340.5,
    institution: "American Express",
    lastFour: "1009",
  },
  {
    id: "4",
    name: "Investment Portfolio",
    type: "investment",
    balance: 45890.25,
    institution: "Vanguard",
    lastFour: "7632",
  },
];
