import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { Plus } from "lucide-react";
import { useToast } from "@/hooks/use-toast";
import { useAccounts } from "@/hooks/useAccounts";
import { useCategories } from "@/hooks/useCategories";
import { supabase } from "@/lib/supabaseClient";
import {
  calculateNextDueDate,
  PAYMENT_METHOD_OPTIONS,
  requiresAccountSelection,
} from "@/lib/recurringBills";
import type { PaymentMethod, Frequency } from "@/lib/recurringBills";
import { ensureCreditCardPayment } from "@/lib/creditCardPayments";

export function AddRecurringBillDialog({
  onAdded,
  open,
  onOpenChange,
}: {
  onAdded: () => void;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}) {
  const [internalOpen, setInternalOpen] = useState(false);
  const isControlled = open !== undefined;
  const isOpen = isControlled ? open : internalOpen;
  const setIsOpen = isControlled ? onOpenChange! : setInternalOpen;
  const [loading, setLoading] = useState(false);
  const { toast } = useToast();
  const { accounts } = useAccounts();
  const { categories } = useCategories();

  const NONE_VALUE = "__none__";
  const today = new Date().toISOString().split("T")[0];
  const defaultFrequency: Frequency = "monthly";
  const [formData, setFormData] = useState<{
    title: string;
    amount: string;
    account_id: string;
    category_id: string;
    start_date: string;
    next_due_date: string;
    frequency: Frequency;
    payment_method: "" | PaymentMethod;
  }>({
    title: "",
    amount: "",
    account_id: "",
    category_id: "",
    start_date: today,
    next_due_date: calculateNextDueDate(today, defaultFrequency),
    frequency: defaultFrequency,
    payment_method: "",
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;
    setLoading(true);

    try {
      const { data: userData, error: userError } =
        await supabase.auth.getUser();
      if (userError) throw userError;

      const userId = userData?.user?.id;
      if (!userId) throw new Error("User not found");

      const paymentMethod = formData.payment_method || null;
      if (
        paymentMethod &&
        requiresAccountSelection(paymentMethod) &&
        !formData.account_id
      ) {
        toast({
          title: "Account required",
          description: "Please choose an account for credit payments.",
          variant: "destructive",
        });
        setLoading(false);
        return;
      }

      const accountIdValue = formData.account_id || null;

      const nextDueDate =
        formData.next_due_date ||
        calculateNextDueDate(formData.start_date, formData.frequency);

      const parsedAmount = parseFloat(formData.amount);

      const newBill = {
        title: formData.title,
        amount: parsedAmount,
        start_date: formData.start_date,
        next_due_date: nextDueDate,
        account_id: accountIdValue,
        category_id: formData.category_id || null,
        frequency: formData.frequency,
        user_id: userId,
        payment_method: paymentMethod,
      };

      console.log("🧾 Creating new recurring bill:", newBill);

      const { data, error } = await supabase
        .from("recurring_bills")
        .insert([newBill])
        .select("*");

      if (error) {
        console.error("❌ Error inserting recurring bill:", error);
        toast({
          title: "Error",
          description: "Failed to add recurring bill",
          variant: "destructive",
        });
        return;
      }

      console.log("✅ Recurring bill added successfully:", data);
      toast({
        title: "Added",
        description: `${formData.title} was added successfully.`,
      });

      if (
        paymentMethod &&
        requiresAccountSelection(paymentMethod) &&
        formData.account_id
      ) {
        try {
          await ensureCreditCardPayment({
            supabase,
            userId,
            accountId: formData.account_id,
            title: formData.title,
            amount: parsedAmount,
            dueDate: formData.start_date,
          });
        } catch (creditError) {
          console.error(
            "Error scheduling credit card payment:",
            creditError
          );
        }
      }

      setIsOpen(false);
      onAdded();
    } catch (error: unknown) {
      console.error("💥 Unexpected error:", error);
      toast({
        title: "Error",
        description: error instanceof Error ? error.message : "An unexpected error occurred.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={setIsOpen}>
      {!isControlled && (
        <DialogTrigger asChild>
          <Button size="sm" className="gap-2">
            <Plus className="h-4 w-4" /> Add Recurring Bill
          </Button>
        </DialogTrigger>
      )}

      <DialogContent className="sm:max-w-[500px] bg-card border-border">
        <DialogHeader>
          <DialogTitle>Add Recurring Bill</DialogTitle>
          <DialogDescription>
            Set up a recurring payment schedule.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4 mt-4">
          {/* Title */}
          <div className="space-y-2">
            <Label>Title</Label>
            <Input
              value={formData.title}
              onChange={(e) =>
                setFormData({ ...formData, title: e.target.value })
              }
              placeholder="e.g., Spotify Subscription"
              required
            />
          </div>

          {/* Amount */}
          <div className="space-y-2">
            <Label>Amount</Label>
            <Input
              type="number"
              step="0.01"
              value={formData.amount}
              onChange={(e) =>
                setFormData({ ...formData, amount: e.target.value })
              }
              placeholder="24.80"
              required
            />
          </div>

          {/* Start Date */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Input
              type="date"
              value={formData.start_date}
              onChange={(e) => {
                const value = e.target.value;
                setFormData((prev) => ({
                  ...prev,
                  start_date: value,
                  next_due_date: calculateNextDueDate(value, prev.frequency),
                }));
              }}
              required
            />
          </div>

          {/* Frequency */}
          <div className="space-y-2">
            <Label>Frequency</Label>
            <Select
              value={formData.frequency}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  frequency: value as Frequency,
                  next_due_date: calculateNextDueDate(
                    prev.start_date,
                    value as Frequency
                  ),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="weekly">Weekly</SelectItem>
                <SelectItem value="monthly">Monthly</SelectItem>
                <SelectItem value="yearly">Yearly</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Payment Method */}
          <div className="space-y-2">
            <Label>Payment Method</Label>
            <Select
              value={formData.payment_method || NONE_VALUE}
              onValueChange={(value) =>
                setFormData((prev) => ({
                  ...prev,
                  payment_method:
                    value === NONE_VALUE ? "" : (value as PaymentMethod),
                }))
              }
            >
              <SelectTrigger>
                <SelectValue placeholder="Select payment method" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={NONE_VALUE}>None</SelectItem>
                {PAYMENT_METHOD_OPTIONS.map((method) => (
                  <SelectItem key={method} value={method}>
                    {method}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Next Due Date (auto-calculated) */}
          <div className="space-y-2">
            <Label>Next Due Date</Label>
            <Input type="date" value={formData.next_due_date} disabled />
          </div>

          {/* Account / Category */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>Account</Label>
              <Select
                value={formData.account_id || NONE_VALUE}
                onValueChange={(value) =>
                  setFormData({
                    ...formData,
                    account_id: value === NONE_VALUE ? "" : value,
                  })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select account" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value={NONE_VALUE}>None</SelectItem>
                  {accounts.map((a) => (
                    <SelectItem key={a.id} value={a.id}>
                      {a.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label>Category</Label>
              <Select
                value={formData.category_id}
                onValueChange={(value) =>
                  setFormData({ ...formData, category_id: value })
                }
              >
                <SelectTrigger>
                  <SelectValue placeholder="Select category" />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={c.id}>
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-3 pt-4">
            <Button
              variant="outline"
              type="button"
              onClick={() => setIsOpen(false)}
            >
              Cancel
            </Button>
            <Button type="submit" disabled={loading}>
              {loading ? "Saving..." : "Add Bill"}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
}
