"use client";

import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";

export default function Home() {
  const { data: session, status } = useSession();

  if (status === "loading") {
    return (
      <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-md w-full space-y-8 text-center">
          <p className="text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 text-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-900 mb-4">
            Hello {session?.user?.name || session?.user?.email}!
          </h1>
          <p className="text-gray-600 mb-6">Welcome back to Bloomer!</p>
          <div className="space-y-4">
            <p className="text-sm text-gray-500">
              Signed in as: {session?.user?.email}
            </p>
            <Button
              onClick={() => signOut({ callbackUrl: "/sign-in" })}
              variant="outline"
              className="mt-4"
            >
              Sign Out
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
