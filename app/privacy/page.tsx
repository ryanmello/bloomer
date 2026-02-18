import Link from "next/link";
import Image from "next/image";
import Flower from "@/public/flower.png";

export const metadata = {
  title: "Privacy Policy | Bloomer",
  description:
    "Bloomer privacy policy – how we collect, use, and protect your data.",
};

export default function PrivacyPolicyPage() {
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

      <main className="flex-1 max-w-4xl mx-auto w-full px-4 md:px-8 py-12">
        <h1 className="text-3xl font-bold mb-2">Privacy Policy</h1>
        <p className="text-muted-foreground text-sm mb-10">
          Last updated: February 18, 2026
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm">
          <section>
            <h2 className="text-xl font-semibold mb-3">
              1. Introduction
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Bloomer (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) operates gobloomer.com
              and provides an all-in-one platform for flower shops. This Privacy
              Policy explains how we collect, use, disclose, and safeguard your
              information when you use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              2. Information We Collect
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We may collect:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>
                <strong className="text-foreground">Account information:</strong>{" "}
                Name, email address, password, and business details you provide
                when signing up.
              </li>
              <li>
                <strong className="text-foreground">Business data:</strong>{" "}
                Customer lists, orders, delivery information, and marketing data
                you add to the platform.
              </li>
              <li>
                <strong className="text-foreground">Payment information:</strong>{" "}
                Billing details processed through our payment provider; we do not
                store full payment card numbers.
              </li>
              <li>
                <strong className="text-foreground">Usage data:</strong>{" "}
                How you use our services, including IP address, device info, and
                log data.
              </li>
              <li>
                <strong className="text-foreground">Authentication data:</strong>{" "}
                When you sign in with Google or other providers, we receive basic
                profile information (name, email) from them.
              </li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              3. How We Use Your Information
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use your information to provide and improve our services,
              process orders, send transactional emails (e.g., password resets),
              support marketing automations, comply with legal obligations, and
              protect our platform and users.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              4. Third-Party Services
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              We use third-party services that may process your data:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>
                <strong className="text-foreground">Authentication:</strong>{" "}
                NextAuth (session management) and OAuth providers (e.g., Google).
              </li>
              <li>
                <strong className="text-foreground">Email:</strong> Resend for
                transactional and marketing emails.
              </li>
              <li>
                <strong className="text-foreground">Payment processing:</strong>{" "}
                Square and/or other payment providers you connect.
              </li>
              <li>
                <strong className="text-foreground">Hosting:</strong> Vercel,
                MongoDB, and other infrastructure providers.
              </li>
            </ul>
            <p className="text-muted-foreground leading-relaxed mt-3">
              These providers have their own privacy policies governing their use
              of data.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              5. Data Security
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use industry-standard measures to protect your data, including
              encryption in transit (HTTPS) and secure authentication. Passwords
              are hashed and never stored in plain text.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              6. Your Rights
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Depending on your location, you may have rights to access, correct,
              delete, or export your personal data. You can manage account
              information in your dashboard. For requests we cannot fulfill
              there, contact us at the email below.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              7. Cookies and Similar Technologies
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We use cookies and similar technologies for authentication,
              session management, and analytics. You can control cookie
              preferences through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              8. Children&apos;s Privacy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Our services are not intended for anyone under 16. We do not
              knowingly collect information from children.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              9. Changes to This Policy
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update this Privacy Policy from time to time. We will notify
              you of material changes by posting the updated policy on this page
              and updating the &quot;Last updated&quot; date.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              10. Contact Us
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about this Privacy Policy or our data practices,
              contact us at{" "}
              <a
                href="mailto:placeholder-privacy@gobloomer.com"
                className="text-primary hover:underline"
              >
                privacy@gobloomer.com
              </a>
              .
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t">
          <Link
            href="/"
            className="text-sm text-muted-foreground hover:text-primary transition-colors"
          >
            ← Return to Bloomer
          </Link>
        </div>
      </main>

      <footer className="border-t py-6 px-4 md:px-8">
        <div className="max-w-4xl mx-auto flex flex-wrap items-center justify-between gap-4 text-sm text-muted-foreground">
          <div className="flex items-center gap-2">
            <Image src={Flower} alt="Bloomer" width={20} height={20} />
            <span className="font-semibold text-foreground">Bloomer</span>
          </div>
          <div className="flex gap-6">
            <Link href="/privacy" className="hover:text-primary transition-colors">
              Privacy Policy
            </Link>
            <Link href="/terms" className="hover:text-primary transition-colors">
              Terms of Service
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
