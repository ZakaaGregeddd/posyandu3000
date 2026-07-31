"use client";

import React from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import Pagination from "./Pagination";
import { Balita } from "@/lib/fetch/balita";
import { calculateAge } from "@/lib/utils/health";

interface BalitaTableProps {
  title: string;
  icon: string;
  iconBgClass: string;
  list: Balita[];
  currentPage: number;
  onPageChange: (page: number) => void;
  itemsPerPage?: number;
  showLockBadge?: boolean;
  emptyMessage: string;
}

export default function BalitaTable({
  title,
  icon,
  iconBgClass,
  list,
  currentPage,
  onPageChange,
  itemsPerPage = 3,
  showLockBadge = false,
  emptyMessage,
}: BalitaTableProps) {
  const totalPages = Math.max(Math.ceil(list.length / itemsPerPage), 1);
  const paginatedList = list.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <section className="space-y-4">
      <div className="flex items-center gap-3">
        <div
          className={`w-10 h-10 rounded-xl ${iconBgClass} flex items-center justify-center text-tertiary shadow-sm`}
        >
          <span
            className="material-symbols-outlined text-2xl"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            {icon}
          </span>
        </div>
        <div>
          <h3 className="font-headline text-lg font-bold text-on-background">
            {title}
          </h3>
          <p className="text-xs text-on-surface-variant">
            {list.length} anggota terdaftar
          </p>
        </div>
      </div>

      <Card className="border border-outline-variant/15 overflow-hidden p-0 bg-transparent shadow-none border-none">
        <CardContent className="p-0">
          <div className="w-full overflow-x-auto pb-2">
            <table className="w-full border-separate border-spacing-y-2 min-w-[750px]">
            <thead>
              <tr className="text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                <th className="px-6 py-4 bg-secondary-container rounded-l-xl">
                  No. KK
                </th>
                <th className="px-6 py-4 bg-secondary-container">NIK</th>
                <th className="px-6 py-4 bg-secondary-container">
                  Nama Anggota
                </th>
                <th className="px-6 py-4 bg-secondary-container">Usia</th>
                <th className="px-6 py-4 bg-secondary-container">Status</th>
                <th className="px-6 py-4 text-right bg-secondary-container rounded-r-xl">
                  Aksi
                </th>
              </tr>
            </thead>
            <tbody>
              {paginatedList.length === 0 ? (
                <tr className="bg-white">
                  <td
                    colSpan={6}
                    className="text-center text-on-surface-variant py-8 border border-outline-variant/10 rounded-xl"
                  >
                    {emptyMessage}
                  </td>
                </tr>
              ) : (
                paginatedList.map((item) => {
                  const isLocked =
                    showLockBadge && calculateAge(item.tanggalLahir).years >= 5;
                  return (
                    <tr
                      key={item.id}
                      className={`bg-white hover:bg-slate-50 transition-colors ${
                        item.statusHidup === "Meninggal" ? "opacity-75" : ""
                      }`}
                    >
                      <td className="px-6 py-4 text-sm font-medium border-y border-l border-outline-variant/10 rounded-l-xl text-on-surface">
                        {item.noKk}
                      </td>
                      <td className="px-6 py-4 text-sm border-y border-outline-variant/10 text-on-surface">
                        {item.nik || "-"}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold border-y border-outline-variant/10 text-on-surface">
                        <div className="flex items-center gap-2">
                          <span>{item.nama}</span>
                          {isLocked && (
                            <span
                              className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full"
                              title="Usia >= 5 tahun, entri data dibekukan"
                            >
                              Terkunci
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 border-y border-outline-variant/10">
                        <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed-variant rounded-full text-xs font-bold whitespace-nowrap">
                          {calculateAge(item.tanggalLahir).text}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-y border-outline-variant/10">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            item.statusHidup === "Hidup"
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {item.statusHidup}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right border-y border-r border-outline-variant/10 rounded-r-xl">
                        <Link href={`/dashboard/balita/${item.id}`}>
                          <button className="group inline-flex items-center gap-2 text-tertiary hover:bg-secondary-brand/40 px-4 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer">
                            <span className="text-xs font-bold">
                              Lihat Detail
                            </span>
                            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                              arrow_forward
                            </span>
                          </button>
                        </Link>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
          </div>

          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            onPageChange={onPageChange}
          />
        </CardContent>
      </Card>
    </section>
  );
}
