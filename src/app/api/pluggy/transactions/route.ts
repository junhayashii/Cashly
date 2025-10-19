import { NextRequest, NextResponse } from "next/server";
import type { Item, ItemStatus, Transaction, TransactionFilters } from "pluggy-sdk";

import pluggyClient from "@/lib/pluggyClient";

type AggregatedTransactions = {
  accountId: string;
  accountName: string | null;
  transactions: Transaction[];
};

const MAX_REFRESH_WAIT_MS = 30_000;
const REFRESH_POLL_INTERVAL_MS = 1_500;
const PENDING_ITEM_STATUSES = new Set<ItemStatus>([
  "UPDATING",
  "MERGING",
  "WAITING_USER_INPUT",
  "WAITING_USER_ACTION",
]);
const USER_ACTION_ITEM_STATUSES = new Set<ItemStatus>([
  "WAITING_USER_INPUT",
  "WAITING_USER_ACTION",
]);

const wait = (milliseconds: number) =>
  new Promise((resolve) => setTimeout(resolve, milliseconds));

type RefreshResult = {
  item: Item | null;
  timedOut: boolean;
  error?: unknown;
};

const refreshPluggyItem = async (itemId: string): Promise<RefreshResult> => {
  try {
    let item = await pluggyClient.updateItem(itemId);
    if (!item) {
      return { item: null, timedOut: false };
    }

    if (!PENDING_ITEM_STATUSES.has(item.status)) {
      return { item, timedOut: false };
    }

    const startedAt = Date.now();
    while (PENDING_ITEM_STATUSES.has(item.status)) {
      if (Date.now() - startedAt > MAX_REFRESH_WAIT_MS) {
        console.warn(
          `[Pluggy] Timed out waiting for item ${itemId} to refresh. Current status: ${item.status}`
        );
        return { item, timedOut: true };
      }

      await wait(REFRESH_POLL_INTERVAL_MS);
      item = await pluggyClient.fetchItem(itemId);
      if (!item) {
        break;
      }
      if (!PENDING_ITEM_STATUSES.has(item.status)) {
        break;
      }
    }

    return { item, timedOut: false };
  } catch (error) {
    console.error(`[Pluggy] Failed to refresh item ${itemId}.`, error);
    return { item: null, timedOut: false, error };
  }
};

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const accountId = searchParams.get("accountId");
  const itemId = searchParams.get("itemId");

  if (!accountId && !itemId) {
    return NextResponse.json(
      {
        error: "Missing query parameter: provide either accountId or itemId.",
      },
      { status: 400 }
    );
  }

  try {
    const to = new Date();
    const from = new Date();
    from.setDate(from.getDate() - 7);
    const options = {
      from: from.toISOString(),
      to: to.toISOString(),
    } satisfies TransactionFilters;

    if (accountId) {
      const transactionsResponse = await pluggyClient.fetchTransactions(
        accountId,
        options
      );
      const transactions = transactionsResponse.results;

      console.log(
        `[Pluggy] Retrieved ${transactions.length} transactions for account ${accountId}.`
      );
      if (transactions.length > 0) {
        console.dir(transactions, { depth: null });
      }

      return NextResponse.json({
        accountId,
        transactions,
      });
    }

    const refreshResult = await refreshPluggyItem(itemId!);

    const accountsResponse = await pluggyClient.fetchAccounts(itemId!);
    const accounts = accountsResponse.results;

    if (!accounts.length) {
      console.log(`[Pluggy] No accounts found for item ${itemId}.`);

      return NextResponse.json({
        itemId,
        itemStatus: refreshResult.item?.status ?? null,
        itemLastUpdatedAt: refreshResult.item?.lastUpdatedAt?.toISOString() ?? null,
        itemRefreshTimedOut: refreshResult.timedOut,
        itemRequiresUserAction: refreshResult.item
          ? USER_ACTION_ITEM_STATUSES.has(refreshResult.item.status)
          : false,
        accounts: [],
        transactionsByAccount: [],
      });
    }

    const transactionsByAccount: AggregatedTransactions[] = await Promise.all(
      accounts.map(async (account) => {
        const transactionsResponse = await pluggyClient.fetchTransactions(
          account.id,
          options
        );
        const transactions = transactionsResponse.results;

        console.log(
          `[Pluggy] Retrieved ${transactions.length} transactions for account ${account.id} (item ${itemId}).`
        );
        if (transactions.length > 0) {
          console.dir(transactions, { depth: null });
        }

        return {
          accountId: account.id,
          accountName: account.name ?? null,
          transactions,
        };
      })
    );

    return NextResponse.json({
      itemId,
      itemStatus: refreshResult.item?.status ?? null,
      itemLastUpdatedAt: refreshResult.item?.lastUpdatedAt?.toISOString() ?? null,
      itemRefreshTimedOut: refreshResult.timedOut,
      itemRequiresUserAction: refreshResult.item
        ? USER_ACTION_ITEM_STATUSES.has(refreshResult.item.status)
        : false,
      accounts: accounts.map((account) => ({
        id: account.id,
        name: account.name,
        type: account.type,
        number: account.number,
        balance: account.balance,
        currency: account.currencyCode,
      })),
      transactionsByAccount,
    });
  } catch (error) {
    console.error("[Pluggy] Failed to retrieve transactions.", error);

    return NextResponse.json(
      {
        error: "Failed to fetch Pluggy transactions.",
      },
      { status: 500 }
    );
  }
}
