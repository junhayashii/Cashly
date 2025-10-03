import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Wifi, Phone, Zap, Tv, Cloud, Music } from "lucide-react";

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDate: string;
  status: "paid" | "pending" | "overdue";
  icon: any;
}

const bills: Bill[] = [
  {
    id: "1",
    name: "Internet",
    amount: 79.99,
    dueDate: "Dec 5",
    status: "paid",
    icon: Wifi,
  },
  {
    id: "2",
    name: "Phone",
    amount: 45.0,
    dueDate: "Dec 8",
    status: "pending",
    icon: Phone,
  },
  {
    id: "3",
    name: "Electricity",
    amount: 120.5,
    dueDate: "Dec 12",
    status: "pending",
    icon: Zap,
  },
  {
    id: "4",
    name: "Streaming",
    amount: 15.99,
    dueDate: "Dec 15",
    status: "pending",
    icon: Tv,
  },
  {
    id: "5",
    name: "Cloud Storage",
    amount: 9.99,
    dueDate: "Dec 18",
    status: "pending",
    icon: Cloud,
  },
  {
    id: "6",
    name: "Music",
    amount: 12.99,
    dueDate: "Dec 20",
    status: "pending",
    icon: Music,
  },
];

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
