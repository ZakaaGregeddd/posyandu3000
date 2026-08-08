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

  const [noKk, setNoKk] = useState("");
  const [alamat, setAlamat] = useState("");
  const [rt, setRt] = useState("");
  const [rw, setRw] = useState("");
  const [noTelp, setNoTelp] = useState("");

  useEffect(() => {
    if (isOpen) {
      setNoKk(kk.noKk || "");
      setAlamat(kk.alamat || "");
      setRt(kk.rt || "");
      setRw(kk.rw || "");
      setNoTelp(kk.noTelp || "");
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

    if (noKk.length !== 16) {
      setFormError("Nomor KK harus tepat 16 digit");
      return;
    }

    setIsSubmitting(true);

    try {
      const updated = await updateKK({
        id: kk.id,
        noKk,
        alamat,
        rt,
        rw,
        noTelp,
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
          <DialogTitle>Edit Data Keluarga</DialogTitle>
          <DialogDescription>
            Perbarui nomor kartu keluarga, alamat, RT/RW, dan kontak keluarga.
          </DialogDescription>
        </DialogHeader>

        <DialogContent className="space-y-4 py-4">
          {formError && (
            <div className="text-xs font-semibold text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
              {formError}
            </div>
          )}

          <div className="space-y-3">
            <div className="space-y-1.5">
              <div className="flex justify-between items-center">
                <Label htmlFor="edit_no_kk">Nomor Kartu Keluarga (KK)</Label>
                <span className={`text-[10px] font-semibold ${noKk.length === 16 ? "text-teal-600 font-bold" : "text-on-surface-variant/80"}`}>
                  {noKk.length} / 16 digit
                </span>
              </div>
              <Input
                id="edit_no_kk"
                value={noKk}
                placeholder="16 digit nomor KK"
                onChange={(e) => handleNumericInput(e.target.value, 16, setNoKk)}
                required
              />
            </div>

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
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_telp">No. Telepon / WA Keluarga</Label>
              <Input
                id="edit_telp"
                value={noTelp}
                placeholder="Contoh: 081234567890"
                onChange={(e) => handleNumericInput(e.target.value, 13, setNoTelp)}
              />
            </div>
          </div>
        </DialogContent>

        <DialogFooter className="pt-2 border-t border-outline-variant/10">
          <Button type="button" variant="outline" onClick={onClose} disabled={isSubmitting}>
            Batal
          </Button>
          <Button type="submit" disabled={isSubmitting} className="bg-tertiary hover:bg-tertiary/90 text-white font-bold">
            {isSubmitting ? "Menyimpan..." : "Simpan Perubahan"}
          </Button>
        </DialogFooter>
      </form>
    </Dialog>
  );
}
