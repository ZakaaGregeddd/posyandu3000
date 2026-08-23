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
import { getKKs, KKOption } from "@/lib/fetch/balita";
import { registerExistingAsLansia, getEligibleLansiaMembersByKk, KKMemberLansiaOption } from "@/lib/fetch/lansia";

interface TambahLansiaModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

export default function TambahLansiaModal({
  isOpen,
  onClose,
  onSuccess,
}: TambahLansiaModalProps) {
  const router = useRouter();
  const [stage, setStage] = useState<1 | 2>(1);
  const [kks, setKks] = useState<KKOption[]>([]);
  const [selectedKk, setSelectedKk] = useState("");
  const [isOpenKkDropdown, setIsOpenKkDropdown] = useState(false);
  const [kkSearchQuery, setKkSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Members selection states
  const [members, setMembers] = useState<KKMemberLansiaOption[]>([]);
  const [selectedMember, setSelectedMember] = useState("");
  const [isLoadingMembers, setIsLoadingMembers] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  useEffect(() => {
    if (isOpen) {
      getKKs()
        .then((data) => setKks(data))
        .catch((err) => console.error("Failed to load KK list", err));
    }
  }, [isOpen]);

  useEffect(() => {
    if (selectedKk) {
      setIsLoadingMembers(true);
      getEligibleLansiaMembersByKk(selectedKk)
        .then((data) => {
          setMembers(data);
          setSelectedMember("");
          setIsLoadingMembers(false);
        })
        .catch((err) => {
          console.error("Failed to load members", err);
          setIsLoadingMembers(false);
        });
    } else {
      setMembers([]);
      setSelectedMember("");
    }
  }, [selectedKk]);

  const handleClose = () => {
    setStage(1);
    setSelectedKk("");
    setIsOpenKkDropdown(false);
    setKkSearchQuery("");
    setMembers([]);
    setSelectedMember("");
    onClose();
  };

  const handleNoKk = () => {
    handleClose();
    router.push("/dashboard/tambah-kk");
  };

  const handleConfirm = async () => {
    if (!selectedKk) return;
    if (selectedMember) {
      setIsSubmitting(true);
      try {
        await registerExistingAsLansia(selectedMember);
        handleClose();
        if (onSuccess) onSuccess();
      } catch (err) {
        console.error("Gagal mendaftarkan lansia:", err);
      } finally {
        setIsSubmitting(false);
      }
    } else {
      // Fallback: redirect to KK edit page if no member selected
      handleClose();
      router.push(`/dashboard/tambah-kk?prefillKk=${selectedKk}`);
    }
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
          Tambah Data Lansia
        </DialogTitle>
        <DialogDescription className="text-center mt-1">
          {stage === 1 
            ? "Apakah Anda ingin menggunakan data Kartu Keluarga (KK) yang sudah terdaftar?"
            : "Silakan pilih nomor Kartu Keluarga (KK) dan anggota yang ingin dijadikan lansia."}
        </DialogDescription>
      </DialogHeader>

      <DialogContent className={`py-4 transition-all duration-300 ${stage === 2 ? "min-h-[440px]" : ""}`}>
        {stage === 2 && (
          <div className="space-y-4 relative">
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
                <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[220px]">
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
                            <span>Ayah: <strong className="text-on-surface">{k.namaAyah || "-"}</strong></span>
                            <span className="text-slate-300">|</span>
                            <span>Ibu: <strong className="text-on-surface">{k.namaIbu || "-"}</strong></span>
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

            {/* Members Section */}
            {selectedKk && (
              <div className="space-y-2">
                <Label>Pilih Anggota Keluarga yang Lansia</Label>
                {isLoadingMembers ? (
                  <div className="text-center py-4 text-xs text-on-surface-variant animate-pulse">
                    Memuat daftar anggota keluarga...
                  </div>
                ) : members.length === 0 ? (
                  <div className="p-4 rounded-xl border border-dashed border-outline-variant/60 bg-slate-50 text-center space-y-3">
                    <p className="text-xs text-on-surface-variant leading-relaxed">
                      Tidak ditemukan anggota keluarga (usia ≥ 45 tahun) di KK ini yang belum terdaftar sebagai lansia.
                    </p>
                    <Button
                      onClick={() => {
                        handleClose();
                        router.push(`/dashboard/tambah-kk?prefillKk=${selectedKk}`);
                      }}
                      variant="outline"
                      className="text-xs font-bold w-full !border-tertiary !text-tertiary hover:!bg-tertiary hover:!text-white transition-all cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-xs mr-1.5">group_add</span>
                      Tambah Anggota Baru ke KK ini
                    </Button>
                  </div>
                ) : (
                  <div className="grid grid-cols-1 gap-2 max-h-[160px] overflow-y-auto p-1 border border-outline-variant/20 rounded-xl bg-slate-50/50">
                    {members.map((m) => {
                      const ageYears = new Date().getFullYear() - new Date(m.tanggalLahir).getFullYear();
                      return (
                        <button
                          key={m.id}
                          type="button"
                          onClick={() => setSelectedMember(m.id)}
                          className={`w-full px-4 py-2.5 text-left border rounded-xl flex items-center justify-between transition-all cursor-pointer ${
                            selectedMember === m.id
                              ? "bg-tertiary/10 border-tertiary text-tertiary font-bold"
                              : "bg-white border-outline-variant/30 hover:border-slate-400 text-on-surface"
                          }`}
                        >
                          <div className="flex flex-col gap-0.5">
                            <span className="text-xs font-bold">{m.nama}</span>
                            <span className="text-[10px] opacity-80">
                              NIK: {m.nik || "Tidak ada NIK"} | {m.statusKeluarga}
                            </span>
                          </div>
                          <span className="text-[10px] bg-slate-100 border border-outline-variant/20 px-2 py-0.5 rounded-full text-on-surface-variant font-bold">
                            {ageYears} Th
                          </span>
                        </button>
                      );
                    })}
                  </div>
                )}
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
              disabled={isSubmitting}
            >
              Kembali
            </Button>
            <Button
              onClick={handleConfirm}
              disabled={!selectedKk || !selectedMember || isSubmitting}
              className="w-full sm:w-auto font-bold bg-tertiary hover:bg-tertiary/95 text-white flex items-center justify-center gap-1.5"
            >
              {isSubmitting ? (
                <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined text-sm">person_add</span>
                  <span>Tambah Sebagai Lansia</span>
                </>
              )}
            </Button>
          </>
        )}
      </DialogFooter>
    </Dialog>
  );
}
