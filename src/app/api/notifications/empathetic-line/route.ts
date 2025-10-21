import { NextResponse } from "next/server";
import { buildEmpatheticFallbackLine } from "@/lib/empatheticFallback";

// ✅ 最新エンドポイント（2025年10月時点）
const GEMINI_CHAT_COMPLETIONS_URL =
  "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

// ✅ シンプルなメモリキャッシュ（再デプロイでリセットされる）
const messageCache = new Map<string, string>();

type RequestPayload = {
  categoryName?: string;
  spent?: number;
  monthlyBudget?: number;
};

export async function POST(request: Request) {
  // --- 入力解析 ---
  const { categoryName, spent, monthlyBudget }: RequestPayload =
    (await request.json().catch(() => ({}))) ?? {};

  const fallbackLine = buildEmpatheticFallbackLine({
    categoryName,
    spent,
    monthlyBudget,
  });

  if (!categoryName) {
    return NextResponse.json(
      { line: fallbackLine, reason: "missing-category-name" },
      { status: 200 }
    );
  }

  if (!process.env.GEMINI_API_KEY) {
    console.warn(
      "[Notifications] GEMINI_API_KEY is not set. Returning fallback empathy line."
    );
    return NextResponse.json(
      { line: fallbackLine, reason: "missing-api-key" },
      { status: 200 }
    );
  }

  // --- キャッシュキー生成（カテゴリ＋年月）---
  const cacheKey = `${categoryName}-${new Date().getFullYear()}-${new Date().getMonth()}`;
  if (messageCache.has(cacheKey)) {
    console.log("[Notifications] Using cached empathetic line:", cacheKey);
    return NextResponse.json({
      line: messageCache.get(cacheKey),
      reason: "cached",
    });
  }

  try {
    // --- プロンプト生成 ---
    const prompt = [
      `カテゴリ名: ${categoryName}`,
      typeof monthlyBudget === "number"
        ? `毎月の予算: ${monthlyBudget.toLocaleString()}`
        : null,
      typeof spent === "number"
        ? `今月の利用額: ${spent.toLocaleString()}`
        : null,
      "",
      "上記の状況を踏まえて、家計管理に寄り添う優しいアドバイスを日本語で1文だけ返してください。",
      "利用者を責めず、前向きに次の月へ向かう気持ちになれる内容にしてください。",
      "敬語ではなく、柔らかい口調で短くまとめてください。",
    ]
      .filter(Boolean)
      .join("\n");

    // --- Geminiリクエスト内容 ---
    const body = {
      model: "gemini-2.5-flash",
      messages: [
        {
          role: "system",
          content:
            "あなたは共感的で優しい家計アドバイザーです。家計の失敗を責めず、前向きになれる一言を伝えます。",
        },
        { role: "user", content: prompt },
      ],
    };

    // --- API呼び出し関数（リトライ付き） ---
    async function callGeminiWithRetry(retryCount = 0): Promise<Response> {
      const res = await fetch(GEMINI_CHAT_COMPLETIONS_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
        },
        body: JSON.stringify(body),
      });

      // ✅ レート制限時（429）は最大2回まで再試行
      if (res.status === 429 && retryCount < 2) {
        console.warn(
          `[Gemini] Rate limit hit, retrying in 5s... (try ${retryCount + 1})`
        );
        await new Promise((r) => setTimeout(r, 5000));
        return callGeminiWithRetry(retryCount + 1);
      }

      return res;
    }

    const response = await callGeminiWithRetry();

    // --- エラーハンドリング ---
    if (!response.ok) {
      const errorBody = await response.text();
      console.error(
        "[Notifications] Failed to fetch empathetic line from Gemini.",
        { status: response.status, errorBody }
      );
      const reason =
        response.status === 429 ? "gemini-quota-exceeded" : "gemini-request-failed";
      messageCache.set(cacheKey, fallbackLine);
      return NextResponse.json(
        { line: fallbackLine, reason },
        { status: 200 }
      );
    }

    // --- レスポンス解析 ---
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

    // --- キャッシュ登録 ---
    messageCache.set(cacheKey, normalized);

    return NextResponse.json({
      line: normalized || fallbackLine,
      reason: normalized ? "success" : "empty-response",
    });
  } catch (error) {
    console.error(
      "[Notifications] Unexpected error while generating empathetic line.",
      error
    );
    messageCache.set(cacheKey, fallbackLine);
    return NextResponse.json(
      { line: fallbackLine, reason: "unexpected-error" },
      { status: 200 }
    );
  }
}
