import { Goal } from "@/types";
import { Plane, Home, GraduationCap, Car } from "lucide-react";

export const goals: Goal[] = [
  {
    id: "1",
    title: "Vacation Fund",
    target: 5000,
    current: 3420,
    icon: Plane,
    color: "text-primary",
    deadline: "Jun 2026",
  },
  {
    id: "2",
    title: "Emergency Fund",
    target: 10000,
    current: 7200,
    icon: Home,
    color: "text-primary",
    deadline: "Dec 2026",
  },
  {
    id: "3",
    title: "New Car",
    target: 25000,
    current: 8500,
    icon: Car,
    color: "text-primary",
    deadline: "Dec 2027",
  },
  {
    id: "4",
    title: "Education",
    target: 15000,
    current: 4200,
    icon: GraduationCap,
    color: "text-primary",
    deadline: "Sep 2026",
  },
];
