"use client";

import { RecurringBills } from "@/components/RecurringBills";
import { AddRecurringBillDialog } from "@/components/AddRecurringBillsDialog";
import ProtectedRoute from "@/components/ProtectedRoute";

const Bills = () => {
  return (
    <ProtectedRoute>
      <div className="space-y-8">
        {/* Header Section */}
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-2">
              Recurring Bills
            </h2>
            <p className="text-muted-foreground">
              Manage your recurring bills and payments
            </p>
          </div>
          <AddRecurringBillDialog onAdded={() => {}} />
        </div>

        {/* Bills Section */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <div className="lg:col-span-2">
            <RecurringBills />
          </div>
        </div>
      </div>
    </ProtectedRoute>
  );
};

export default Bills;
