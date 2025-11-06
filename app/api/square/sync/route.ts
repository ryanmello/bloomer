// app/api/square/sync/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function GET() {
  // Return current status for the header (connected + lastSyncAt)
  const integ = await (db as any).squareIntegration.findFirst();
  return NextResponse.json({
    connected: integ?.connected ?? false,
    lastSyncIso: integ?.lastSyncAt?.toISOString() ?? null,
  });
}

export async function POST() {
  // TODO: call your Square pipelines; here we just simulate the sync
  await new Promise((r) => setTimeout(r, 1500));

  const existing = await (db as any).squareIntegration.findFirst();
  if (existing) {
    await (db as any).squareIntegration.update({
      where: { id: existing.id },
      data: { lastSyncAt: new Date() },
    });
  } else {
    await (db as any).squareIntegration.create({
      data: { connected: false, lastSyncAt: new Date() },
    });
  }

  return NextResponse.json({ ok: true });
}
