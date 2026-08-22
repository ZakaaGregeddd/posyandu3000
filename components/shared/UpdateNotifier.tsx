"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";

export default function UpdateNotifier() {
  const [showModal, setShowModal] = useState(false);
  const [updateInfo, setUpdateInfo] = useState<any>(null);
  const [downloading, setDownloading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDownloaded, setIsDownloaded] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined" || !window.electronAPI) return;

    // Listen for update available
    const unsubscribeUpdate = window.electronAPI.onUpdateAvailable((info) => {
      setUpdateInfo(info);
      setShowModal(true);
    });

    // Listen for download progress
    const unsubscribeProgress = window.electronAPI.onDownloadProgress((progressObj) => {
      setDownloading(true);
      if (progressObj && typeof progressObj.percent === "number") {
        setProgress(Math.round(progressObj.percent));
      }
    });

    // Listen for update downloaded
    const unsubscribeDownloaded = window.electronAPI.onUpdateDownloaded(() => {
      setDownloading(false);
      setIsDownloaded(true);
    });

    return () => {
      if (unsubscribeUpdate) unsubscribeUpdate();
      if (unsubscribeProgress) unsubscribeProgress();
      if (unsubscribeDownloaded) unsubscribeDownloaded();
    };
  }, []);

  const handleStartDownload = async () => {
    if (window.electronAPI && window.electronAPI.startDownload) {
      setDownloading(true);
      try {
        await window.electronAPI.startDownload();
      } catch (err) {
        console.error("Gagal memulai unduhan:", err);
        setDownloading(false);
      }
    }
  };

  const handleInstall = async () => {
    if (window.electronAPI && window.electronAPI.quitAndInstall) {
      try {
        await window.electronAPI.quitAndInstall();
      } catch (err) {
        console.error("Gagal memasang pembaruan:", err);
      }
    }
  };

  if (!showModal) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-in fade-in duration-300">
      <div className="w-full max-w-md bg-white border border-outline-variant/30 shadow-2xl rounded-2xl p-6 md:p-8 animate-in fade-in zoom-in duration-300 flex flex-col items-center text-center relative overflow-hidden">
        
        {/* Decorative background pulse */}
        <div className="absolute w-[200px] h-[200px] rounded-full bg-tertiary/10 blur-[50px] -top-10 -right-10 pointer-events-none" />

        {/* Icon */}
        <div className="w-16 h-16 bg-tertiary/10 rounded-2xl flex items-center justify-center text-tertiary mb-5">
          <span className="material-symbols-outlined text-[36px] animate-pulse">
            {isDownloaded ? "system_update" : "cloud_download"}
          </span>
        </div>

        {/* Header */}
        <h3 className="font-headline text-lg font-bold text-on-surface mb-2">
          {isDownloaded
            ? "Pembaruan Siap Dipasang!"
            : downloading
            ? "Mengunduh Pembaruan..."
            : "Pembaruan Aplikasi Tersedia"}
        </h3>
        
        <p className="text-xs text-on-surface-variant leading-relaxed mb-6 max-w-sm">
          {isDownloaded
            ? `Versi terbaru (${updateInfo?.version || ""}) telah sukses diunduh. Mulai ulang aplikasi sekarang untuk memasang.`
            : downloading
            ? `Sedang mengunduh versi terbaru (${updateInfo?.version || ""}). Mohon jangan tutup aplikasi.`
            : `Versi baru (${updateInfo?.version || ""}) telah tersedia. Apakah Anda ingin mengunduh pembaruan sekarang?`}
        </p>

        {/* Download Progress Bar */}
        {downloading && (
          <div className="w-full space-y-2 mb-6">
            <div className="flex justify-between items-center text-[10px] font-bold text-outline">
              <span>PROGRESS</span>
              <span>{progress}%</span>
            </div>
            <div className="w-full h-2 bg-slate-100 rounded-full overflow-hidden relative">
              <div 
                className="absolute top-0 left-0 h-full bg-tertiary rounded-full transition-all duration-300 ease-out"
                style={{ width: `${progress}%` }}
              />
            </div>
          </div>
        )}

        {/* Actions */}
        <div className="flex gap-3 w-full justify-end mt-2">
          {!downloading && !isDownloaded && (
            <>
              <Button
                variant="ghost"
                onClick={() => setShowModal(false)}
                className="font-bold text-xs"
              >
                Nanti Saja
              </Button>
              <Button
                onClick={handleStartDownload}
                className="flex-1 font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-2"
              >
                <span className="material-symbols-outlined text-sm">download</span>
                <span>Unduh Sekarang</span>
              </Button>
            </>
          )}

          {downloading && (
            <div className="w-full text-center text-xs text-outline font-semibold animate-pulse py-2">
              Mengunduh berkas pembaruan...
            </div>
          )}

          {isDownloaded && (
            <Button
              onClick={handleInstall}
              className="w-full font-bold text-xs cursor-pointer shadow-md flex items-center justify-center gap-2 py-5"
            >
              <span className="material-symbols-outlined text-sm">restart_alt</span>
              <span>Mulai Ulang & Pasang</span>
            </Button>
          )}
        </div>
      </div>
    </div>
  );
}
