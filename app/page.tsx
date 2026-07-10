'use client';

import { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { getCurrentUser } from '@/lib/data/db-service';

export default function Home() {
  const router = useRouter();

  useEffect(() => {
    const user = getCurrentUser();
    if (user) {
      router.replace('/dashboard');
    } else {
      router.replace('/login');
    }
  }, [router]);

  return (
    <div className="min-h-screen flex items-center justify-center bg-[#FFFDFE]">
      <div className="flex flex-col items-center gap-3">
        <div className="w-12 h-12 border-4 border-tertiary border-t-transparent rounded-full animate-spin" />
        <span className="text-sm font-semibold text-tertiary">Mengalihkan...</span>
      </div>
    </div>
  );
}
