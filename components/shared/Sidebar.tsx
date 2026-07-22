"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutUser, getCurrentUser } from "@/lib/fetch/auth";

export default function Sidebar() {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<{
    id: string;
    email: string | null;
  } | null>(null);

  React.useEffect(() => {
    let isMounted = true;
    getCurrentUser().then((u) => {
      if (isMounted) setUser(u);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  const handleLogout = async () => {
    try {
      await logoutUser();
    } finally {
      router.push("/login");
      router.refresh();
    }
  };

  const navItems = [
    { name: "Dashboard", href: "/dashboard", icon: "dashboard" },
    {
      name: "Tambah KK Baru",
      href: "/dashboard/tambah-kk",
      icon: "person_add",
    },
    { name: "Balita", href: "/dashboard/balita", icon: "child_care" },
    { name: "Ibu Hamil", href: "/dashboard/ibu-hamil", icon: "pregnant_woman" },
    { name: "Lansia", href: "/dashboard/lansia", icon: "elderly" },
    { name: "Laporan PDF", href: "/dashboard/laporan", icon: "picture_as_pdf" },
  ];

  return (
    <aside className="fixed left-0 top-0 h-full w-[280px] bg-secondary-container flex flex-col py-8 border-r border-outline-variant z-40 shadow-sm">
      <div className="px-6 mb-8">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-tertiary rounded-lg flex items-center justify-center shadow-sm">
            <span
              className="material-symbols-outlined text-white"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              volunteer_activism
            </span>
          </div>
          <div className="flex flex-col">
            <span className="font-headline font-bold tracking-tight text-body-lg text-tertiary">
              Posyandu Digital
            </span>
          </div>
        </div>
      </div>

      <nav className="flex-1 flex flex-col gap-2">
        {navItems.map((item) => {
          // Check if item.href matches pathname (with prefix check for subroutes)
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${
                isActive
                  ? "bg-tertiary text-white shadow-sm"
                  : "text-on-secondary-container hover:bg-white/60 hover:text-tertiary hover:translate-x-1.5"
              } mx-4 px-4 py-3 flex items-center gap-3 rounded-full transition-all duration-200 font-medium text-sm`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}
      </nav>

      <div className="mt-auto px-4 flex flex-col gap-2">
        <div className="mx-4 p-3 bg-white/60 rounded-xl flex items-center gap-3 border border-outline-variant/30">
          <div className="w-8 h-8 rounded-full bg-tertiary text-white flex items-center justify-center font-bold text-sm">
            {user?.id ? user.id.charAt(0).toUpperCase() : "K"}
          </div>
          <div className="flex flex-col overflow-hidden">
            <span className="text-xs font-semibold text-on-surface truncate">
              {user?.email || "Kader Posyandu"}
            </span>
            <span className="text-[10px] text-on-surface-variant">
              Kader Posyandu
            </span>
          </div>
        </div>

        <button
          onClick={handleLogout}
          className="mt-2 text-error px-4 py-3 flex items-center gap-3 hover:bg-error-container hover:translate-x-1.5 rounded-full transition-all duration-200 w-full text-left font-medium text-sm cursor-pointer"
        >
          <span className="material-symbols-outlined">logout</span>
          <span>Logout</span>
        </button>
      </div>
    </aside>
  );
}
