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
    type: "income" | "expense" | "savings" | "transfer";
    date: string;
    goal_id: string;
    from_account_id?: string;
    to_account_id?: String;
  }>({
    title: "",
    amount: "",
    category_id: "",
    account_id: "",
    type: "expense",
    date: new Date().toISOString().split("T")[0],
    goal_id: "",
    from_account_id: "",
    to_account_id: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const isSavings = formData.type === "savings";
    const isTransfer = formData.type === "transfer";

    // 必須項目チェック
    if (
      !formData.title ||
      !formData.amount ||
      (!isSavings && !isTransfer && !formData.account_id) ||
      (!isSavings && !isTransfer && !formData.category_id) ||
      (isSavings && !formData.goal_id) ||
      (isTransfer && (!formData.from_account_id || !formData.to_account_id))
    ) {
      toast({
        title: "Missing fields",
        description: "Please fill in all required fields",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    if (isTransfer && formData.from_account_id === formData.to_account_id) {
      toast({
        title: "Invalid Transfer",
        description: "From and To accounts cannot be the same",
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

    const amount = parseFloat(formData.amount);

    try {
      let insertedData: Transaction[] = [];

      if (isSavings) {
        // Savings の処理
        const transaction = {
          id: crypto.randomUUID(),
          title: formData.title,
          amount: amount,
          account_id: formData.account_id,
          goal_id: formData.goal_id,
          type: "savings",
          user_id: user.id,
          date: formData.date,
        };

        const { data: saved, error } = await supabase
          .from("transactions")
          .insert([transaction])
          .select();

        if (error) throw error;
        insertedData = saved;

        // Goal 更新
        const { data: goalData } = await supabase
          .from("goals")
          .select("current_amount")
          .eq("id", formData.goal_id)
          .single();

        if (goalData) {
          await supabase
            .from("goals")
            .update({ current_amount: (goalData.current_amount || 0) + amount })
            .eq("id", formData.goal_id);
        }

        // Account 残高減算
        const { data: accountData } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", formData.account_id)
          .single();

        if (accountData) {
          await supabase
            .from("accounts")
            .update({ balance: (accountData.balance || 0) - amount })
            .eq("id", formData.account_id);
        }
      } else if (isTransfer) {
        // Transfer の場合
        const transactions = [
          {
            id: crypto.randomUUID(),
            title: formData.title,
            amount: -amount,
            account_id: formData.from_account_id,
            type: "transfer",
            user_id: user.id,
            date: formData.date,
          },
          {
            id: crypto.randomUUID(),
            title: formData.title,
            amount: amount,
            account_id: formData.to_account_id,
            type: "transfer",
            user_id: user.id,
            date: formData.date,
          },
        ];

        const { data: saved, error } = await supabase
          .from("transactions")
          .insert(transactions)
          .select();

        if (error) throw error;
        insertedData = saved;

        // From アカウント残高減算
        const { data: fromAccountData } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", formData.from_account_id)
          .single();
        if (fromAccountData) {
          await supabase
            .from("accounts")
            .update({ balance: (fromAccountData.balance || 0) - amount })
            .eq("id", formData.from_account_id);
        }

        // To アカウント残高加算
        const { data: toAccountData } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", formData.to_account_id)
          .single();
        if (toAccountData) {
          await supabase
            .from("accounts")
            .update({ balance: (toAccountData.balance || 0) + amount })
            .eq("id", formData.to_account_id);
        }
      } else {
        // Expense / Income
        const transaction = {
          id: crypto.randomUUID(),
          title: formData.title,
          amount: formData.type === "expense" ? -amount : amount,
          category_id: formData.category_id,
          account_id: formData.account_id,
          type: formData.type,
          user_id: user.id,
          date: formData.date,
        };

        const { data: saved, error } = await supabase
          .from("transactions")
          .insert([transaction])
          .select();

        if (error) throw error;
        insertedData = saved;

        // Account 残高更新
        const { data: accountData } = await supabase
          .from("accounts")
          .select("balance")
          .eq("id", formData.account_id)
          .single();
        if (accountData) {
          await supabase
            .from("accounts")
            .update({
              balance:
                (accountData.balance || 0) +
                (formData.type === "expense" ? -amount : amount),
            })
            .eq("id", formData.account_id);
        }
      }

      insertedData.forEach(onAddTransaction);

      toast({
        title: "Transaction added",
        description: `${formData.type} of $${amount} has been recorded`,
      });

      // フォームリセット
      setFormData({
        title: "",
        amount: "",
        category_id: "",
        account_id: "",
        type: "expense",
        date: new Date().toISOString().split("T")[0],
        goal_id: "",
        from_account_id: "",
        to_account_id: "",
      });
      setOpen(false);
    } catch (err) {
      console.error(err);
      toast({
        title: "Error",
        description: "Failed to save transaction",
        variant: "destructive",
      });
    }

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
                <SelectItem value="transfer">Transfer</SelectItem>
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

          {/* --- Transferの場合だけFrom/To Account表示 --- */}
          {formData.type === "transfer" && (
            <div className="grid grid-cols-2 gap-4">
              {/* From Account */}
              <div className="space-y-2">
                <Label htmlFor="from_account">From Account</Label>
                <Select
                  value={formData.from_account_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, from_account_id: value })
                  }
                >
                  <SelectTrigger
                    id="from_account"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Select source account" />
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

              {/* To Account */}
              <div className="space-y-2">
                <Label htmlFor="to_account">To Account</Label>
                <Select
                  value={formData.to_account_id?.toString()}
                  onValueChange={(value) =>
                    setFormData({ ...formData, to_account_id: value })
                  }
                >
                  <SelectTrigger
                    id="to_account"
                    className="bg-background border-border"
                  >
                    <SelectValue placeholder="Select destination account" />
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
          )}

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
            {formData.type !== "transfer" && (
              <div className="space-y-2">
                <Label htmlFor="account">Account</Label>
                <Select
                  value={formData.account_id?.toString()}
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
            )}
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
