"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import type { Item } from "pluggy-sdk";
import {
  PluggyConnect,
  type PluggyConnectInstance,
} from "react-pluggy-connect";
import { CheckCircle2, Loader2, Plug, Plus, RefreshCw } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { useToast } from "@/hooks/use-toast";
import { useTheme } from "@/components/ThemeProvider";
import { supabase } from "@/lib/supabaseClient";
import { useAccounts } from "@/hooks/useAccounts";
import { useTransaction } from "@/hooks/useTransactions";
import type { Account } from "@/types";

type ConnectTokenResponse = {
  connectToken: string;
};

type LinkedItem = {
  connectionId?: string | null;
  itemId: string;
  accountMapping: Record<string, string>;
  transactionIds?: string[];
  /** Latest Pluggy transaction timestamp processed (ISO). */
  lastProcessedAt?: string;
  /** Latest time we finished a sync for status messaging (ISO). */
  lastSyncedAt?: string;
  /** Human readable institution name for UI. */
  institutionName?: string;
  /** Cached Pluggy account labels associated with the item. */
  accountNames?: string[];
  /** Latest known status for the connection */
  status?: string | null;
};

type ConnectionSummary = {
  itemId: string;
  connectionId: string | null;
  institutionName: string;
  accounts: Account[];
  accountLabels: string[];
  displayNames: string[];
  missingCount: number;
  lastSyncedAt: string | null;
  accountsNeedingLink: string[];
};

const LINKED_ITEMS_STORAGE_NAMESPACE = "cashly:pluggy-linked-items";
const LEGACY_LINKED_ITEMS_KEY = LINKED_ITEMS_STORAGE_NAMESPACE;

