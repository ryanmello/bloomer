"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <p className="text-muted-foreground">Loading...</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-card rounded-lg border p-6">
        <h2 className="text-2xl font-semibold mb-2">
          Hello {session?.user?.name || session?.user?.email}!
        </h2>
        <p className="text-muted-foreground mb-4">Welcome back to Bloomer!</p>
        <div className="flex items-center justify-between">
          <p className="text-sm text-muted-foreground">
            Signed in as: {session?.user?.email}
          </p>
          <Button
            onClick={() => signOut({ callbackUrl: "/sign-in" })}
            variant="outline"
            size="sm"
          >
            Sign Out
          </Button>
        </div>
      </div>

      {/* Quick Stats or Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold mb-2">Total Customers</h3>
          <p className="text-2xl font-bold text-primary">1,234</p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold mb-2">Active Campaigns</h3>
          <p className="text-2xl font-bold text-primary">8</p>
        </div>
        <div className="bg-card rounded-lg border p-6">
          <h3 className="font-semibold mb-2">Revenue</h3>
          <p className="text-2xl font-bold text-primary">$12,345</p>
        </div>
      </div>
    </div>
  );
}
