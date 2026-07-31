"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getKKs, deleteKK, getAnggotaCountMap, KK } from "@/lib/fetch/keluarga";

export default function KKTerdaftarPage() {
  const router = useRouter();

  // Data States
  const [kks, setKks] = useState<KK[]>([]);
  const [countMap, setCountMap] = useState<Map<string, number>>(new Map());
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [kkToDelete, setKkToDelete] = useState<KK | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);

  // Load Data
  const loadData = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const [kkData, counts] = await Promise.all([
        getKKs(),
        getAnggotaCountMap(),
      ]);
      setKks(kkData);
      setCountMap(counts);
    } catch (err: any) {
      setLoadError(err.message || "Gagal memuat data");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  // Filtered KK list
  const filteredKKs = kks.filter((kk) => {
    const term = searchTerm.toLowerCase();
    return (
      kk.noKk.toLowerCase().includes(term) ||
      kk.namaKepalaKeluarga.toLowerCase().includes(term) ||
      kk.alamat.toLowerCase().includes(term)
    );
  });

  // Stats
  const totalKK = kks.length;
  const totalJiwa = Array.from(countMap.values()).reduce(
    (acc, n) => acc + n,
    0,
  );

  const getKKMembersCount = (noKk: string) => countMap.get(noKk) ?? 0;

  const handleConfirmDelete = (e: React.MouseEvent, kk: KK) => {
    e.stopPropagation();
    setKkToDelete(kk);
    setIsDeleteOpen(true);
  };

  const handleDelete = async () => {
    if (!kkToDelete) return;
    setIsDeleting(true);
    try {
      await deleteKK(kkToDelete.noKk);
      await loadData();
      setIsDeleteOpen(false);
      setKkToDelete(null);
    } catch (err: any) {
      alert(err.message || "Gagal menghapus KK");
    } finally {
      setIsDeleting(false);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-background">
            KK Terdaftar
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Daftar Kartu Keluarga yang telah terdaftar dalam sistem monitoring
            Posyandu Digital.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/tambah-kk")}
          className="flex items-center gap-2 bg-tertiary hover:bg-tertiary/90 text-white font-bold"
        >
          <span className="material-symbols-outlined text-sm">person_add</span>
          <span>Daftar KK Baru</span>
        </Button>
      </div>

      {loadError && (
        <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl">
          {loadError}
        </div>
      )}

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col justify-between h-32 border border-outline-variant/20 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] bg-white">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm text-on-surface-variant">
              Total KK Terdaftar
            </span>
            <span className="material-symbols-outlined text-tertiary">
              folder_shared
            </span>
          </div>
          <div className="font-headline text-3xl font-extrabold text-on-background">
            {totalKK}
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between h-32 border border-outline-variant/20 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] bg-white">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm text-on-surface-variant">
              Total Jiwa Dipantau
            </span>
            <span className="material-symbols-outlined text-tertiary">
              groups
            </span>
          </div>
          <div className="font-headline text-3xl font-extrabold text-on-background">
            {totalJiwa} Jiwa
          </div>
        </Card>
      </div>

      {/* Search Input & Cards Container */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <Input
            placeholder="Cari No KK, Kepala Keluarga, Alamat..."
            className="pl-9 bg-white border border-outline-variant/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="text-center text-sm text-on-surface-variant py-12">
            Memuat data...
          </div>
        ) : filteredKKs.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center border border-outline-variant/20 text-on-surface-variant">
            Tidak ada data Kartu Keluarga ditemukan.
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredKKs.map((kk) => {
              const mCount = getKKMembersCount(kk.noKk);
              return (
                <div
                  key={kk.noKk}
                  onClick={() =>
                    router.push(`/dashboard/kk-terdaftar/${kk.noKk}`)
                  }
                  className="bg-white p-6 rounded-xl border border-outline-variant/20 hover:border-tertiary/40 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] hover:shadow-md transition-all duration-200 cursor-pointer flex flex-col justify-between group"
                >
                  <div>
                    <div className="flex justify-between items-start mb-4">
                      <div className="space-y-0.5">
                        <span className="text-[10px] uppercase font-bold tracking-wider text-tertiary">
                          KARTU KELUARGA
                        </span>
                        <h4 className="font-headline font-bold text-lg text-on-surface group-hover:text-tertiary transition-colors">
                          {kk.namaKepalaKeluarga}
                        </h4>
                      </div>
                      <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-bold bg-secondary-container text-tertiary">
                        {mCount} Anggota
                      </span>
                    </div>

                    <div className="space-y-2 text-sm border-t border-outline-variant/10 pt-4 mb-6">
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">
                          Nomor KK:
                        </span>
                        <span className="font-mono font-semibold text-on-surface">
                          {kk.noKk}
                        </span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">
                          Wilayah:
                        </span>
                        <span className="font-semibold text-on-surface">
                          RT {kk.rt} / RW {kk.rw}
                        </span>
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-on-surface-variant">Alamat:</span>
                        <span className="text-on-surface line-clamp-1">
                          {kk.alamat}
                        </span>
                      </div>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    <Button
                      variant="outline"
                      className="flex-1 font-bold text-xs"
                      onClick={(e) => {
                        e.stopPropagation();
                        router.push(`/dashboard/kk-terdaftar/${kk.noKk}`);
                      }}
                    >
                      <span className="material-symbols-outlined text-xs mr-1">
                        visibility
                      </span>
                      Detail Keluarga
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-error hover:bg-error-container hover:text-error px-3"
                      onClick={(e) => handleConfirmDelete(e, kk)}
                    >
                      <span className="material-symbols-outlined text-xs">
                        delete
                      </span>
                    </Button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <DialogHeader>
          <div className="w-12 h-12 bg-red-50 text-error rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <DialogTitle className="text-center text-error">
            Hapus Kartu Keluarga?
          </DialogTitle>
          <DialogDescription className="text-center mt-1">
            Apakah Anda yakin ingin menghapus KK {kkToDelete?.noKk} (
            {kkToDelete?.namaKepalaKeluarga})? Semua data anggota keluarga
            (balita, ibu hamil, lansia) di dalamnya akan ikut terhapus. Tindakan
            ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
            Batalkan
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Menghapus..." : "Ya, Hapus Data"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
