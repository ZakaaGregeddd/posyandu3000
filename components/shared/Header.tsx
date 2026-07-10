'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { getCurrentUser } from '@/lib/data/db-service';

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = React.useState<{ username: string } | null>(null);

  React.useEffect(() => {
    setUser(getCurrentUser());
  }, []);

  // Simple breadcrumbs builder
  const getBreadcrumbs = () => {
    const parts = pathname.split('/').filter(p => p);
    if (parts.length === 0) return [{ name: 'Home', href: '/dashboard' }];
    
    return parts.map((part, index) => {
      const href = '/' + parts.slice(0, index + 1).join('/');
      let name = part.charAt(0).toUpperCase() + part.slice(1);
      if (part === 'tambah-kk') name = 'Tambah KK Baru';
      if (part === 'ibu-hamil') name = 'Ibu Hamil';
      
      return { name, href };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex justify-between items-center w-full px-8 h-16 bg-background sticky top-0 z-10 border-b border-outline-variant/10">
      <div className="flex items-center gap-2 text-on-background text-sm font-medium">
        <span className="material-symbols-outlined text-body-lg text-tertiary">home</span>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.href}>
            <span className="text-on-surface-variant font-light text-xs">/</span>
            <span className={idx === breadcrumbs.length - 1 ? 'text-on-background font-semibold' : 'text-on-surface-variant'}>
              {crumb.name}
            </span>
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div 
          className="w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold cursor-pointer hover:opacity-90 transition-opacity bg-tertiary text-white shadow-sm"
          title={user?.username || 'User Profile'}
        >
          {user?.username ? user.username.charAt(0).toUpperCase() : 'K'}
        </div>
      </div>
    </header>
  );
}
