"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "@/components/ui/dialog";

export default function PengaturanPage() {
  const [isExporting, setIsExporting] = useState(false);
  const [isImporting, setIsImporting] = useState(false);
  const [isResetting, setIsResetting] = useState(false);
  const [isConfirmResetOpen, setIsConfirmResetOpen] = useState(false);
  const [confirmText, setConfirmText] = useState("");
  const [passwordInput, setPasswordInput] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [message, setMessage] = useState<{ text: string; type: "success" | "error" } | null>(null);
  const [dbPath, setDbPath] = useState("Memuat lokasi database...");

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.getDatabasePath) {
      window.electronAPI.getDatabasePath().then((path) => {
        setDbPath(path);
      });
    } else {
      setDbPath("LocalStorage Browser (Mode Demo/Web)");
    }
  }, []);

  const handleExport = async () => {
    setIsExporting(true);
    setMessage(null);
    try {
      if (window.electronAPI && window.electronAPI.exportDatabase) {
        const res = await window.electronAPI.exportDatabase();
        if (res.success) {
          setMessage({ text: res.message, type: "success" });
        } else {
          setMessage({ text: res.message, type: "error" });
        }
      } else {
        setMessage({ text: "Fitur ekspor database hanya tersedia di aplikasi desktop.", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal mengekspor database.", type: "error" });
    } finally {
      setIsExporting(false);
    }
  };

  const handleImport = async () => {
    setIsImporting(true);
    setMessage(null);
    try {
      if (window.electronAPI && window.electronAPI.importDatabase) {
        const res = await window.electronAPI.importDatabase();
        if (res.success) {
          setMessage({ text: res.message, type: "success" });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setMessage({ text: res.message, type: "error" });
        }
      } else {
        setMessage({ text: "Fitur gabung database hanya tersedia di aplikasi desktop.", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal menggabungkan database.", type: "error" });
    } finally {
      setIsImporting(false);
    }
  };

  const handleReset = async () => {
    // Verify password
    const storedPassword = localStorage.getItem("offline_user_password");
    if (storedPassword && passwordInput !== storedPassword) {
      setPasswordError("Password akun salah!");
      return;
    }

    setIsResetting(true);
    setIsConfirmResetOpen(false);
    setMessage(null);
    try {
      if (window.electronAPI && window.electronAPI.resetDatabase) {
        const res = await window.electronAPI.resetDatabase();
        if (res.success) {
          setMessage({ text: res.message, type: "success" });
          setTimeout(() => {
            window.location.reload();
          }, 1500);
        } else {
          setMessage({ text: res.message, type: "error" });
        }
      } else {
        setMessage({ text: "Fitur reset database hanya tersedia di aplikasi desktop.", type: "error" });
      }
    } catch (err: any) {
      setMessage({ text: err.message || "Gagal mengosongkan database.", type: "error" });
    } finally {
      setIsResetting(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="font-headline text-3xl font-bold text-on-background">
          Pengaturan Aplikasi
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Kelola pencadangan, sinkronisasi data antar perangkat, dan pemeliharaan database Posyandu secara mandiri.
        </p>
      </div>

      <div className="bg-[#FFFDFE] border border-outline-variant/30 rounded-2xl p-5 shadow-[0px_4px_20px_rgba(0,0,0,0.02)] flex flex-col gap-2">
        <span className="text-xs font-bold text-outline uppercase tracking-wider">Lokasi File Database SQLite Aktif:</span>
        <span className="font-mono text-xs text-on-surface break-all bg-slate-50 border border-outline-variant/20 p-3.5 rounded-xl shadow-inner select-all">
          {dbPath}
        </span>
      </div>

      {message && (
        <div
          className={`p-4 rounded-2xl border text-sm font-semibold transition-all duration-300 ${
            message.type === "success"
              ? "bg-green-50 border-green-200 text-green-800"
              : "bg-red-50 border-red-200 text-red-800"
          }`}
        >
          {message.text}
        </div>
      )}

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Card Backup */}
        <Card className="border border-outline-variant/20 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] bg-white overflow-hidden flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-tertiary">cloud_download</span>
              <h3 className="font-headline text-lg font-bold text-on-surface">Ekspor Database (Backup)</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Mencadangkan seluruh data Posyandu (Data Balita, Lansia, Ibu Hamil, dan Tanda Terima Manfaat) ke dalam sebuah berkas database `.db`. Simpan berkas ini di tempat yang aman sebagai cadangan sewaktu-waktu.
            </p>
          </CardContent>
          <div className="p-6 pt-0">
            <Button
              onClick={handleExport}
              variant="outline"
              disabled={isExporting || isImporting || isResetting}
              className="w-full !border-tertiary !text-tertiary !bg-white hover:!bg-tertiary hover:!text-white font-bold flex items-center justify-center gap-2 cursor-pointer py-5 border-2 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-sm">download</span>
              <span>{isExporting ? "Sedang Mengekspor..." : "Ekspor Database Sekarang"}</span>
            </Button>
          </div>
        </Card>

        {/* Card Merge / Import */}
        <Card className="border border-outline-variant/20 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] bg-white overflow-hidden flex flex-col justify-between">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-tertiary">merge_type</span>
              <h3 className="font-headline text-lg font-bold text-on-surface">Gabungkan Data (Import & Merge)</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Mengambil berkas database dari perangkat lain dan <strong>menggabungkannya</strong> dengan database saat ini. Data lama Anda <strong>TIDAK AKAN HILANG</strong>. Jika ada data yang persis sama, entri tersebut akan dilewati secara otomatis untuk menghindari duplikasi.
            </p>
          </CardContent>
          <div className="p-6 pt-0">
            <Button
              onClick={handleImport}
              disabled={isExporting || isImporting || isResetting}
              variant="outline"
              className="w-full !border-tertiary !text-tertiary !bg-white hover:!bg-tertiary hover:!text-white font-bold flex items-center justify-center gap-2 cursor-pointer py-5 border-2 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-sm">upload</span>
              <span>{isImporting ? "Sedang Menggabungkan..." : "Pilih Berkas & Gabungkan"}</span>
            </Button>
          </div>
        </Card>

        {/* Card Reset Database */}
        <Card className="border border-red-100 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] bg-red-50/10 overflow-hidden flex flex-col justify-between md:col-span-2">
          <CardContent className="p-6 space-y-4">
            <div className="flex items-center gap-3">
              <span className="material-symbols-outlined text-3xl text-error">delete_forever</span>
              <h3 className="font-headline text-lg font-bold text-error">Pengosongan Database (Reset)</h3>
            </div>
            <p className="text-xs text-on-surface-variant leading-relaxed">
              Menghapus seluruh catatan dan data transaksi dari aplikasi. Tindakan ini akan mengembalikan database ke keadaan kosong seperti pertama kali dipasang. <strong>Seluruh data akan terhapus secara permanen.</strong> Pastikan Anda telah mengekspor database sebelum melakukan tindakan ini.
            </p>
          </CardContent>
          <div className="p-6 pt-0">
            <Button
              onClick={() => {
                setConfirmText("");
                setPasswordInput("");
                setPasswordError("");
                setShowPassword(false);
                setIsConfirmResetOpen(true);
              }}
              variant="outline"
              disabled={isExporting || isImporting || isResetting}
              className="w-full !border-red-600 !text-red-600 !bg-white hover:!bg-red-600 hover:!text-white font-bold flex items-center justify-center gap-2 cursor-pointer py-5 border-2 transition-all duration-200"
            >
              <span className="material-symbols-outlined text-sm">warning</span>
              <span>Kosongkan Database Aplikasi</span>
            </Button>
          </div>
        </Card>
      </div>

      {/* Dialog Konfirmasi Reset */}
      {isConfirmResetOpen && (
        <Dialog isOpen={isConfirmResetOpen} onClose={() => setIsConfirmResetOpen(false)}>
          <DialogHeader>
            <DialogTitle className="text-center font-headline text-lg font-bold text-error">
              Konfirmasi Reset Database
            </DialogTitle>
            <DialogDescription className="text-center mt-1 text-sm text-on-surface-variant">
              Tindakan ini akan menghapus <strong>SELURUH</strong> data keluarga, anggota posyandu, riwayat pemeriksaan, dan tanda terima bantuan.
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="py-4 space-y-4">
            <div className="bg-red-50 text-red-800 text-xs font-semibold p-4 rounded-xl border border-red-200 leading-relaxed text-center">
              Apakah Anda yakin ingin melanjutkan? Tindakan ini tidak dapat dibatalkan secara otomatis kecuali jika Anda memiliki berkas backup eksternal.
            </div>
            
            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant block">
                Ketik <span className="text-error font-extrabold">"Hapus Database"</span> untuk mengonfirmasi tindakan:
              </label>
              <Input
                placeholder="Hapus Database"
                value={confirmText}
                onChange={(e) => setConfirmText(e.target.value)}
                className="w-full border-outline-variant/40"
              />
            </div>

            <div className="space-y-2">
              <label className="text-xs font-bold text-on-surface-variant block">
                Masukkan Password Akun Anda:
              </label>
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Password akun"
                  value={passwordInput}
                  onChange={(e) => {
                    setPasswordInput(e.target.value);
                    setPasswordError("");
                  }}
                  className={`w-full pr-12 border-outline-variant/40 ${passwordError ? "border-red-500 focus-visible:ring-red-500" : ""}`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline-variant hover:text-outline transition-colors cursor-pointer text-on-surface-variant"
                >
                  <span className="material-symbols-outlined text-[20px]">
                    {showPassword ? "visibility_off" : "visibility"}
                  </span>
                </button>
              </div>
              {passwordError && (
                <p className="text-[10px] font-semibold text-red-600">{passwordError}</p>
              )}
            </div>
          </DialogContent>

          <DialogFooter className="flex flex-row justify-end gap-3 w-full">
            <Button
              variant="ghost"
              onClick={() => setIsConfirmResetOpen(false)}
              disabled={isResetting}
              className="font-bold"
            >
              Batal
            </Button>
            <Button
              onClick={handleReset}
              disabled={isResetting || confirmText !== "Hapus Database" || !passwordInput}
              className="bg-error text-white hover:bg-error/90 font-bold"
            >
              {isResetting ? "Mereset..." : "Ya, Hapus Semua Data"}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
