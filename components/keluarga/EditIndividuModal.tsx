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
import { updateIndividu, Individu } from "@/lib/fetch/individu";
import { KKMember } from "@/lib/fetch/keluarga";

interface EditIndividuModalProps {
  isOpen: boolean;
  onClose: () => void;
  member: KKMember;
  onSuccess: (updated: Individu) => void;
}

export default function EditIndividuModal({
  isOpen,
  onClose,
  member,
  onSuccess,
}: EditIndividuModalProps) {
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [formError, setFormError] = useState("");

  const [nik, setNik] = useState("");
  const [nama, setNama] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"L" | "P">("L");
  const [statusHidup, setStatusHidup] = useState<"Hidup" | "Meninggal">("Hidup");
  const [tanggalMeninggal, setTanggalMeninggal] = useState("");
  const [keteranganMeninggal, setKeteranganMeninggal] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNik(member.nik || "");
      setNama(member.nama || "");
      setTempatLahir(member.tempatLahir || "");
      setTanggalLahir(member.tanggalLahir || "");
      setJenisKelamin(member.jenisKelamin || "L");
      setStatusHidup(member.statusHidup || "Hidup");
      setTanggalMeninggal((member as any).tanggalMeninggal || "");
      setKeteranganMeninggal((member as any).keteranganMeninggal || "");
      setFormError("");
    }
  }, [isOpen, member]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (nik && nik.length !== 16) {
      setFormError("NIK harus tepat 16 digit");
      return;
    }
    if (!nama.trim()) {
      setFormError("Nama wajib diisi");
      return;
    }
    if (!tanggalLahir) {
      setFormError("Tanggal lahir wajib diisi");
      return;
    }
    if (statusHidup === "Meninggal" && !tanggalMeninggal) {
      setFormError("Tanggal meninggal wajib diisi jika status Meninggal");
      return;
    }

    setIsSubmitting(true);
    try {
      const updated = await updateIndividu({
        id: member.id, // UUID
        nik: nik || undefined,
        nama,
        tempatLahir,
        tanggalLahir,
        jenisKelamin,
        statusHidup,
        tanggalMeninggal: statusHidup === "Meninggal" ? tanggalMeninggal : null,
        keteranganMeninggal: statusHidup === "Meninggal" ? keteranganMeninggal : null,
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
      <form onSubmit={handleSubmit} className="flex flex-col max-h-[85vh] overflow-hidden">
        <DialogHeader>
          <DialogTitle>Edit Data Anggota</DialogTitle>
          <DialogDescription>
            Perbarui data identitas anggota keluarga untuk {member.nama}.
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4 py-4">
          {formError && (
            <div className="text-xs font-semibold text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {formError}
            </div>
          )}

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div className="md:col-span-2 space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="ind_nik">NIK</Label>
                <span className={`text-[10px] font-semibold ${nik.length === 16 ? "text-teal-600 font-bold" : "text-on-surface-variant/80"}`}>
                  {nik.length} / 16 digit
                </span>
              </div>
              <Input
                id="ind_nik"
                value={nik}
                placeholder="16 digit NIK (opsional)"
                onChange={(e) => setNik(e.target.value.replace(/[^0-9]/g, "").substring(0, 16))}
              />
            </div>

            <div className="md:col-span-2 space-y-1.5">
              <Label htmlFor="ind_nama">Nama Lengkap</Label>
              <Input
                id="ind_nama"
                value={nama}
                onChange={(e) => setNama(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ind_tempat_lahir">Tempat Lahir</Label>
              <Input
                id="ind_tempat_lahir"
                value={tempatLahir}
                onChange={(e) => setTempatLahir(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ind_tanggal_lahir">Tanggal Lahir</Label>
              <Input
                id="ind_tanggal_lahir"
                type="date"
                value={tanggalLahir}
                onChange={(e) => setTanggalLahir(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ind_jk">Jenis Kelamin</Label>
              <select
                id="ind_jk"
                value={jenisKelamin}
                onChange={(e) => setJenisKelamin(e.target.value as "L" | "P")}
                className="w-full h-10 rounded-lg border border-outline-variant/40 px-3 text-sm bg-white"
              >
                <option value="L">Laki-laki</option>
                <option value="P">Perempuan</option>
              </select>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="ind_status">Status</Label>
              <select
                id="ind_status"
                value={statusHidup}
                onChange={(e) => setStatusHidup(e.target.value as "Hidup" | "Meninggal")}
                className="w-full h-10 rounded-lg border border-outline-variant/40 px-3 text-sm bg-white"
              >
                <option value="Hidup">Hidup</option>
                <option value="Meninggal">Meninggal</option>
              </select>
            </div>
          </div>

          {statusHidup === "Meninggal" && (
            <div className="space-y-3 p-4 rounded-xl bg-slate-50/50 border border-outline-variant/30">
              <h4 className="text-sm font-bold text-red-600">Data Kematian</h4>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="ind_tgl_meninggal">Tanggal Meninggal</Label>
                  <Input
                    id="ind_tgl_meninggal"
                    type="date"
                    value={tanggalMeninggal}
                    onChange={(e) => setTanggalMeninggal(e.target.value)}
                    required
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="ind_ket_meninggal">Keterangan</Label>
                  <Input
                    id="ind_ket_meninggal"
                    value={keteranganMeninggal}
                    onChange={(e) => setKeteranganMeninggal(e.target.value)}
                  />
                </div>
              </div>
            </div>
          )}
        </DialogContent>

        <DialogFooter className="pt-2 border-t border-outline-variant/10">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-primary hover:bg-primary/90 text-white font-bold">
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
