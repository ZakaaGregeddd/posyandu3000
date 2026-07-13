'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/shared/Sidebar';
import Header from '@/components/shared/Header';
import { getCurrentUser } from '@/lib/data/db-service';

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const user = getCurrentUser();
    if (!user) {
      router.replace('/login');
    } else {
      setLoading(false);
    }
  }, [router]);

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center bg-[#FFFDFE]">
        <div className="flex flex-col items-center gap-4">
          <span className="material-symbols-outlined text-5xl text-tertiary animate-heartbeat" style={{ fontVariationSettings: "'FILL' 1" }}>
            favorite
          </span>
          <div className="w-28 h-1 bg-tertiary-fixed rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full w-full bg-tertiary rounded-full animate-progress-slide" />
          </div>
          <span className="text-sm font-semibold text-tertiary tracking-wide animate-pulse">Memuat halaman...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-background">
      {/* Sidebar */}
      <Sidebar />
      
      {/* Main Panel */}
      <div className="flex-1 ml-[280px] flex flex-col min-h-screen">
        <Header />
        
        {/* Main Workspace Canvas */}
        <main className="flex-1 p-8 overflow-y-auto">
          {children}
        </main>
      </div>
    </div>
  );
}