const PluggyConnectLauncher = () => {
  const { toast } = useToast();
  const { theme } = useTheme();
  const {
    accounts: existingAccounts,
    loading: accountsLoading,
    addAccount,
    updateAccountBalance,
    refresh: refreshAccounts,
  } = useAccounts();
  const { refresh: refreshTransactions } = useTransaction();
  const [userId, setUserId] = useState<string | null>(null);
  const [userLoaded, setUserLoaded] = useState(false);
  const [connectToken, setConnectToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [syncing, setSyncing] = useState(false);
  const [syncingItemId, setSyncingItemId] = useState<string | null>(null);
  const [linkedItems, setLinkedItems] = useState<LinkedItem[]>([]);
  const connectInstanceRef = useRef<PluggyConnectInstance | null>(null);
  const linkedItemsRef = useRef<LinkedItem[]>([]);
  const autoSyncStartedRef = useRef(false);
  const isMountedRef = useRef(true);

  useEffect(() => {
    if (connectToken && connectInstanceRef.current) {
      void connectInstanceRef.current.show();
    }
  }, [connectToken]);

  useEffect(() => {
    let active = true;

    const resolveUser = async () => {
      try {
        const { data, error } = await supabase.auth.getUser();
        if (!active) return;
        if (error || !data?.user) {
          setUserId(null);
        } else {
          setUserId(data.user.id);
        }
      } catch {
        if (active) {
          setUserId(null);
        }
      } finally {
        if (active) {
          setUserLoaded(true);
        }
      }
    };

    void resolveUser();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    return () => {
      isMountedRef.current = false;
    };
  }, []);

  useEffect(() => {
    if (!userLoaded) return;

    if (!userId) {
      linkedItemsRef.current = [];
      setLinkedItems([]);
      autoSyncStartedRef.current = false;
      return;
    }

    let cancelled = false;

    const load = async () => {
      const [remote, local] = await Promise.all([
        loadLinkedItemsFromSupabase(userId),
        Promise.resolve(loadLinkedItemsFromStorage(userId)),
      ]);

      if (cancelled) return;

      const merged = mergeLinkedItemSources({
        remote,
        local,
      });

      linkedItemsRef.current = merged;
      setLinkedItems(merged);
      autoSyncStartedRef.current = false;
      saveLinkedItemsToStorage(userId, merged);
    };

    void load();

    return () => {
      cancelled = true;
    };
  }, [userId, userLoaded]);

  const latestSyncAt = useMemo(() => {
    const timestamps = linkedItems
      .map((item) => item.lastSyncedAt)
      .filter((value): value is string => Boolean(value));
    if (!timestamps.length) return null;
    const maxMilliseconds = Math.max(
      ...timestamps.map((value) => new Date(value).getTime())
    );
    if (!Number.isFinite(maxMilliseconds)) return null;
    return new Date(maxMilliseconds);
  }, [linkedItems]);

  const formattedLastSync = useMemo(
    () => (latestSyncAt ? formatDisplayTimestamp(latestSyncAt) : null),
    [latestSyncAt]
  );

  const connectionSummaries: ConnectionSummary[] = useMemo(() => {
    return linkedItems.map((link) => {
      const mappedIds = Object.values(link.accountMapping ?? {});
      const accountsIndex = new Map(existingAccounts.map((account) => [account.id, account]));

      const accountSet = new Map<string, Account>();

      for (const accountId of mappedIds) {
        const account = accountsIndex.get(accountId);
        if (account) accountSet.set(account.id, account);
      }

      if (link.connectionId) {
        for (const account of existingAccounts) {
          if (account.connection_id === link.connectionId) {
            accountSet.set(account.id, account);
          }
        }
      }

      const institutionName =
        (accountSet.size
          ? accountSet.values().next().value?.institution ??
            accountSet.values().next().value?.name
          : link.institutionName) ?? "Pluggy Account";

      if (!accountSet.size) {
        const normalizedInstitution = institutionName?.toLowerCase().trim();
        if (normalizedInstitution) {
          for (const account of existingAccounts) {
            if (account.connection_id) continue;

            const institutionMatch =
              account.institution &&
              account.institution.toLowerCase().trim() === normalizedInstitution;
            const nameMatch =
              account.name &&
              account.name.toLowerCase().includes(normalizedInstitution);

            if (institutionMatch || nameMatch) {
              accountSet.set(account.id, account);
            }
          }
        }
      }

      const accounts = Array.from(accountSet.values());
      const missingCount =
        mappedIds.length > 0 ? Math.max(mappedIds.length - accounts.length, 0) : 0;

      const accountLabels =
        accounts.length > 0
          ? accounts.map((account) => account.name)
          : link.accountNames ?? [];

      const displayNames = accountLabels.length
        ? accountLabels
            .map(formatAccountNameForDisplay)
            .filter((value) => value.length > 0)
        : [];

      const accountsNeedingLink =
        link.connectionId && accounts.length
          ? accounts
              .filter((account) => !account.connection_id)
              .map((account) => account.id)
          : [];

      return {
        itemId: link.itemId,
        connectionId: link.connectionId ?? null,
        institutionName: institutionName ?? "Pluggy Account",
        accounts,
        accountLabels,
        displayNames,
        missingCount,
        lastSyncedAt: link.lastSyncedAt ?? null,
        accountsNeedingLink,
      };
    });
  }, [existingAccounts, linkedItems]);

  const hasConnections = connectionSummaries.some((summary) => summary.accounts.length > 0);
  const staleMappingCount = connectionSummaries.reduce(
    (total, summary) => total + summary.missingCount,
    0
  );
  const totalConnectedAccounts = connectionSummaries.reduce(
    (total, summary) => total + summary.accounts.length,
    0
  );
const connectionsToRender = useMemo(
  () =>
    [...connectionSummaries].sort((a, b) =>
      a.institutionName.localeCompare(b.institutionName)
    ),
  [connectionSummaries]
);

  const linkingAccountsRef = useRef(false);

  useEffect(() => {
    if (!userId) return;
    if (linkingAccountsRef.current) return;

    const updates = new Map<string, string[]>();

    for (const summary of connectionSummaries) {
      if (!summary.connectionId) continue;
      if (!summary.accountsNeedingLink.length) continue;
      updates.set(summary.connectionId, summary.accountsNeedingLink);
    }

    if (!updates.size) return;

    linkingAccountsRef.current = true;

    const linkAccounts = async () => {
      try {
        for (const [connectionId, accountIds] of updates.entries()) {
          const { error } = await supabase
            .from("accounts")
            .update({
              connection_id: connectionId,
              updated_at: new Date().toISOString(),
            })
            .eq("user_id", userId)
            .in("id", accountIds);

          if (error && (error as { code?: string })?.code !== "42P01") {
            console.error(
              `[Pluggy] Failed to backfill connection for accounts ${accountIds.join(", ")}.`,
              error
            );
          }
        }

        await refreshAccounts().catch((error) => {
          console.error("[Pluggy] Failed to refresh accounts after linking.", error);
        });
      } finally {
        linkingAccountsRef.current = false;
      }
    };

    void linkAccounts();
  }, [connectionSummaries, refreshAccounts, userId]);

  const persistLinkedItems = useCallback(
    (next: LinkedItem[]) => {
      linkedItemsRef.current = next;
      setLinkedItems(next);
      if (userId) {
        saveLinkedItemsToStorage(userId, next);
        void syncLinkedItemsToSupabase(userId, next);
      }
    },
    [userId]
  );

  const setSyncingState = useCallback((value: boolean) => {
    if (isMountedRef.current) {
      setSyncing(value);
      if (!value) {
        setSyncingItemId(null);
      }
    }
  }, []);

  const upsertLinkedItem = useCallback(
    (link: LinkedItem) => {
      const existing = linkedItemsRef.current;
      const index = existing.findIndex((item) => item.itemId === link.itemId);
      if (index === -1) {
        persistLinkedItems([...existing, link]);
      } else {
        const updated = [...existing];
        updated[index] = link;
        persistLinkedItems(updated);
      }
    },
    [persistLinkedItems]
  );

  const syncPluggyItem = useCallback(
    async ({
      itemId,
      existingLink,
      silent,
    }: {
      itemId: string;
      existingLink?: LinkedItem | null;
      silent?: boolean;
    }): Promise<LinkedItem | null> => {
      try {
        const response = await fetch(
          `/api/pluggy/transactions?itemId=${encodeURIComponent(itemId)}`
        );
        const body = await response.json().catch(() => null);

        if (!response.ok) {
          const message =
            (body && body.error) ||
            "Failed to fetch Pluggy transactions for automatic sync.";
          throw new Error(message);
        }

        const accountsInPayload = extractAccounts(body);
        const transactionsInPayload = extractTransactionsByAccount(body);
        if (!userId) {
          throw new Error("Supabase user session is required to save transactions.");
        }

        let connectionId =
          existingLink?.connectionId ??
          (await ensureConnectionRecord({
            userId,
            itemId,
            status: existingLink?.status ?? "active",
          }));

        const accountIdMapping = await ensureSupabaseAccounts({
          pluggyAccounts: accountsInPayload,
          existingAccounts,
          onAccountCreated: addAccount,
          initialMapping: existingLink?.accountMapping,
          userId,
          onAccountBalanceUpdated: updateAccountBalance,
          connectionId,
        });

        const existingTransactionIds = new Set(existingLink?.transactionIds ?? []);
        const processedTransactionIdsThisRun = new Set<string>();
        const candidateTransactionIds: string[] = [];
        const transactionUpserts: SupabaseTransactionInsert[] = [];
        let latestTransactionTimestamp = existingLink?.lastProcessedAt
          ? new Date(existingLink.lastProcessedAt).getTime()
          : existingLink?.lastSyncedAt
            ? new Date(existingLink.lastSyncedAt).getTime()
            : 0;

        for (const group of transactionsInPayload) {
          const supabaseAccountId = accountIdMapping[group.accountId];
          if (!supabaseAccountId) continue;

          for (const transaction of group.transactions) {
            if (!transaction?.id) continue;
            const dateObject = parsePluggyDate(transaction.date);
            if (dateObject) {
              latestTransactionTimestamp = Math.max(
                latestTransactionTimestamp,
                dateObject.getTime()
              );
            }

            if (existingTransactionIds.has(transaction.id)) continue;
            if (processedTransactionIdsThisRun.has(transaction.id)) continue;

            const status = transaction.status?.toUpperCase();
            if (status === "PENDING") continue;

            const normalizedAmount = normalizePluggyAmount(transaction.amount, transaction.type);
            if (normalizedAmount === null) continue;

            if (!dateObject) continue;
            const dateString = formatDateOnly(dateObject);

            transactionUpserts.push({
              id: transaction.id,
              title: buildPluggyTransactionTitle(transaction),
              amount: normalizedAmount,
              account_id: supabaseAccountId,
              type: normalizedAmount < 0 ? "expense" : "income",
              user_id: userId,
              date: dateString,
            });
            candidateTransactionIds.push(transaction.id);
            processedTransactionIdsThisRun.add(transaction.id);
          }
        }

        if (transactionUpserts.length) {
          const { error: transactionError } = await supabase
            .from("transactions")
            .upsert(transactionUpserts, { onConflict: "id" });

          if (transactionError) {
            console.error(
              `[Pluggy] Failed to upsert ${transactionUpserts.length} transactions for item ${itemId}.`,
              transactionError
            );
          } else {
            console.log(
              `[Pluggy] Upserted ${transactionUpserts.length} transactions for item ${itemId}.`
            );
            candidateTransactionIds.forEach((id) => existingTransactionIds.add(id));
            await refreshTransactions().catch((refreshError) => {
              console.error(
                "[Pluggy] Failed to refresh transactions after sync.",
                refreshError
              );
            });
          }
        }

        const pluggyAccountNames = accountsInPayload
          .map((account) => (account.name && account.name.trim()) || null)
          .filter((value): value is string => Boolean(value));
        const inferredInstitutionName =
          pluggyAccountNames[0] ??
          existingLink?.institutionName ??
          (accountsInPayload.length ? "Pluggy Account" : undefined);

        const link: LinkedItem = {
          itemId,
          connectionId: existingLink?.connectionId ?? null,
          accountMapping: accountIdMapping,
          transactionIds: Array.from(existingTransactionIds),
          lastProcessedAt:
            latestTransactionTimestamp > 0
              ? new Date(latestTransactionTimestamp).toISOString()
              : existingLink?.lastProcessedAt ??
                existingLink?.lastSyncedAt ??
                new Date().toISOString(),
          lastSyncedAt: new Date().toISOString(),
          institutionName: inferredInstitutionName,
          accountNames:
            pluggyAccountNames.length > 0
              ? Array.from(new Set(pluggyAccountNames))
              : existingLink?.accountNames,
          status: "active",
        };

        if (userId) {
          const ensuredConnectionId = await ensureConnectionRecord({
            userId,
            itemId,
            institutionName: inferredInstitutionName,
            status: link.status,
          });
          connectionId = ensuredConnectionId ?? connectionId ?? null;
        }

        link.connectionId = connectionId ?? null;

        upsertLinkedItem(link);
        return link;
      } catch (error) {
        const message =
          error instanceof Error ? error.message : "Failed to sync Pluggy data.";
        console.error(`[Pluggy] Failed to synchronize item ${itemId}.`, error);
        if (!silent) {
          toast({
            title: "Pluggy 同期エラー",
            description: message,
            variant: "destructive",
          });
        }
        if (userId) {
          await ensureConnectionRecord({
            userId,
            itemId,
            institutionName: existingLink?.institutionName,
            status: "error",
          });
        }
        return null;
      }
    },
    [
      addAccount,
      existingAccounts,
      refreshTransactions,
      toast,
      updateAccountBalance,
      upsertLinkedItem,
      userId,
    ]
  );

  useEffect(() => {
    if (accountsLoading) return;
    if (!userId) return;
    if (autoSyncStartedRef.current) return;
    if (!linkedItemsRef.current.length) return;

    autoSyncStartedRef.current = true;
    let cancelled = false;

    const run = async () => {
      setSyncingState(true);
      for (const link of linkedItemsRef.current) {
        if (cancelled) break;
        await syncPluggyItem({
          itemId: link.itemId,
          existingLink: link,
          silent: true,
        });
      }
      if (!cancelled) {
        await refreshAccounts().catch((error) => {
          console.error("[Pluggy] Failed to refresh accounts after auto sync.", error);
        });
        setSyncingState(false);
      }
    };

    void run();

    return () => {
      cancelled = true;
      setSyncingState(false);
    };
  }, [accountsLoading, refreshAccounts, setSyncingState, syncPluggyItem, userId]);

  const requestConnectToken = async () => {
    setLoading(true);
    setErrorMessage(null);

    try {
      if (!userId) {
        throw new Error("You must be signed in to connect Pluggy.");
      }

      const response = await fetch("/api/pluggy/connect-token", {
        method: "POST",
      });
      const body = (await response.json().catch(() => null)) as
        | ConnectTokenResponse
        | { error?: string }
        | null;

      if (!response.ok || !body || !("connectToken" in body)) {
        const message =
          (body && "error" in body && body.error) ||
          "Pluggy Connect token could not be generated.";
        throw new Error(message);
      }

      const { connectToken } = body as ConnectTokenResponse;
      setConnectToken(connectToken);
    } catch (error) {
      console.error("[Pluggy] Failed to initialize Connect.", error);
      const message =
        error instanceof Error
          ? error.message
          : "Failed to initialize Pluggy Connect.";
      setErrorMessage(message);
      toast({
        title: "Pluggy Connect error",
        description: message,
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  const handleSuccess = async ({ item }: { item: Item }) => {
    toast({
      title: "Financial institution connected",
      description: "Pluggy retrieved data successfully.",
    });

    await connectInstanceRef.current?.hide();
    setConnectToken(null);

    const existingLink = linkedItemsRef.current.find(
      (link) => link.itemId === item.id
    );
    await syncPluggyItem({ itemId: item.id, existingLink });
    await refreshAccounts().catch((error) => {
      console.error("[Pluggy] Failed to refresh accounts after connect.", error);
    });
  };

  const handleManualSync = async (itemId?: string) => {
    if (syncing) return;
    if (!userId) {
      toast({
        title: "Pluggy を利用するにはサインインが必要です",
        description: "アカウントにサインインしてから再度お試しください。",
        variant: "destructive",
      });
      return;
    }
    if (!linkedItemsRef.current.length) {
      toast({
        title: "Pluggy アカウント未連携",
        description: "先に金融機関を接続してください。",
      });
      return;
    }

    const targets = itemId
      ? linkedItemsRef.current.filter((link) => link.itemId === itemId)
      : linkedItemsRef.current;

    if (!targets.length) {
      toast({
        title: "接続情報が見つかりません",
        description: "もう一度 Pluggy を接続し直してください。",
        variant: "destructive",
      });
      return;
    }

    if (itemId) {
      setSyncingItemId(itemId);
    }
    setSyncingState(true);
    try {
      for (const link of targets) {
        await syncPluggyItem({ itemId: link.itemId, existingLink: link });
      }
      await refreshAccounts().catch((error) => {
        console.error("[Pluggy] Failed to refresh accounts after manual sync.", error);
      });
    } finally {
      setSyncingState(false);
    }
  };

  const handleError = (error: { message: string }) => {
    console.error("[Pluggy] Connect error.", error);
    toast({
      title: "Pluggy Connect error",
      description: error.message,
      variant: "destructive",
    });
  };

  const handleClose = () => {
    setConnectToken(null);
    connectInstanceRef.current = null;
  };

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-start justify-between gap-3 rounded-lg border border-border bg-muted/40 p-4">
        <div className="space-y-1">
          <p className="text-sm font-medium text-foreground">Pluggy 接続状況</p>
          <p className="text-xs text-muted-foreground">
            {hasConnections
              ? `現在 ${connectionsToRender.length} 件の接続で ${totalConnectedAccounts} 口座を同期しています。`
              : "Pluggy Connect で金融機関を接続すると、ここに表示されます。"}
          </p>
          {formattedLastSync ? (
            <p className="text-xs text-muted-foreground">最終同期: {formattedLastSync}</p>
          ) : null}
        </div>
        <div className="flex items-center gap-2">
          <Badge
            variant={
              accountsLoading || syncing
                ? "secondary"
                : hasConnections
                  ? "default"
                  : "outline"
            }
            className="flex items-center gap-1"
          >
            {accountsLoading || syncing ? (
              <Loader2 className="h-3 w-3 animate-spin" />
            ) : null}
            {accountsLoading
              ? "確認中..."
              : syncing
                ? "同期中"
                : hasConnections
                  ? "接続済み"
                  : "未接続"}
          </Badge>
          {hasConnections ? (
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleManualSync()}
              disabled={syncing}
              className="gap-2"
            >
              {syncing && !syncingItemId ? (
                <>
                  <Loader2 className="h-4 w-4 animate-spin" />
                  更新中...
                </>
              ) : (
                <>
                  <RefreshCw className="h-4 w-4" />
                  すべて更新
                </>
              )}
            </Button>
          ) : null}
        </div>
      </div>

      <div className="space-y-2">
        {connectionsToRender.map((connection) => {
          const isHealthy = connection.accounts.length > 0 && connection.missingCount === 0;
          const isSyncingThis = syncing && syncingItemId === connection.itemId;
          const accountSummary =
            connection.displayNames.length > 0
              ? connection.displayNames.join(" / ")
              : "接続済みの口座が見つかりません。";
          const lastSyncedLabel = connection.lastSyncedAt
            ? formatDisplayTimestamp(new Date(connection.lastSyncedAt))
            : null;
          const accentClass = pickAccentColor(connection.institutionName);
          const initials = extractInitials(connection.institutionName);
          return (
            <div
              key={connection.itemId}
              className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-border bg-background/80 p-4 shadow-sm"
            >
              <div className="flex min-w-0 flex-1 items-center gap-3">
                <span
                  className={`flex h-9 w-9 items-center justify-center rounded-full text-xs font-semibold uppercase ${accentClass}`}
                >
                  {initials}
                </span>
                <div className="min-w-0 space-y-1">
                  <p className="truncate text-sm font-medium text-foreground">
                    {connection.institutionName}
                  </p>
                  <p className="text-xs text-muted-foreground">{accountSummary}</p>
                  {lastSyncedLabel ? (
                    <p className="text-[11px] text-muted-foreground/80">最終同期: {lastSyncedLabel}</p>
                  ) : null}
                  {connection.missingCount > 0 ? (
                    <p className="text-[11px] text-destructive">
                      {connection.missingCount} 件の口座が見つかりませんでした。再接続をお試しください。
                    </p>
                  ) : null}
                </div>
              </div>
              <div className="flex items-center gap-3">
                <Badge
                  variant={isHealthy ? "default" : "destructive"}
                  className="gap-1 px-3 py-1 text-xs"
                >
                  {isHealthy ? (
                    <>
                      <CheckCircle2 className="h-3 w-3" />
                      接続済み
                    </>
                  ) : (
                    <>
                      <Plug className="h-3 w-3" />
                      再接続が必要
                    </>
                  )}
                </Badge>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={() => handleManualSync(connection.itemId)}
                  disabled={syncing}
                  className="gap-1"
                >
                  {isSyncingThis ? (
                    <>
                      <Loader2 className="h-4 w-4 animate-spin" />
                      更新中...
                    </>
                  ) : (
                    <>
                      <RefreshCw className="h-4 w-4" />
                      {connection.accounts.length > 0 ? "更新" : "再接続"}
                    </>
                  )}
                </Button>
              </div>
            </div>
          );
        })}
        <div className="flex flex-wrap items-center justify-between gap-4 rounded-lg border border-dashed border-border/80 bg-muted/20 p-4">
          <div className="flex items-center gap-3">
            <span className="flex h-9 w-9 items-center justify-center rounded-full border border-dashed border-border/70 text-sm text-muted-foreground">
              <Plus className="h-4 w-4" />
            </span>
            <div className="space-y-1">
              <p className="text-sm font-medium text-foreground">銀行を追加</p>
              <p className="text-xs text-muted-foreground">
                新しい金融機関を Pluggy Connect で連携します。
              </p>
            </div>
          </div>
          <Button onClick={requestConnectToken} disabled={loading || syncing}>
            {loading ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                接続を準備中...
              </>
            ) : (
              <>
                <Plug className="mr-2 h-4 w-4" />
                接続
              </>
            )}
          </Button>
        </div>
      </div>
      {staleMappingCount > 0 ? (
        <p className="text-xs text-muted-foreground">
          {staleMappingCount} 件の接続が最新の口座と一致しません。不要な連携がある場合は Supabase の口座を整理してから再接続してください。
        </p>
      ) : null}
      {errorMessage ? (
        <p className="text-sm text-destructive">{errorMessage}</p>
      ) : null}
      {connectToken ? (
        <PluggyConnect
          connectToken={connectToken}
          theme={theme === "dark" ? "dark" : "light"}
          onSuccess={handleSuccess}
          onError={handleError}
          onClose={handleClose}
          onHide={handleClose}
          innerRef={(instance) => {
            connectInstanceRef.current = instance;
          }}
        />
      ) : null}
    </div>
  );
};

export default PluggyConnectLauncher;

const buildStorageKey = (userId: string) =>
  `${LINKED_ITEMS_STORAGE_NAMESPACE}:${userId}`;

const loadLinkedItemsFromStorage = (userId: string): LinkedItem[] => {
  if (typeof window === "undefined" || !userId) return [];

  const parse = (key: string): LinkedItem[] => {
    try {
      const raw = window.localStorage.getItem(key);
      if (!raw) return [];
      const parsed = JSON.parse(raw);
      if (!Array.isArray(parsed)) return [];

      return parsed
        .map((entry) => ({
          itemId: typeof entry?.itemId === "string" ? entry.itemId : null,
          accountMapping: normalizeAccountMapping(entry?.accountMapping),
          transactionIds: Array.isArray(entry?.transactionIds)
            ? entry.transactionIds.filter((id: unknown): id is string => typeof id === "string")
            : undefined,
          connectionId:
            entry && typeof entry.connectionId === "string" ? entry.connectionId : undefined,
          lastProcessedAt:
            entry && typeof entry.lastProcessedAt === "string"
              ? entry.lastProcessedAt
              : typeof entry?.lastSyncAt === "string"
                ? entry.lastSyncAt
                : undefined,
          lastSyncedAt:
            entry && typeof entry.lastSyncedAt === "string"
              ? entry.lastSyncedAt
              : typeof entry?.lastSyncAt === "string"
                ? entry.lastSyncAt
                : undefined,
          institutionName:
            entry && typeof entry.institutionName === "string"
              ? entry.institutionName
              : undefined,
          accountNames: Array.isArray(entry?.accountNames)
            ? entry.accountNames.filter(
                (value: unknown): value is string => typeof value === "string"
              )
            : undefined,
          status:
            entry && typeof entry.status === "string"
              ? entry.status
              : null,
        }))
        .filter((entry) => Boolean(entry.itemId)) as LinkedItem[];
    } catch (error) {
      console.error("[Pluggy] Failed to load linked items from storage.", error);
      return [];
    }
  };

  const namespacedKey = buildStorageKey(userId);
  const items = parse(namespacedKey);
  if (items.length > 0) return items;

  const legacyItems = parse(LEGACY_LINKED_ITEMS_KEY);
  if (legacyItems.length > 0) {
    saveLinkedItemsToStorage(userId, legacyItems);
    window.localStorage.removeItem(LEGACY_LINKED_ITEMS_KEY);
  }
  return legacyItems;
};

const saveLinkedItemsToStorage = (userId: string, items: LinkedItem[]) => {
  if (typeof window === "undefined" || !userId) return;
  try {
    window.localStorage.setItem(buildStorageKey(userId), JSON.stringify(items));
  } catch (error) {
    console.error("[Pluggy] Failed to persist linked items.", error);
  }
};

const loadLinkedItemsFromSupabase = async (
  userId: string
): Promise<LinkedItem[] | null> => {
  try {
    const { data, error } = await supabase
      .from("connections")
      .select("id, pluggy_connection_id, institution_name, status, updated_at")
      .eq("user_id", userId);

    if (error) {
      if ((error as { code?: string })?.code === "42P01") {
        console.warn(
          "[Pluggy] Supabase table connections not found. Falling back to local storage."
        );
        return null;
      }
      console.error("[Pluggy] Failed to load connections from Supabase.", error);
      return null;
    }

    if (!data) return [];

    return data
      .map((row) => {
        if (!row || typeof row !== "object") return null;
        const record = row as Record<string, unknown>;
        const pluggyId =
          typeof record.pluggy_connection_id === "string"
            ? record.pluggy_connection_id
            : null;
        if (!pluggyId) return null;

        const connectionId =
          typeof record.id === "string" ? (record.id as string) : null;
        const institutionName =
          typeof record.institution_name === "string"
            ? (record.institution_name as string)
            : undefined;
        const status =
          typeof record.status === "string"
            ? (record.status as string)
            : null;
        const lastSyncedAt =
          typeof record.updated_at === "string"
            ? (record.updated_at as string)
            : undefined;

        const candidate: LinkedItem = {
          itemId: pluggyId,
          connectionId,
          accountMapping: {},
          institutionName,
          status,
        };

        if (lastSyncedAt) {
          candidate.lastSyncedAt = lastSyncedAt;
        }

        return candidate;
      })
      .filter((entry) => Boolean(entry)) as LinkedItem[];
  } catch (error) {
    console.error("[Pluggy] Unexpected error loading Supabase connections.", error);
    return null;
  }
};

const ensureConnectionRecord = async ({
  userId,
  itemId,
  institutionName,
  status,
}: {
  userId: string;
  itemId: string;
  institutionName?: string;
  status?: string | null;
}): Promise<string | null> => {
  try {
    const { data: existing, error: selectError } = await supabase
      .from("connections")
      .select("id, institution_name, status")
      .eq("user_id", userId)
      .eq("pluggy_connection_id", itemId)
      .maybeSingle();

    if (selectError) {
      const code = (selectError as { code?: string })?.code;
      if (code && code !== "PGRST116") {
        if (code === "42P01") {
          console.warn(
            "[Pluggy] Supabase table connections not found. Skipping remote persistence."
          );
          return null;
        }
        throw selectError;
      }
    }

    if (existing && typeof existing.id === "string") {
      const updates: Record<string, unknown> = {};
      if (
        institutionName &&
        institutionName.length > 0 &&
        institutionName !== existing.institution_name
      ) {
        updates.institution_name = institutionName;
      }
      if (status && status !== existing.status) {
        updates.status = status;
      }

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await supabase
          .from("connections")
          .update(updates)
          .eq("id", existing.id)
          .eq("user_id", userId);
      }

      return existing.id as string;
    }

    const { data: inserted, error: insertError } = await supabase
      .from("connections")
      .insert([
        {
          pluggy_connection_id: itemId,
          institution_name: institutionName ?? null,
          status: status ?? "active",
          user_id: userId,
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      if ((insertError as { code?: string })?.code === "42P01") {
        console.warn(
          "[Pluggy] Supabase table connections not found. Skipping remote persistence."
        );
        return null;
      }
      throw insertError;
    }

    return (inserted?.id as string | undefined) ?? null;
  } catch (error) {
    console.error("[Pluggy] Failed to ensure connection record.", error);
    return null;
  }
};

const syncLinkedItemsToSupabase = async (
  userId: string,
  items: LinkedItem[]
) => {
  try {
    const { data: existingRows, error: selectError } = await supabase
      .from("connections")
      .select("id, pluggy_connection_id")
      .eq("user_id", userId);

    if (selectError) {
      if ((selectError as { code?: string })?.code === "42P01") {
        console.warn(
          "[Pluggy] Supabase table connections not found. Skipping remote persistence."
        );
        return;
      }
      throw selectError;
    }

    const existingMap = new Map<string, string>(
      (existingRows ?? [])
        .map((row) => {
          if (!row || typeof row !== "object") return null;
          const record = row as Record<string, unknown>;
          const id =
            typeof record.id === "string" ? (record.id as string) : null;
          const pluggyId =
            typeof record.pluggy_connection_id === "string"
              ? (record.pluggy_connection_id as string)
              : null;
          return id && pluggyId ? ([pluggyId, id] as const) : null;
        })
        .filter((entry): entry is readonly [string, string] => Boolean(entry))
    );

    const keepIds = new Set<string>();

    for (const item of items) {
      const connectionId =
        item.connectionId ??
        existingMap.get(item.itemId) ??
        (await ensureConnectionRecord({
          userId,
          itemId: item.itemId,
          institutionName: item.institutionName,
          status: item.status ?? "active",
        }));

      if (!connectionId) continue;
      item.connectionId = connectionId;
      keepIds.add(connectionId);

      const updates: Record<string, unknown> = {};
      if (item.institutionName) {
        updates.institution_name = item.institutionName;
      }
      if (item.status) {
        updates.status = item.status;
      }

      if (Object.keys(updates).length > 0) {
        updates.updated_at = new Date().toISOString();
        await supabase
          .from("connections")
          .update(updates)
          .eq("id", connectionId)
          .eq("user_id", userId);
      }
    }

    const staleIds =
      existingRows
        ?.map((row) => {
          if (!row || typeof row !== "object") return null;
          const record = row as Record<string, unknown>;
          const id =
            typeof record.id === "string" ? (record.id as string) : null;
          return id && !keepIds.has(id) ? id : null;
        })
        .filter((id): id is string => Boolean(id)) ?? [];

    if (staleIds.length > 0) {
      const { error: deleteError } = await supabase
        .from("connections")
        .delete()
        .eq("user_id", userId)
        .in("id", staleIds);

      if (deleteError && (deleteError as { code?: string })?.code !== "42P01") {
        throw deleteError;
      }
    }
  } catch (error) {
    console.error("[Pluggy] Failed to persist connections to Supabase.", error);
  }
};

const mergeLinkedItemSources = ({
  remote,
  local,
}: {
  remote: LinkedItem[] | null;
  local: LinkedItem[];
}): LinkedItem[] => {
  const merged = new Map<string, LinkedItem>();

  for (const item of local) {
    merged.set(item.itemId, {
      ...item,
      accountMapping: { ...item.accountMapping },
      transactionIds: item.transactionIds ? [...item.transactionIds] : undefined,
    });
  }

  if (remote) {
    for (const remoteItem of remote) {
      const existing = merged.get(remoteItem.itemId);
      if (existing) {
        merged.set(remoteItem.itemId, {
          ...existing,
          ...remoteItem,
          accountMapping: existing.accountMapping,
          transactionIds: existing.transactionIds,
          lastProcessedAt:
            existing.lastProcessedAt ?? remoteItem.lastProcessedAt,
          lastSyncedAt: remoteItem.lastSyncedAt ?? existing.lastSyncedAt,
          accountNames:
            existing.accountNames && existing.accountNames.length > 0
              ? existing.accountNames
              : remoteItem.accountNames,
          connectionId: remoteItem.connectionId ?? existing.connectionId ?? null,
          institutionName: remoteItem.institutionName ?? existing.institutionName,
          status: remoteItem.status ?? existing.status ?? null,
        });
      } else {
        merged.set(remoteItem.itemId, {
          ...remoteItem,
          accountMapping: {},
        });
      }
    }
  }

  return Array.from(merged.values());
};

const normalizeAccountMapping = (input: unknown): Record<string, string> => {
  if (!input || typeof input !== "object") return {};
  return Object.fromEntries(
    Object.entries(input as Record<string, unknown>).filter(
      ([key, value]) => typeof key === "string" && typeof value === "string"
    )
  ) as Record<string, string>;
};

const COLOR_CLASSES = [
  "bg-violet-500 text-white",
  "bg-amber-500 text-slate-950",
  "bg-emerald-500 text-white",
  "bg-sky-500 text-white",
  "bg-rose-500 text-white",
  "bg-slate-500 text-white",
];

const pickAccentColor = (input: string): string => {
  if (!input) {
    return COLOR_CLASSES[0];
  }
  let hash = 0;
  for (let index = 0; index < input.length; index += 1) {
    hash = (hash + input.charCodeAt(index)) % COLOR_CLASSES.length;
  }
  return COLOR_CLASSES[hash];
};

const extractInitials = (label: string): string => {
  if (!label) return "PG";
  const words = label.trim().split(/\s+/).filter(Boolean);
  if (!words.length) return "PG";
  const initials = words.slice(0, 2).map((word) => word.charAt(0).toUpperCase());
  return initials.join("");
};

const formatAccountNameForDisplay = (label: string): string => {
  if (!label) return "";
  const cleaned = label.replace(/^\s*Pluggy\s*•\s*/i, "").trim();
  return cleaned || label.trim();
};

const formatDisplayTimestamp = (date: Date): string => {
  try {
    return `${date.toLocaleDateString()} ${date.toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })}`;
  } catch {
    return date.toISOString();
  }
};

type TransactionsApiItemResponse = {
  accounts?: PluggyAccountSummary[];
  transactionsByAccount?: AggregatedTransactionsPayload[];
  itemStatus?: string | null;
  itemLastUpdatedAt?: string | null;
  itemRefreshTimedOut?: boolean;
  itemRequiresUserAction?: boolean;
};

type AggregatedTransactionsPayload = {
  accountId: string;
  accountName: string | null;
  transactions: PluggyTransactionPayload[];
};

type PluggyTransactionPayload = {
  id: string;
  accountId: string;
  date?: string | null;
  description?: string | null;
  descriptionRaw?: string | null;
  type?: string | null;
  amount?: number | null;
  status?: string | null;
  categoryId?: string | null;
  merchant?: {
    name?: string | null;
    businessName?: string | null;
  } | null;
};

type PluggyAccountSummary = {
  id: string;
  name: string | null;
  type: string | null;
  number: string | null;
  balance: number | null;
  currency?: string | null;
};

type SupabaseTransactionInsert = {
  id: string;
  title: string;
  amount: number;
  account_id: string;
  type: "income" | "expense";
  user_id: string;
  date: string;
};

const extractAccounts = (payload: unknown): PluggyAccountSummary[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const { accounts } = payload as TransactionsApiItemResponse;
  if (!Array.isArray(accounts)) {
    return [];
  }
  return accounts;
};

const extractTransactionsByAccount = (
  payload: unknown
): AggregatedTransactionsPayload[] => {
  if (!payload || typeof payload !== "object") {
    return [];
  }
  const { transactionsByAccount } = payload as TransactionsApiItemResponse;
  if (!Array.isArray(transactionsByAccount)) {
    return [];
  }
  return transactionsByAccount.filter(
    (group): group is AggregatedTransactionsPayload =>
      Boolean(group) &&
      typeof group === "object" &&
      typeof (group as AggregatedTransactionsPayload).accountId === "string" &&
      Array.isArray((group as AggregatedTransactionsPayload).transactions)
  );
};

const parsePluggyDate = (value?: string | null): Date | null => {
  if (!value) return null;
  const asDate = new Date(value);
  if (Number.isNaN(asDate.getTime())) {
    return null;
  }
  return asDate;
};

const formatDateOnly = (date: Date): string => date.toISOString().split("T")[0];

const normalizePluggyAmount = (
  amount: number | null | undefined,
  type: string | null | undefined
): number | null => {
  if (typeof amount !== "number" || Number.isNaN(amount)) {
    return null;
  }
  if ((type ?? "").toUpperCase() === "DEBIT") {
    return -Math.abs(amount);
  }
  return Math.abs(amount);
};

const buildPluggyTransactionTitle = (transaction: PluggyTransactionPayload): string => {
  const candidate =
    transaction.description?.trim() ||
    transaction.descriptionRaw?.trim() ||
    transaction.merchant?.name?.trim() ||
    transaction.merchant?.businessName?.trim();
  if (candidate) {
    return candidate.length > 120 ? `${candidate.slice(0, 117)}...` : candidate;
  }
  return "Pluggy transaction";
};

const ensureSupabaseAccounts = async ({
  pluggyAccounts,
  existingAccounts,
  onAccountCreated,
  initialMapping,
  userId,
  onAccountBalanceUpdated,
  connectionId,
}: {
  pluggyAccounts: PluggyAccountSummary[];
  existingAccounts: Account[];
  onAccountCreated: (account: Account) => void;
  initialMapping?: Record<string, string> | undefined;
  userId?: string;
  onAccountBalanceUpdated?: (accountId: string, balance: number) => void;
  connectionId?: string | null;
}): Promise<Record<string, string>> => {
  const mapping: Record<string, string> = {
    ...(initialMapping ?? {}),
  };
  const resolvedAccounts = [...existingAccounts];
  const assignedSupabaseIds = new Set<string>();

  for (const pluggyAccount of pluggyAccounts) {
    if (!pluggyAccount.id) continue;

    const normalizedName = buildAccountName(pluggyAccount);
    const pluggyInstitution = pluggyAccount.name ?? "Pluggy";

    const mappedId = mapping[pluggyAccount.id];
    console.log("[Pluggy] Evaluating account sync", {
      pluggyAccountId: pluggyAccount.id,
      mappedId,
      name: normalizedName,
      pluggyInstitution,
    });

    const canReuseMappedId =
      mappedId && !assignedSupabaseIds.has(mappedId)
        ? resolvedAccounts.some((account) => account.id === mappedId)
        : false;

    const existingIndex = resolvedAccounts.findIndex((account) => {
      if (canReuseMappedId) {
        return account.id === mappedId;
      }
      if (
        mapping[pluggyAccount.id] &&
        mapping[pluggyAccount.id] !== account.id &&
        assignedSupabaseIds.has(account.id)
      ) {
        return false;
      }
      return account.name === normalizedName;
    });
    const existing = existingIndex >= 0 ? resolvedAccounts[existingIndex] : null;

    if (existing) {
      mapping[pluggyAccount.id] = existing.id;
      assignedSupabaseIds.add(existing.id);
      console.log("[Pluggy] Existing Supabase account matched", {
        pluggyAccountId: pluggyAccount.id,
        supabaseAccountId: existing.id,
      });

      const pluggyBalance =
        typeof pluggyAccount.balance === "number" ? pluggyAccount.balance : null;
      const existingBalance = typeof existing.balance === "number" ? existing.balance : null;
      const balanceNeedsUpdate =
        pluggyBalance !== null &&
        (existingBalance === null || Math.abs(existingBalance - pluggyBalance) > 0.009);
      const needsConnectionUpdate =
        Boolean(connectionId) && existing.connection_id !== connectionId;

      if (balanceNeedsUpdate || needsConnectionUpdate) {
        if (balanceNeedsUpdate) {
          console.log("[Pluggy] Detected balance change", {
            accountId: existing.id,
            pluggyBalance,
            existingBalance,
          });
        }

        const updates: Record<string, unknown> = {};
        if (balanceNeedsUpdate && pluggyBalance !== null) {
          updates.balance = pluggyBalance;
          updates.institution = pluggyInstitution;
        }
        if (needsConnectionUpdate && connectionId) {
          updates.connection_id = connectionId;
        }

        if (Object.keys(updates).length > 0) {
          let updateBuilder = supabase
            .from("accounts")
            .update(updates)
            .eq("id", existing.id);

          if (userId) {
            updateBuilder = updateBuilder.eq("user_id", userId);
          }

          const { data: updatedAccount, error: updateError } = await updateBuilder
            .select()
            .single();

          if (updateError) {
            console.error("[Pluggy] Supabase account update failed", {
              accountId: existing.id,
              error: updateError,
            });
          } else if (updatedAccount) {
            resolvedAccounts[existingIndex] = updatedAccount as Account;
            if (balanceNeedsUpdate && pluggyBalance !== null) {
              const updatedBalance =
                typeof updatedAccount.balance === "number"
                  ? updatedAccount.balance
                  : pluggyBalance ?? 0;
              onAccountBalanceUpdated?.(updatedAccount.id, updatedBalance);
            }
          }
        }
      } else if (needsConnectionUpdate && connectionId) {
        resolvedAccounts[existingIndex] = {
          ...existing,
          connection_id: connectionId,
        };
      }

      continue;
    }

    const payload = {
      name: normalizedName,
      type: mapAccountType(pluggyAccount),
      balance: pluggyAccount.balance ?? 0,
      institution: pluggyInstitution,
      connection_id: connectionId ?? null,
    };

    const { data, error } = await supabase
      .from("accounts")
      .insert([
        {
          ...payload,
          ...(userId ? { user_id: userId } : {}),
        },
      ])
      .select()
      .single();

    if (error) {
      console.error("[Pluggy] Failed to create Supabase account.", error);
      continue;
    }

    mapping[pluggyAccount.id] = data.id;
    assignedSupabaseIds.add(data.id);
    const accountRecord = data as Account;
    resolvedAccounts.push(accountRecord);
    onAccountCreated(accountRecord);
  }

  return mapping;
};

const buildAccountName = (account: PluggyAccountSummary): string => {
  const name = account.name ?? "Pluggy Account";
  let identifier = "";
  if (account.number && account.number.length >= 4) {
    identifier = ` •••${account.number.slice(-4)}`;
  } else if (account.type) {
    identifier = ` • ${account.type.toLowerCase()}`;
  }
  return `Pluggy • ${name}${identifier}`;
};

const mapAccountType = (account: PluggyAccountSummary): Account["type"] => {
  if (account.type?.toUpperCase() === "CREDIT" || account.type?.toUpperCase() === "CREDIT_CARD") {
    return "credit_card";
  }
  return "bank";
};
