"use client";

import {
  useState,
  useEffect,
  useRef,
  useCallback,
  type ComponentType,
} from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
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
  MoreHorizontal,
  Calendar,
} from "lucide-react";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import dayjs from "dayjs";

import { Category } from "@/types";
import { useCategories } from "@/hooks/useCategories";
import { useTransaction } from "@/hooks/useTransactions";
import { AddCategoryDialog } from "@/components/AddCategoryDialog";
import { EditCategoryDialog } from "@/components/EditCategoryDialog";

import { supabase } from "@/lib/supabaseClient";

import { useUserSettings } from "@/hooks/useUserSettings";
import { addNotification } from "@/hooks/addNotifications";
import { sendNotificationEmail } from "@/lib/sendNotificationEmail";
import { buildEmpatheticFallbackLine } from "@/lib/empatheticFallback";

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
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);

  useEffect(() => {
    setSelectedMonth(dayjs().format("YYYY-MM"));
  }, []);

  const [userId, setUserId] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      if (user) {
        setUserId(user.id);
        setUserEmail(user.email);
      }
    };

    fetchUser();
  }, []);

  const { settings } = useUserSettings(userId || undefined);

  const currencySymbol = settings?.currency === "BRL" ? "R$" : "$";

  const fetchEmpatheticLine = useCallback(
    async ({
      name,
      monthlyBudget,
      spent,
    }: {
      name: string;
      monthlyBudget: number;
      spent: number;
    }) => {
      const fallbackLine = buildEmpatheticFallbackLine({
        categoryName: name,
        monthlyBudget,
        spent,
      });

      try {
        const response = await fetch("/api/notifications/empathetic-line", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            categoryName: name,
            monthlyBudget,
            spent,
          }),
        });

        if (!response.ok) {
          return fallbackLine;
        }

        const data = (await response.json()) as { line?: string };
        return (data?.line ?? "").trim() || fallbackLine;
      } catch (error) {
        console.warn(
          "[Categories] Failed to fetch empathetic line for notification.",
          error
        );
        return fallbackLine;
      }
    },
    [buildEmpatheticFallbackLine]
  );

  // ---- Stats Calculation ----
  const getCategoryStats = () => {
    const categoryStats = categories.map((category) => {
      // 選択された月のトランザクションのみをフィルター
      const categoryTransactions = transactions.filter((t) => {
        const transactionDate = dayjs(t.date);
        const transactionMonth = transactionDate.format("YYYY-MM");
        return (
          t.category_id === category.id &&
          t.type === category.type &&
          transactionMonth === selectedMonth
        );
      });
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
      categoryStats,
    };
  };

  const stats = getCategoryStats();

  // ---- Split by type ----
  const incomeCategories = stats.categoryStats.filter(
    (c) => c.type === "income"
  );
  const expenseCategories = stats.categoryStats.filter(
    (c) => c.type === "expense"
  );

  const totalIncome = incomeCategories.reduce((sum, c) => sum + c.spent, 0);
  const totalExpense = expenseCategories.reduce((sum, c) => sum + c.spent, 0);
  const totalBudget = expenseCategories.reduce(
    (sum, c) => sum + c.monthlyBudget,
    0
  );

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

  const handleCategoryUpdated = () => {
    setEditingCategory(null);
  };

  const handleDelete = async (category: Category) => {
    if (!category) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`
    );

    if (!confirmDelete) return;

    const { error } = await supabase
      .from("categories")
      .delete()
      .eq("id", category.id);

    if (error) {
      console.error("Failed to delete category:", error);
      toast({
        title: "Error",
        description: "Failed to delete category",
        variant: "destructive",
      });
      return;
    }

    toast({
      title: "Category deleted",
      description: `${category.name} has been deleted`,
    });
  };

  const notifiedOverBudgetRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!userId || expenseCategories.length === 0) return;

    const checkOverBudget = async () => {
      const notifiedSet = notifiedOverBudgetRef.current;

      for (const category of expenseCategories) {
        const percentage =
          category.monthlyBudget > 0
            ? (category.spent / category.monthlyBudget) * 100
            : 0;

        if (percentage > 100) {
          if (!notifiedSet.has(category.id)) {
            try {
              const baseMessage = `Your "${category.name}" category has exceeded its budget.`;
              const empathyLine = await fetchEmpatheticLine({
                name: category.name,
                monthlyBudget: category.monthlyBudget,
                spent: category.spent,
              });
              const combinedMessage = `${baseMessage} ${empathyLine}`.trim();

              const created = await addNotification({
                userId,
                type: "OVER_BUDGET",
                relatedId: category.id,
                message: combinedMessage,
              });

              if (!created) {
                notifiedSet.add(category.id);
                continue;
              }

              notifiedSet.add(category.id);

              toast({
                title: "Over Budget Alert",
                description: combinedMessage,
                variant: "destructive",
              });

              void sendNotificationEmail({
                userId,
                email: userEmail,
                notificationsEnabled: settings?.notifications,
                notification: {
                  title: "Over Budget Alert",
                  message: combinedMessage,
                },
              });
            } catch (error) {
              console.error(
                "[Categories] Failed to add over-budget notification.",
                error
              );
            }
          }
        } else if (notifiedSet.has(category.id)) {
          notifiedSet.delete(category.id);
        }
      }
    };

    void checkOverBudget();
  }, [
    expenseCategories,
    fetchEmpatheticLine,
    settings?.notifications,
    toast,
    userEmail,
    userId,
  ]);

  if (!selectedMonth) return null;

  return (
    <div className="space-y-10">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">
            Categories
          </h2>
          <p className="text-muted-foreground">
            Organize and manage your spending categories & budgets
          </p>
        </div>
        <div className="flex items-center gap-6">
          {/* Month Selector */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              <Calendar className="h-4 w-4 text-muted-foreground" />
            </div>
            <Select value={selectedMonth} onValueChange={setSelectedMonth}>
              <SelectTrigger className="w-48">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {Array.from({ length: 12 }, (_, i) => {
                  const month = dayjs().subtract(i, "month");
                  const monthValue = month.format("YYYY-MM");
                  const monthLabel = month.format("MMMM YYYY");
                  return (
                    <SelectItem key={monthValue} value={monthValue}>
                      {monthLabel}
                    </SelectItem>
                  );
                })}
              </SelectContent>
            </Select>
          </div>
          <AddCategoryDialog onAddCategory={handleAddCategory} />
        </div>
      </div>

      {categoriesLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading categories...
        </div>
      ) : (
        <div className="flex flex-col gap-10">
          {/* ----- Income Section ----- */}
          <section>
            <h3 className="text-2xl font-semibold mb-2 flex items-center gap-2">
              <TrendingUp className="w-5 h-5 text-green-500" />
              Income
            </h3>
            <p className="text-muted-foreground mb-4">
              Total income for {dayjs(selectedMonth).format("MMMM YYYY")}:{" "}
              <span className="font-semibold text-green-600">
                {currencySymbol}
                {totalIncome.toFixed(2)}
              </span>
            </p>
            {incomeCategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {incomeCategories.map((category) => {
                  const Icon = getIconComponent(category.icon || "DollarSign");
                  return (
                    <Card
                      key={category.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="relative">
                        <div className="flex items-start gap-3">
                          <div className="p-3 rounded-lg bg-green-50">
                            <Icon className="h-5 w-5 text-green-600" />
                          </div>
                          <div>
                            <CardTitle className="text-lg">
                              {category.name}
                            </CardTitle>
                            <CardDescription className="text-sm">
                              {category.transactions} transactions
                            </CardDescription>
                          </div>
                        </div>

                        <div className="absolute top-2 right-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditCategory(category)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(category)}
                                className="text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-2">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Income ({dayjs(selectedMonth).format("MMM YYYY")})
                          </span>
                          <span className="font-medium text-green-600">
                            {currencySymbol}
                            {category.spent.toFixed(2)}
                          </span>
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No income categories yet.
              </p>
            )}
          </section>

          {/* ----- Expense Section ----- */}
          <section>
            <h3 className="text-2xl font-semibold mb-2 flex items-center gap-2">
              <TrendingDown className="w-5 h-5 text-red-500" />
              Expenses
            </h3>
            <p className="text-muted-foreground mb-4">
              Total budget:{" "}
              <span className="font-semibold">
                {currencySymbol}
                {totalBudget.toFixed(2)}
              </span>{" "}
              | Total spent in {dayjs(selectedMonth).format("MMMM YYYY")}:{" "}
              <span className="font-semibold text-red-600">
                {currencySymbol}
                {totalExpense.toFixed(2)}
              </span>
            </p>

            {expenseCategories.length > 0 ? (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
                {expenseCategories.map((category) => {
                  const Icon = getIconComponent(
                    category.icon || "ShoppingCart"
                  );
                  const percentage =
                    category.monthlyBudget > 0
                      ? (category.spent / category.monthlyBudget) * 100
                      : 0;
                  const isOverBudget = percentage > 100;

                  return (
                    <Card
                      key={category.id}
                      className="hover:shadow-md transition-shadow"
                    >
                      <CardHeader className="relative">
                        <div className="flex items-start gap-3">
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
                          </div>
                        </div>

                        <div className="absolute top-2 right-2">
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button variant="ghost" size="icon">
                                <MoreHorizontal className="w-4 h-4" />
                              </Button>
                            </DropdownMenuTrigger>
                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onClick={() => handleEditCategory(category)}
                              >
                                Edit
                              </DropdownMenuItem>
                              <DropdownMenuItem
                                onClick={() => handleDelete(category)}
                                className="text-destructive"
                              >
                                Delete
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>
                      </CardHeader>

                      <CardContent className="space-y-3">
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Monthly Budget
                          </span>
                          <span className="font-medium">
                            {currencySymbol}
                            {category.monthlyBudget}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-sm">
                          <span className="text-muted-foreground">
                            Spent ({dayjs(selectedMonth).format("MMM YYYY")})
                          </span>
                          <span
                            className={`font-medium ${
                              isOverBudget ? "text-destructive" : ""
                            }`}
                          >
                            {currencySymbol}
                            {category.spent.toFixed(2)}
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
                        <div className="flex justify-between text-xs text-muted-foreground">
                          <span>{percentage.toFixed(0)}% used</span>
                          {isOverBudget && (
                            <Badge variant="destructive" className="text-xs">
                              Over Budget
                            </Badge>
                          )}
                        </div>
                      </CardContent>
                    </Card>
                  );
                })}
              </div>
            ) : (
              <p className="text-muted-foreground text-sm">
                No expense categories yet.
              </p>
            )}
          </section>

          <EditCategoryDialog
            category={editingCategory}
            open={editDialogOpen}
            onOpenChange={setEditDialogOpen}
            onCategoryUpdated={handleCategoryUpdated}
          />
        </div>
      )}
    </div>
  );
};

export default Categories;
