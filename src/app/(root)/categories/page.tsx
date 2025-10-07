"use client";

import { useState, type ComponentType } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  ShoppingCart,
  Home,
  Car,
  Coffee,
  Plane,
  Heart,
  Zap,
  Edit,
  DollarSign,
  TrendingUp,
  TrendingDown,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { Category } from "@/types";
import { useCategories } from "@/hooks/useCategories";
import { useTransaction } from "@/hooks/useTransactions";
import { AddCategoryDialog } from "@/components/AddCategoryDialog";
import { EditCategoryDialog } from "@/components/EditCategoryDialog";

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

const Categories = () => {
  const {
    categories,
    loading: categoriesLoading,
    addCategory,
  } = useCategories();
  const { transactions } = useTransaction();
  const { toast } = useToast();
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  // Calculate real statistics from transactions
  const getCategoryStats = () => {
    const categoryStats = categories.map((category) => {
      const categoryTransactions = transactions.filter(
        (t) => t.category_id === category.id && t.type === category.type
      );
      const spent = categoryTransactions.reduce(
        (sum, t) => sum + Math.abs(t.amount),
        0
      );
      const transactionCount = categoryTransactions.length;

      return {
        ...category,
        spent,
        transactions: transactionCount,
        monthlyBudget: category.monthly_budget || 0,
      };
    });

    return {
      totalCategories: categories.length,
      totalBudget: categoryStats.reduce((sum, c) => sum + c.monthlyBudget, 0),
      totalSpent: categoryStats.reduce((sum, c) => sum + c.spent, 0),
      categoryStats,
    };
  };

  const stats = getCategoryStats();

  const handleAddCategory = (newCategory: Category) => {
    addCategory(newCategory);
    toast({
      title: "Category added",
      description: `${newCategory.name} has been created successfully`,
    });
  };

  const handleEditCategory = (category: Category) => {
    setEditingCategory(category);
    setEditDialogOpen(true);
  };

  const handleCategoryUpdated = (updatedCategory: Category) => {
    // Update the category in the list
    const updatedCategories = categories.map((cat) =>
      cat.id === updatedCategory.id ? updatedCategory : cat
    );
    // Force re-render by updating state
    setEditingCategory(null);
  };

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
        <AddCategoryDialog onAddCategory={handleAddCategory} />
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
            <div className="text-2xl font-bold">{stats.totalCategories}</div>
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
              ${stats.totalBudget.toFixed(2)}
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
              ${stats.totalSpent.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Categories Grid */}
      {categoriesLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading categories...
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {stats.categoryStats.map((category) => {
            const Icon = getIconComponent(category.icon || "ShoppingCart");
            const percentage =
              category.monthlyBudget > 0
                ? (category.spent / category.monthlyBudget) * 100
                : 0;
            const isOverBudget = percentage > 100;

            return (
              <Card
                key={category.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg bg-muted">
                        <Icon className="h-5 w-5 text-muted-foreground" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {category.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {category.transactions} transactions
                        </CardDescription>
                        <Badge
                          variant={
                            category.type === "income" ? "default" : "secondary"
                          }
                          className="mt-1 text-xs"
                        >
                          {category.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>
                <CardContent className="space-y-4">
                  {category.type === "expense" && (
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
                          ${category.spent.toFixed(2)}
                        </span>
                      </div>
                      <div className="h-2 bg-muted rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all ${
                            isOverBudget ? "bg-destructive" : "bg-primary"
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
                  )}
                  {category.type === "income" && (
                    <div className="space-y-2">
                      <div className="flex items-center justify-between text-sm">
                        <span className="text-muted-foreground">
                          Total Income
                        </span>
                        <span className="font-medium text-green-600">
                          ${category.spent.toFixed(2)}
                        </span>
                      </div>
                      <div className="text-xs text-muted-foreground">
                        From {category.transactions} transactions
                      </div>
                    </div>
                  )}
                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditCategory(category)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}

      <EditCategoryDialog
        category={editingCategory}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onCategoryUpdated={handleCategoryUpdated}
      />
    </div>
  );
};

export default Categories;
