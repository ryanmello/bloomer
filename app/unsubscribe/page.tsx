import Link from "next/link";
import Image from "next/image";
import Flower from "@/public/flower.png";
import db from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";
import { redirect } from "next/navigation";

export const metadata = {
  title: "Unsubscribed | Bloomer",
  description: "You have been unsubscribed from marketing emails.",
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function UnsubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <UnsubscribeLayout>
        <h1 className="text-2xl font-semibold mb-2">Invalid link</h1>
        <p className="text-muted-foreground text-sm">
          This unsubscribe link is missing or invalid. If you need to unsubscribe, use the link in
          the email we sent you.
        </p>
        <Link href="/" className="inline-block mt-6 text-sm text-primary hover:underline">
          Return to home
        </Link>
      </UnsubscribeLayout>
    );
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return (
      <UnsubscribeLayout>
        <h1 className="text-2xl font-semibold mb-2">Link expired or invalid</h1>
        <p className="text-muted-foreground text-sm">
          This unsubscribe link has expired or is invalid. Links are valid for 30 days.
        </p>
        <Link href="/" className="inline-block mt-6 text-sm text-primary hover:underline">
          Return to home
        </Link>
      </UnsubscribeLayout>
    );
  }

  // Mark unsubscribed on GET (in case they opened in browser instead of one-click POST)
  await db.customer.update({
    where: { id: payload.customerId },
    data: { unsubscribedAt: new Date() },
  });

  return (
    <UnsubscribeLayout>
      <h1 className="text-2xl font-semibold mb-2">You&apos;re unsubscribed</h1>
      <p className="text-muted-foreground text-sm">
        You won&apos;t receive marketing emails from us anymore.
      </p>
      <p className="text-muted-foreground text-sm mt-2">
        Changed your mind? You can opt back in anytime.
      </p>
      <div className="flex flex-col items-center gap-3 mt-6">
        <Link
          href={`/subscribe?token=${encodeURIComponent(token)}`}
          className="text-sm text-primary hover:underline font-medium"
        >
          Opt back in
        </Link>
        <Link href="/" className="text-sm text-muted-foreground hover:underline">
          Return to home
        </Link>
      </div>
    </UnsubscribeLayout>
  );
}

function UnsubscribeLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="min-h-screen flex flex-col bg-background">
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur">
        <div className="max-w-4xl mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <Link href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
            <Image src={Flower} alt="Bloomer" width={24} height={24} />
            <span className="text-xl font-bold">Bloomer</span>
          </Link>
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Back to home
          </Link>
        </div>
      </header>

      <main className="flex-1 max-w-md mx-auto w-full px-4 md:px-8 py-16 text-center">
        {children}
      </main>
    </div>
  );
}
