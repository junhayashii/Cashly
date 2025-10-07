"use client";

import { useState, type ComponentType } from "react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Wallet,
  Banknote,
  Coins,
  Smartphone,
  PiggyBank,
  Edit,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { Account } from "@/types";
import { useAccounts } from "@/hooks/useAccounts";
import { AddAccountDialog } from "@/components/AddAccountsDialog";

type IconComponent = ComponentType<{ className?: string }>;

const getIconComponent = (iconName: string): IconComponent => {
  const icons: Record<string, IconComponent> = {
    CreditCard,
    Wallet,
    Banknote,
    Coins,
    Smartphone,
    PiggyBank,
  };
  return icons[iconName] || Wallet;
};

const Accounts = () => {
  const { accounts, loading: accountsLoading, addAccount } = useAccounts();

  const { toast } = useToast();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const handleAddAccount = (newAccount: Account) => {
    addAccount(newAccount);
    toast({
      title: "Account added",
      description: `${newAccount.name} has been created successfully`,
    });
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setEditDialogOpen(true);
  };

  const handleAccountUpdated = (updatedAccount: Account) => {
    // TODO: 更新処理をフックに移動してもOK
    setEditingAccount(null);
  };

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-foreground mb-2">Accounts</h2>
          <p className="text-muted-foreground">
            Manage your bank accounts, cards, and wallets
          </p>
        </div>
        <AddAccountDialog onAddAccount={handleAddAccount} />
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Accounts
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{accounts.length}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-3">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Balance
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">${totalBalance.toFixed(2)}</div>
          </CardContent>
        </Card>
      </div>

      {/* Accounts List */}
      {accountsLoading ? (
        <div className="text-center py-8 text-muted-foreground">
          Loading accounts...
        </div>
      ) : accounts.length === 0 ? (
        <div className="text-center py-10 text-muted-foreground">
          No accounts yet. Add your first one!
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {accounts.map((account) => {
            const Icon = getIconComponent("Wallet");
            const typeLabels: Record<string, string> = {
              bank: "Bank Account",
              credit_card: "Credit Card",
              cash: "Cash",
              digital_wallet: "Digital Wallet",
            };

            return (
              <Card
                key={account.id}
                className="hover:shadow-lg transition-shadow"
              >
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-3 rounded-lg">
                        <Icon className="h-5 w-5 text-white" />
                      </div>
                      <div>
                        <CardTitle className="text-lg">
                          {account.name}
                        </CardTitle>
                        <CardDescription className="text-sm">
                          {typeLabels[account.type] || account.type}
                        </CardDescription>
                        <Badge variant="secondary" className="mt-1 text-xs">
                          {account.type}
                        </Badge>
                      </div>
                    </div>
                  </div>
                </CardHeader>

                <CardContent className="space-y-4">
                  <div className="space-y-1">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-muted-foreground">Balance</span>
                      <span className="font-medium text-foreground">
                        ${account.balance.toFixed(2)}
                      </span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      className="flex-1"
                      onClick={() => handleEditAccount(account)}
                    >
                      <Edit className="h-4 w-4 mr-2" />
                      Edit
                    </Button>
                  </div>
                </CardContent>
              </Card>
            );
          })}
        </div>
      )}
      {/* 
      <EditAccountDialog
        account={editingAccount}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onAccountUpdated={handleAccountUpdated}
      /> */}
    </div>
  );
};

export default Accounts;
