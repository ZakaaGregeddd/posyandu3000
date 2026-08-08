"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { KKOption } from "@/lib/fetch/balita";

interface TambahBalitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  kks: KKOption[];
  onSuccess?: (newBalita: any) => void;
}

export default function TambahBalitaModal({
  isOpen,
  onClose,
  kks,
}: TambahBalitaModalProps) {
  const router = useRouter();
  const [stage, setStage] = useState<1 | 2>(1);
  const [selectedKk, setSelectedKk] = useState("");
  const [isOpenKkDropdown, setIsOpenKkDropdown] = useState(false);
  const [kkSearchQuery, setKkSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  const handleClose = () => {
    setStage(1);
    setSelectedKk("");
    setIsOpenKkDropdown(false);
    setKkSearchQuery("");
    onClose();
  };

  const handleNoKk = () => {
    handleClose();
    router.push("/dashboard/tambah-kk");
  };

  const handleConfirmKk = () => {
    if (!selectedKk) return;
    handleClose();
    router.push(`/dashboard/tambah-kk?prefillKk=${selectedKk}`);
  };

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenKkDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

  const filteredKks = kks.filter((k) => {
    const query = kkSearchQuery.toLowerCase();
    return (
      k.noKk.toLowerCase().includes(query) ||
      (k.namaAyah || "").toLowerCase().includes(query) ||
      (k.namaIbu || "").toLowerCase().includes(query)
    );
  });

  return (
    <Dialog isOpen={isOpen} onClose={handleClose}>
      <DialogHeader>
        <DialogTitle className="text-center font-headline text-lg font-bold">
          Tambah Anggota Balita
        </DialogTitle>
        <DialogDescription className="text-center mt-1">
          {stage === 1 
            ? "Apakah Anda ingin menggunakan data Kartu Keluarga (KK) yang sudah terdaftar?"
            : "Silakan pilih nomor Kartu Keluarga (KK) yang ingin digunakan."}
        </DialogDescription>
      </DialogHeader>

      <DialogContent className={`py-4 transition-all duration-300 ${stage === 2 ? "min-h-[420px]" : ""}`}>
        {stage === 2 && (
          <div className="space-y-2 relative" ref={dropdownRef}>
            <Label>Pilih Nomor KK</Label>
            
            {/* Custom Select Button */}
            <button
              type="button"
              onClick={() => setIsOpenKkDropdown(!isOpenKkDropdown)}
              className="w-full min-h-[58px] rounded-xl border border-outline-variant/40 px-4 py-2.5 text-left bg-white shadow-sm flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all focus:outline-none"
            >
              {selectedKk ? (
                (() => {
                  const selectedObj = kks.find((k) => k.noKk === selectedKk);
                  return (
                    <div className="flex flex-col gap-0.5">
                      <span className="font-headline font-bold text-sm text-on-surface">
                        No. KK: {selectedKk}
                      </span>
                      <span className="text-xs text-on-surface-variant">
                        Ayah: {selectedObj?.namaAyah || "-"} | Ibu: {selectedObj?.namaIbu || "-"}
                      </span>
                    </div>
                  );
                })()
              ) : (
                <span className="text-sm text-on-surface-variant/70">
                  -- Pilih Nomor KK --
                </span>
              )}
              <span className="material-symbols-outlined text-on-surface-variant">
                {isOpenKkDropdown ? "keyboard_arrow_up" : "keyboard_arrow_down"}
              </span>
            </button>

            {/* Dropdown Menu Card */}
            {isOpenKkDropdown && (
              <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[320px]">
                {/* Search Box */}
                <div className="p-2 border-b border-outline-variant/10 bg-slate-50/80">
                  <input
                    type="text"
                    placeholder="Cari Nomor KK, nama Ayah atau Ibu..."
                    value={kkSearchQuery}
                    onChange={(e) => setKkSearchQuery(e.target.value)}
                    className="w-full h-9 rounded-lg border border-outline-variant/40 px-3 text-xs bg-white focus:outline-none focus:border-primary"
                  />
                </div>

                {/* KK Items List */}
                <div className="overflow-y-auto flex-1 divide-y divide-outline-variant/10">
                  {filteredKks.length > 0 ? (
                    filteredKks.map((k) => (
                      <button
                        key={k.noKk}
                        type="button"
                        onClick={() => {
                          setSelectedKk(k.noKk);
                          setIsOpenKkDropdown(false);
                          setKkSearchQuery("");
                        }}
                        className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex flex-col gap-1 ${
                          selectedKk === k.noKk ? "bg-primary/5 hover:bg-primary/10" : ""
                        }`}
                      >
                        <div className="flex justify-between items-center">
                          <span className="font-bold text-xs text-primary">
                            {k.noKk}
                          </span>
                          {k.rt && k.rw && (
                            <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-on-surface-variant font-semibold">
                              RT {k.rt} / RW {k.rw}
                            </span>
                          )}
                        </div>
                        <div className="text-[11px] text-on-surface-variant flex flex-wrap gap-x-2">
                          <span>👨 Ayah: <strong className="text-on-surface">{k.namaAyah || "-"}</strong></span>
                          <span className="text-slate-300">|</span>
                          <span>👩 Ibu: <strong className="text-on-surface">{k.namaIbu || "-"}</strong></span>
                        </div>
                      </button>
                    ))
                  ) : (
                    <div className="p-4 text-center text-xs text-on-surface-variant/80">
                      Tidak ada KK yang cocok
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}
      </DialogContent>

      <DialogFooter className="sm:justify-center gap-2 pt-2 border-t border-outline-variant/10">
        {stage === 1 ? (
          <>
            <Button
              onClick={handleNoKk}
              variant="outline"
              className="w-full sm:w-auto font-semibold"
            >
              Tidak, saya ingin KK baru
            </Button>
            <Button
              onClick={() => setStage(2)}
              className="w-full sm:w-auto font-bold bg-primary hover:bg-primary/95 text-white"
            >
              Ya, Gunakan data KK yang ada
            </Button>
          </>
        ) : (
          <>
            <Button
              onClick={() => setStage(1)}
              variant="outline"
              className="w-full sm:w-auto font-semibold"
            >
              Kembali
            </Button>
            <Button
              onClick={handleConfirmKk}
              disabled={!selectedKk}
              className="w-full sm:w-auto font-bold bg-tertiary hover:bg-tertiary/95 text-white"
            >
              Konfirmasi
            </Button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}
