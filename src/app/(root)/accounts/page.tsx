"use client";

import { useState, useEffect, type ComponentType } from "react";
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
import { useSidebar } from "@/components/ui/sidebar";

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
  const { isMobile } = useSidebar();
  const headerClass = isMobile
    ? "flex items-center justify-between pl-12"
    : "flex items-center justify-between";

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

  return (
    <div className="flex w-full min-w-0 flex-col gap-8 overflow-x-hidden h-[95vh] overflow-hidden">
      {/* Header */}
      <div className={headerClass}>
        <div>
          <div className="mb-2 flex items-center gap-3">
            <h2 className="text-3xl font-bold text-foreground">Accounts</h2>
          </div>
          <p className="text-muted-foreground">
            Manage your bank accounts, cards, and wallets
          </p>
        </div>
        <div className="hidden sm:block">
          <AddAccountDialog onAddAccount={handleAddAccount} />
        </div>
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
      <div className="flex w-full min-w-0 max-w-full flex-col gap-6 overflow-x-hidden min-[1420px]:flex-row min-[1420px]:min-h-0 min-[1420px]:gap-6">
        {/* Left Sidebar - Accounts List */}
        <div className="w-full min-w-0 min-[1420px]:flex-[1] min-[1420px]:min-h-0 min-[1420px]:overflow-hidden">
          <div className="flex flex-col overflow-visible rounded-2xl border border-border/40 bg-card/50">
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
              <div className="w-full max-w-full overflow-x-hidden overflow-y-auto max-h-[80vh] min-[1420px]:max-h-[85vh] px-2 sm:px-2.5 md:px-3 py-2 sm:py-2.5 md:py-3 pr-2 sm:pr-3">
                <div className="grid w-full min-w-0 grid-cols-[repeat(auto-fit,minmax(220px,1fr))] gap-3">
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
                        className={`group relative w-full min-w-0 h-[140px] sm:h-[160px] md:h-[175px] lg:h-[185px] xl:h-[195px] cursor-pointer rounded-xl sm:rounded-2xl border transition-all duration-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary/50 ${
                          isSelected
                            ? "border-primary/80 bg-primary/5 ring-2 ring-primary/30 shadow-lg shadow-primary/20"
                            : "border-border/40 hover:border-border hover:shadow-md"
                        }`}
                      >
                        <div
                          className={`relative flex h-full flex-col overflow-hidden rounded-xl sm:rounded-2xl ${gradient} p-2 sm:p-2.5 md:p-2.5 lg:p-3 xl:p-3 2xl:p-4 text-white transition-transform duration-300 ${
                            isSelected
                              ? "scale-[1.02]"
                              : "group-hover:-translate-y-0.5"
                          }`}
                        >
                          <div
                            onClick={(e) => e.stopPropagation()}
                            className="absolute right-0.5 top-0.5 sm:right-1 sm:top-1 md:right-1 md:top-1 lg:right-1.5 lg:top-1.5 2xl:right-1.5 2xl:top-1.5 z-20"
                          >
                            <DropdownMenu>
                              <DropdownMenuTrigger asChild>
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  className="h-3.5 w-3.5 sm:h-4 sm:w-4 md:h-5 md:w-5 lg:h-6 lg:w-6 2xl:h-6 2xl:w-6 rounded-full p-0 text-white hover:bg-white/20"
                                >
                                  <MoreVertical className="h-2 w-2 sm:h-2.5 sm:w-2.5 md:h-3 md:w-3 lg:h-3.5 lg:w-3.5 2xl:h-3.5 2xl:w-3.5" />
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
                            <div className="absolute bottom-0.5 right-0.5 sm:bottom-1 sm:right-1 md:bottom-1.5 md:right-1.5 lg:bottom-2 lg:right-2 2xl:bottom-2 2xl:right-2 z-20">
                              <span className="rounded-full bg-white/90 px-0.5 sm:px-1 md:px-1.5 lg:px-2 py-0.5 text-[6px] sm:text-[7px] md:text-[8px] lg:text-[9px] xl:text-[9px] 2xl:text-[10px] font-semibold uppercase tracking-wide text-primary">
                                Selected
                              </span>
                            </div>
                          )}

                          <div className="flex items-start justify-between gap-1.5 sm:gap-2 pr-4 sm:pr-5 md:pr-6 lg:pr-8 xl:pr-9 2xl:pr-10">
                            <div className="space-y-0.5 min-w-0 flex-1">
                              <p className="text-[7px] sm:text-[8px] md:text-[8px] lg:text-[9px] xl:text-[9px] 2xl:text-[10px] uppercase tracking-wide opacity-80 truncate">
                                {account.institution || "Manual account"}
                              </p>
                              <p className="text-[10px] sm:text-xs md:text-sm lg:text-sm xl:text-sm 2xl:text-base font-semibold leading-tight truncate">
                                {account.name}
                              </p>
                            </div>
                            <div className="flex h-5 w-5 sm:h-7 sm:w-7 md:h-8 md:w-8 lg:h-9 lg:w-9 xl:h-9 xl:w-9 2xl:h-10 2xl:w-10 items-center justify-center rounded-lg sm:rounded-xl bg-white/15 backdrop-blur flex-shrink-0">
                              <Icon className="h-2.5 w-2.5 sm:h-3 sm:w-3 md:h-3.5 md:w-3.5 lg:h-3.5 lg:w-3.5 xl:h-3.5 xl:w-3.5 2xl:h-4 2xl:w-4" />
                            </div>
                          </div>

                          <div className="mt-1 sm:mt-1.5 md:mt-2 lg:mt-2.5 xl:mt-3 2xl:mt-4 flex items-end justify-between gap-1.5 sm:gap-2">
                            <div className="min-w-0 flex-1">
                              <p className="text-[7px] sm:text-[8px] md:text-[8px] lg:text-[9px] xl:text-[9px] 2xl:text-[10px] opacity-70">
                                Balance
                              </p>
                              <p className="text-xs sm:text-sm md:text-base lg:text-lg xl:text-lg 2xl:text-xl font-semibold truncate">
                                {formatCurrency(
                                  account.balance,
                                  currencySymbol
                                )}
                              </p>
                            </div>
                            <div className="text-right space-y-0.5 flex-shrink-0">
                              <Badge
                                variant="secondary"
                                className="border-0 bg-white/20 text-white backdrop-blur text-[7px] sm:text-[8px] md:text-[8px] lg:text-[9px] xl:text-[9px] 2xl:text-[10px] px-0.5 sm:px-1 md:px-1.5 py-0.5"
                              >
                                {label}
                              </Badge>
                              {creditLimit !== null && (
                                <p className="text-[7px] sm:text-[8px] md:text-[8px] lg:text-[9px] xl:text-[9px] 2xl:text-[10px] opacity-80">
                                  Limit{" "}
                                  {formatCurrency(creditLimit, currencySymbol)}
                                </p>
                              )}
                            </div>
                          </div>

                          {account.type === "credit_card" &&
                            creditLimit !== null &&
                            availableLimit !== null && (
                              <div className="mt-1 sm:mt-1.5 md:mt-2 lg:mt-2.5 xl:mt-3 2xl:mt-4 rounded-md sm:rounded-lg bg-white/15 p-0.5 sm:p-1 md:p-1.5 lg:p-2 xl:p-2 2xl:p-2.5 text-[7px] sm:text-[8px] md:text-[8px] lg:text-[9px] xl:text-[9px] 2xl:text-[10px] uppercase tracking-wide">
                                <div className="flex items-center justify-between text-white gap-1 sm:gap-1.5">
                                  <div className="min-w-0">
                                    <p className="opacity-80 text-[7px] sm:text-[8px] md:text-[8px] lg:text-[9px] xl:text-[9px] 2xl:text-[10px]">
                                      Used
                                    </p>
                                    <p className="text-[8px] sm:text-[9px] md:text-[9px] lg:text-[10px] xl:text-[10px] 2xl:text-xs font-semibold truncate">
                                      {formatCurrency(
                                        usedAmount || 0,
                                        currencySymbol
                                      )}
                                    </p>
                                  </div>
                                  <div className="text-right min-w-0">
                                    <p className="opacity-80 text-[7px] sm:text-[8px] md:text-[8px] lg:text-[9px] xl:text-[9px] 2xl:text-[10px]">
                                      Available
                                    </p>
                                    <p className="text-[8px] sm:text-[9px] md:text-[9px] lg:text-[10px] xl:text-[10px] 2xl:text-xs font-semibold truncate">
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
                            <CreditCard className="absolute -right-3 -top-3 sm:-right-4 sm:-top-4 md:-right-5 md:-top-5 lg:-right-6 lg:-top-6 xl:-right-6 xl:-top-6 2xl:-right-6 2xl:-top-6 h-12 w-12 sm:h-16 sm:w-16 md:h-20 md:w-20 lg:h-20 lg:w-20 xl:h-24 xl:w-24 2xl:h-24 2xl:w-24" />
                          </div>
                          <div className="mt-auto" aria-hidden="true" />
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Right Content Area */}
        <div className="flex flex-col gap-6 w-full min-w-0 min-[1420px]:flex-[3] min-[1420px]:min-h-0 min-[1420px]:overflow-hidden">
          {/* Transactions*/}

          <div className="w-full min-w-0 overflow-visible min-[1420px]:overflow-hidden">
            <TransactionList
              transactions={selectedAccountTransactions}
              title={
                activeAccount
                  ? `${activeAccount.name} Transactions`
                  : "All Transactions"
              }
              currencySymbol={currencySymbol}
              mobileBreakpoint={1365}
            />
          </div>
        </div>
      </div>
      <div className="sm:hidden fixed bottom-4 right-4 z-50">
        <AddAccountDialog
          onAddAccount={handleAddAccount}
          trigger={
            <Button className="h-12 w-12 rounded-full shadow-lg shadow-primary/40 bg-primary text-primary-foreground">
              <span className="sr-only">Add Account</span>
              <span aria-hidden className="text-xl leading-none">
                +
              </span>
            </Button>
          }
        />
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
