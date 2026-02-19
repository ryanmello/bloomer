import Link from "next/link";
import Image from "next/image";
import Flower from "@/public/flower.png";
import { LEGAL_CONTACT } from "@/lib/legal-contact";

export const metadata = {
  title: "Terms of Service | Bloomer",
  description:
    "Bloomer terms of service – rules and guidelines for using our platform.",
};

export default function TermsOfServicePage() {
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
        <h1 className="text-3xl font-bold mb-2">Terms of Service</h1>
        <p className="text-muted-foreground text-sm mb-10">
          Last updated: February 1, 2025
        </p>

        <div className="prose prose-neutral dark:prose-invert max-w-none space-y-8 text-sm">
          <section>
            <h2 className="text-xl font-semibold mb-3">
              1. Agreement to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              By accessing or using Bloomer (&quot;we,&quot; &quot;our,&quot; or &quot;us&quot;) at
              gobloomer.com, you agree to be bound by these Terms of Service. If
              you do not agree, do not use our services.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              2. Description of Service
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Bloomer provides an all-in-one platform for flower shops to manage
              orders, customers, deliveries, marketing, and related operations.
              We reserve the right to modify, suspend, or discontinue any part of
              the service at any time.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              3. Account Registration and Responsibility
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              You must provide accurate information when creating an account and
              keep it up to date. You are responsible for all activity under
              your account and for maintaining the confidentiality of your
              password. You must notify us promptly of any unauthorized access.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              4. Acceptable Use
            </h2>
            <p className="text-muted-foreground leading-relaxed mb-3">
              You agree not to:
            </p>
            <ul className="list-disc pl-6 text-muted-foreground space-y-1">
              <li>Violate any applicable laws or regulations</li>
              <li>Infringe on others&apos; intellectual property or rights</li>
              <li>Transmit malware, spam, or harmful content</li>
              <li>Attempt to gain unauthorized access to our systems or others&apos; accounts</li>
              <li>Use the service for any fraudulent or illegal purpose</li>
              <li>Interfere with or disrupt the service or its infrastructure</li>
            </ul>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              5. Fees and Payment
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Paid plans are billed according to the pricing in effect at the
              time of subscription. Fees are non-refundable except as required
              by law or as stated in our refund policy. We may change pricing
              with notice; continued use after changes constitutes acceptance.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              6. Intellectual Property
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              Bloomer and its content, features, and functionality are owned by
              us and protected by copyright and other intellectual property
              laws. You may not copy, modify, or create derivative works without
              our written permission. You retain ownership of content you upload;
              you grant us a license to use it to provide the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              7. Disclaimer of Warranties
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              The service is provided &quot;as is&quot; and &quot;as available.&quot; We disclaim
              all warranties, express or implied, including merchantability,
              fitness for a particular purpose, and non-infringement. We do not
              warrant that the service will be uninterrupted or error-free.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              8. Limitation of Liability
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              To the maximum extent permitted by law, Bloomer and its affiliates
              shall not be liable for any indirect, incidental, special,
              consequential, or punitive damages, or any loss of profits, data,
              or goodwill, arising from your use of the service. Our total
              liability shall not exceed the amount you paid us in the twelve
              months prior to the claim.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              9. Termination
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may suspend or terminate your account at any time for violation
              of these terms or for any other reason. You may cancel your account
              at any time through your settings. Upon termination, your right to
              use the service ceases. Provisions that by their nature should
              survive will remain in effect.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              10. Changes to Terms
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              We may update these Terms of Service from time to time. We will
              notify you of material changes by posting the updated terms on
              this page and updating the &quot;Last updated&quot; date. Your continued
              use after changes constitutes acceptance. If you do not agree, you
              must stop using the service.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              11. Governing Law
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              These terms are governed by the laws of the United States. Any
              disputes shall be resolved in the courts of competent jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-xl font-semibold mb-3">
              12. Contact
            </h2>
            <p className="text-muted-foreground leading-relaxed">
              For questions about these Terms of Service, contact us at{" "}
              <a
                href={`mailto:${LEGAL_CONTACT.legalEmail}`}
                className="text-primary hover:underline"
              >
                {LEGAL_CONTACT.legalEmail}
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
