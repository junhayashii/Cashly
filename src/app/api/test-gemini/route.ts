import { NextResponse } from "next/server";

export async function GET() {
  const prompt = "家計管理に関する短い優しいアドバイスを1文ください。";

  const url =
    "https://generativelanguage.googleapis.com/v1beta/openai/chat/completions";

  const body = {
    model: "gemini-2.5-flash", // ✅ 最新モデル（現時点で利用可能）
    messages: [
      { role: "system", content: "あなたは優しい家計アドバイザーです。" },
      { role: "user", content: prompt },
    ],
  };

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${process.env.GEMINI_API_KEY}`,
    },
    body: JSON.stringify(body),
  });

  const data = await res.json();
  return NextResponse.json(data);
}
