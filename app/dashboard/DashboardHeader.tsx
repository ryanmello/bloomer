// components/dashboard/DashboardHeader.tsx (Server Component)
import { db } from "@/lib/prisma";
import DashboardHeaderClient from "./DashboardHeader.client";

export default async function DashboardHeader() {
  const integ = await db.squareIntegration.findFirst();
  const connected = integ?.connected ?? false;
  const lastSyncIso = integ?.lastSyncAt?.toISOString() ?? null;

  return <DashboardHeaderClient connected={connected} lastSyncIso={lastSyncIso} />;
}
