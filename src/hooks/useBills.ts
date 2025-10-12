import { useState, useEffect } from "react";
import { supabase } from "@/lib/supabaseClient";
import { useToast } from "@/hooks/use-toast";

export interface RecurringBill {
  id: string;
  title: string;
  amount: number;
  is_paid: boolean;
  next_due_date: string;
  account_id: string | null;
  category_id: string | null;
  frequency: "weekly" | "monthly" | "yearly";
  start_date?: string;
  created_at?: string;
  updated_at?: string;
}

export function useBills() {
  const [bills, setBills] = useState<RecurringBill[]>([]);
  const [loading, setLoading] = useState(true);
  const { toast } = useToast();

  const fetchBills = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from("recurring_bills")
        .select("*")
        .order("next_due_date", { ascending: true });

      if (error) {
        console.error("Error fetching bills:", error);
        toast({ title: "Error fetching bills", variant: "destructive" });
        return;
      }

      setBills(data || []);
    } catch (error) {
      console.error("Error fetching bills:", error);
      toast({ title: "Error fetching bills", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  const markAsPaid = async (bill: RecurringBill) => {
    try {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) throw new Error("User not found");

      // Create transaction record
      await supabase.from("transactions").insert([
        {
          title: bill.title,
          amount: -bill.amount,
          date: new Date().toISOString().split("T")[0],
          account_id: bill.account_id,
          category_id: bill.category_id,
          user_id: userId,
        },
      ]);

      // Calculate next due date
      const nextDue = new Date(bill.next_due_date);
      if (bill.frequency === "monthly") {
        nextDue.setMonth(nextDue.getMonth() + 1);
      } else if (bill.frequency === "weekly") {
        nextDue.setDate(nextDue.getDate() + 7);
      } else if (bill.frequency === "yearly") {
        nextDue.setFullYear(nextDue.getFullYear() + 1);
      }

      // Update bill
      await supabase
        .from("recurring_bills")
        .update({
          is_paid: true,
          next_due_date: nextDue.toISOString().split("T")[0],
        })
        .eq("id", bill.id);

      toast({ title: "Bill marked as paid!" });
      fetchBills();
    } catch (error) {
      console.error("Error marking bill as paid:", error);
      toast({
        title: "Error marking bill as paid",
        variant: "destructive",
      });
    }
  };

  const deleteBill = async (billId: string) => {
    try {
      const { error } = await supabase
        .from("recurring_bills")
        .delete()
        .eq("id", billId);

      if (error) {
        console.error("Error deleting bill:", error);
        toast({ title: "Error deleting bill", variant: "destructive" });
        return;
      }

      toast({ title: "Bill deleted successfully" });
      fetchBills();
    } catch (error) {
      console.error("Error deleting bill:", error);
      toast({ title: "Error deleting bill", variant: "destructive" });
    }
  };

  const getStatusColor = (bill: RecurringBill) => {
    if (bill.is_paid) return "bg-green-100 text-green-800 border-green-200";

    const dueDate = new Date(bill.next_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate < today) return "bg-red-100 text-red-800 border-red-200";
    return "bg-yellow-100 text-yellow-800 border-yellow-200";
  };

  const getStatusText = (bill: RecurringBill) => {
    if (bill.is_paid) return "Paid";

    const dueDate = new Date(bill.next_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);

    if (dueDate < today) return "Overdue";
    return "Pending";
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const getFrequencyText = (frequency: string) => {
    return frequency.charAt(0).toUpperCase() + frequency.slice(1);
  };

  // Calculate metrics
  const totalBills = bills.length;
  const paidBills = bills.filter((bill) => bill.is_paid).length;
  const pendingBills = bills.filter((bill) => !bill.is_paid).length;
  const overdueBills = bills.filter((bill) => {
    if (bill.is_paid) return false;
    const dueDate = new Date(bill.next_due_date);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    return dueDate < today;
  }).length;

  const totalPendingAmount = bills
    .filter((bill) => !bill.is_paid)
    .reduce((sum, bill) => sum + bill.amount, 0);

  const totalOverdueAmount = bills
    .filter((bill) => {
      if (bill.is_paid) return false;
      const dueDate = new Date(bill.next_due_date);
      const today = new Date();
      today.setHours(0, 0, 0, 0);
      return dueDate < today;
    })
    .reduce((sum, bill) => sum + bill.amount, 0);

  useEffect(() => {
    fetchBills();
  }, []);

  return {
    bills,
    loading,
    fetchBills,
    markAsPaid,
    deleteBill,
    getStatusColor,
    getStatusText,
    formatDate,
    getFrequencyText,
    // Metrics
    totalBills,
    paidBills,
    pendingBills,
    overdueBills,
    totalPendingAmount,
    totalOverdueAmount,
  };
}
