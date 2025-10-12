"use client";

import { useState } from "react";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Check,
  Clock,
  Pencil,
  Trash2,
  Plus,
  Calendar,
  DollarSign,
  AlertTriangle,
} from "lucide-react";
import { AddRecurringBillDialog } from "@/components/AddRecurringBillsDialog";
import EditRecurringBillsDialog from "@/components/EditRecurringBillsDialog";
import ProtectedRoute from "@/components/ProtectedRoute";
import { useBills, RecurringBill } from "@/hooks/useBills";

const Bills = () => {
  const [selectedBill, setSelectedBill] = useState<RecurringBill | null>(null);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isAddOpen, setIsAddOpen] = useState(false);

  const {
    bills,
    loading,
    fetchBills,
    markAsPaid,
    deleteBill,
    getStatusColor,
    getStatusText,
    formatDate,
    getFrequencyText,
    totalBills,
    paidBills,
    pendingBills,
    overdueBills,
    totalPendingAmount,
  } = useBills();

  if (loading) {
    return (
      <ProtectedRoute>
        <div className="space-y-8">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-3xl font-bold text-foreground mb-2">
                Recurring Bills
              </h2>
              <p className="text-muted-foreground">
                Manage your recurring bills and payments
              </p>
            </div>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            {[...Array(4)].map((_, i) => (
              <Card key={i} className="p-6">
                <div className="animate-pulse">
                  <div className="h-4 bg-muted rounded w-3/4 mb-2"></div>
                  <div className="h-8 bg-muted rounded w-1/2"></div>
                </div>
              </Card>
            ))}
          </div>
        </div>
      </ProtectedRoute>
    );
  }

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
          <Button onClick={() => setIsAddOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Recurring Bill
          </Button>
        </div>

        {/* Metrics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Total Bills
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {totalBills}
                </p>
              </div>
              <div className="h-8 w-8 bg-blue-100 rounded-full flex items-center justify-center">
                <Calendar className="h-4 w-4 text-blue-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending
                </p>
                <p className="text-2xl font-bold text-foreground">
                  {pendingBills}
                </p>
              </div>
              <div className="h-8 w-8 bg-yellow-100 rounded-full flex items-center justify-center">
                <Clock className="h-4 w-4 text-yellow-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Overdue
                </p>
                <p className="text-2xl font-bold text-red-600">
                  {overdueBills}
                </p>
              </div>
              <div className="h-8 w-8 bg-red-100 rounded-full flex items-center justify-center">
                <AlertTriangle className="h-4 w-4 text-red-600" />
              </div>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-muted-foreground">
                  Pending Amount
                </p>
                <p className="text-2xl font-bold text-foreground">
                  ${totalPendingAmount.toFixed(2)}
                </p>
              </div>
              <div className="h-8 w-8 bg-green-100 rounded-full flex items-center justify-center">
                <DollarSign className="h-4 w-4 text-green-600" />
              </div>
            </div>
          </Card>
        </div>

        {/* Bills List */}
        <Card className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-foreground">All Bills</h3>
            <div className="flex items-center gap-2">
              <Badge variant="outline" className="text-xs">
                {paidBills} Paid
              </Badge>
              <Badge variant="outline" className="text-xs">
                {pendingBills} Pending
              </Badge>
              {overdueBills > 0 && (
                <Badge variant="destructive" className="text-xs">
                  {overdueBills} Overdue
                </Badge>
              )}
            </div>
          </div>

          {bills.length === 0 ? (
            <div className="text-center py-12">
              <div className="h-12 w-12 bg-muted rounded-full flex items-center justify-center mx-auto mb-4">
                <Calendar className="h-6 w-6 text-muted-foreground" />
              </div>
              <h3 className="text-lg font-medium text-foreground mb-2">
                No recurring bills
              </h3>
              <p className="text-muted-foreground mb-4">
                Get started by adding your first recurring bill
              </p>
              <Button onClick={() => setIsAddOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Recurring Bill
              </Button>
            </div>
          ) : (
            <div className="space-y-4">
              {bills.map((bill) => (
                <div
                  key={bill.id}
                  className="flex items-center justify-between p-4 border border-border rounded-lg hover:bg-muted/30 transition-colors"
                >
                  <div className="flex items-center gap-4">
                    <div className="flex-shrink-0">
                      {bill.is_paid ? (
                        <Check className="h-5 w-5 text-green-600" />
                      ) : (
                        <Clock className="h-5 w-5 text-yellow-600" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <h4 className="font-medium text-foreground">
                        {bill.title}
                      </h4>
                      <div className="flex items-center gap-4 text-sm text-muted-foreground">
                        <span>Due {formatDate(bill.next_due_date)}</span>
                        <span>•</span>
                        <span>{getFrequencyText(bill.frequency)}</span>
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-4">
                    <div className="text-right">
                      <p className="font-semibold text-foreground">
                        ${bill.amount.toFixed(2)}
                      </p>
                      <Badge className={`text-xs ${getStatusColor(bill)}`}>
                        {getStatusText(bill)}
                      </Badge>
                    </div>

                    <div className="flex items-center gap-2">
                      {!bill.is_paid && (
                        <Button
                          size="sm"
                          variant="outline"
                          onClick={() => markAsPaid(bill)}
                          className="text-xs"
                        >
                          Mark Paid
                        </Button>
                      )}

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => {
                          setSelectedBill(bill);
                          setIsEditOpen(true);
                        }}
                      >
                        <Pencil className="h-4 w-4 text-muted-foreground" />
                      </Button>

                      <Button
                        variant="ghost"
                        size="icon"
                        onClick={() => deleteBill(bill.id)}
                        className="text-red-600 hover:text-red-700 hover:bg-red-50"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </Card>

        {/* Dialogs */}
        <AddRecurringBillDialog
          onAdded={fetchBills}
          open={isAddOpen}
          onOpenChange={setIsAddOpen}
        />

        {selectedBill && (
          <EditRecurringBillsDialog
            open={isEditOpen}
            onClose={() => setIsEditOpen(false)}
            recurringBill={selectedBill}
            onSuccess={fetchBills}
          />
        )}
      </div>
    </ProtectedRoute>
  );
};

export default Bills;
