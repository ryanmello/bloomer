"use client";

import Sidebar from "@/components/sidebar/Sidebar";
import Header from "@/components/header/Header";
import { useState } from "react";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const [isSidebarOpen, setIsSidebarOpen] = useState(false);
  
  return (
    <div className="flex min-h-screen">
      <Sidebar 
        isOpen={isSidebarOpen} 
        onClose={() => setIsSidebarOpen(false)} 
      />
      <main className="flex-1 flex flex-col ml-0 xl:ml-[260px] w-full min-w-0">
        <Header onMenuClick={() => setIsSidebarOpen(true)} />
        <div className="flex-1 p-4 overflow-x-hidden">
          {children}
        </div>
      </main>
    </div>
  );
}

