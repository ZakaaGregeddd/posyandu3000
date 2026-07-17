"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getCurrentUser,
  getBalitaById,
  getIbuHamilById,
  getLansiaById,
} from "@/lib/data/db-service";

export default function Header() {
  const pathname = usePathname();
  const [user, setUser] = React.useState<{ username: string } | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setUser(getCurrentUser());
    setMounted(true);
  }, []);

  // Simple breadcrumbs builder
  const getBreadcrumbs = () => {
    let parts = pathname.split("/").filter((p) => p);
    if (parts.length === 0) return [{ name: "Home", href: "/dashboard" }];

    // If we are in subpages, hide the 'dashboard' prefix from breadcrumbs
    if (parts.length > 1 && parts[0] === "dashboard") {
      parts = parts.slice(1);
    }

    return parts.map((part, index) => {
      let href = "/dashboard";
      if (part === "balita") href = "/dashboard/balita";
      else if (part === "ibu-hamil") href = "/dashboard/ibu-hamil";
      else if (part === "lansia") href = "/dashboard/lansia";
      else if (part === "tambah-kk") href = "/dashboard/tambah-kk";
      else if (index === 0 && part === "dashboard") href = "/dashboard";

      const isDetailPage = parts.length === 2 && index === 1;
      const parentType = parts[0];

      let name = part.charAt(0).toUpperCase() + part.slice(1);
      if (part === "tambah-kk") name = "Tambah KK Baru";
      if (part === "ibu-hamil") name = "Ibu Hamil";

      if (mounted && isDetailPage) {
        if (parentType === "balita") {
          href = `/dashboard/balita/${part}`;
          const person = getBalitaById(part);
          if (person) name = person.nama;
        } else if (parentType === "ibu-hamil") {
          href = `/dashboard/ibu-hamil/${part}`;
          const person = getIbuHamilById(part);
          if (person) name = person.nama;
        } else if (parentType === "lansia") {
          href = `/dashboard/lansia/${part}`;
          const person = getLansiaById(part);
          if (person) name = person.nama;
        }
      }

      return { name, href };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex justify-between items-center w-full px-8 h-16 bg-[#FFFDFE] sticky top-0 z-30 border-b border-outline-variant/10">
      <div className="flex items-center gap-2 text-on-background text-sm font-medium">
        <span className="material-symbols-outlined text-body-lg text-tertiary">
          home
        </span>
        {breadcrumbs.map((crumb, idx) => (
          <React.Fragment key={crumb.href}>
            <span className="text-on-surface-variant font-light text-xs">
              /
            </span>
            <span
              className={
                idx === breadcrumbs.length - 1
                  ? "text-on-background font-semibold"
                  : "text-on-surface-variant"
              }
            >
              {crumb.name}
            </span>
          </React.Fragment>
        ))}
      </div>
      <div className="flex items-center gap-4">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center font-headline font-bold cursor-pointer hover:opacity-90 transition-opacity bg-tertiary text-white shadow-sm"
          title={user?.username || "User Profile"}
        >
          {user?.username ? user.username.charAt(0).toUpperCase() : "K"}
        </div>
      </div>
    </header>
  );
}
