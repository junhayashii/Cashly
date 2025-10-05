import { Wifi, Phone, Zap, Tv, Cloud, Music } from "lucide-react";

import { Bill } from "@/types";

export const bills: Bill[] = [
  {
    id: "1",
    name: "Internet",
    amount: 79.99,
    dueDate: "Dec 5",
    status: "paid",
    icon: Wifi,
  },
  {
    id: "2",
    name: "Phone",
    amount: 45.0,
    dueDate: "Dec 8",
    status: "pending",
    icon: Phone,
  },
  {
    id: "3",
    name: "Electricity",
    amount: 120.5,
    dueDate: "Dec 12",
    status: "pending",
    icon: Zap,
  },
  {
    id: "4",
    name: "Streaming",
    amount: 15.99,
    dueDate: "Dec 15",
    status: "pending",
    icon: Tv,
  },
  {
    id: "5",
    name: "Cloud Storage",
    amount: 9.99,
    dueDate: "Dec 18",
    status: "pending",
    icon: Cloud,
  },
  {
    id: "6",
    name: "Music",
    amount: 12.99,
    dueDate: "Dec 20",
    status: "pending",
    icon: Music,
  },
];
