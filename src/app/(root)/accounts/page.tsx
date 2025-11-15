"use client";

import { useState, useEffect, type ComponentType } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  CreditCard,
  Wallet,
  Banknote,
  Coins,
  Smartphone,
  PiggyBank,
  Edit,
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
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

import { supabase } from "@/lib/supabaseClient";
import { useUserSettings } from "@/hooks/useUserSettings";

type IconComponent = ComponentType<{ className?: string }>;

const ACCOUNT_TYPE_CONFIG: Record<
  Account["type"],
  {
    label: string;
    gradient: string;
    icon: IconComponent;
  }
> = {
  bank: {
    label: "Bank Account",
    gradient: "bg-gradient-to-br from-sky-600 via-blue-500 to-cyan-400",
    icon: Banknote,
  },
  credit_card: {
    label: "Credit Card",
    gradient: "bg-gradient-to-br from-purple-600 via-fuchsia-500 to-pink-500",
    icon: CreditCard,
  },
  cash: {
    label: "Cash",
    gradient: "bg-gradient-to-br from-amber-600 via-orange-500 to-yellow-400",
    icon: Coins,
  },
  e_wallet: {
    label: "Digital Wallet",
    gradient: "bg-gradient-to-br from-emerald-600 via-green-500 to-lime-400",
    icon: Smartphone,
  },
  investment: {
    label: "Investment",
    gradient: "bg-gradient-to-br from-slate-600 via-slate-500 to-slate-400",
    icon: PiggyBank,
  },
};

const getAccountPreset = (type: Account["type"] | undefined) => {
  if (!type) {
    return {
      label: "Account",
      gradient: "bg-gradient-to-br from-zinc-600 via-zinc-500 to-zinc-400",
      icon: Wallet,
    };
  }

  return (
    ACCOUNT_TYPE_CONFIG[type] || {
      label: "Account",
      gradient: "bg-gradient-to-br from-zinc-600 via-zinc-500 to-zinc-400",
      icon: Wallet,
    }
  );
};

