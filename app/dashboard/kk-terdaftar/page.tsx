"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getKKs, deleteKK, getBalitas, getIbuHamils, getLansias } from "@/lib/data/db-service";
import { KK, Balita, IbuHamil, Lansia } from "@/lib/data/types";

export default function KKTerdaftarPage() {
  const router = useRouter();

  // Data States
  const [kks, setKks] = useState<KK[]>([]);
  const [balitas, setBalitas] = useState<Balita[]>([]);
  const [ibuHamils, setIbuHamils] = useState<IbuHamil[]>([]);
  const [lansias, setLansias] = useState<Lansia[]>([]);

  // Search & Filter
  const [searchTerm, setSearchTerm] = useState("");

  // Modal States
  const [kkToDelete, setKkToDelete] = useState<KK | null>(null);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Load Data
  const loadData = () => {
    setKks(getKKs());
    setBalitas(getBalitas());
    setIbuHamils(getIbuHamils());
    setLansias(getLansias());
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

  // Calculate stats
  const totalKK = kks.length;
  
  // Total Jiwa = Balita + Ibu Hamil + Lansia registered under those KKs + Parents
  const totalJiwa = kks.reduce((acc, kk) => {
    const bCount = balitas.filter((b) => b.noKk === kk.noKk).length;
    const iCount = ibuHamils.filter((i) => i.noKk === kk.noKk).length;
    const lCount = lansias.filter((l) => l.noKk === kk.noKk).length;
    let parentCount = 0;
    if (kk.namaAyah && !balitas.some(b => b.nama === kk.namaAyah) && !ibuHamils.some(i => i.nama === kk.namaAyah) && !lansias.some(l => l.nama === kk.namaAyah)) {
      parentCount++;
    }
    if (kk.namaIbu && !balitas.some(b => b.nama === kk.namaIbu) && !ibuHamils.some(i => i.nama === kk.namaIbu) && !lansias.some(l => l.nama === kk.namaIbu)) {
      parentCount++;
    }
    return acc + bCount + iCount + lCount + parentCount;
  }, 0);

  // Get members count of a specific KK
  const getKKMembersCount = (noKk: string) => {
    const kk = kks.find((k) => k.noKk === noKk);
    const bCount = balitas.filter((b) => b.noKk === noKk).length;
    const iCount = ibuHamils.filter((i) => i.noKk === noKk).length;
    const lCount = lansias.filter((l) => l.noKk === noKk).length;
    
    let parentCount = 0;
    if (kk?.namaAyah && !balitas.some(b => b.nama === kk.namaAyah) && !ibuHamils.some(i => i.nama === kk.namaAyah) && !lansias.some(l => l.nama === kk.namaAyah)) {
      parentCount++;
    }
    if (kk?.namaIbu && !balitas.some(b => b.nama === kk.namaIbu) && !ibuHamils.some(i => i.nama === kk.namaIbu) && !lansias.some(l => l.nama === kk.namaIbu)) {
      parentCount++;
    }

    return bCount + iCount + lCount + parentCount;
  };

  const handleConfirmDelete = (e: React.MouseEvent, kk: KK) => {
    e.stopPropagation();
    setKkToDelete(kk);
    setIsDeleteOpen(true);
  };

  const handleDelete = () => {
    if (kkToDelete) {
      deleteKK(kkToDelete.noKk);
      loadData();
      setIsDeleteOpen(false);
      setKkToDelete(null);
    }
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-background">KK Terdaftar</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Daftar Kartu Keluarga yang telah terdaftar dalam sistem monitoring Posyandu Digital.
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

      {/* Stats Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <Card className="p-6 flex flex-col justify-between h-32 border border-outline-variant/20 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] bg-white">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm text-on-surface-variant">Total KK Terdaftar</span>
            <span className="material-symbols-outlined text-tertiary">folder_shared</span>
          </div>
          <div className="font-headline text-3xl font-extrabold text-on-background">{totalKK}</div>
        </Card>

        <Card className="p-6 flex flex-col justify-between h-32 border border-outline-variant/20 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] bg-white">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm text-on-surface-variant">Total Jiwa Dipantau</span>
            <span className="material-symbols-outlined text-tertiary">groups</span>
          </div>
          <div className="font-headline text-3xl font-extrabold text-on-background">{totalJiwa} Jiwa</div>
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

        {/* KK Bento List */}
        {filteredKKs.length === 0 ? (
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
                  onClick={() => router.push(`/dashboard/kk-terdaftar/${kk.noKk}`)}
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
                        <span className="text-on-surface-variant">Nomor KK:</span>
                        <span className="font-mono font-semibold text-on-surface">{kk.noKk}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-on-surface-variant">Wilayah:</span>
                        <span className="font-semibold text-on-surface">RT {kk.rt} / RW {kk.rw}</span>
                      </div>
                      <div className="flex flex-col gap-1 mt-1">
                        <span className="text-on-surface-variant">Alamat:</span>
                        <span className="text-on-surface line-clamp-1">{kk.alamat}</span>
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
                      <span className="material-symbols-outlined text-xs mr-1">visibility</span>
                      Detail Keluarga
                    </Button>
                    <Button
                      variant="ghost"
                      className="text-error hover:bg-error-container hover:text-error px-3"
                      onClick={(e) => handleConfirmDelete(e, kk)}
                    >
                      <span className="material-symbols-outlined text-xs">delete</span>
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
          <DialogTitle className="text-center text-error">Hapus Kartu Keluarga?</DialogTitle>
          <DialogDescription className="text-center mt-1">
            Apakah Anda yakin ingin menghapus KK {kkToDelete?.noKk} ({kkToDelete?.namaKepalaKeluarga})? 
            Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
            Batalkan
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Ya, Hapus Data
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
