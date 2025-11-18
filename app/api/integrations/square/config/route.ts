// app/api/integrations/square/config/route.ts
import { NextResponse } from "next/server";
import db from "@/lib/prisma";

export async function POST(req: Request) {
  const body = await req.json().catch(() => ({}));
  const { accessToken, locationId } = body as {
    accessToken?: string;
    locationId?: string;
  };

  if (!accessToken || !locationId) {
    return NextResponse.json({ ok: false, error: "missing_fields" }, { status: 400 });
  }

  const existing = await (db as any).squareIntegration.findFirst();
  if (existing) {
    await (db as any).squareIntegration.update({
      where: { id: existing.id },
      data: {
        accessToken,
        locationId,
        connected: true,
      },
    });
  } else {
    await (db as any).squareIntegration.create({
      data: {
        accessToken,
        locationId,
        connected: true,
      },
    });
  }

  return NextResponse.json({ ok: true });
}
