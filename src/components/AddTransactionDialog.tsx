import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";

import { Transaction } from "@/types";
import { supabase } from "@/lib/supabaseClient";
import { useCategories } from "@/hooks/useCategories";
import { useAccounts } from "@/hooks/useAccounts";
import { useGoals } from "@/hooks/useGoals";

interface AddTransactionDialogProps {
  onAddTransaction: (transaction: Transaction) => void;
}

export function AddTransactionDialog({
  onAddTransaction,
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { accounts } = useAccounts();
  const { goals } = useGoals();

  // ✅ goal_id を空文字で初期化（uncontrolled→controlled warning防止）
  const [formData, setFormData] = useState<{
    title: string;
    amount: string;
    category_id: string;
    account_id: string;
    type: "income" | "expense" | "savings";
    date: string;
    goal_id: string;
  }>({
    title: "",
    amount: "",
    category_id: "",
    account_id: "",
    type: "expense",
    date: new Date().toISOString().split("T")[0],
    goal_id: "", // ✅ 空文字にする
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    // ✅ savings の場合 category_id は不要
    const isSavings = formData.type === "savings";

    if (
      !formData.title ||
      !formData.amount ||
      !formData.account_id ||
      (!isSavings && !formData.category_id) || // savings以外ならカテゴリ必須
      (isSavings && !formData.goal_id) // savingsならgoal必須
    ) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const { data, error: userError } = await supabase.auth.getUser();
    const user = data?.user;

    if (userError || !user) {
      toast({
        title: "Error",
        description: "Could not get user info",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    const transaction = {
      id: crypto.randomUUID(),
      title: formData.title,
      amount:
        parseFloat(formData.amount) * (formData.type === "expense" ? -1 : 1),
      category_id: isSavings ? null : formData.category_id,
      account_id: formData.account_id,
      goal_id: isSavings ? formData.goal_id : null,
      date: formData.date,
      type: formData.type,
      user_id: user.id,
    };

    console.log("Attempting to insert transaction:", transaction);

    const { data: insertedData, error } = await supabase
      .from("transactions")
      .insert([transaction])
      .select();

    if (error) {
      console.error("Failed to insert transaction:", error);
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    onAddTransaction(insertedData[0]);
    toast({
      title: "Transaction added",
      description: `${
        formData.type === "expense"
          ? "Expense"
          : formData.type === "income"
          ? "Income"
          : "Savings"
      } of $${formData.amount} has been recorded`,
    });

    // ✅ Savingsの場合はGoalとAccountを更新
    if (formData.type === "savings") {
      const amount = parseFloat(formData.amount);

      // 🎯 1. Goalのcurrent_amountを更新
      // まず現在のGoalを取得
      const { data: goalData, error: goalFetchError } = await supabase
        .from("goals")
        .select("current_amount")
        .eq("id", formData.goal_id)
        .single();

      if (goalFetchError || !goalData) {
        console.error("Failed to fetch goal:", goalFetchError);
      } else {
        const newGoalAmount = (goalData.current_amount || 0) + amount;

        const { error: goalUpdateError } = await supabase
          .from("goals")
          .update({ current_amount: newGoalAmount })
          .eq("id", formData.goal_id);

        if (goalUpdateError) {
          console.error("Failed to update goal:", goalUpdateError);
        }
      }

      // 🏦 2. Accountのbalanceを減らす
      const { data: accountData, error: accountFetchError } = await supabase
        .from("accounts")
        .select("balance")
        .eq("id", formData.account_id)
        .single();

      if (accountFetchError || !accountData) {
        console.error("Failed to fetch account:", accountFetchError);
      } else {
        const newBalance = (accountData.balance || 0) - amount;

        const { error: accountUpdateError } = await supabase
          .from("accounts")
          .update({ balance: newBalance })
          .eq("id", formData.account_id);

        if (accountUpdateError) {
          console.error(
            "Failed to update account balance:",
            accountUpdateError
          );
        }
      }
    }

    // ✅ リセット時に goal_id も空文字でリセット
    setFormData({
      title: "",
      amount: "",
      category_id: "",
      account_id: "",
      type: "expense",
      date: new Date().toISOString().split("T")[0],
      goal_id: "",
    });

    setOpen(false); // ✅ 閉じる
    setLoading(false);
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="sm" className="gap-2">
          <Plus className="h-4 w-4" />
          Add Transaction
        </Button>
      </DialogTrigger>

      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Add Transaction
          </DialogTitle>
          <DialogDescription>
            Add the details of your transaction here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* --- Transaction Type --- */}
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  type: value as "income" | "expense" | "savings",
                  category_id: "",
                  goal_id: "",
                })
              }
            >
              <SelectTrigger id="type" className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="savings">Savings</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* --- Title --- */}
          <div className="space-y-2">
            <Label htmlFor="title">Description</Label>
            <Input
              id="title"
              placeholder="e.g., Grocery shopping"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="bg-background border-border"
            />
          </div>

          {/* --- Amount & Date --- */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label htmlFor="amount">Amount</Label>
              <Input
                id="amount"
                type="number"
                step="0.01"
                placeholder="0.00"
                value={formData.amount}
                onChange={(e) =>
                  setFormData({ ...formData, amount: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="date">Date</Label>
              <Input
                id="date"
                type="date"
                value={formData.date}
                onChange={(e) =>
                  setFormData({ ...formData, date: e.target.value })
                }
                className="bg-background border-border"
              />
            </div>
          </div>

          {/* --- Savingsの場合だけGoal表示 --- */}
          <div className="grid grid-cols-2 gap-4">
            {formData.type === "savings" && (
              <div className="space-y-2">
                <Label htmlFor="goal">Goal</Label>
                <Select
                  value={formData.goal_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, goal_id: value })
                  }
                >
                  <SelectTrigger
                    id="goal"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Select a goal" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {goals.map((goal) => (
                      <SelectItem key={goal.id} value={goal.id}>
                        {goal.name} (${goal.current_amount}/$
                        {goal.target_amount})
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            )}

            {/* --- Account --- */}
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, account_id: value })
                }
              >
                <SelectTrigger
                  id="account"
                  className="bg-background border-border"
                >
                  <SelectValue placeholder="Select an account" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {accounts.map((account) => (
                    <SelectItem key={account.id} value={account.id}>
                      {account.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* --- Buttons --- */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={() => setOpen(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving..." : "Add Transaction"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
