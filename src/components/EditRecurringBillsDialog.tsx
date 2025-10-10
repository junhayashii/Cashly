import React, { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";

interface EditRecurringBillsDialogProps {
  open: boolean;
  onClose: () => void;
  recurringBill: any;
  onSuccess?: () => void;
}

export default function EditRecurringBillsDialog({
  open,
  onClose,
  recurringBill,
  onSuccess,
}: EditRecurringBillsDialogProps) {
  const [title, setTitle] = useState("");
  const [amount, setAmount] = useState("");
  const [frequency, setFrequency] = useState("monthly");
  const [nextDueDate, setNextDueDate] = useState("");
  const [startDate, setStartDate] = useState("");
  const [accountId, setAccountId] = useState("");
  const [categoryId, setCategoryId] = useState("");
  const [accounts, setAccounts] = useState<any[]>([]);
  const [categories, setCategories] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const fetchDropdownData = async () => {
      const [{ data: accountsData }, { data: categoriesData }] =
        await Promise.all([
          supabase.from("accounts").select("id, name"),
          supabase.from("categories").select("id, name"),
        ]);
      setAccounts(accountsData || []);
      setCategories(categoriesData || []);
    };

    fetchDropdownData();
  }, []);

  useEffect(() => {
    if (recurringBill) {
      setTitle(recurringBill.title || "");
      setAmount(recurringBill.amount?.toString() || "");
      setFrequency(recurringBill.frequency || "monthly");
      setNextDueDate(recurringBill.next_due_date?.split("T")[0] || "");
      setStartDate(
        recurringBill.start_date?.split("T")[0] ||
          new Date().toISOString().split("T")[0]
      );
      setAccountId(recurringBill.account_id || "");
      setCategoryId(recurringBill.category_id || "");
    }
  }, [recurringBill]);

  const handleSave = async () => {
    try {
      if (!recurringBill) return;

      if (!title || !amount || !accountId || !categoryId || !nextDueDate) {
        alert("Please fill in all required fields.");
        return;
      }

      setLoading(true);

      const updatedBill = {
        title,
        amount: parseFloat(amount),
        frequency,
        next_due_date: nextDueDate,
        start_date: startDate || new Date().toISOString(), // ← start_dateを常に送る
        account_id: accountId,
        category_id: categoryId,
        updated_at: new Date().toISOString(),
      };

      const { error } = await supabase
        .from("recurring_bills")
        .update(updatedBill)
        .eq("id", recurringBill.id);

      if (error) {
        console.error("Error updating recurring bill:", error);
        alert("Failed to update recurring bill.");
      } else {
        onSuccess?.();
        onClose();
      }
    } catch (err) {
      console.error("Unexpected error updating recurring bill:", err);
    } finally {
      setLoading(false);
    }
  };

  if (!recurringBill) return null;

  return (
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Edit Recurring Bill</DialogTitle>
        </DialogHeader>
        <DialogDescription>Edit a recurring payment.</DialogDescription>

        <div className="space-y-4">
          <div>
            <Label>Title</Label>
            <Input
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g., Spotify"
            />
          </div>

          <div>
            <Label>Amount</Label>
            <Input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="e.g., 25.00"
            />
          </div>

          <div>
            <Label>Frequency</Label>
            <Select value={frequency} onValueChange={setFrequency}>
              <SelectTrigger>
                <SelectValue placeholder="Select frequency" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          <div>
            <Label>Next Due Date</Label>
            <Input
              type="date"
              value={nextDueDate}
              onChange={(e) => setNextDueDate(e.target.value)}
            />
          </div>

          <div>
            <Label>Start Date</Label>
            <Input
              type="date"
              value={startDate}
              onChange={(e) => setStartDate(e.target.value)}
            />
          </div>

          <div>
            <Label>Account</Label>
            <Select value={accountId} onValueChange={setAccountId}>
              <SelectTrigger>
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

          <div>
            <Label>Category</Label>
            <Select value={categoryId} onValueChange={setCategoryId}>
              <SelectTrigger>
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
        </div>

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={onClose}>
            Cancel
          </Button>
          <Button onClick={handleSave} disabled={loading}>
            {loading ? "Saving..." : "Save Changes"}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
