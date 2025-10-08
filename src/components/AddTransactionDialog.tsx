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

interface AddTransactionDialogProps {
  onAddTransaction: (transaction: Transaction) => void;
}

export function AddTransactionDialog({
  onAddTransaction,
}: AddTransactionDialogProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { getCategoriesByType } = useCategories();
  const { accounts, getAccountById } = useAccounts();
  const [formData, setFormData] = useState<{
    title: string;
    amount: string;
    category_id: string;
    account_id: string;
    type: "income" | "expense";
    date: string;
  }>({
    title: "",
    amount: "",
    category_id: "",
    account_id: "",
    type: "expense",
    date: new Date().toISOString().split("T")[0],
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    if (!formData.title || !formData.amount || !formData.category_id) {
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
      category_id: formData.category_id,
      account_id: formData.account_id,
      date: formData.date,
      type: formData.type,
      user_id: user.id,
    };

    console.log("Attempting to insert transaction:", transaction);

    const { data: insertedData, error } = await supabase
      .from("Transactions")
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

    console.log("Inserted transaction data:", insertedData[0]);

    onAddTransaction(insertedData[0]);
    toast({
      title: "Transaction added",
      description: `${formData.type === "expense" ? "Expense" : "Income"} of $${
        formData.amount
      } has been recorded`,
    });

    setFormData({
      title: "",
      amount: "",
      category_id: "",
      account_id: "",
      type: "expense",
      date: new Date().toISOString().split("T")[0],
    });
    setOpen(false);
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
          <div className="space-y-2">
            <Label htmlFor="type">Transaction Type</Label>
            <Select
              value={formData.type}
              onValueChange={(value) =>
                setFormData({
                  ...formData,
                  type: value as "income" | "expense",
                  category_id: "",
                })
              }
            >
              <SelectTrigger id="type" className="bg-background border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="bg-popover border-border z-50">
                <SelectItem value="expense">Expense</SelectItem>
                <SelectItem value="income">Income</SelectItem>
              </SelectContent>
            </Select>
          </div>

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
          <div className="grid grid-cols-2 gap-4">
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
                  <SelectValue placeholder="Select a category" />
                </SelectTrigger>
                <SelectContent className="bg-popover border-border z-50">
                  {getCategoriesByType(formData.type).map((category) => (
                    <SelectItem key={category.id} value={category.id}>
                      {category.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
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
            <Button type="submit" className="flex-1">
              Add Transaction
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
