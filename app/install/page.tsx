"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";

export default function InstallWizardPage() {
  const router = useRouter();
  const [step, setStep] = useState(1);
  const [defaultDbPath, setDefaultDbPath] = useState("Memuat lokasi default...");
  const [selectedFolder, setSelectedFolder] = useState<string | null>(null);
  
  // Account Form States
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Check if already installed
    if (typeof window !== "undefined") {
      const isInstalled = localStorage.getItem("posyandu_installed");
      if (isInstalled === "true") {
        router.replace("/dashboard");
        return;
      }

      // Fetch default db path from main process if available
      if (window.electronAPI && window.electronAPI.getDatabasePath) {
        window.electronAPI.getDatabasePath().then((path) => {
          setDefaultDbPath(path);
        });
      } else {
        setDefaultDbPath("LocalStorage Browser (Mode Demo/Web)");
      }
    }
  }, [router]);

  const handleSelectFolder = async () => {
    if (window.electronAPI && window.electronAPI.selectDirectory) {
      setError("");
      try {
        const folder = await window.electronAPI.selectDirectory();
        if (folder) {
          setSelectedFolder(folder);
        }
      } catch (err: any) {
        setError("Gagal memilih direktori.");
      }
    } else {
      setError("Fitur pemilihan direktori hanya tersedia di aplikasi desktop.");
    }
  };

  const handleNextStep = () => {
    setError("");
    if (step === 2) {
      // Step 2 validation (optional, default path is always valid)
      setStep(3);
    } else {
      setStep(step + 1);
    }
  };

  const handlePrevStep = () => {
    setError("");
    setStep(step - 1);
  };

  const handleFinishSetup = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    // Step 3 validation
    if (!email) {
      setError("Email atau Username wajib diisi");
      return;
    }
    if (!password) {
      setError("Kata sandi wajib diisi");
      return;
    }
    if (password.length < 6) {
      setError("Kata sandi minimal harus 6 karakter");
      return;
    }
    if (password !== confirmPassword) {
      setError("Konfirmasi kata sandi tidak cocok");
      return;
    }

    setLoading(true);

    try {
      // 1. Set custom database path if selected
      if (selectedFolder && window.electronAPI && window.electronAPI.setDatabasePath) {
        const resPath = await window.electronAPI.setDatabasePath(selectedFolder);
        if (!resPath.success) {
          throw new Error(resPath.message || "Gagal mengatur lokasi database");
        }
      } else if (window.electronAPI && window.electronAPI.resetDatabase) {
        // Ensure a clean database even if using default location
        await window.electronAPI.resetDatabase();
      }

      // 2. Set credentials in LocalStorage
      const user = {
        id: "offline-kader-id",
        email: email.includes("@") ? email : `${email}@posyandu.com`,
      };
      
      localStorage.setItem("offline_user", JSON.stringify(user));
      localStorage.setItem("offline_user_password", password);
      localStorage.setItem("posyandu_installed", "true");

      // Redirect to Dashboard
      router.push("/dashboard");
    } catch (err: any) {
      setError(err.message || "Terjadi kesalahan saat menyelesaikan konfigurasi.");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center font-sans overflow-hidden relative bg-pattern p-4">
      {/* Decorative Atmospheric Blur Circles */}
      <div className="absolute w-[400px] h-[400px] rounded-full bg-tertiary-fixed/30 blur-[100px] -top-24 -left-24 animate-pulse duration-[8000ms]" />
      <div className="absolute w-[400px] h-[400px] rounded-full bg-surface-container-high/30 blur-[100px] bottom-0 right-0 animate-pulse duration-[6000ms] delay-1000" />

      {/* SVG Distorted Mesh Ribbon Background */}
      <div className="absolute inset-0 pointer-events-none opacity-85 z-0 overflow-hidden flex items-center justify-center">
        <svg
          className="w-full h-[85%] min-h-[550px]"
          xmlns="http://www.w3.org/2000/svg"
          preserveAspectRatio="none"
          viewBox="0 0 1440 600"
        >
          <defs>
            <linearGradient id="ribbon-grad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ab2c5d" stopOpacity="0.05" />
              <stop offset="25%" stopColor="#ab2c5d" stopOpacity="0.85" />
              <stop offset="50%" stopColor="#6b5a60" stopOpacity="0.5" />
              <stop offset="75%" stopColor="#ab2c5d" stopOpacity="0.85" />
              <stop offset="100%" stopColor="#f4dce4" stopOpacity="0.05" />
            </linearGradient>
          </defs>
          <g stroke="url(#ribbon-grad)" strokeWidth="2.4" fill="none">
            {Array.from({ length: 15 }).map((_, i) => {
              const offset = i * 10;
              const delay = i * -0.3;
              const opacity = 0.25 + (i % 4) * 0.2;
              return (
                <path
                  key={i}
                  d={`M -50,${250 + offset} 
                      C 250,${50 + i * 6} 550,${450 - i * 10} 800,${250 + i * 4} 
                      C 1050,${50 + i * 10} 1250,${450 - i * 6} 1490,${200 + offset}`}
                  strokeOpacity={opacity}
                  className="animate-ribbon-wave"
                  style={{
                    animationDelay: `${delay}s`,
                    animationDuration: `${12 + (i % 3) * 3}s`,
                  }}
                />
              );
            })}
          </g>
        </svg>
      </div>

      {/* Main Container */}
      <main className="w-full max-w-2xl bg-white/95 backdrop-blur-md border border-outline-variant/30 shadow-xl rounded-2xl overflow-hidden p-8 md:p-12 animate-in fade-in zoom-in duration-300 relative z-10">
        
        {/* Logo / Header */}
        <div className="flex flex-col items-center text-center mb-8">
          <div className="w-14 h-14 bg-tertiary rounded-2xl flex items-center justify-center shadow-md mb-3">
            <span
              className="material-symbols-outlined text-white text-3xl animate-heartbeat"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              volunteer_activism
            </span>
          </div>
          <h1 className="font-headline text-2xl font-extrabold text-on-surface tracking-tight">
            Konfigurasi Awal Aplikasi
          </h1>
          <p className="text-sm text-on-surface-variant mt-1">
            Langkah mudah memulai Posyandu3000 Digital
          </p>
        </div>

        {/* Steps Progress Indicator */}
        <div className="flex items-center justify-center mb-10 max-w-md mx-auto">
          <div className="flex items-center w-full relative justify-between">
            <div className="absolute top-1/2 left-0 right-0 h-0.5 bg-outline-variant/30 -translate-y-1/2 z-0" />
            <div 
              className="absolute top-1/2 left-0 h-0.5 bg-tertiary -translate-y-1/2 z-0 transition-all duration-300"
              style={{ width: `${((step - 1) / 2) * 100}%` }}
            />

            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-xs relative z-10 transition-all duration-300 ${
                  s < step
                    ? "bg-tertiary text-white"
                    : s === step
                    ? "bg-tertiary text-white ring-4 ring-tertiary-fixed"
                    : "bg-white border-2 border-outline-variant/60 text-on-surface-variant"
                }`}
              >
                {s < step ? (
                  <span className="material-symbols-outlined text-sm font-bold">check</span>
                ) : (
                  s
                )}
              </div>
            ))}
          </div>
        </div>

        {error && (
          <div className="mb-6 text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl animate-in fade-in duration-200">
            {error}
          </div>
        )}

        {/* Step 1: Welcome Screen */}
        {step === 1 && (
          <div className="space-y-6 text-center animate-in fade-in duration-300">
            <h2 className="font-headline text-lg font-bold text-on-surface">
              Selamat Datang di Portal Kader Posyandu3000!
            </h2>
            <p className="text-sm text-on-surface-variant leading-relaxed max-w-lg mx-auto">
              Aplikasi ini dirancang untuk mempermudah kader dalam mencatat data keluarga, balita, ibu hamil, serta lansia secara digital, cepat, dan aman.
            </p>
            <div className="p-4 bg-secondary-container/20 border border-secondary-fixed-dim/30 rounded-2xl text-left max-w-lg mx-auto flex items-start gap-3">
              <span className="material-symbols-outlined text-tertiary mt-0.5">info</span>
              <p className="text-xs text-on-secondary-fixed-variant leading-relaxed">
                Aplikasi menyimpan seluruh data Anda secara lokal pada komputer ini. Anda tetap dapat mengoperasikan aplikasi dan menginput data pemeriksaan meskipun tanpa koneksi internet.
              </p>
            </div>
            <div className="pt-4">
              <Button
                onClick={handleNextStep}
                className="px-8 cursor-pointer flex items-center justify-center gap-2 mx-auto hover:scale-[1.01]"
              >
                <span>Mulai Konfigurasi</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step 2: Storage Directory Picker */}
        {step === 2 && (
          <div className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
                Pilih Lokasi Penyimpanan Database
              </h2>
              <p className="text-xs text-on-surface-variant leading-relaxed">
                Tentukan di folder mana file database aplikasi (`posyandu.db`) akan disimpan. Anda bisa menaruhnya di Drive sistem, Harddisk eksternal, atau folder khusus pilihan Anda agar mudah dicadangkan.
              </p>
            </div>

            <div className="space-y-4">
              <div className="p-4 rounded-xl border border-outline-variant/40 bg-slate-50/50 space-y-2">
                <span className="text-[10px] font-bold uppercase tracking-wider text-outline">
                  Lokasi Aktif Saat Ini:
                </span>
                <div className="font-mono text-xs text-on-surface break-all bg-white p-3 rounded-lg border border-outline-variant/20 shadow-inner">
                  {selectedFolder ? `${selectedFolder}\\posyandu.db` : defaultDbPath}
                </div>
              </div>

              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleSelectFolder}
                  className="flex-1 !border-tertiary !text-tertiary hover:!bg-tertiary hover:!text-white font-bold flex items-center justify-center gap-2 cursor-pointer transition-all duration-200 py-6"
                >
                  <span className="material-symbols-outlined text-[20px]">folder_open</span>
                  <span>Pilih Folder Penyimpanan Lain</span>
                </Button>
              </div>

              {selectedFolder && (
                <div className="bg-green-50 text-green-800 text-[11px] font-semibold p-3.5 rounded-xl border border-green-200 flex items-center gap-2">
                  <span className="material-symbols-outlined text-sm">check_circle</span>
                  <span>Folder kustom berhasil dipilih. Database bersih akan dibuat di lokasi tersebut.</span>
                </div>
              )}
            </div>

            <div className="flex justify-between pt-4 gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePrevStep}
                className="font-bold cursor-pointer"
              >
                Kembali
              </Button>
              <Button
                type="button"
                onClick={handleNextStep}
                className="px-6 cursor-pointer flex items-center gap-2 font-bold hover:scale-[1.01]"
              >
                <span>Lanjutkan</span>
                <span className="material-symbols-outlined text-sm">arrow_forward</span>
              </Button>
            </div>
          </div>
        )}

        {/* Step 3: Account Credentials */}
        {step === 3 && (
          <form onSubmit={handleFinishSetup} className="space-y-6 animate-in fade-in duration-300">
            <div>
              <h2 className="font-headline text-lg font-bold text-on-surface mb-2">
                Buat Akun Kader Utama
              </h2>
              <p className="text-xs text-on-surface-variant">
                Buat akun pengguna yang akan digunakan untuk masuk ke dashboard aplikasi Posyandu3000 pada komputer ini.
              </p>
            </div>

            <div className="space-y-4">
              <div className="space-y-1.5">
                <Label htmlFor="email">Email atau Username</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[20px]">person</span>
                  </div>
                  <Input
                    id="email"
                    type="text"
                    placeholder="Contoh: kader_posyandu / mawar@gmail.com"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="pl-11"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="password">Kata Sandi (Min. 6 Karakter)</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[20px]">lock</span>
                  </div>
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="pl-11 pr-12"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute inset-y-0 right-0 pr-4 flex items-center text-outline-variant hover:text-outline cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-[20px]">
                      {showPassword ? "visibility_off" : "visibility"}
                    </span>
                  </button>
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="confirmPassword">Konfirmasi Kata Sandi</Label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none text-outline">
                    <span className="material-symbols-outlined text-[20px]">check_circle</span>
                  </div>
                  <Input
                    id="confirmPassword"
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={confirmPassword}
                    onChange={(e) => setConfirmPassword(e.target.value)}
                    className="pl-11"
                  />
                </div>
              </div>
            </div>

            <div className="flex justify-between pt-4 gap-4">
              <Button
                type="button"
                variant="ghost"
                onClick={handlePrevStep}
                disabled={loading}
                className="font-bold cursor-pointer"
              >
                Kembali
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="px-6 cursor-pointer flex items-center justify-center gap-2 font-bold shadow-md hover:scale-[1.01]"
              >
                {loading ? (
                  <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                ) : (
                  <>
                    <span>Selesaikan Setup</span>
                    <span className="material-symbols-outlined text-sm">done_all</span>
                  </>
                )}
              </Button>
            </div>
          </form>
        )}
      </main>

      {/* Direct inline style injection to bypass bundler CSS caching */}
      <style>{`
        .animate-ribbon-wave {
          animation: ribbon-flow-new 15s infinite linear;
          stroke-dasharray: 4 16;
          stroke-linecap: round;
        }

        @keyframes ribbon-flow-new {
          0% {
            stroke-dashoffset: 0;
            transform: translateY(0) skewY(-0.5deg);
          }
          50% {
            transform: translateY(-8px) skewY(0.5deg);
          }
          100% {
            stroke-dashoffset: -200;
            transform: translateY(0) skewY(-0.5deg);
          }
        }
      `}</style>
    </div>
  );
}
