import { NextResponse } from "next/server";

import { requireSessionEmail } from "@/lib/auth/session";
import { quoteAssetForTransaction } from "@/lib/pricing/live-quote";
import type { AssetSearchResult } from "@/lib/types";

export async function POST(request: Request) {
  try {
    await requireSessionEmail();
    const input = (await request.json()) as AssetSearchResult;
    const quote = await quoteAssetForTransaction(input);
    return NextResponse.json({ quote });
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Could not fetch live quote." },
      { status: 400 }
    );
  }
}
