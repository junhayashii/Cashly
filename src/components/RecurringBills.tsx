import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, Pencil } from "lucide-react";

import { AddRecurringBillDialog } from "./AddRecurringBillsDialog";
import EditRecurringBillsDialog from "./EditRecurringBillsDialog";

interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  is_paid: boolean;
  next_due_date: string;
  account_id: string | null;
  category_id: string | null;
  frequency: "weekly" | "monthly" | "yearly";
  start_date?: string;
}

export function RecurringBills() {
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [selectedBill, setSelectedBill] = useState<RecurringBill | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const { toast } = useToast();
  const DEFAULT_CATEGORY_ID = "default-category-id";

  useEffect(() => {
    fetchBills();
  }, []);

  const fetchBills = async () => {
    const { data, error } = await supabase
      .from("recurring_bills")
      .select("*")
      .order("next_due_date", { ascending: true });

    if (error) {
      console.error("Error fetching bills:", error);
      toast({ title: "Error fetching bills", variant: "destructive" });
    } else {
      const updated = data.map((b) => ({ ...b, is_paid: b.is_paid ?? true }));
      setBills(updated);
    }
  };

  const markAsPaid = async (bill: RecurringBill) => {
    console.log("Mark as Paid clicked for:", bill);

    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error("User not found");

      const transactionCategoryId = bill.category_id ?? DEFAULT_CATEGORY_ID;

      // 1. Transaction作成
      const { data: transactionData, error: transactionError } = await supabase
        .from("transactions")
        .insert([
          {
            title: `${bill.title} - ${new Date().toLocaleString("en-US", {
              month: "long",
            })}`,
            amount: -bill.amount,
            date: new Date().toISOString().split("T")[0],
            account_id: bill.account_id,
            category_id: transactionCategoryId,
            user_id: userId,
          },
        ])
        .select();

      if (transactionError) throw transactionError;

      // 2. next_due_date更新
      const nextDue = new Date(bill.next_due_date);
      switch (bill.frequency) {
        case "monthly":
          nextDue.setMonth(nextDue.getMonth() + 1);
          break;
        case "weekly":
          nextDue.setDate(nextDue.getDate() + 7);
          break;
        case "yearly":
          nextDue.setFullYear(nextDue.getFullYear() + 1);
          break;
      }

      const { error: updateError } = await supabase
        .from("recurring_bills")
        .update({
          is_paid: true,
          next_due_date: nextDue.toISOString().split("T")[0],
        })
        .eq("id", bill.id);

      if (updateError) throw updateError;

      toast({
        title: "Paid!",
        description: "Transaction recorded successfully.",
      });

      fetchBills();
    } catch (error) {
      console.error("Error in markAsPaid:", error);
      toast({
        title: "Error",
        description: String(error),
        variant: "destructive",
      });
    }
  };

  const handleEdit = (bill: RecurringBill) => {
    setSelectedBill(bill);
    setIsEditOpen(true);
  };

  const totalPending = bills
    .filter((bill) => !bill.is_paid)
    .reduce((sum, bill) => sum + bill.amount, 0);

  return (
    <Card className="p-6 bg-card border-border">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-xl font-bold text-foreground">Recurring Bills</h2>
          <p className="text-sm text-muted-foreground mt-1">
            ${totalPending.toFixed(2)} pending this month
          </p>
        </div>
        <div>
          <AddRecurringBillDialog onAdded={fetchBills} />
        </div>
      </div>

      <div className="space-y-3">
        {bills.map((bill) => {
          const status = bill.is_paid ? "paid" : "pending";
          const statusColors = {
            paid: "bg-success/10 text-success border-success/20",
            pending: "bg-warning/10 text-warning border-warning/20",
          };

          return (
            <div
              key={bill.id}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  {bill.is_paid ? (
                    <Check className="h-4 w-4 text-success" />
                  ) : (
                    <Clock className="h-4 w-4 text-warning" />
                  )}
                </div>
                <div>
                  <p className="font-medium text-foreground">{bill.title}</p>
                  <p className="text-sm text-muted-foreground">
                    Due {bill.next_due_date}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">
                  ${bill.amount.toFixed(2)}
                </span>

                <Badge
                  variant="outline"
                  className={statusColors[status]}
                  onClick={() => !bill.is_paid && markAsPaid(bill)}
                  style={{ cursor: !bill.is_paid ? "pointer" : "default" }}
                >
                  {bill.is_paid ? "Paid" : "Mark as Paid"}
                </Badge>

                {/* ✏️ 編集ボタン追加 */}
                <Button
                  variant="ghost"
                  size="icon"
                  onClick={() => handleEdit(bill)}
                  className="text-muted-foreground hover:text-primary"
                >
                  <Pencil className="h-4 w-4" />
                </Button>
              </div>
            </div>
          );
        })}
      </div>

      {/* 編集ダイアログ */}
      {selectedBill && (
        <EditRecurringBillsDialog
          open={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          recurringBill={selectedBill}
          onSuccess={fetchBills}
        />
      )}
    </Card>
  );
}
