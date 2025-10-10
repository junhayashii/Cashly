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
];
