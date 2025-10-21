import { NextResponse } from "next/server";
import {
  buildReportsInsightFallback,
  type ReportsInsightInput,
} from "@/lib/reportsInsightFallback";

const GEMINI_CHAT_COMPLETIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

const messageCache = new Map<string, string>();

const roundForCache = (value: number | undefined) => {
  if (typeof value !== "number" || Number.isNaN(value)) return 0;
  return Math.round(value);
};

const formatNumber = (value?: number) => {
  if (typeof value !== "number" || Number.isNaN(value)) return null;
  try {
    return new Intl.NumberFormat("ja-JP").format(Math.round(value));
  } catch {
    return Math.round(value).toString();
  }
};

export async function POST(request: Request) {
  const payload =
    ((await request.json().catch(() => ({}))) as ReportsInsightInput) ?? {};

  const fallbackLine = buildReportsInsightFallback(payload);

  if (!process.env.GEMINI_API_KEY) {
    console.warn(
      "[Reports] GEMINI_API_KEY is not set. Returning fallback smart insight."
    );
    return NextResponse.json(
      { line: fallbackLine, reason: "missing-api-key" },
      { status: 200 }
    );
  }

  const cacheKey = JSON.stringify({
    periodLabel: payload.periodLabel ?? "",
    topCategoryName: payload.topCategoryName ?? "",
    topCategoryPercent: roundForCache(payload.topCategoryPercent),
    savingsRatePercent: roundForCache(payload.savingsRatePercent),
    largestExpenseTitle: payload.largestExpenseTitle ?? "",
    largestExpenseAmount: roundForCache(payload.largestExpenseAmount),
    avgDailySpending: roundForCache(payload.avgDailySpending),
    totalIncome: roundForCache(payload.totalIncome),
    totalExpense: roundForCache(payload.totalExpense),
  });

  if (messageCache.has(cacheKey)) {
    return NextResponse.json({
      line: messageCache.get(cacheKey),
      reason: "cached",
    });
  }

  const currencySymbol = payload.currencySymbol || "$";
  const formatCurrency = (value?: number) => {
    const formatted = formatNumber(value);
    return formatted ? `${currencySymbol}${formatted}` : null;
  };
  const formatPercent = (value?: number) => {
    if (typeof value !== "number" || Number.isNaN(value)) return null;
    return `${Math.round(value)}%`;
  };

  const netDifference =
    (payload.totalIncome ?? 0) - (payload.totalExpense ?? 0);
  const netDifferenceText =
    netDifference !== 0 ? formatCurrency(Math.abs(netDifference)) : null;
  const summaryParts = [
    payload.periodLabel ? `対象期間: ${payload.periodLabel}` : null,
    formatCurrency(payload.totalIncome)
      ? `収入合計: ${formatCurrency(payload.totalIncome)}`
      : null,
    formatCurrency(payload.totalExpense)
      ? `支出合計: ${formatCurrency(payload.totalExpense)}`
      : null,
    netDifferenceText
      ? `差額: ${netDifference > 0 ? "+" : "-"}${netDifferenceText}`
      : null,
    formatCurrency(payload.avgDailySpending)
      ? `1日あたりの平均支出: ${formatCurrency(payload.avgDailySpending)}`
      : null,
    payload.topCategoryName &&
    payload.topCategoryName !== "-" &&
    formatPercent(payload.topCategoryPercent)
      ? `支出トップカテゴリ: ${payload.topCategoryName} (${formatPercent(
          payload.topCategoryPercent
        )})`
      : null,
    payload.largestExpenseTitle &&
    payload.largestExpenseTitle !== "-" &&
    formatCurrency(payload.largestExpenseAmount)
      ? `最大支出取引: ${payload.largestExpenseTitle} (${formatCurrency(
          payload.largestExpenseAmount
        )})`
      : null,
    formatPercent(payload.savingsRatePercent)
      ? `貯蓄率: ${formatPercent(payload.savingsRatePercent)}`
      : null,
  ].filter(Boolean);

  const prompt = [
    ...summaryParts,
    "",
    "上記のデータをもとに、家計レポート全体を優しくまとめる日本語の文章を1文だけ作成してください。",
    "収入・支出・差額など主要な数字に軽く触れつつ、気づきをひとつ伝え、次に取れる穏やかなアクションを提案してください。",
    "利用者を責めず前向きな気持ちになれる表現にしてください。",
    "文章は1文のみとし、最後に句点「。」を1つだけ付けてください。",
  ]
    .filter(Boolean)
    .join("\n");

  const body = {
    model: "gemini-2.5-flash",
    messages: [
      {
        role: "system",
        content:
          "あなたは共感的で寄り添いのある家計アドバイザーです。ユーザーを責めず、前向きな気持ちになれる短い一言を届けます。",
      },
      { role: "user", content: prompt },
    ],
  };

  async function callGeminiWithRetry(retryCount = 0): Promise<Response> {
    const res = await fetch(GEMINI_CHAT_COMPLETIONS_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
      },
      body: JSON.stringify(body),
    });

    if (res.status === 429 && retryCount < 2) {
      console.warn(
        `[Gemini] Rate limit hit for reports insight, retrying in 5s... (try ${
          retryCount + 1
        })`
      );
      await new Promise((resolve) => setTimeout(resolve, 5000));
      return callGeminiWithRetry(retryCount + 1);
    }

    return res;
  }

  try {
    const response = await callGeminiWithRetry();

    if (!response.ok) {
      const errorBody = await response.text();
      console.error("[Reports] Failed to fetch smart insight from Gemini.", {
        status: response.status,
        errorBody,
      });
      const reason =
        response.status === 429 ? "gemini-quota-exceeded" : "gemini-request-failed";
      messageCache.set(cacheKey, fallbackLine);
      return NextResponse.json(
        { line: fallbackLine, reason },
        { status: 200 }
      );
    }

    const data = await response.json();
    const line =
      data?.choices?.[0]?.message?.content ??
      data?.choices?.[0]?.message?.parts?.[0]?.text ??
      fallbackLine;

    const normalized =
      typeof line === "string"
        ? line.trim()
        : Array.isArray(line)
        ? line
            .map((part: unknown) => String(part ?? ""))
            .join("")
            .trim()
        : fallbackLine;

    messageCache.set(cacheKey, normalized || fallbackLine);

    return NextResponse.json({
      line: normalized || fallbackLine,
      reason: normalized ? "success" : "empty-response",
    });
  } catch (error) {
    console.error(
      "[Reports] Unexpected error while generating smart insight.",
      error
    );
    messageCache.set(cacheKey, fallbackLine);
    return NextResponse.json(
      { line: fallbackLine, reason: "unexpected-error" },
      { status: 200 }
    );
  }
}
