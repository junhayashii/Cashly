"use client";

import { useState } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Plus, CreditCard, Building2, Wallet, TrendingUp } from "lucide-react";
import { Badge } from "@/components/ui/badge";

import { Account } from "@/types";
import { initialAccounts } from "@/data/account";

const getAccountIcon = (type: string) => {
  switch (type) {
    case "checking":
      return Wallet;
    case "savings":
      return Building2;
    case "credit":
      return CreditCard;
    case "investment":
      return TrendingUp;
    default:
      return Wallet;
  }
};

const getAccountColor = (type: string) => {
  switch (type) {
    case "checking":
      return "bg-primary/10 text-primary";
    case "savings":
      return "bg-success/10 text-success";
    case "credit":
      return "bg-accent/10 text-accent";
    case "investment":
      return "bg-warning/10 text-warning";
    default:
      return "bg-muted";
  }
};

const Accounts = () => {
  const [accounts] = useState<Account[]>(initialAccounts);

  const totalAssets = accounts
    .filter((a) => a.balance > 0)
    .reduce((sum, a) => sum + a.balance, 0);

  const totalLiabilities = accounts
    .filter((a) => a.balance < 0)
    .reduce((sum, a) => sum + Math.abs(a.balance), 0);

  const netWorth = totalAssets - totalLiabilities;

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Accounts</h2>
          <p className="text-muted-foreground">
            Manage all your financial accounts
          </p>
        </div>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Add Account
        </Button>
      </div>

      {/* Net Worth Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Assets
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-success">
              ${totalAssets.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Liabilities
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">
              ${totalLiabilities.toFixed(2)}
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Net Worth
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-primary">
              ${netWorth.toFixed(2)}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {accounts.map((account) => {
          const Icon = getAccountIcon(account.type);
          const colorClass = getAccountColor(account.type);

          return (
            <Card
              key={account.id}
              className="hover:shadow-lg transition-shadow"
            >
              <CardHeader>
                <div className="flex items-start justify-between">
                  <div className="flex items-center gap-3">
                    <div className={`p-3 rounded-lg ${colorClass}`}>
                      <Icon className="h-5 w-5" />
                    </div>
                    <div>
                      <CardTitle className="text-lg">{account.name}</CardTitle>
                      <CardDescription className="text-sm">
                        {account.institution} •••• {account.lastFour}
                      </CardDescription>
                    </div>
                  </div>
                  <Badge variant="outline" className="capitalize">
                    {account.type}
                  </Badge>
                </div>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground mb-1">
                      Balance
                    </p>
                    <p
                      className={`text-2xl font-bold ${
                        account.balance >= 0
                          ? "text-foreground"
                          : "text-destructive"
                      }`}
                    >
                      ${Math.abs(account.balance).toFixed(2)}
                    </p>
                  </div>
                  <Button variant="outline" size="sm">
                    View Details
                  </Button>
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
};

export default Accounts;
