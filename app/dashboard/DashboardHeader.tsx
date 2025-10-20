// components/dashboard/DashboardHeader.tsx (Server Component)
import DashboardHeaderClient from "./DashboardHeader.client";

export default function DashboardHeader({
  connected,
  lastSyncIso,
}: {
  connected: boolean;
  lastSyncIso: string;
}) {
  // This is a server component that forwards initial props to the client component.
  return (
    <DashboardHeaderClient
      connected={connected}
      lastSyncIso={lastSyncIso}
    />
  );
}
