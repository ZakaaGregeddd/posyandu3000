"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/shared/Sidebar";
import Header from "@/components/shared/Header";
import { getCurrentUser } from "@/lib/fetch/auth";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  const [isSidebarOpen, setIsSidebarOpen] = useState(false);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace("/login");
    } else {
      setLoading(false);
    }
  }, [router]);

  // Close sidebar on route change (in case of navigation on mobile)
  useEffect(() => {
    setIsSidebarOpen(false);
  }, [router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FFFDFE]">
        <div className="flex flex-col items-center gap-4">
          <span
            className="material-symbols-outlined text-5xl text-tertiary animate-heartbeat"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
          <div className="w-28 h-1 bg-tertiary-fixed rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full w-full bg-tertiary rounded-full animate-progress-slide" />
          </div>
          <span className="text-sm font-semibold text-tertiary tracking-wide animate-pulse">
            Memuat halaman...
          </span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background overflow-x-hidden">
      {/* Sidebar Mobile Overlay Backdrop */}
      {isSidebarOpen && (
        <div
          className="fixed inset-0 bg-black/30 z-30 lg:hidden transition-opacity duration-300"
          onClick={() => setIsSidebarOpen(false)}
        />
      )}

      {/* Sidebar */}
      <Sidebar isOpen={isSidebarOpen} onClose={() => setIsSidebarOpen(false)} />

      {/* Main Panel */}
      <div className="flex-1 lg:ml-[280px] flex flex-col min-h-screen w-full min-w-0 pt-16">
        <Header onMenuToggle={() => setIsSidebarOpen(!isSidebarOpen)} />

        {/* Main Workspace Canvas */}
        <main className="flex-1 p-4 md:p-8 overflow-y-auto w-full min-w-0">{children}</main>
      </div>
    </div>
  );
}
