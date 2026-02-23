"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { ArrowRight, Check } from "lucide-react";
import Flower from "@/public/flower.png";
import Image from "next/image";
import Dashboard from "@/public/dashboard.png";
import { useUser } from "@/context/AuthContext";

export default function LandingPage() {
  const { user } = useUser();

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      {user && (
        <div className="w-full flex justify-center py-4">
          <Link href="/dashboard" className="w-full max-w-2xl mx-4">
            <div className="flex items-center justify-between px-6 py-2 rounded-full border border-orange-300 bg-orange-50 hover:bg-orange-100 transition-colors cursor-pointer">
              <span className="text-sm text-black">
                Welcome back,{" "}
                <span className="font-medium text-black">
                  {user.firstName} {user.lastName}
                </span>
              </span>
              <div className="flex items-center gap-2">
                <p className="text-sm font-semibold text-black">
                  Go to dashboard
                </p>
                <ArrowRight className="h-4 w-4 text-black" />
              </div>
            </div>
          </Link>
        </div>
      )}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto grid grid-cols-3 h-16 items-center px-4 md:px-8">
          <div className="flex items-center gap-2">
            <Image src={Flower} alt="Flower" width="24" height="24" />
            <span className="text-xl font-bold">Bloomer</span>
          </div>

          <nav className="hidden md:flex items-center gap-6 justify-center">
            <Link
              href="#pricing"
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Pricing
            </Link>
            <Link
              href=""
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Features
            </Link>
            <Link
              href=""
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              About
            </Link>
            <Link
              href=""
              className="text-sm font-medium hover:text-primary transition-colors"
            >
              Contact Us
            </Link>
          </nav>

          <div className="flex items-center gap-3 justify-end">
            {!user && (
              <Button asChild variant="ghost" className="cursor-pointer">
                <Link href="/sign-in">Sign In</Link>
              </Button>
            )}
            <Button className="cursor-pointer">Book a demo</Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full px-4 md:px-8 pt-20 pb-16">
        <div className="max-w-xl mx-auto text-center space-y-8">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-bold tracking-tight">
            The <span className="text-red-400">Flower Shop</span> Platform That
            Converts, Captures, & Keeps Members
          </h1>

          <p className="text-muted-foreground max-w-xl mx-auto">
            Bloomer is the flower shop platform built to drive growth, manage
            members, and market automatically. Stop managing broken tools and
            paying 4% commission, and start dominating with one unified system.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button asChild size="lg">
              <Link href="/sign-up">
                Upgrade to Bloomer
                <ArrowRight />
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Product Screenshot */}
      <section className="w-full px-4 md:px-8 pb-20">
        <div className="max-w-6xl mx-auto relative">
          {/* Glow effect */}
          <div className="absolute -top-1 -left-1 -right-1 h-[96%] bg-gradient-to-r from-red-400 to-orange-300 rounded-xl blur-xl opacity-20" />
          <div className="relative rounded-xl border-t border-r border-l bg-card shadow-2xl overflow-hidden">
            {/* Placeholder for product screenshot */}
            <Image src={Dashboard} alt="Dashboard" className="w-full h-full" />
            {/* Fade out overlay at the bottom */}
            <div className="absolute inset-x-0 bottom-0 h-32 bg-gradient-to-t from-background via-background/50 to-transparent pointer-events-none" />
            {/* <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <div className="text-6xl">📊</div>
                <p className="text-muted-foreground text-lg">
                  Product Screenshot Placeholder
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Replace this section with your dashboard screenshot showing
                  customer management, campaigns, and automation features
                </p>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Social Proof */}
      {/* <section className="w-full px-4 md:px-8 pb-20">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
            <div className="text-xl font-semibold">Chicky Blooms</div>
            <div className="text-xl font-semibold">Lincoln Florist</div>
          </div>
        </div>
      </section> */}

      {/* Comparison Section */}
      <section className="w-full px-4 md:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="grid md:grid-cols-2 gap-8">
            {/* The Old Way */}
            {/* <div className="space-y-6 p-8 rounded-2xl bg-gradient-to-br from-muted/50 to-muted/30 border border-border/50">
              <div className="flex items-center gap-3 pb-2">
                <div className="h-10 w-10 rounded-xl bg-destructive/10 flex items-center justify-center">
                  <X className="h-5 w-5 text-destructive" />
                </div>
                <h3 className="text-2xl font-bold text-foreground">
                  The Old Way
                </h3>
              </div>
              <div className="space-y-3">
                {[
                  "Scattered customer data across multiple tools",
                  "Manual campaign creation that takes hours",
                  "No visibility into customer engagement metrics",
                  "Repetitive tasks consuming valuable time",
                  "Disconnected marketing channels causing confusion",
                ].map((item, index) => (
                  <div
                    key={index}
                    className="flex items-start gap-3 p-4 rounded-xl bg-background/60 border border-border/40 backdrop-blur-sm"
                  >
                    <div className="mt-0.5 shrink-0">
                      <div className="h-5 w-5 rounded-full bg-destructive/10 flex items-center justify-center">
                        <X className="h-3.5 w-3.5 text-destructive" />
                      </div>
                    </div>
                    <p className="text-sm text-muted-foreground leading-relaxed">
                      {item}
                    </p>
                  </div>
                ))}
              </div>
            </div> */}

            {/* The Bloomer Way */}
            {/* <div className="space-y-6 p-8 rounded-2xl bg-gradient-to-br from-primary/5 via-primary/10 to-primary/5 border-2 border-primary/30 shadow-lg shadow-primary/5 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent pointer-events-none" />

              <div className="relative">
                <div className="flex items-center gap-3 pb-2">
                  <Image src={Flower} alt="Flower" width="40" height="40" />
                  <h3 className="text-2xl font-bold bg-gradient-to-r from-primary to-primary/70 bg-clip-text text-transparent">
                    The Bloomer Way
                  </h3>
                </div>
                <div className="space-y-3">
                  {[
                    "Unified customer hub with all data in one place",
                    "AI-powered campaigns that launch in minutes",
                    "Real-time analytics and engagement insights",
                    "Smart automation that works while you sleep",
                    "Seamless multi-channel orchestration from one platform",
                  ].map((item, index) => (
                    <div
                      key={index}
                      className="flex items-start gap-3 p-4 rounded-xl bg-background/80 border border-primary/20 backdrop-blur-sm hover:border-primary/40 hover:bg-background/90 transition-all duration-200"
                    >
                      <div className="mt-0.5 shrink-0">
                        <div className="h-5 w-5 rounded-full bg-primary/20 flex items-center justify-center">
                          <Check className="h-3.5 w-3.5 text-primary" />
                        </div>
                      </div>
                      <p className="text-sm font-medium text-foreground leading-relaxed">
                        {item}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            </div> */}
          </div>
        </div>
      </section>

      {/* Pricing Section */}
      <section id="pricing" className="w-full px-4 md:px-8 pb-20 scroll-mt-20">
        <div className="max-w-4xl mx-auto">
          {/* Section Header */}
          <div className="text-center space-y-4 mb-12">
            <h2 className="text-3xl sm:text-4xl font-bold tracking-tight">
              All the tools you need, one simple price.
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto">
              Experience the peace of mind that comes with having your flower
              shop under control
            </p>
          </div>

          <div className="relative rounded-2xl bg-gradient-to-br from-primary/5 via-background to-primary/5 border-2 border-primary/20 shadow-2xl overflow-hidden">
            {/* Decorative glow effects */}
            <div className="absolute -top-20 -right-20 h-60 w-60 bg-gradient-to-br from-red-400 to-orange-300 rounded-full blur-3xl opacity-10" />
            <div className="absolute -bottom-20 -left-20 h-60 w-60 bg-gradient-to-br from-orange-300 to-red-400 rounded-full blur-3xl opacity-10" />

            <div className="relative p-8 md:p-12">
              {/* Header */}
              <div className="mb-8 space-y-3">
                <div className="inline-flex items-center gap-2 mb-2">
                  <Image src={Flower} alt="Flower" width={32} height={32} />
                  <h2 className="text-xl md:text-2xl font-bold">
                    Bloomer Platform
                  </h2>
                </div>
                <p className="text-muted-foreground max-w-2xl">
                  One simple package to give your shop everything it needs to
                  increase revenue
                </p>
              </div>

              {/* Pricing */}
              <div className="text-center mb-8 pb-8 border-b border-border/50">
                <div className="flex items-baseline justify-center gap-2 mb-2">
                  <span className="text-5xl md:text-6xl font-bold">$99</span>
                  <span className="text-xl text-muted-foreground">/month</span>
                </div>
                <p className="text-sm text-muted-foreground">
                  per shop • billed monthly
                </p>
                <div className="mt-6">
                  <Button asChild size="lg" className="px-8">
                    <Link href="/sign-up">
                      Get Started
                      <ArrowRight className="ml-2 h-4 w-4" />
                    </Link>
                  </Button>
                </div>
              </div>

              {/* Features */}
              <div className="space-y-6">
                <p className="text-center text-base font-semibold text-foreground">
                  Everything you need to convert, capture, and connect with your
                  members including:
                </p>

                <div className="grid md:grid-cols-2 gap-x-8 gap-y-4 max-w-3xl mx-auto">
                  {[
                    "Customer management system",
                    "Order tracking & history",
                    "Email marketing campaigns",
                    "Real-time analytics & reports",
                    "Mobile-friendly dashboard",
                    "Payment processing",
                    "Inventory management",
                    "Lilli AI Agent assistant",
                    "Voice agent for phone orders",
                    "24/7 automated customer support",
                    "Smart order routing",
                    "Priority support & onboarding",
                  ].map((feature, index) => (
                    <div key={index} className="flex items-start gap-3">
                      <Check className="h-5 w-5 text-primary shrink-0 mt-0.5" />
                      <span className="text-sm text-foreground font-medium">
                        {feature}
                      </span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t bg-background py-12 px-4 md:px-8">
        <div className="max-w-7xl mx-auto grid md:grid-cols-4 gap-8">
          <div className="space-y-4">
            <div className="flex items-center gap-2">
              <Image src={Flower} alt="Bloomer" width={24} height={24} />
              <span className="text-lg font-bold">Bloomer</span>
            </div>
            <p className="text-sm text-muted-foreground">
              The all-in-one platform for modern flower shops.
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Product</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary">
                  Features
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Pricing
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Integrations
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Company</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="#" className="hover:text-primary">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Careers
                </Link>
              </li>
              <li>
                <Link href="#" className="hover:text-primary">
                  Blog
                </Link>
              </li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4">Legal</h4>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>
                <Link href="/privacy" className="hover:text-primary">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/terms" className="hover:text-primary">
                  Terms of Service
                </Link>
              </li>
            </ul>
          </div>
        </div>
      </footer>
    </div>
  );
}
