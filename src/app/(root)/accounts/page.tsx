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
  ChevronRight,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { Account } from "@/types";
import { useAccounts } from "@/hooks/useAccounts";
import { AddAccountDialog } from "@/components/AddAccountsDialog";
import { EditAccountDialog } from "@/components/EditAccountDialog";

import { useTransaction } from "@/hooks/useTransactions";
import { TransactionList } from "@/components/TransactionList";
import { RecurringBills } from "@/components/RecurringBills";

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

const getAccountGradient = (type: string) => {
  switch (type) {
    case "checking":
      return "bg-gradient-to-br from-blue-600 via-blue-500 to-blue-400";
    case "savings":
      return "bg-gradient-to-br from-green-600 via-green-500 to-green-400";
    case "credit_card":
      return "bg-gradient-to-br from-purple-600 via-purple-500 to-purple-400";
    case "investment":
      return "bg-gradient-to-br from-yellow-600 via-yellow-500 to-yellow-400";
    default:
      return "bg-gradient-to-br from-gray-600 via-gray-500 to-gray-400";
  }
};

const Accounts = () => {
  const { accounts, loading: accountsLoading, addAccount } = useAccounts();
  const { transactions, setTransactions } = useTransaction();

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

      {/* Summary Cards
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
      </div> */}

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
            const gradientClass = getAccountGradient(account.type);
            const typeLabels: Record<string, string> = {
              bank: "Bank Account",
              credit_card: "Credit Card",
              cash: "Cash",
              digital_wallet: "Digital Wallet",
            };

            return (
              // <Card
              //   key={account.id}
              //   className="hover:shadow-lg transition-shadow"
              // >
              //   <CardHeader>
              //     <div className="flex items-start justify-between">
              //       <div className="flex items-center gap-3">
              //         <div className="p-3 rounded-lg">
              //           <Icon className="h-5 w-5 text-white" />
              //         </div>
              //         <div>
              //           <CardTitle className="text-lg">
              //             {account.name}
              //           </CardTitle>
              //           <CardDescription className="text-sm">
              //             {typeLabels[account.type] || account.type}
              //           </CardDescription>
              //           <Badge variant="secondary" className="mt-1 text-xs">
              //             {account.type}
              //           </Badge>
              //         </div>
              //       </div>
              //     </div>
              //   </CardHeader>

              //   <CardContent className="space-y-4">
              //     <div className="space-y-1">
              //       <div className="flex items-center justify-between text-sm">
              //         <span className="text-muted-foreground">Balance</span>
              //         <span className="font-medium text-foreground">
              //           ${account.balance.toFixed(2)}
              //         </span>
              //       </div>
              //     </div>

              //     <div className="flex gap-2">
              //       <Button
              //         variant="outline"
              //         size="sm"
              //         className="flex-1"
              //         onClick={() => handleEditAccount(account)}
              //       >
              //         <Edit className="h-4 w-4 mr-2" />
              //         Edit
              //       </Button>
              //     </div>
              //   </CardContent>
              // </Card>
              <div
                key={account.id}
                onClick={() => handleEditAccount(account)}
                className="group cursor-pointer"
              >
                {/* Bank Card */}
                <div
                  className={`relative overflow-hidden rounded-2xl ${gradientClass} p-6 h-56 flex flex-col justify-between text-white shadow-lg hover:shadow-2xl transition-all duration-300 hover:scale-105`}
                >
                  {/* Card Header */}
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm opacity-90 mb-1">
                        {account.institution}
                      </p>
                      <Badge
                        variant="secondary"
                        className="capitalize bg-white/20 text-white border-0 backdrop-blur-sm"
                      >
                        {account.type}
                      </Badge>
                    </div>
                    <Icon className="h-8 w-8 opacity-80" />
                  </div>

                  {/* Card Number */}
                  <div>
                    <p className="text-lg tracking-wider font-medium mb-2">
                      •••• •••• •••• ••••
                    </p>
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs opacity-70 mb-1">Balance</p>
                        <p className="text-2xl font-bold">
                          $
                          {Math.abs(account.balance).toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                      </div>
                      {/* {account.expiryDate && (
                        <div className="text-right">
                          <p className="text-xs opacity-70 mb-1">Expires</p>
                          <p className="text-sm font-medium">
                            {account.expiryDate}
                          </p>
                        </div>
                      )} */}
                    </div>
                  </div>

                  {/* Card Footer */}
                  <div className="absolute bottom-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
                    <div className="flex items-center gap-1 text-xs font-medium bg-white/20 backdrop-blur-sm px-3 py-1 rounded-full">
                      View Details
                      <ChevronRight className="h-3 w-3" />
                    </div>
                  </div>

                  {/* Decorative Pattern */}
                  <div className="absolute -right-8 -top-8 opacity-10">
                    <CreditCard className="h-40 w-40" />
                  </div>
                </div>

                {/* Additional Info Below Card */}
                <div className="mt-3 px-2">
                  <p className="text-sm font-medium text-foreground">
                    {account.name}
                  </p>
                  {/* {account.creditLimit && (
                    <div className="flex items-center gap-2 mt-1">
                      <p className="text-xs text-muted-foreground">
                        Available: ${(account.availableCredit || 0).toFixed(2)}{" "}
                        of ${account.creditLimit.toFixed(2)}
                      </p>
                    </div>
                  )} */}
                </div>
              </div>
            );
          })}
        </div>
      )}

      <EditAccountDialog
        account={editingAccount}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onAccountUpdated={handleAccountUpdated}
      />

      <div className="grid grid-col-1 lg:grid-cols-3 gap-6">
        <div className="lg:col-span-2 space-y-6">
          <TransactionList transactions={transactions} />
        </div>
        <div className="lg:col-span-1 space-y-6">
          <RecurringBills />
        </div>
      </div>
    </div>
  );
};

export default Accounts;
