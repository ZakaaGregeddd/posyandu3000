"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  getCurrentUser,
  getBalitaById,
  getIbuHamilById,
  getLansiaById,
  getKKByNoKk,
} from "@/lib/data/db-service";

interface HeaderProps {
  onMenuToggle?: () => void;
}

export default function Header({ onMenuToggle }: HeaderProps) {
  const pathname = usePathname();
  const [user, setUser] = React.useState<{ username: string } | null>(null);
  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setUser(getCurrentUser());
    setMounted(true);
  }, []);

  const [resolvedNames, setResolvedNames] = React.useState<Record<string, string>>({});

  React.useEffect(() => {
    let parts = pathname.split("/").filter((p) => p);
    if (parts.length > 1 && parts[0] === "dashboard") {
      parts = parts.slice(1);
    }
    if (parts.length === 2) {
      const [parentType, id] = parts;
      if (!resolvedNames[id]) {
        let name = "";
        if (parentType === "balita") {
          const person = getBalitaById(id);
          if (person) name = person.nama;
        } else if (parentType === "ibu-hamil") {
          const person = getIbuHamilById(id);
          if (person) name = person.nama;
        } else if (parentType === "lansia") {
          const person = getLansiaById(id);
          if (person) name = person.nama;
        } else if (parentType === "kk-terdaftar") {
          const kk = getKKByNoKk(id);
          if (kk) name = kk.noKk;
        }

        if (name) {
          setResolvedNames((prev) => ({ ...prev, [id]: name }));
        } else {
          (async () => {
            try {
              if (parentType === "ibu-hamil") {
                const { getIbuHamilById: getSupabaseIbuHamil } = await import("@/lib/fetch/ibuHamil");
                const person = await getSupabaseIbuHamil(id);
                if (person) setResolvedNames((prev) => ({ ...prev, [id]: person.nama }));
              } else if (parentType === "balita") {
                const { getBalitaById: getSupabaseBalita } = await import("@/lib/fetch/balita");
                const person = await getSupabaseBalita(id);
                if (person) setResolvedNames((prev) => ({ ...prev, [id]: person.nama }));
              } else if (parentType === "lansia") {
                const { getLansiaById: getSupabaseLansia } = await import("@/lib/fetch/lansia");
                const person = await getSupabaseLansia(id);
                if (person) setResolvedNames((prev) => ({ ...prev, [id]: person.nama }));
              }
            } catch (err) {
              console.error(err);
            }
          })();
        }
      }
    }
  }, [pathname, resolvedNames]);

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
      else if (part === "ibu-hamil") name = "Ibu Hamil";
      else if (part === "kk-terdaftar") name = "KK Terdaftar";

      if (mounted && isDetailPage) {
        if (parentType === "balita") {
          href = `/dashboard/balita/${part}`;
        } else if (parentType === "ibu-hamil") {
          href = `/dashboard/ibu-hamil/${part}`;
        } else if (parentType === "lansia") {
          href = `/dashboard/lansia/${part}`;
        } else if (parentType === "kk-terdaftar") {
          href = `/dashboard/kk-terdaftar/${part}`;
        }
        if (resolvedNames[part]) {
          name = resolvedNames[part];
        }
      }

      return { name, href };
    });
  };

  const breadcrumbs = getBreadcrumbs();

  return (
    <header className="flex justify-between items-center w-full px-4 md:px-8 h-16 bg-[#FFFDFE] fixed top-0 right-0 left-0 lg:left-[280px] z-20 border-b border-outline-variant/10">
      <div className="flex items-center gap-2 text-on-background text-sm font-medium">
        {/* Toggle Button for Sidebar on Mobile */}
        <button
          onClick={onMenuToggle}
          className="lg:hidden text-on-surface-variant hover:bg-surface-container-low p-1.5 rounded-full transition-colors cursor-pointer flex items-center justify-center mr-1"
        >
          <span className="material-symbols-outlined text-[24px]">menu</span>
        </button>

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
                  ? "text-on-background font-semibold truncate max-w-[140px] xs:max-w-[180px] sm:max-w-none"
                  : "text-on-surface-variant"
              }
            >
              {idx === breadcrumbs.length - 1 ? (
                crumb.name
              ) : (
                <>
                  <span className="hidden md:inline">{crumb.name}</span>
                  <span className="inline md:hidden">...</span>
                </>
              )}
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
