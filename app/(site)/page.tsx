"use client";

import { Button } from "@/components/ui/button";
import Link from "next/link";
import { Play, Check, X } from "lucide-react";

export default function LandingPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-b from-background to-secondary/20">
      {/* Header */}
      <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="max-w-7xl mx-auto flex h-16 items-center justify-between px-4 md:px-8">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
              <span className="text-primary-foreground font-bold text-lg">B</span>
            </div>
            <span className="text-xl font-bold">Bloomer</span>
          </div>
          
          <nav className="hidden md:flex items-center gap-6">
            <Link href="#features" className="text-sm font-medium hover:text-primary transition-colors">
              Features
            </Link>
            <Link href="#how-it-works" className="text-sm font-medium hover:text-primary transition-colors">
              How It Works
            </Link>
            <Link href="#pricing" className="text-sm font-medium hover:text-primary transition-colors">
              Pricing
            </Link>
            <Link href="#faq" className="text-sm font-medium hover:text-primary transition-colors">
              FAQ
            </Link>
          </nav>

          <div className="flex items-center gap-3">
            <Button asChild variant="ghost">
              <Link href="/sign-in">Login</Link>
            </Button>
            <Button asChild>
              <Link href="/sign-up">Get Started</Link>
            </Button>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="w-full px-4 md:px-8 pt-20 pb-16">
        <div className="max-w-5xl mx-auto text-center space-y-8">
          <h1 className="text-5xl sm:text-6xl lg:text-7xl font-bold tracking-tight">
            The smarter way to engage customers, <span className="text-primary">Superfast</span>
          </h1>
          
          <p className="text-xl sm:text-2xl text-muted-foreground max-w-3xl mx-auto">
            All-in-one platform for customer engagement, marketing automation, and AI-powered campaigns, built for modern businesses.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button asChild size="lg" className="text-base px-8 h-12">
              <Link href="/sign-up">
                Get Started
                <span className="ml-2">→</span>
              </Link>
            </Button>
            <Button size="lg" variant="outline" className="text-base px-8 h-12">
              <Play className="mr-2 h-4 w-4" />
              Watch Demo
            </Button>
          </div>

          <p className="text-sm text-muted-foreground pt-2">
            14 day free trial, No credit card required
          </p>
        </div>
      </section>

      {/* Product Screenshot */}
      <section className="w-full px-4 md:px-8 pb-20">
        <div className="max-w-6xl mx-auto">
          <div className="relative rounded-xl border bg-card shadow-2xl overflow-hidden">
            {/* Placeholder for product screenshot */}
            <div className="aspect-[16/10] bg-gradient-to-br from-primary/10 via-secondary/20 to-accent/10 flex items-center justify-center">
              <div className="text-center space-y-4 p-8">
                <div className="text-6xl">📊</div>
                <p className="text-muted-foreground text-lg">
                  Product Screenshot Placeholder
                </p>
                <p className="text-sm text-muted-foreground max-w-md mx-auto">
                  Replace this section with your dashboard screenshot showing customer management, campaigns, and automation features
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Social Proof */}
      <section className="w-full px-4 md:px-8 pb-20">
        <div className="max-w-6xl mx-auto text-center space-y-8">
          <p className="text-sm text-muted-foreground font-medium">
            Trusted by 4,000+ companies
          </p>
          <div className="flex flex-wrap items-center justify-center gap-8 md:gap-12 opacity-60">
            <div className="text-xl font-semibold">Acme Corp</div>
            <div className="text-xl font-semibold">TechStart</div>
            <div className="text-xl font-semibold">GrowthCo</div>
            <div className="text-xl font-semibold">Innovate Inc</div>
            <div className="text-xl font-semibold">NextGen</div>
          </div>
        </div>
      </section>

      {/* Comparison Section */}
      <section className="w-full px-4 md:px-8 pb-20">
        <div className="max-w-6xl mx-auto grid md:grid-cols-2 gap-8">
          {/* The Old Way */}
          <div className="space-y-6">
            <h2 className="text-3xl font-bold">The Old Way</h2>
            <div className="space-y-4">
              {[
                "Scattered customer data across multiple tools.",
                "Manual campaign creation that takes hours.",
                "No visibility into customer engagement metrics.",
                "Repetitive tasks consuming valuable time.",
                "Disconnected marketing channels causing confusion."
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-muted/50">
                  <div className="mt-0.5">
                    <X className="h-5 w-5 text-destructive" />
                  </div>
                  <p className="text-base">{item}</p>
                </div>
              ))}
            </div>
          </div>

          {/* The Bloomer Way */}
          <div className="space-y-6">
            <div className="flex items-center gap-3">
              <div className="h-8 w-8 rounded-lg bg-primary flex items-center justify-center">
                <span className="text-primary-foreground font-bold">B</span>
              </div>
              <h2 className="text-3xl font-bold">The Bloomer Way</h2>
            </div>
            <div className="space-y-4">
              {[
                "Unified customer hub with all data in one place.",
                "AI-powered campaigns that launch in minutes.",
                "Real-time analytics and engagement insights.",
                "Smart automation that works while you sleep.",
                "Seamless multi-channel orchestration from one platform."
              ].map((item, index) => (
                <div key={index} className="flex items-start gap-3 p-4 rounded-lg bg-primary/5 border border-primary/20">
                  <div className="mt-0.5">
                    <Check className="h-5 w-5 text-primary" />
                  </div>
                  <p className="text-base">{item}</p>
                </div>
              ))}
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="w-full px-4 md:px-8 pb-20">
        <div className="max-w-4xl mx-auto text-center space-y-6 p-12 rounded-2xl bg-primary/5 border border-primary/20">
          <h2 className="text-4xl font-bold">Ready to grow your business?</h2>
          <p className="text-xl text-muted-foreground">
            Join thousands of businesses using Bloomer to automate their marketing and engage customers like never before.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center items-center pt-4">
            <Button asChild size="lg" className="text-base px-8 h-12">
              <Link href="/sign-up">
                Start Free Trial
              </Link>
            </Button>
            <Button asChild size="lg" variant="outline" className="text-base px-8 h-12">
              <Link href="/sign-in">
                Sign In
              </Link>
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t py-8 px-4 mt-auto">
        <div className="max-w-6xl mx-auto text-center text-sm text-muted-foreground">
          © {new Date().getFullYear()} Bloomer. All rights reserved.
        </div>
      </footer>
    </div>
  );
}
