import { useState } from "react";
import { Check, Clock, Pencil, Plus, Trash2, Calendar } from "lucide-react";
import { Card } from "./ui/card";
import { Button } from "./ui/button";
import { Badge } from "./ui/badge";
import { useBills } from "@/hooks/useBills";

import { RecurringBill } from "@/hooks/useBills";

const RecurringBills = () => {
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

  return (
    <div>
      {/* Bills List */}
      <Card className="p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-lg font-semibold text-foreground">Upcomming</h3>
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
            <Button onClick={() => setIsAddOpen(true)} className="gap-2">
              <Plus className="h-4 w-4" />
              Add Recurring Bill
            </Button>
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
    </div>
  );
};

export default RecurringBills;
