import { useState, type ReactNode } from "react";
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
  trigger?: ReactNode;
}

export function AddTransactionDialog({
  onAddTransaction,
  trigger,
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { accounts } = useAccounts();
  const { goals } = useGoals();
  const { categories } = useCategories(); // ✅ ← 追加！

  // ✅ 初期フォーム
  const [formData, setFormData] = useState<{
    title: string;
    amount: string;
    category_id: string;
    account_id: string;
    type: "income" | "expense" | "savings" | "transfer";
    payment_method: "debito" | "credito" | "pix" | "cash";
    total_installments: number;
    date: string;
    goal_id: string;
    from_account_id?: string;
    to_account_id?: string;
  }>({
    title: "",
    amount: "",
    category_id: "",
    account_id: "",
    type: "expense",
    payment_method: "debito",
    total_installments: 1,
    date: new Date().toISOString().split("T")[0],
    goal_id: "",
    from_account_id: "",
    to_account_id: "",
  });

  // ✅ Submit
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    const isSavings = formData.type === "savings";
    const isTransfer = formData.type === "transfer";

    // Validation
    if (
      !formData.title ||
      !formData.amount ||
      (!isSavings && !isTransfer && !formData.account_id) ||
      ((formData.type === "income" || formData.type === "expense") &&
        !formData.category_id) ||
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

      // --- Savings ---
      if (isSavings) {
        const transaction = {
          id: crypto.randomUUID(),
          title: formData.title,
          amount,
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

        // Update goal & account
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
      }

      // --- Transfer ---
      else if (isTransfer) {
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
            amount,
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
      }

      // Income / Expense / Credit Card Payment
      else {
        if (formData.payment_method === "credito") {
          // --- CREDIT CARD PURCHASE ---
          const totalInstallments = formData.total_installments;
          const baseDate = new Date(formData.date);
          const payments = [];

          for (let i = 1; i <= totalInstallments; i++) {
            const dueDate = new Date(baseDate);
            dueDate.setMonth(dueDate.getMonth() + (i - 1));

            payments.push({
              id: crypto.randomUUID(),
              user_id: user.id,
              card_id: formData.account_id,
              title: formData.title,
              amount: parseFloat(formData.amount) / totalInstallments,
              installment_number: i,
              total_installments: totalInstallments,
              due_date: dueDate.toISOString(),
              paid: false,
            });
          }

          console.log("payments to insert:", payments);

          const { error } = await supabase
            .from("credit_card_payments")
            .insert([...payments]);

          if (error) throw error;

          const totalAmount = payments.reduce((sum, p) => sum + p.amount, 0);
          await supabase.rpc("decrease_available_limit", {
            card_id: formData.account_id,
            amount: totalAmount,
          });

          toast({
            title: "Credit payment added",
            description: "Added to your credit card payments list",
          });
        } else {
          // --- 通常の Income / Expense ---
          const transaction = {
            id: crypto.randomUUID(),
            title: formData.title,
            amount:
              formData.type === "expense"
                ? -parseFloat(formData.amount)
                : parseFloat(formData.amount),
            category_id: formData.category_id,
            account_id: formData.account_id,
            payment_method: formData.payment_method,
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
        }
      }

      insertedData.forEach(onAddTransaction);

      toast({
        title: "Transaction added",
        description: `${formData.type} of $${amount} has been recorded`,
      });

      // Reset
      setFormData({
        title: "",
        amount: "",
        category_id: "",
        account_id: "",
        payment_method: "debito",
        total_installments: 1,
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

  // ✅ Render
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        {trigger ?? (
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" />
            Add Transaction
          </Button>
        )}
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
          {/* --- Type --- */}
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  type: value as "income" | "expense" | "savings" | "transfer",
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

          {/* --- Category (Income/Expenseのみ) --- */}
          {(formData.type === "income" || formData.type === "expense") && (
            <div className="space-y-2">
              <Label htmlFor="category">Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: value })
                }
              >
                <SelectTrigger
                  id="category"
                  className="bg-background border-border"
                >
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {categories.map((cat) => (
                    <SelectItem key={cat.id} value={cat.id}>
                      {cat.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* --- Transfer --- */}
          {formData.type === "transfer" && (
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="from_account">From Account</Label>
                <Select
                  value={formData.from_account_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, from_account_id: value })
                  }
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="From account" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="to_account">To Account</Label>
                <Select
                  value={formData.to_account_id}
                  onValueChange={(value) =>
                    setFormData({ ...formData, to_account_id: value })
                  }
                >
                  <SelectTrigger className="bg-background border-border">
                    <SelectValue placeholder="To account" />
                  </SelectTrigger>
                  <SelectContent className="bg-popover border-border z-50">
                    {accounts.map((acc) => (
                      <SelectItem key={acc.id} value={acc.id}>
                        {acc.name}
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

          {/* --- Goal (Savingsのみ) --- */}
          {formData.type === "savings" && (
            <div className="space-y-2">
              <Label htmlFor="goal">Goal</Label>
              <Select
                value={formData.goal_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, goal_id: value })
                }
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select goal" />
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

          {/* --- Account (Transfer以外) --- */}
          {formData.type !== "transfer" && (
            <div className="space-y-2">
              <Label htmlFor="account">Account</Label>
              <Select
                value={formData.account_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, account_id: value })
                }
              >
                <SelectTrigger className="bg-background border-border">
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {accounts.map((acc) => (
                    <SelectItem key={acc.id} value={acc.id}>
                      {acc.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          {/* --- Payment Method --- */}
          <div className="space-y-2">
            <Label htmlFor="payment_method">Payment Method</Label>
            <Select
              value={formData.payment_method}
              onValueChange={(value) =>
                setFormData({ ...formData, payment_method: value as any })
              }
            >
              <SelectTrigger
                id="payment_method"
                className="bg-background border-border"
              >
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="debito">Debit</SelectItem>
                <SelectItem value="credito">Credit</SelectItem>
                <SelectItem value="cash">Cash</SelectItem>
                <SelectItem value="pix">Pix</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* --- Installments (only when Credit is selected) --- */}
          {formData.payment_method === "credito" && (
            <div className="space-y-2">
              <Label htmlFor="installments">Installments</Label>
              <Input
                id="installments"
                type="number"
                min={1}
                max={24}
                value={formData.total_installments}
                onChange={(e) =>
                  setFormData({
                    ...formData,
                    total_installments: parseInt(e.target.value) || 1,
                  })
                }
                className="bg-background border-border"
                placeholder="e.g., 3"
              />
            </div>
          )}

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
