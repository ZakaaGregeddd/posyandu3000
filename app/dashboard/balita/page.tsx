"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBalitas, getKKs, Balita, KKOption } from "@/lib/fetch/balita";
import { calculateAge } from "@/lib/utils/health";
import BalitaTable from "@/components/balita/BalitaTable";
import TambahBalitaModal from "@/components/balita/TambahBalitaModal";

export default function BalitaPage() {
  const [balitas, setBalitas] = useState<Balita[]>([]);
  const [kks, setKks] = useState<KKOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPageBayi, setCurrentPageBayi] = useState(1);
  const [currentPageBalita, setCurrentPageBalita] = useState(1);

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [balitaData, kkData] = await Promise.all([
          getBalitas(),
          getKKs(),
        ]);
        if (!active) return;
        setBalitas(balitaData);
        setKks(kkData);
      } catch (err: any) {
        if (active) setLoadError(err.message || "Gagal memuat data");
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPageBayi(1);
    setCurrentPageBalita(1);
  }, [searchTerm]);

  const filteredBalitas = balitas.filter(
    (b) =>
      b.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.noKk.includes(searchTerm),
  );

  const bayiList = filteredBalitas.filter(
    (b) => calculateAge(b.tanggalLahir).totalMonths <= 12,
  );
  const balitaList = filteredBalitas.filter(
    (b) => calculateAge(b.tanggalLahir).totalMonths > 12,
  );

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-background">
            Data Balita & Bayi
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Manajemen rekapitulasi data imunisasi dan grafik perkembangan
            Balita.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined">add</span>
          <span>Tambah Anggota Balita</span>
        </Button>
      </div>

      {loadError && (
        <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl">
          {loadError}
        </div>
      )}

      {/* Global Search */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
          search
        </span>
        <Input
          placeholder="Cari nama balita atau nomor KK..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12"
        />
      </div>

      {isLoading ? (
        <div className="text-center text-sm text-on-surface-variant py-12">
          Memuat data...
        </div>
      ) : (
        <>
          <BalitaTable
            title="Data Bayi (0-12 Bulan)"
            icon="child_care"
            iconBgClass="bg-tertiary-fixed"
            list={bayiList}
            currentPage={currentPageBayi}
            onPageChange={setCurrentPageBayi}
            emptyMessage="Tidak ada data bayi ditemukan"
          />

          <BalitaTable
            title="Data Balita (1-5 Tahun)"
            icon="accessibility_new"
            iconBgClass="bg-secondary-container"
            list={balitaList}
            currentPage={currentPageBalita}
            onPageChange={setCurrentPageBalita}
            showLockBadge
            emptyMessage="Tidak ada data balita ditemukan"
          />
        </>
      )}

      <TambahBalitaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        kks={kks}
        onSuccess={(newBalita) => setBalitas((prev) => [...prev, newBalita])}
      />
    </div>
  );
}
