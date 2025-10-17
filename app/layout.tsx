import "./globals.css";
import type { Metadata } from "next";
import AuthContext from "../context/AuthContext";
import { ThemeProvider } from "../context/ThemeProvider";
import { Toaster } from "@/components/ui/sonner";
import Sidebar from "@/components/sidebar/Sidebar";
import Header from "@/components/Header";

export const metadata: Metadata = {
  title: "Bloomer",
  description: "Let's grow together.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className="antialiased">
        <ThemeProvider
          attribute="class"
          defaultTheme="dark"
          enableSystem
          disableTransitionOnChange
        >
          <AuthContext>
            <div className="flex min-h-screen">
              <Sidebar />
              <main className="flex-1 flex flex-col ml-[260px]">
                <Header />
                <div className="flex-1 p-6">
                  {children}
                </div>
              </main>
            </div>
            <Toaster />
          </AuthContext>
        </ThemeProvider>
      </body>
    </html>
  );
}
