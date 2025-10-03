"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Plus,
  ShoppingCart,
  Home,
  Car,
  Coffee,
  Plane,
  Heart,
  Zap,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  monthlyBudget: number;
  spent: number;
  transactions: number;
}

const initialCategories: Category[] = [
  {
    id: "1",
    name: "Food & Dining",
    icon: "ShoppingCart",
    color: "bg-primary",
    monthlyBudget: 600,
    spent: 420,
    transactions: 24,
  },
  {
    id: "2",
    name: "Housing",
    icon: "Home",
    color: "bg-accent",
    monthlyBudget: 1500,
    spent: 1200,
    transactions: 3,
  },
  {
    id: "3",
    name: "Transport",
    icon: "Car",
    color: "bg-success",
    monthlyBudget: 400,
    spent: 280,
    transactions: 12,
  },
  {
    id: "4",
    name: "Entertainment",
    icon: "Coffee",
    color: "bg-warning",
    monthlyBudget: 200,
    spent: 150,
    transactions: 8,
  },
  {
    id: "5",
    name: "Travel",
    icon: "Plane",
    color: "bg-destructive",
    monthlyBudget: 500,
    spent: 0,
    transactions: 0,
  },
  {
    id: "6",
    name: "Healthcare",
    icon: "Heart",
    color: "bg-pink-500",
    monthlyBudget: 300,
    spent: 125,
    transactions: 4,
  },
  {
    id: "7",
    name: "Utilities",
    icon: "Zap",
    color: "bg-orange-500",
    monthlyBudget: 250,
    spent: 220,
    transactions: 5,
  },
];

const getIconComponent = (iconName: string) => {
  const icons: { [key: string]: any } = {
    ShoppingCart,
    Home,
    Car,
    Coffee,
    Plane,
    Heart,
    Zap,
  };
  return icons[iconName] || ShoppingCart;
};

const Categories = () => {
  const [categories] = useState<Category[]>(initialCategories);

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Categories
          </h2>
          <p className="text-muted-foreground">
            Organize and manage your spending categories
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          New Category
        </Button>
      </div>

      {/* Summary Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Categories
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{categories.length}</div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Budget
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              $
              {categories
                .reduce((sum, c) => sum + c.monthlyBudget, 0)
                .toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Spent
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">
              ${categories.reduce((sum, c) => sum + c.spent, 0).toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {categories.map((category) => {
          const Icon = getIconComponent(category.icon);
          const percentage = (category.spent / category.monthlyBudget) * 100;
          const isOverBudget = percentage > 100;

          return (
            <Card
              key={category.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${category.color}/10`}>
                      <Icon
                        className={`h-5 w-5 ${category.color.replace(
                          "bg-",
                          "text-"
                        )}`}
                      />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{category.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {category.transactions} transactions
                      </CardDescription>
                    </div>
                  </div>
                </div>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Budget</span>
                    <span className="font-medium">
                      ${category.monthlyBudget}
                    </span>
                  </div>
                  <div className="flex items-center justify-between text-sm">
                    <span className="text-muted-foreground">Spent</span>
                    <span
                      className={`font-medium ${
                        isOverBudget ? "text-destructive" : ""
                      }`}
                    >
                      ${category.spent}
                    </span>
                  </div>
                  <div className="h-2 bg-muted rounded-full overflow-hidden">
                    <div
                      className={`h-full transition-all ${
                        isOverBudget ? "bg-destructive" : category.color
                      }`}
                      style={{ width: `${Math.min(percentage, 100)}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">
                      {percentage.toFixed(0)}% used
                    </span>
                    {isOverBudget && (
                      <Badge variant="destructive" className="text-xs">
                        Over Budget
                      </Badge>
                    )}
                  </div>
                </div>
                <Button variant="outline" size="sm" className="w-full">
                  Edit Category
                </Button>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Categories;
