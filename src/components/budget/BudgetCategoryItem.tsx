"use client";

import { Card } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import type { Category, Transaction } from "@/types";
import type { ComponentType } from "react";
import {
  ShoppingCart,
  Home,
  Car,
  Coffee,
  Plane,
  Heart,
  Zap,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";

type IconComponent = ComponentType<{ className?: string }>;

const getIconComponent = (iconName: string): IconComponent => {
  const icons: Record<string, IconComponent> = {
    ShoppingCart,
    Home,
    Car,
    Coffee,
    Plane,
    Heart,
    Zap,
    DollarSign,
    TrendingUp,
    TrendingDown,
  };
  return icons[iconName] || ShoppingCart;
};

interface BudgetCategoryItemProps {
  category: Category & {
    spent: number;
    monthlyBudget: number;
  };
  currencySymbol: string;
}

export function BudgetCategoryItem({ category, currencySymbol }: BudgetCategoryItemProps) {
  const percentage =
    category.monthlyBudget > 0
      ? (category.spent / category.monthlyBudget) * 100
      : 0;
  const isOverBudget = percentage > 100;
  const Icon = getIconComponent(category.icon || "ShoppingCart");

  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-lg bg-muted">
            <Icon className={`h-4 w-4 ${category.color}`} />
          </div>
          <div>
            <p className="font-medium text-foreground">{category.name}</p>
            <p className="text-sm text-muted-foreground">
              {currencySymbol}
              {category.spent.toFixed(0)} of {currencySymbol}
              {category.monthlyBudget.toFixed(0)}
            </p>
          </div>
        </div>
        <span
          className={`text-sm font-semibold ${
            isOverBudget ? "text-destructive" : "text-muted-foreground"
          }`}
        >
          {percentage.toFixed(0)}%
        </span>
      </div>
      <Progress value={Math.min(percentage, 100)} className="h-2" />
    </div>
  );
}
