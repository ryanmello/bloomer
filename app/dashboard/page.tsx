"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: session, status } = useSession();

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
    </div>
  );
}
