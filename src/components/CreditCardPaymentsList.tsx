"use client";

import { Card } from "@/components/ui/card";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { CheckCircle2, Clock } from "lucide-react";
import { supabase } from "@/lib/supabaseClient";
import { useState } from "react";

interface CreditCardPayment {
  id: string;
  title: string;
  amount: number;
  installment_number: number;
  total_installments: number;
  due_date: string;
  paid: boolean;
  paid_date?: string;
}

interface CreditCardPaymentsListProps {
  payments: CreditCardPayment[];
  currencySymbol?: string;
  refresh?: () => void; // useCreditCardPaymentsのrefreshを受け取る
}

export function CreditCardPaymentsList({
  payments,
  currencySymbol = "¥",
  refresh,
}: CreditCardPaymentsListProps) {
  const [updatingId, setUpdatingId] = useState<string | null>(null);

  const handleMarkAsPaid = async (paymentId: string) => {
    setUpdatingId(paymentId);
    const { error } = await supabase
      .from("credit_card_payments")
      .update({
        paid: true,
        paid_date: new Date().toISOString(),
      })
      .eq("id", paymentId);

    if (error) {
      console.error("Error marking as paid:", error);
    } else {
      // Triggerが動いてtransactionsに自動追加される
      console.log("✅ Marked as paid:", paymentId);
      if (refresh) refresh(); // リスト更新
    }
    setUpdatingId(null);
  };

  const formatDate = (dateStr?: string) => {
    if (!dateStr) return "-";
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", {
      year: "numeric",
      month: "short",
      day: "numeric",
    });
  };

  return (
    <Card className="h-full flex flex-col bg-card border-border">
      <div className="p-6 pb-4 flex items-center justify-between">
        <h2 className="text-xl font-bold text-foreground">
          Credit Card Payments
        </h2>
        <span className="text-sm text-muted-foreground">
          {payments.length} payments
        </span>
      </div>

      <div className="flex-1 min-h-0 px-6 pb-6 overflow-auto">
        {payments.length === 0 ? (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            No credit card payments found
          </div>
        ) : (
          <Table>
            <TableHeader className="sticky top-0 bg-card z-10">
              <TableRow>
                <TableHead>Title</TableHead>
                <TableHead>Due Date</TableHead>
                <TableHead>Status</TableHead>
                <TableHead className="text-center">Amount</TableHead>
                <TableHead className="text-center">Action</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {payments.map((p) => (
                <TableRow key={p.id}>
                  <TableCell>
                    {p.title} ({p.installment_number}/{p.total_installments})
                  </TableCell>
                  <TableCell>{formatDate(p.due_date)}</TableCell>
                  <TableCell>
                    {p.paid ? (
                      <div className="flex items-center gap-1 text-green-600">
                        <CheckCircle2 className="h-4 w-4" />
                        Paid
                      </div>
                    ) : (
                      <div className="flex items-center gap-1 text-yellow-600">
                        <Clock className="h-4 w-4" />
                        Pending
                      </div>
                    )}
                  </TableCell>
                  <TableCell className="text-center font-semibold">
                    {currencySymbol}
                    {p.amount.toLocaleString()}
                  </TableCell>
                  <TableCell className="text-center">
                    {!p.paid && (
                      <Button
                        size="sm"
                        disabled={updatingId === p.id}
                        onClick={() => handleMarkAsPaid(p.id)}
                      >
                        {updatingId === p.id ? "Updating..." : "Mark as Paid"}
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        )}
      </div>
    </Card>
  );
}
