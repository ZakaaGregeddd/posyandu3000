"use client";

import React, { useState } from "react";
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

  const handleClose = () => {
    setStage(1);
    setSelectedKk("");
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

      <DialogContent className="py-4">
        {stage === 2 && (
          <div className="space-y-2">
            <Label htmlFor="select_kk">Pilih Nomor KK</Label>
            <select
              id="select_kk"
              value={selectedKk}
              onChange={(e) => setSelectedKk(e.target.value)}
              className="w-full h-10 rounded-lg border border-outline-variant/40 px-3 text-sm bg-white"
            >
              <option value="">-- Pilih Nomor KK --</option>
              {kks.map((k) => (
                <option key={k.noKk} value={k.noKk}>
                  {k.noKk} ({k.alamat ? k.alamat.split(" [RT:")[0] : "Alamat Kosong"})
                </option>
              ))}
            </select>
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
