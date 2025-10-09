import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
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
import { useToast } from "@/hooks/use-toast";
import { supabase } from "@/lib/supabaseClient";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { Transaction } from "@/types";

interface EditTransactionDialogProps {
  transaction: Transaction | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onTransactionUpdated: (updated: Transaction) => void;
}

export function EditTransactionDialog({
  transaction,
  open,
  onOpenChange,
  onTransactionUpdated,
}: EditTransactionDialogProps) {
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const [formData, setFormData] = useState<{
    title: string;
    amount: number;
    type: "income" | "expense";
    category_id: string;
    account_id: string;
    date: string;
  }>({
    title: "",
    amount: 0,
    type: "expense",
    category_id: "",
    account_id: "",
    date: new Date().toISOString().split("T")[0],
  });

  // 初期値をトランザクションからセット
  useEffect(() => {
    if (transaction) {
      setFormData({
        title: transaction.title,
        amount: transaction.amount,
        type: transaction.type as "income" | "expense",
        category_id: transaction.category_id || "",
        account_id: transaction.account_id || "",
        date: new Date(transaction.date).toISOString().split("T")[0],
      });
    }
  }, [transaction]);

  // 保存処理
  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!transaction) return;

    setLoading(true);

    const updatedData = {
      title: formData.title,
      amount: formData.amount,
      type: formData.type,
      category_id: formData.category_id || null,
      account_id: formData.account_id || null,
      date: formData.date,
    };

    const { data, error } = await supabase
      .from("transactions")
      .update(updatedData)
      .eq("id", transaction.id)
      .select()
      .single();

    if (error) {
      console.error("Failed to update transaction:", error);
      toast({
        title: "Error",
        description: "Failed to update transaction",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Transaction updated",
      description: `"${formData.title}" has been updated successfully`,
    });

    onTransactionUpdated(data);
    onOpenChange(false);
    setLoading(false);
  };

  // 削除処理
  const handleDelete = async () => {
    if (!transaction) return;

    const confirmDelete = confirm(
      `Are you sure you want to delete "${transaction.title}"?`
    );
    if (!confirmDelete) return;

    setLoading(true);

    const { error } = await supabase
      .from("transactions")
      .delete()
      .eq("id", transaction.id);

    if (error) {
      toast({
        title: "Error",
        description: "Failed to delete transaction",
        variant: "destructive",
      });
      setLoading(false);
      return;
    }

    toast({
      title: "Transaction deleted",
      description: `"${transaction.title}" has been deleted`,
    });

    onOpenChange(false);
    setLoading(false);
  };

  if (!transaction) return null;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-foreground">
            Edit Transaction
          </DialogTitle>
          <DialogDescription>
            Update the details of your transaction here.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* タイトル */}
          <div className="space-y-2">
            <Label htmlFor="title">Title</Label>
            <Input
              id="title"
              placeholder="e.g., Grocery Shopping"
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              className="bg-background border-border"
            />
          </div>

          {/* 金額 */}
          <div className="space-y-2">
            <Label htmlFor="amount">Amount</Label>
            <Input
              id="amount"
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({
                  ...formData,
                  amount: parseFloat(e.target.value) || 0,
                })
              }
              className="bg-background border-border"
            />
          </div>

          {/* タイプ */}
          <div className="space-y-2">
            <Label htmlFor="type">Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  type: value as "income" | "expense",
                })
              }
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="income">Income</SelectItem>
                <SelectItem value="expense">Expense</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* カテゴリ */}
          <div className="space-y-2">
            <Label htmlFor="category">Category</Label>
            <Select
              value={formData.category_id}
              onValueChange={(value) =>
                setFormData({ ...formData, category_id: value })
              }
            >
              <SelectTrigger className="bg-background border-border">
                <SelectValue placeholder="Select category" />
              </SelectTrigger>
              <SelectContent>
                {categories.map((cat) => (
                  <SelectItem key={cat.id} value={cat.id}>
                    {cat.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* アカウント */}
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
              <SelectContent>
                {accounts.map((acc) => (
                  <SelectItem key={acc.id} value={acc.id}>
                    {acc.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* 日付 */}
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

          {/* ボタン */}
          <div className="flex gap-3 pt-4">
            <Button
              type="button"
              variant="destructive"
              onClick={handleDelete}
              disabled={loading}
            >
              Delete
            </Button>
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              className="flex-1"
              disabled={loading}
            >
              Cancel
            </Button>
            <Button type="submit" className="flex-1" disabled={loading}>
              {loading ? "Saving..." : "Save Changes"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
