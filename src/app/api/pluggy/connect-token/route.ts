import { NextRequest, NextResponse } from "next/server";

import pluggyClient from "@/lib/pluggyClient";

export async function POST(request: NextRequest) {
  try {
    const { itemId, options } = (await request.json().catch(() => ({}))) as {
      itemId?: string;
      options?: Record<string, unknown>;
    };

    const { accessToken: connectToken } = await pluggyClient.createConnectToken(
      itemId,
      options
    );

    console.log(
      `[Pluggy] Issued connect token${itemId ? ` for item ${itemId}` : ""}.`
    );

    return NextResponse.json({
      connectToken,
    });
  } catch (error) {
    console.error("[Pluggy] Failed to issue connect token.", error);

    return NextResponse.json(
      {
        error: "Failed to issue connect token.",
      },
      { status: 500 }
    );
  }
}
