"use client";

import React, { useState, useEffect } from "react";
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
import { updateKK, KK } from "@/lib/fetch/keluarga";

interface EditKKModalProps {
  isOpen: boolean;
  onClose: () => void;
  kk: KK;
  onSuccess: (updated: KK) => void;
}

export default function EditKKModal({
  isOpen,
  onClose,
  kk,
  onSuccess,
}: EditKKModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [alamat, setAlamat] = useState("");
  const [rt, setRt] = useState("");
  const [rw, setRw] = useState("");
  const [noTelp, setNoTelp] = useState("");

  const [nikAyah, setNikAyah] = useState("");
  const [namaAyah, setNamaAyah] = useState("");
  const [tempatLahirAyah, setTempatLahirAyah] = useState("");
  const [tanggalLahirAyah, setTanggalLahirAyah] = useState("");

  const [nikIbu, setNikIbu] = useState("");
  const [namaIbu, setNamaIbu] = useState("");
  const [tempatLahirIbu, setTempatLahirIbu] = useState("");
  const [tanggalLahirIbu, setTanggalLahirIbu] = useState("");

  // Isi ulang form dengan data KK terbaru tiap kali modal dibuka
  useEffect(() => {
    if (isOpen) {
      setAlamat(kk.alamat || "");
      setRt(kk.rt || "");
      setRw(kk.rw || "");
      setNoTelp(kk.noTelp || "");
      setNikAyah(kk.nikAyah || "");
      setNamaAyah(kk.namaAyah || "");
      setTempatLahirAyah(kk.tempatLahirAyah || "");
      setTanggalLahirAyah(kk.tanggalLahirAyah || "");
      setNikIbu(kk.nikIbu || "");
      setNamaIbu(kk.namaIbu || "");
      setTempatLahirIbu(kk.tempatLahirIbu || "");
      setTanggalLahirIbu(kk.tanggalLahirIbu || "");
      setFormError("");
    }
  }, [isOpen, kk]);

  const handleNumericInput = (
    val: string,
    maxLength: number,
    setter: (v: string) => void,
  ) => {
    setter(val.replace(/[^0-9]/g, "").substring(0, maxLength));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (namaAyah && !tanggalLahirAyah) {
      setFormError("Tanggal lahir Ayah wajib diisi kalau nama Ayah diisi");
      return;
    }
    if (namaIbu && !tanggalLahirIbu) {
      setFormError("Tanggal lahir Ibu wajib diisi kalau nama Ibu diisi");
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await updateKK({
        noKk: kk.noKk,
        alamat,
        rt,
        rw,
        noTelp,
        nikAyah: nikAyah || undefined,
        namaAyah: namaAyah || undefined,
        tempatLahirAyah: tempatLahirAyah || undefined,
        tanggalLahirAyah: tanggalLahirAyah || undefined,
        nikIbu: nikIbu || undefined,
        namaIbu: namaIbu || undefined,
        tempatLahirIbu: tempatLahirIbu || undefined,
        tanggalLahirIbu: tanggalLahirIbu || undefined,
      });

      onSuccess(updated);
      onClose();
    } catch (err: any) {
      setFormError(err.message || "Gagal menyimpan perubahan");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog isOpen={isOpen} onClose={onClose}>
      <form
        onSubmit={handleSubmit}
        className="flex flex-col max-h-[85vh] overflow-hidden"
      >
        <DialogHeader>
          <DialogTitle>Edit Data Keluarga</DialogTitle>
          <DialogDescription>
            Perbarui alamat, kontak, atau biodata Ayah/Ibu untuk KK {kk.noKk}.
            Nomor KK & NIK yang sudah ada tidak bisa diubah di sini.
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-5">
          {formError && (
            <div className="text-xs font-semibold text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {formError}
            </div>
          )}

          {/* Alamat & Kontak */}
          <div className="space-y-3">
            <h4 className="text-sm font-bold text-tertiary">Alamat & Kontak</h4>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-3">
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="edit_alamat">Alamat</Label>
                <Input
                  id="edit_alamat"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit_rt">RT</Label>
                <Input
                  id="edit_rt"
                  value={rt}
                  onChange={(e) => handleNumericInput(e.target.value, 3, setRt)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit_rw">RW</Label>
                <Input
                  id="edit_rw"
                  value={rw}
                  onChange={(e) => handleNumericInput(e.target.value, 3, setRw)}
                />
              </div>
              <div className="md:col-span-4 space-y-1.5">
                <Label htmlFor="edit_telp">No. Telepon Keluarga</Label>
                <Input
                  id="edit_telp"
                  value={noTelp}
                  onChange={(e) =>
                    handleNumericInput(e.target.value, 13, setNoTelp)
                  }
                />
              </div>
            </div>
          </div>

          {/* Data Ayah */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50/50 border border-outline-variant/30">
            <h4 className="text-sm font-bold text-sky-600">Data Ayah</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit_nik_ayah">
                  NIK Ayah{" "}
                  {kk.nikAyah && (
                    <span className="text-[10px] font-normal text-on-surface-variant">
                      (tidak bisa diubah)
                    </span>
                  )}
                </Label>
                <Input
                  id="edit_nik_ayah"
                  value={nikAyah}
                  disabled={!!kk.nikAyah}
                  placeholder="16 digit NIK (opsional)"
                  onChange={(e) =>
                    handleNumericInput(e.target.value, 16, setNikAyah)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit_nama_ayah">Nama Ayah</Label>
                <Input
                  id="edit_nama_ayah"
                  value={namaAyah}
                  onChange={(e) => setNamaAyah(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit_tempat_ayah">Tempat Lahir</Label>
                <Input
                  id="edit_tempat_ayah"
                  value={tempatLahirAyah}
                  onChange={(e) => setTempatLahirAyah(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit_tgl_ayah">Tanggal Lahir</Label>
                <Input
                  id="edit_tgl_ayah"
                  type="date"
                  value={tanggalLahirAyah}
                  onChange={(e) => setTanggalLahirAyah(e.target.value)}
                />
              </div>
            </div>
          </div>

          {/* Data Ibu */}
          <div className="space-y-3 p-4 rounded-xl bg-slate-50/50 border border-outline-variant/30">
            <h4 className="text-sm font-bold text-pink-600">Data Ibu</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit_nik_ibu">
                  NIK Ibu{" "}
                  {kk.nikIbu && (
                    <span className="text-[10px] font-normal text-on-surface-variant">
                      (tidak bisa diubah)
                    </span>
                  )}
                </Label>
                <Input
                  id="edit_nik_ibu"
                  value={nikIbu}
                  disabled={!!kk.nikIbu}
                  placeholder="16 digit NIK (opsional)"
                  onChange={(e) =>
                    handleNumericInput(e.target.value, 16, setNikIbu)
                  }
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit_nama_ibu">Nama Ibu</Label>
                <Input
                  id="edit_nama_ibu"
                  value={namaIbu}
                  onChange={(e) => setNamaIbu(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit_tempat_ibu">Tempat Lahir</Label>
                <Input
                  id="edit_tempat_ibu"
                  value={tempatLahirIbu}
                  onChange={(e) => setTempatLahirIbu(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="edit_tgl_ibu">Tanggal Lahir</Label>
                <Input
                  id="edit_tgl_ibu"
                  type="date"
                  value={tanggalLahirIbu}
                  onChange={(e) => setTanggalLahirIbu(e.target.value)}
                />
              </div>
            </div>
          </div>
        </DialogContent>

        <DialogFooter>
          <Button type="button" variant="outline" onClick={onClose}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting}>
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
