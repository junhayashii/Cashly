"use client";

import { useEffect, useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";
import { Check, Clock, Pencil, Plus, ArrowRight } from "lucide-react";
import Link from "next/link";

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
      return;
    }

    setBills(data.map((b) => ({ ...b, is_paid: b.is_paid ?? true })));
  };

  const markAsPaid = async (bill: RecurringBill) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error("User not found");

      const categoryId = bill.category_id ?? DEFAULT_CATEGORY_ID;

      await supabase.from("transactions").insert([
        {
          title: `${bill.title}`,
          amount: -bill.amount,
          date: new Date().toISOString().split("T")[0],
          account_id: bill.account_id,
          category_id: categoryId,
          user_id: userId,
        },
      ]);

      const nextDue = new Date(bill.next_due_date);
      if (bill.frequency === "monthly")
        nextDue.setMonth(nextDue.getMonth() + 1);
      if (bill.frequency === "weekly") nextDue.setDate(nextDue.getDate() + 7);
      if (bill.frequency === "yearly")
        nextDue.setFullYear(nextDue.getFullYear() + 1);

      await supabase
        .from("recurring_bills")
        .update({
          is_paid: true,
          next_due_date: nextDue.toISOString().split("T")[0],
        })
        .eq("id", bill.id);

      toast({ title: "Marked as Paid!" });
      fetchBills();
    } catch (err) {
      console.error(err);
      toast({
        title: "Error marking as paid",
        description: String(err),
        variant: "destructive",
      });
    }
  };

  const totalPending = bills
    .filter((b) => !b.is_paid)
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <Card className="p-6 bg-card border-border h-80 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-4">
        <div>
          <h2 className="text-xl font-bold text-foreground">Recurring Bills</h2>
          <p className="text-sm text-muted-foreground">
            ${totalPending.toFixed(2)} pending
          </p>
        </div>
        <Button asChild variant="ghost" size="sm" className="h-8 px-2">
          <Link href="/bills">
            <span className="text-xs">See All</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Bill List */}
      <div className="flex flex-col gap-3 flex-1 overflow-y-auto">
        {bills.length === 0 && (
          <div className="flex-1 flex items-center justify-center">
            <p className="text-center text-muted-foreground">
              No recurring bills yet
            </p>
          </div>
        )}

        {bills.slice(0, 3).map((bill) => (
          <div
            key={bill.id}
            className="flex items-center justify-between py-2 px-1 hover:bg-muted/30 transition-colors rounded"
          >
            {/* Left: icon + info */}
            <div className="flex items-center gap-3">
              <div className="flex-shrink-0">
                {bill.is_paid ? (
                  <Check className="h-4 w-4 text-success" />
                ) : (
                  <Clock className="h-4 w-4 text-warning" />
                )}
              </div>
              <div className="min-w-0 flex-1">
                <p className="font-medium text-foreground text-sm truncate">{bill.title}</p>
                <p className="text-xs text-muted-foreground">
                  Due {bill.next_due_date}
                </p>
              </div>
            </div>

            {/* Right: amount + actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-semibold text-foreground text-sm">
                ${bill.amount.toFixed(2)}
              </span>
              {/* 
              {!bill.is_paid && (
                <Button
                  size="sm"
                  variant="secondary"
                  className="text-xs"
                  onClick={() => markAsPaid(bill)}
                >
                  Mark Paid
                </Button>
              )} */}

              {/* <Button
                variant="ghost"
                size="icon"
                onClick={() => {
                  setSelectedBill(bill);
                  setIsEditOpen(true);
                }}
              >
                <Pencil className="h-4 w-4 text-muted-foreground" />
              </Button> */}
            </div>
          </div>
        ))}
      </div>

      {/* Edit dialog */}
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
