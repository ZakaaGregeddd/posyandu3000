"use client";

import React from "react";
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { logoutUser, getCurrentUser } from "@/lib/fetch/auth";

interface SidebarProps {
  isOpen?: boolean;
  onClose?: () => void;
}

export default function Sidebar({ isOpen = false, onClose }: SidebarProps) {
  const pathname = usePathname();
  const router = useRouter();
  const [user, setUser] = React.useState<{
    id: string;
    email: string | null;
  } | null>(null);

  // Initialize dropdown open state if pathname starts with any of the sub-routes
  const isPemeriksaanActive =
    pathname.startsWith("/dashboard/balita") ||
    pathname.startsWith("/dashboard/ibu-hamil") ||
    pathname.startsWith("/dashboard/lansia");

  const [isPemeriksaanOpen, setIsPemeriksaanOpen] = React.useState(isPemeriksaanActive);

  React.useEffect(() => {
    let isMounted = true;
    getCurrentUser().then((u) => {
      if (isMounted) setUser(u);
    });
    return () => {
      isMounted = false;
    };
  }, []);

  React.useEffect(() => {
    if (isPemeriksaanActive) {
      setIsPemeriksaanOpen(true);
    }
  }, [pathname, isPemeriksaanActive]);

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
    {
      name: "KK Terdaftar",
      href: "/dashboard/kk-terdaftar",
      icon: "folder_shared",
    },
  ];

  const pemeriksaanItems = [
    { name: "Balita", href: "/dashboard/balita", icon: "child_care" },
    { name: "Ibu Hamil", href: "/dashboard/ibu-hamil", icon: "pregnant_woman" },
    { name: "Lansia", href: "/dashboard/lansia", icon: "elderly" },
  ];

  return (
    <aside
      className={`fixed left-0 top-0 h-full w-[280px] bg-secondary-container flex flex-col py-8 border-r border-outline-variant z-40 shadow-sm transition-transform duration-300 ease-in-out lg:translate-x-0 ${isOpen ? "translate-x-0" : "-translate-x-full"
        }`}
    >
      <div className="px-6 mb-8 flex justify-between items-center">
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

        {/* Close Button on Mobile */}
        <button
          onClick={onClose}
          className="lg:hidden text-on-secondary-container hover:bg-white/60 p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center"
        >
          <span className="material-symbols-outlined text-[20px]">close</span>
        </button>
      </div>

      <nav className="flex-1 flex flex-col gap-2 overflow-y-auto">
        {navItems.map((item) => {
          const isActive =
            pathname === item.href ||
            (item.href !== "/dashboard" && pathname.startsWith(item.href));

          return (
            <Link
              key={item.href}
              href={item.href}
              className={`${isActive
                ? "bg-tertiary text-white shadow-sm"
                : "text-on-secondary-container hover:bg-white/60 hover:text-tertiary hover:translate-x-1.5"
                } mx-4 px-4 py-3 flex items-center gap-3 rounded-full transition-all duration-200 font-medium text-sm`}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
              <span>{item.name}</span>
            </Link>
          );
        })}

        {/* Dropdown Data Pemeriksaan */}
        <div className="flex flex-col">
          <button
            onClick={() => setIsPemeriksaanOpen(!isPemeriksaanOpen)}
            className={`${isPemeriksaanActive
              ? "text-tertiary font-semibold"
              : "text-on-secondary-container hover:bg-white/60 hover:text-tertiary"
              } mx-4 px-4 py-3 flex items-center justify-between rounded-full transition-all duration-200 font-medium text-sm cursor-pointer`}
          >
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined">medical_information</span>
              <span>Data Pemeriksaan</span>
            </div>
            <span className={`material-symbols-outlined transition-transform duration-200 ${isPemeriksaanOpen ? "rotate-180" : ""}`}>
              expand_more
            </span>
          </button>

          {/* Collapsible content */}
          <div
            className={`transition-all duration-300 ease-in-out overflow-hidden flex flex-col gap-1 mt-1 ${isPemeriksaanOpen ? "max-h-[200px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
              }`}
          >
            {pemeriksaanItems.map((item) => {
              const isActive =
                pathname === item.href || pathname.startsWith(item.href);

              return (
                <Link
                  key={item.href}
                  href={item.href}
                  className={`${isActive
                    ? "bg-tertiary text-white shadow-sm"
                    : "text-on-secondary-container/80 hover:bg-white/60 hover:text-tertiary hover:translate-x-1.5"
                    } ml-10 mr-4 px-4 py-2.5 flex items-center gap-3 rounded-full transition-all duration-200 font-medium text-sm`}
                >
                  <span className="material-symbols-outlined text-[20px]">{item.icon}</span>
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </div>
        </div>

        <Link
          href="/dashboard/penerima-manfaat"
          className={`${pathname.startsWith("/dashboard/penerima-manfaat")
            ? "bg-tertiary text-white shadow-sm"
            : "text-on-secondary-container hover:bg-white/60 hover:text-tertiary hover:translate-x-1.5"
            } mx-4 px-4 py-3 flex items-center gap-3 rounded-full transition-all duration-200 font-medium text-sm`}
        >
          <span className="material-symbols-outlined">featured_seasonal_and_gifts</span>
          <span>Penerima Manfaat</span>
        </Link>

        <Link
          href="/dashboard/laporan"
          className={`${pathname.startsWith("/dashboard/laporan")
            ? "bg-tertiary text-white shadow-sm"
            : "text-on-secondary-container hover:bg-white/60 hover:text-tertiary hover:translate-x-1.5"
            } mx-4 px-4 py-3 flex items-center gap-3 rounded-full transition-all duration-200 font-medium text-sm`}
        >
          <span className="material-symbols-outlined">picture_as_pdf</span>
          <span>Laporan PDF</span>
        </Link>
      </nav>

      <div className="mt-auto px-4 flex flex-col gap-2 pt-4 border-t border-outline-variant/10">
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

