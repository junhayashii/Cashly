import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";

import { bills } from "@/data/bills";

export function RecurringBills() {
  const totalPending = bills
    .filter((bill) => bill.status === "pending")
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
      </div>
      <div className="space-y-3">
        {bills.map((bill) => {
          const Icon = bill.icon;
          const statusColors = {
            paid: "bg-success/10 text-success border-success/20",
            pending: "bg-warning/10 text-warning border-warning/20",
            overdue: "bg-destructive/10 text-destructive border-destructive/20",
          };

          return (
            <div
              key={bill.id}
              className="flex items-center justify-between p-4 rounded-lg hover:bg-secondary/50 transition-colors"
            >
              <div className="flex items-center gap-3">
                <div className="p-2 rounded-lg bg-muted">
                  <Icon className="h-4 w-4 text-primary" />
                </div>
                <div>
                  <p className="font-medium text-foreground">{bill.name}</p>
                  <p className="text-sm text-muted-foreground">
                    Due {bill.dueDate}
                  </p>
                </div>
              </div>
              <div className="flex items-center gap-3">
                <span className="font-semibold text-foreground">
                  ${bill.amount.toFixed(2)}
                </span>
                <Badge variant="outline" className={statusColors[bill.status]}>
                  {bill.status}
                </Badge>
              </div>
            </div>
          );
        })}
      </div>
    </Card>
  );
}
