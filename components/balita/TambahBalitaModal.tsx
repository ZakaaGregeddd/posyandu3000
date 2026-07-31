"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import { addBalita, Balita, KKOption } from "@/lib/fetch/balita";

interface TambahBalitaModalProps {
  isOpen: boolean;
  onClose: () => void;
  kks: KKOption[];
  onSuccess: (newBalita: Balita) => void;
}

export default function TambahBalitaModal({
  isOpen,
  onClose,
  kks,
  onSuccess,
}: TambahBalitaModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [noKk, setNoKk] = useState("");
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"L" | "P">("L");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [golonganDarah, setGolonganDarah] = useState("");
  const [caraLahir, setCaraLahir] = useState<"SC" | "Normal" | "">("");
  const [usiaKehamilanSaatLahir, setUsiaKehamilanSaatLahir] = useState("");
  const [formError, setFormError] = useState("");

  const resetForm = () => {
    setNoKk("");
    setNama("");
    setNik("");
    setJenisKelamin("L");
    setTempatLahir("");
    setTanggalLahir("");
    setGolonganDarah("");
    setCaraLahir("");
    setUsiaKehamilanSaatLahir("");
    setFormError("");
  };

  const handleClose = () => {
    onClose();
    resetForm();
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!noKk || !nama || !tempatLahir || !tanggalLahir) {
      setFormError("Semua field wajib diisi");
      return;
    }

    if (nik && nik.length !== 16) {
      setFormError(
        "NIK harus tepat 16 digit (atau kosongkan dulu jika belum ada)",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const newBalita = await addBalita({
        nama,
        tempatLahir,
        tanggalLahir,
        jenisKelamin,
        noKk,
        statusHidup: "Hidup",
        nik: nik || undefined,
        caraLahir: caraLahir || undefined,
        usiaKehamilanSaatLahirWeeks: usiaKehamilanSaatLahir
          ? parseInt(usiaKehamilanSaatLahir)
          : undefined,
        golonganDarah: golonganDarah || undefined,
      });

      onSuccess(newBalita);
      handleClose();
    } catch (err: any) {
      setFormError(err.message || "Gagal menambahkan anggota");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={handleClose}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col max-h-[85vh] overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle>Tambah Data Balita / Bayi</DialogTitle>
          <DialogDescription>
            Masukkan informasi detail balita baru. Pastikan nomor KK telah
            terdaftar di sistem.
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4">
          {formError && (
            <div className="text-xs font-semibold text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <Label htmlFor="modal_no_kk">Nomor KK</Label>
              <select
                id="modal_no_kk"
                value={noKk}
                onChange={(e) => setNoKk(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all"
                required
              >
                <option value="" className="text-xs md:text-sm bg-white text-on-surface">-- Pilih No KK --</option>
                {kks.map((k) => (
                  <option key={k.noKk} value={k.noKk} className="text-xs md:text-sm bg-white text-on-surface">
                    {k.noKk}
                  </option>
                ))}
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal_nik">NIK</Label>
              <Input
                id="modal_nik"
                placeholder="Masukkan 16 digit NIK"
                value={nik}
                onChange={(e) => {
                  const clean = e.target.value
                    .replace(/[^0-9]/g, "")
                    .substring(0, 16);
                  setNik(clean);
                }}
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="modal_nama">Nama Lengkap</Label>
              <Input
                id="modal_nama"
                placeholder="Nama Lengkap Balita"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal_jk">Jenis Kelamin</Label>
              <select
                id="modal_jk"
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value as "L" | "P")}
                className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all"
              >
                <option value="L" className="text-xs md:text-sm bg-white text-on-surface">Laki-laki</option>
                <option value="P" className="text-xs md:text-sm bg-white text-on-surface">Perempuan</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal_tempat">Tempat Lahir</Label>
              <Input
                id="modal_tempat"
                placeholder="Kota / Kabupaten"
                value={tempatLahir}
                onChange={(e) => setTempatLahir(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal_tanggal">Tanggal Lahir</Label>
              <Input
                id="modal_tanggal"
                type="date"
                value={tanggalLahir}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setTanggalLahir(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal_golongan_darah">
                Golongan Darah (Opsional)
              </Label>
              <select
                id="modal_golongan_darah"
                value={golonganDarah}
                onChange={(e) => setGolonganDarah(e.target.value)}
                className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all"
              >
                <option value="" className="text-xs md:text-sm bg-white text-on-surface">-- Belum diketahui --</option>
                <option value="A" className="text-xs md:text-sm bg-white text-on-surface">A</option>
                <option value="B" className="text-xs md:text-sm bg-white text-on-surface">B</option>
                <option value="AB" className="text-xs md:text-sm bg-white text-on-surface">AB</option>
                <option value="O" className="text-xs md:text-sm bg-white text-on-surface">O</option>
              </select>
            </div>

            <div className="md:col-span-2 text-xs text-on-surface-variant bg-secondary-container/40 rounded-lg px-3 py-2">
              Nama Ayah/Ibu otomatis diambil dari data KK yang dipilih. Pastikan
              KK sudah memiliki data ayah/ibu yang lengkap.
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal_cara_lahir">Cara Lahir (Opsional)</Label>
              <select
                id="modal_cara_lahir"
                value={caraLahir}
                onChange={(e) =>
                  setCaraLahir(e.target.value as "SC" | "Normal" | "")
                }
                className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all"
              >
                <option value="" className="text-xs md:text-sm bg-white text-on-surface">-- Pilih Cara Lahir --</option>
                <option value="Normal" className="text-xs md:text-sm bg-white text-on-surface">Normal</option>
                <option value="SC" className="text-xs md:text-sm bg-white text-on-surface">SC</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="modal_usia_kehamilan">
                Usia Kehamilan (Weeks - Opsional)
              </Label>
              <Input
                id="modal_usia_kehamilan"
                type="number"
                placeholder="Contoh: 38"
                value={usiaKehamilanSaatLahir}
                onChange={(e) => setUsiaKehamilanSaatLahir(e.target.value)}
              />
            </div>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={handleClose}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Data"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
