import "./globals.css";
import type { Metadata } from "next";
import AuthContext from "../context/AuthContext";
import { Toaster } from "@/components/ui/sonner";
import Sidebar from "@/components/sidebar/Sidebar";

export const metadata: Metadata = {
  title: "Bloomer",
  description: "Bloomer",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className="antialiased">
        <AuthContext>
          <Sidebar />
          <div className="ml-[260px] min-h-screen">
            {children}
          </div>
          <Toaster />
        </AuthContext>
      </body>
    </html>
  );
}
