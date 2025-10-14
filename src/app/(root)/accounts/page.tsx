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
  MoreVertical,
} from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";

import { Account } from "@/types";
import { useAccounts } from "@/hooks/useAccounts";
import { AddAccountDialog } from "@/components/AddAccountsDialog";
import { EditAccountDialog } from "@/components/EditAccountDialog";

import { useTransaction } from "@/hooks/useTransactions";
import { TransactionList } from "@/components/TransactionList";
import { RecurringBills } from "@/components/RecurringBillsSimple";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const handleAddAccount = (newAccount: Account) => {
    addAccount(newAccount);
    toast({
      title: "Account added",
      description: `${newAccount.name} has been created successfully`,
    });
  };

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount(account);
  };

  const handleEditAccount = (account: Account) => {
    setEditingAccount(account);
    setEditDialogOpen(true);
  };

  const handleAccountUpdated = (updatedAccount: Account) => {
    // TODO: 更新処理をフックに移動してもOK
    setEditingAccount(null);
  };

  // 選択されたアカウントのトランザクションをフィルタリング
  const selectedAccountTransactions = selectedAccount
    ? transactions.filter(
        (transaction) => transaction.account_id === selectedAccount.id
      )
    : transactions;

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

      {/* Main Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
        {/* Left Sidebar - Accounts List */}
        <div className="lg:col-span-1">
          <div className="sticky top-6">
            <h3 className="text-lg font-semibold text-foreground mb-4">
              Your Accounts
            </h3>
            {accountsLoading ? (
              <div className="text-center py-8 text-muted-foreground">
                Loading accounts...
              </div>
            ) : accounts.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                No accounts yet. Add your first one!
              </div>
            ) : (
              <div className="space-y-3">
                {accounts.map((account) => {
                  const Icon = getIconComponent("Wallet");
                  const gradientClass = getAccountGradient(account.type);
                  const isSelected = selectedAccount?.id === account.id;

                  return (
                    <div
                      key={account.id}
                      onClick={() => handleAccountSelect(account)}
                      className={`group cursor-pointer transition-all duration-200 rounded-xl overflow-hidden ${
                        isSelected
                          ? "ring-2 ring-primary ring-offset-2 ring-offset-background shadow-lg"
                          : "hover:shadow-md"
                      }`}
                    >
                      {/* Compact Account Card */}
                      <div
                        className={`relative overflow-hidden rounded-xl ${gradientClass} p-4 h-32 flex flex-col justify-between text-white transition-all duration-300 ${
                          isSelected ? "scale-105" : "hover:scale-102"
                        }`}
                      >
                        {/* Card Header */}
                        <div className="flex items-start justify-between">
                          <div>
                            <p className="text-xs opacity-90 mb-1">
                              {account.institution}
                            </p>
                            <Badge
                              variant="secondary"
                              className="capitalize bg-white/20 text-white border-0 backdrop-blur-sm text-xs"
                            >
                              {account.type}
                            </Badge>
                          </div>
                          <div className="flex items-center gap-2">
                            <Icon className="h-5 w-5 opacity-80" />
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-6 w-6 p-0 text-white hover:bg-white/20"
                                  onClick={(e) => e.stopPropagation()}
                                >
                                  <MoreVertical className="h-3 w-3" />
                                </Button>
                              </DropdownMenuTrigger>
                              <DropdownMenuContent align="end">
                                <DropdownMenuItem
                                  onClick={() => handleEditAccount(account)}
                                >
                                  <Edit className="h-4 w-4 mr-2" />
                                  Edit Account
                                </DropdownMenuItem>
                              </DropdownMenuContent>
                            </DropdownMenu>
                          </div>
                        </div>

                        {/* Balance */}
                        <div>
                          <p className="text-xs opacity-70 mb-1">Balance</p>
                          <p className="text-lg font-bold">
                            $
                            {Math.abs(account.balance).toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}
                          </p>
                        </div>

                        {/* Decorative Pattern */}
                        <div className="absolute -right-4 -top-4 opacity-10">
                          <CreditCard className="h-20 w-20" />
                        </div>
                      </div>

                      {/* Account Name Below Card */}
                      <div className="mt-2 px-1">
                        <p className="text-sm font-medium text-foreground truncate">
                          {account.name}
                        </p>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3 space-y-6">
          {/* Selected Account Info */}
          {selectedAccount ? (
            <div className="bg-gradient-to-r from-primary/5 to-primary/10 rounded-xl p-6 border border-primary/20">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-2xl font-bold text-foreground">
                    {selectedAccount.name}
                  </h3>
                  <p className="text-muted-foreground">
                    {selectedAccount.institution} • {selectedAccount.type}
                  </p>
                </div>
                <div className="text-right">
                  <p className="text-3xl font-bold text-foreground">
                    ${selectedAccount.balance.toFixed(2)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Current Balance
                  </p>
                </div>
              </div>
            </div>
          ) : (
            <div className="bg-muted/50 rounded-xl p-6 text-center">
              <h3 className="text-xl font-semibold text-foreground mb-2">
                Select an Account
              </h3>
              <p className="text-muted-foreground">
                Choose an account from the sidebar to view its details and
                transactions
              </p>
            </div>
          )}

          {/* Transactions*/}

          <TransactionList
            transactions={selectedAccountTransactions}
            title={
              selectedAccount
                ? `${selectedAccount.name} Transactions`
                : "All Transactions"
            }
          />
        </div>
      </div>

      <EditAccountDialog
        account={editingAccount}
        open={editDialogOpen}
        onOpenChange={setEditDialogOpen}
        onAccountUpdated={handleAccountUpdated}
      />
    </div>
  );
};

export default Accounts;