const formatCurrency = (value: number, currencySymbol: string) => {
  const sign = value < 0 ? "-" : "";
  return `${sign}${currencySymbol}${Math.abs(value).toLocaleString("en-US", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const Accounts = () => {
  const {
    accounts,
    loading: accountsLoading,
    addAccount,
    refresh,
  } = useAccounts();
  const { transactions } = useTransaction();

  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const fetchUser = async () => {
      const {
        data: { user },
        error,
      } = await supabase.auth.getUser();
      if (error) {
        console.error("Error fetching user:", error);
        return;
      }
      if (user) setUserId(user.id);
    };

    fetchUser();
  }, []);

  const { settings } = useUserSettings(userId || undefined);

  const currencySymbol = settings?.currency === "BRL" ? "R$" : "$";

  const { toast } = useToast();
  const [editingAccount, setEditingAccount] = useState<Account | null>(null);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedAccount, setSelectedAccount] = useState<Account | null>(null);

  const [monthlyDue, setMonthlyDue] = useState(0);

  useEffect(() => {
    if (!selectedAccount) return;

    const exists = accounts.some(
      (account) => account.id === selectedAccount.id
    );

    if (!exists) {
      setSelectedAccount(null);
    }
  }, [accounts, selectedAccount]);

  const selectedAccountFromList = selectedAccount
    ? accounts.find((account) => account.id === selectedAccount.id) ?? null
    : null;

  const activeAccount = selectedAccountFromList ?? null;
  const activeAccountId = activeAccount?.id;
  const hasActiveCreditAccount = activeAccount?.type === "credit_card";

  useEffect(() => {
    const fetchMonthlyDue = async () => {
      if (!activeAccountId || !hasActiveCreditAccount) {
        setMonthlyDue(0);
        return;
      }

      const start = new Date();
      start.setDate(1);
      const end = new Date(start);
      end.setMonth(start.getMonth() + 1);

      const { data, error } = await supabase
        .from("credit_card_payments")
        .select("amount")
        .eq("card_id", activeAccountId)
        .eq("paid", false)
        .gte("due_date", start.toISOString())
        .lt("due_date", end.toISOString());

      if (error) {
        console.error("Error fetching monthly due:", error);
        setMonthlyDue(0);
        return;
      }

      const total = data?.reduce((sum, p) => sum + p.amount, 0) ?? 0;
      setMonthlyDue(total);
    };

    fetchMonthlyDue();
  }, [activeAccountId, hasActiveCreditAccount]);

  const totalBalance = accounts.reduce((sum, a) => sum + a.balance, 0);

  const handleAddAccount = (newAccount: Account) => {
    addAccount(newAccount);
    toast({
      title: "Account added",
      description: `${newAccount.name} has been created successfully`,
    });
  };

  const handleAccountSelect = (account: Account) => {
    setSelectedAccount((current) =>
      current?.id === account.id ? null : account
    );
  };

  const handleEditAccount = (account: Account) => {
    console.log("Editing account:", account);
    setEditingAccount(account);
    setEditDialogOpen(true);
  };

  const handleAccountUpdated = (updatedAccount: Account) => {
    if (selectedAccount?.id === updatedAccount.id) {
      setSelectedAccount(updatedAccount);
    }
    refresh();
    setEditingAccount(null);
  };

  // 選択されたアカウントのトランザクションをフィルタリング
  const selectedAccountTransactions = activeAccount
    ? transactions.filter(
        (transaction) => transaction.account_id === activeAccount.id
      )
    : transactions;

  const aggregateBalanceLabel = activeAccount
    ? "Current Balance"
    : "Total Balance";
  const aggregateBalanceDescription = activeAccount
    ? `Balance available in ${activeAccount.name}`
    : "Combined balance across all accounts";
  const aggregateBalanceValue = activeAccount
    ? activeAccount.balance
    : totalBalance;

  const canShowCreditLimit =
    hasActiveCreditAccount && typeof activeAccount?.credit_limit === "number";
  const creditLimitValue = canShowCreditLimit
    ? Number(activeAccount?.credit_limit ?? 0)
    : 0;
  const availableLimit =
    canShowCreditLimit && typeof activeAccount?.available_limit === "number"
      ? Number(activeAccount?.available_limit)
      : null;
  const usedLimit =
    canShowCreditLimit && availableLimit !== null
      ? Math.max(creditLimitValue - availableLimit, 0)
      : null;
  const usagePercent =
    usedLimit !== null && creditLimitValue > 0
      ? Math.min((usedLimit / creditLimitValue) * 100, 100)
      : 0;

  return (
    <div className="flex h-[95vh] flex-col gap-8 overflow-hidden">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h2 className="text-3xl font-bold text-foreground">Accounts</h2>
          </div>
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
      <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 flex-1 min-h-0">
        {/* Left Sidebar - Accounts List */}
        <div className="lg:col-span-1 min-h-0">
          <div className="flex h-full flex-col overflow-hidden rounded-2xl border border-border/40 bg-card/50">
            <div className="flex items-center justify-between border-b border-border/40 px-4 py-3">
              <p className="text-sm font-semibold text-foreground">Accounts</p>
              <span className="text-xs text-muted-foreground">
                {accountsLoading ? "—" : accounts.length}
              </span>
            </div>
            {accountsLoading ? (
              <div className="flex flex-1 items-center justify-center px-4 text-center text-muted-foreground">
                Loading accounts...
              </div>
            ) : accounts.length === 0 ? (
              <div className="flex flex-1 items-center justify-center px-4 text-center text-muted-foreground">
                No accounts yet. Add your first one!
              </div>
            ) : (
              <div className="flex-1 space-y-3 overflow-y-auto px-2 py-4 pr-3">
                {accounts.map((account) => {
                  const {
                    gradient,
                    icon: Icon,
                    label,
                  } = getAccountPreset(account.type);
                  const isSelected = activeAccount?.id === account.id;
                  const creditLimit =
                    typeof account.credit_limit === "number"
                      ? account.credit_limit
                      : null;
                  const availableLimit =
                    typeof account.available_limit === "number"
                      ? account.available_limit
                      : null;
                  const usedAmount =
                    creditLimit !== null && availableLimit !== null
                      ? Math.max(creditLimit - availableLimit, 0)
                      : null;

                  return (
                    <div
                      key={account.id}
                      role="button"
                      tabIndex={0}
                      aria-pressed={isSelected}
                      aria-label={`Select ${account.name}`}
                      onKeyDown={(event) => {
                        if (event.key === "Enter" || event.key === " ") {
                          event.preventDefault();
                          handleAccountSelect(account);
                        }
                      }}
                      onClick={() => handleAccountSelect(account)}
                      className={`group relative cursor-pointer rounded-2xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                        isSelected
                          ? "border-primary/80 bg-primary/5 ring-2 ring-primary/30 shadow-lg shadow-primary/20"
                          : "border-border/40 hover:border-border hover:shadow-md"
                      }`}
                    >
                      <div
                        className={`relative flex h-full min-h-[200px] flex-col overflow-hidden rounded-2xl ${gradient} p-4 text-white transition-transform duration-300 ${
                          isSelected
                            ? "scale-[1.02]"
                            : "group-hover:-translate-y-0.5"
                        }`}
                      >
                        <div
                          onClick={(e) => e.stopPropagation()}
                          className="absolute right-2 top-2 z-20"
                        >
                          <DropdownMenu>
                            <DropdownMenuTrigger asChild>
                              <Button
                                variant="ghost"
                                size="sm"
                                className="h-7 w-7 rounded-full p-0 text-white hover:bg-white/20"
                              >
                                <MoreVertical className="h-4 w-4" />
                              </Button>
                            </DropdownMenuTrigger>

                            <DropdownMenuContent align="end">
                              <DropdownMenuItem
                                onSelect={(e) => {
                                  e.preventDefault();
                                  handleEditAccount(account);
                                }}
                              >
                                <Edit className="mr-2 h-4 w-4" />
                                Edit Account
                              </DropdownMenuItem>
                            </DropdownMenuContent>
                          </DropdownMenu>
                        </div>

                        {isSelected && (
                          <div className="absolute bottom-3 right-3 z-20">
                            <span className="rounded-full bg-white/90 px-3 py-1 text-[11px] font-semibold uppercase tracking-wide text-primary">
                              Selected
                            </span>
                          </div>
                        )}

                        <div className="flex items-start justify-between gap-3 pr-10">
                          <div className="space-y-1">
                            <p className="text-[11px] uppercase tracking-wide opacity-80">
                              {account.institution || "Manual account"}
                            </p>
                            <p className="text-lg font-semibold leading-tight">
                              {account.name}
                            </p>
                          </div>
                          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white/15 backdrop-blur">
                            <Icon className="h-5 w-5" />
                          </div>
                        </div>

                        <div className="mt-4 flex items-end justify-between gap-3">
                          <div>
                            <p className="text-xs opacity-70">Balance</p>
                            <p className="text-2xl font-semibold">
                              {formatCurrency(account.balance, currencySymbol)}
                            </p>
                          </div>
                          <div className="text-right space-y-1">
                            <Badge
                              variant="secondary"
                              className="border-0 bg-white/20 text-white backdrop-blur"
                            >
                              {label}
                            </Badge>
                            {creditLimit !== null && (
                              <p className="text-xs opacity-80">
                                Limit{" "}
                                {formatCurrency(creditLimit, currencySymbol)}
                              </p>
                            )}
                          </div>
                        </div>

                        {account.type === "credit_card" &&
                          creditLimit !== null &&
                          availableLimit !== null && (
                            <div className="mt-4 rounded-xl bg-white/15 p-3 text-[11px] uppercase tracking-wide">
                              <div className="flex items-center justify-between text-white">
                                <div>
                                  <p className="opacity-80">Used</p>
                                  <p className="text-sm font-semibold">
                                    {formatCurrency(
                                      usedAmount || 0,
                                      currencySymbol
                                    )}
                                  </p>
                                </div>
                                <div className="text-right">
                                  <p className="opacity-80">Available</p>
                                  <p className="text-sm font-semibold">
                                    {formatCurrency(
                                      availableLimit,
                                      currencySymbol
                                    )}
                                  </p>
                                </div>
                              </div>
                            </div>
                          )}

                        <div className="pointer-events-none absolute inset-0 opacity-10">
                          <CreditCard className="absolute -right-6 -top-6 h-24 w-24" />
                        </div>
                        <div className="mt-auto" aria-hidden="true" />
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="lg:col-span-3 flex flex-col gap-6 min-h-0">
          {/* Selected Account Info */}
          <div className="shrink-0">
            {accounts.length === 0 ? (
              <div className="rounded-xl border border-dashed border-border/60 p-6 text-center">
                <h3 className="text-xl font-semibold text-foreground mb-2">
                  No accounts yet
                </h3>
                <p className="text-muted-foreground">
                  Add your first account to start tracking balances and
                  activity.
                </p>
              </div>
            ) : (
              <div className="grid grid-cols-1 gap-4 md:grid-cols-3 md:auto-rows-fr">
                {/* 💰 Balance overview */}
                <Card className="bg-card border-border h-full">
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">
                      {aggregateBalanceLabel}
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    <p className="text-2xl font-bold">
                      {currencySymbol}
                      {aggregateBalanceValue.toLocaleString("en-US", {
                        minimumFractionDigits: 2,
                        maximumFractionDigits: 2,
                      })}
                    </p>
                    <p className="text-xs text-muted-foreground mt-2">
                      {aggregateBalanceDescription}
                    </p>
                  </CardContent>
                </Card>

                {/* 💳 Credit Limit */}
                <Card className="bg-card border-border h-full">
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">
                      Credit Activity
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {canShowCreditLimit && availableLimit !== null ? (
                      <>
                        <p className="text-2xl font-bold">
                          {currencySymbol}
                          {creditLimitValue.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <div className="mt-3">
                          <p className="text-sm text-muted-foreground mb-1">
                            Used: {currencySymbol}
                            {usedLimit?.toLocaleString("en-US", {
                              minimumFractionDigits: 2,
                              maximumFractionDigits: 2,
                            })}{" "}
                            ({usagePercent.toFixed(0)}%)
                          </p>
                          <div className="w-full h-2 bg-muted rounded-full overflow-hidden">
                            <div
                              className="h-full bg-primary transition-all duration-500"
                              style={{ width: `${usagePercent}%` }}
                            ></div>
                          </div>
                        </div>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {activeAccount
                          ? "This account doesn't include credit limit tracking."
                          : "Select a credit card to see limit usage."}
                      </p>
                    )}
                  </CardContent>
                </Card>

                {/* 📅 Upcoming Payment */}
                <Card className="bg-card border-border h-full">
                  <CardHeader>
                    <CardTitle className="text-sm text-muted-foreground">
                      Upcoming Payment
                    </CardTitle>
                  </CardHeader>
                  <CardContent>
                    {hasActiveCreditAccount ? (
                      <>
                        <p className="text-2xl font-bold">
                          {currencySymbol}
                          {monthlyDue.toLocaleString("en-US", {
                            minimumFractionDigits: 2,
                            maximumFractionDigits: 2,
                          })}
                        </p>
                        <p className="text-xs text-muted-foreground mt-1">
                          Due this month
                        </p>
                      </>
                    ) : (
                      <p className="text-sm text-muted-foreground">
                        {activeAccount
                          ? "Upcoming payment data appears for credit cards."
                          : "Choose a credit card to see upcoming payments."}
                      </p>
                    )}
                  </CardContent>
                </Card>
              </div>
            )}
          </div>

          {/* Transactions*/}

          <div className="flex-1 min-h-0 overflow-hidden">
            <TransactionList
              transactions={selectedAccountTransactions}
              title={
                activeAccount
                  ? `${activeAccount.name} Transactions`
                  : "All Transactions"
              }
              currencySymbol={currencySymbol}
            />
          </div>
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
