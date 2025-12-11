"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Check, Clock, ArrowRight } from "lucide-react";
import Link from "next/link";

import EditRecurringBillsDialog from "./EditRecurringBillsDialog";
import type { RecurringBill } from "@/hooks/useBills";

type RecurringBillsProps = {
  currencySymbol: string;
  bills: RecurringBill[];
};

export function RecurringBills({ currencySymbol, bills = [] }: RecurringBillsProps) {
  const [selectedBill, setSelectedBill] = useState<RecurringBill | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);

  const totalPending = bills
    .filter((b) => !b.is_paid)
    .reduce((sum, b) => sum + b.amount, 0);

  return (
    <Card className="p-6 bg-card border-border h-72 flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="text-xl font-bold text-foreground">Recurring Bills</h2>
          <p className="text-sm text-muted-foreground">
            {currencySymbol}
            {totalPending.toFixed(2)} pending
          </p>
        </div>
        <Button
          asChild
          variant="ghost"
          size="sm"
          className="h-7 px-2 text-muted-foreground hover:text-foreground"
        >
          <Link href="/transactions">
            <span className="text-xs">See All</span>
            <ArrowRight className="h-3 w-3 ml-1" />
          </Link>
        </Button>
      </div>

      {/* Bill List */}
      <div className="flex flex-col gap-2 flex-1">
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
            className="flex items-center justify-between py-1.5 px-1 hover:bg-muted/30 transition-colors rounded"
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
                <p className="font-medium text-foreground text-sm truncate">
                  {bill.title}
                </p>
                <p className="text-xs text-muted-foreground">
                  {bill.is_paid
                    ? `Next on ${bill.next_due_date}`
                    : `Due ${bill.next_due_date}`}
                  {bill.payment_method && ` • ${bill.payment_method}`}
                </p>
              </div>
            </div>

            {/* Right: amount + actions */}
            <div className="flex items-center gap-2 flex-shrink-0">
              <span className="font-semibold text-foreground text-sm">
                {currencySymbol}
                {bill.amount.toFixed(2)}
              </span>
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
          onSuccess={() => {}} // No-op as we rely on parent refresh or just view only here
        />
      )}
    </Card>
  );
}
