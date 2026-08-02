"use client";

import React, { useState } from "react";
import { StatusHidup } from "@/lib/data/types";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "../ui/dialog";
import { Button } from "../ui/button";
import { Label } from "../ui/label";
import { Input } from "../ui/input";

interface StatusHidupControlProps {
  currentStatus: StatusHidup;
  tanggalMeninggal?: string;
  penyebabMeninggal?: string;
  // Boleh sync (void) atau async (Promise<void>) - kalau async, komponen ini
  // akan menunggu selesai dulu sebelum menutup modal & menampilkan loading.
  onStatusChange: (
    status: StatusHidup,
    tanggal?: string,
    penyebab?: string,
  ) => void | Promise<void>;
  disabled?: boolean;
}

type ModalMode = "edit" | "confirmRevert";

export default function StatusHidupControl({
  currentStatus,
  tanggalMeninggal,
  penyebabMeninggal,
  onStatusChange,
  disabled = false,
}: StatusHidupControlProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [mode, setMode] = useState<ModalMode>("edit");
  const [deathDate, setDeathDate] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [cause, setCause] = useState("");
  const [validationError, setValidationError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const isEditingExisting = currentStatus === "Meninggal";

  const openModal = () => {
    if (disabled) return;
    // Pre-fill dari data yang sudah ada supaya tidak perlu ketik ulang saat
    // hanya mau mengoreksi tanggal/penyebab.
    setDeathDate(
      tanggalMeninggal
        ? tanggalMeninggal.split("T")[0]
        : new Date().toISOString().split("T")[0],
    );
    setCause(penyebabMeninggal || "");
    setValidationError("");
    setMode("edit");
    setIsModalOpen(true);
  };

  const closeModal = () => {
    if (isSubmitting) return;
    setIsModalOpen(false);
    setMode("edit");
    setValidationError("");
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!deathDate) {
      setValidationError("Tanggal meninggal harus diisi");
      return;
    }
    if (!cause.trim()) {
      setValidationError("Penyebab meninggal harus diisi");
      return;
    }

    setValidationError("");
    setIsSubmitting(true);
    try {
      await onStatusChange("Meninggal", deathDate, cause);
      setIsModalOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleConfirmRevert = async () => {
    setIsSubmitting(true);
    try {
      await onStatusChange("Hidup");
      setIsModalOpen(false);
      setMode("edit");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-on-surface-variant">
          Status Hidup:
        </span>
        <button
          type="button"
          onClick={openModal}
          disabled={disabled}
          title="Klik untuk mengubah status hidup"
          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            currentStatus === "Hidup"
              ? "bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 hover:border-teal-300"
              : "bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300"
          }`}
        >
          <span
            className={`w-2.5 h-2.5 rounded-full ${currentStatus === "Hidup" ? "bg-teal-500" : "bg-red-500"}`}
          />
          {currentStatus}
        </button>
      </div>

      {currentStatus === "Meninggal" &&
        (tanggalMeninggal || penyebabMeninggal) && (
          <div className="text-xs bg-red-50/70 border border-red-100 text-red-800 rounded-xl p-3 max-w-sm mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
            <div className="flex items-start justify-between gap-2 mb-0.5">
              <p className="font-semibold">Detail Kematian:</p>
              <button
                type="button"
                onClick={openModal}
                disabled={disabled}
                title="Edit detail kematian"
                className="text-red-600 hover:text-red-800 hover:bg-red-100 rounded-md p-0.5 -m-0.5 transition-colors cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed shrink-0"
              >
                <span className="material-symbols-outlined text-sm block">
                  edit
                </span>
              </button>
            </div>
            {tanggalMeninggal && (
              <p>
                <span className="font-medium text-red-600">Tanggal:</span>{" "}
                {new Date(tanggalMeninggal).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
            )}
            {penyebabMeninggal && (
              <p>
                <span className="font-medium text-red-600">Penyebab:</span>{" "}
                {penyebabMeninggal}
              </p>
            )}
          </div>
        )}

      {/* Modal Kelola Status Kematian */}
      <Dialog isOpen={isModalOpen} onClose={closeModal}>
        {mode === "edit" ? (
          <form
            onSubmit={handleSubmit}
            className="flex flex-col max-h-[85vh] overflow-hidden"
          >
            <DialogHeader>
              <DialogTitle className="text-red-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-red-600">
                  warning
                </span>
                {isEditingExisting
                  ? "Edit Detail Kematian"
                  : "Ubah Status Kematian"}
              </DialogTitle>
              <DialogDescription>
                {isEditingExisting
                  ? "Perbarui tanggal atau penyebab kematian anggota ini bila ada kesalahan input sebelumnya."
                  : "Silakan masukkan tanggal dan penyebab kematian anggota ini. Tindakan ini akan membekukan riwayat pemeriksaan selanjutnya."}
              </DialogDescription>
            </DialogHeader>

            <DialogContent className="space-y-4">
              {validationError && (
                <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                  {validationError}
                </div>
              )}
              <div className="space-y-1.5">
                <Label htmlFor="deathDate">Tanggal Meninggal</Label>
                <Input
                  id="deathDate"
                  type="date"
                  value={deathDate}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setDeathDate(e.target.value)}
                  disabled={isSubmitting}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="cause">Penyebab Meninggal</Label>
                <textarea
                  id="cause"
                  value={cause}
                  rows={3}
                  placeholder="Contoh: Sakit DBD, Usia lanjut, dll."
                  disabled={isSubmitting}
                  className="flex w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background placeholder:text-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none"
                  onChange={(e) => setCause(e.target.value)}
                />
              </div>

              {isEditingExisting && (
                <button
                  type="button"
                  onClick={() => setMode("confirmRevert")}
                  disabled={isSubmitting}
                  className="text-xs font-semibold text-teal-700 hover:text-teal-800 hover:underline cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  Bukan meninggal? Kembalikan status jadi Hidup
                </button>
              )}
            </DialogContent>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={closeModal}
                disabled={isSubmitting}
              >
                Batal
              </Button>
              <Button
                type="submit"
                variant="destructive"
                disabled={isSubmitting}
              >
                {isSubmitting
                  ? "Menyimpan..."
                  : isEditingExisting
                    ? "Simpan Perubahan"
                    : "Simpan & Nonaktifkan"}
              </Button>
            </DialogFooter>
          </form>
        ) : (
          <div className="flex flex-col max-h-[85vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle className="text-teal-700 flex items-center gap-2">
                <span className="material-symbols-outlined text-teal-600">
                  favorite
                </span>
                Kembalikan ke Status Hidup?
              </DialogTitle>
              <DialogDescription>
                Data tanggal dan penyebab kematian yang tersimpan akan dihapus,
                dan riwayat entri pemeriksaan untuk anggota ini akan aktif
                kembali. Tindakan ini tidak membatalkan riwayat pemeriksaan yang
                sudah ada.
              </DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setMode("edit")}
                disabled={isSubmitting}
              >
                Kembali
              </Button>
              <Button
                type="button"
                onClick={handleConfirmRevert}
                disabled={isSubmitting}
                className="bg-teal-600 hover:bg-teal-700 text-white"
              >
                {isSubmitting ? "Menyimpan..." : "Ya, Kembalikan ke Hidup"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>
    </div>
  );
}
