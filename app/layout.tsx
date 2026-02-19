"use client";

import "./globals.css";
import AuthContext from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta
          name="google-site-verification"
          content="W8PZgrE7Q2BakSqgrV4BzIPCsdd70VAnNhFYXV4kHZA"
        />
      </head>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthContext>
            {children}
            <Toaster />
          </AuthContext>
        </ThemeProvider>
      </body>
    </html>
  );
}
