import Link from "next/link";
import Image from "next/image";
import Flower from "@/public/flower.png";
import db from "@/lib/prisma";
import { verifyUnsubscribeToken } from "@/lib/unsubscribe-token";

export const metadata = {
  title: "Subscribed | Bloomer",
  description: "You're back on our mailing list.",
};

type Props = { searchParams: Promise<{ token?: string }> };

export default async function SubscribePage({ searchParams }: Props) {
  const { token } = await searchParams;

  if (!token) {
    return (
      <SubscribeLayout>
        <h1 className="text-2xl font-semibold mb-2">Invalid link</h1>
        <p className="text-muted-foreground text-sm">
          This link is missing or invalid. Use the &quot;Opt back in&quot; link from your
          unsubscribe confirmation.
        </p>
        <Link href="/" className="inline-block mt-6 text-sm text-primary hover:underline">
          Return to home
        </Link>
      </SubscribeLayout>
    );
  }

  const payload = verifyUnsubscribeToken(token);
  if (!payload) {
    return (
      <SubscribeLayout>
        <h1 className="text-2xl font-semibold mb-2">Link expired or invalid</h1>
        <p className="text-muted-foreground text-sm">
          This link has expired or is invalid. Links are valid for 30 days.
        </p>
        <Link href="/" className="inline-block mt-6 text-sm text-primary hover:underline">
          Return to home
        </Link>
      </SubscribeLayout>
    );
  }

  await db.customer.update({
    where: { id: payload.customerId },
    data: { unsubscribedAt: null },
  });

  return (
    <SubscribeLayout>
      <h1 className="text-2xl font-semibold mb-2">You&apos;re back on the list</h1>
      <p className="text-muted-foreground text-sm">
        You&apos;ll receive our marketing emails again. Thanks for staying in touch.
      </p>
      <Link href="/" className="inline-block mt-6 text-sm text-primary hover:underline">
        Return to home
      </Link>
    </SubscribeLayout>
  );
}

function SubscribeLayout({ children }: { children: React.ReactNode }) {
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
