"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { getActiveMembers, addPenerimaManfaat, ActiveMemberOption } from "@/lib/fetch/penerima-manfaat";

export default function TambahPenerimaManfaatPage() {
  const router = useRouter();
  const [members, setMembers] = useState<ActiveMemberOption[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Form states
  const [selectedKk, setSelectedKk] = useState("");
  const [selectedNik, setSelectedNik] = useState("");
  const [selectedMember, setSelectedMember] = useState<ActiveMemberOption | null>(null);
  const [tanggalDiterima, setTanggalDiterima] = useState(() => {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, "0");
    const dd = String(today.getDate()).padStart(2, "0");
    return `${yyyy}-${mm}-${dd}`;
  });
  const [keterangan, setKeterangan] = useState("");
  const [fotoBukti, setFotoBukti] = useState("");

  // Photo mode: "none" | "upload" | "camera"
  const [photoMode, setPhotoMode] = useState<"none" | "upload" | "camera">("none");
  const [isDragActive, setIsDragActive] = useState(false);

  // Webcam states
  const videoRef = useRef<HTMLVideoElement | null>(null);
  const [stream, setStream] = useState<MediaStream | null>(null);
  const [cameraError, setCameraError] = useState("");
  const [devices, setDevices] = useState<MediaDeviceInfo[]>([]);
  const [selectedDeviceId, setSelectedDeviceId] = useState("");

  // Load active members for dropdowns
  useEffect(() => {
    getActiveMembers()
      .then((data) => setMembers(data))
      .catch((err) => console.error("Failed to load members list", err));
  }, []);

  // Clean up camera stream on close
  useEffect(() => {
    return () => {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
    };
  }, [stream]);

  // Filter unique KKs from members list
  const uniqueKks = Array.from(new Set(members.map((m) => m.noKk))).sort();

  // Filter NIKs based on selected KK
  const filteredNiks = members.filter((m) => m.noKk === selectedKk);

  // Handle KK Change
  const handleKkChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSelectedKk(e.target.value);
    setSelectedNik("");
    setSelectedMember(null);
  };

  // Handle NIK Change
  const handleNikChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const nik = e.target.value;
    setSelectedNik(nik);
    const found = members.find((m) => m.noKk === selectedKk && m.nik === nik);
    setSelectedMember(found || null);
  };

  // Camera activation
  const startCamera = async (deviceId?: string) => {
    setPhotoMode("camera");
    setCameraError("");
    setFotoBukti("");
    try {
      if (stream) {
        stream.getTracks().forEach((track) => track.stop());
      }
      
      let mediaStream: MediaStream;
      try {
        const constraints: MediaStreamConstraints = {
          video: deviceId 
            ? { deviceId: { exact: deviceId }, width: { ideal: 640 }, height: { ideal: 480 } } 
            : { width: { ideal: 640 }, height: { ideal: 480 } }
        };
        mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
      } catch (firstErr) {
        console.warn("First camera constraint failed, retrying with fallback 1...", firstErr);
        try {
          // Fallback 1: use specific deviceId without resolution limits
          const constraints: MediaStreamConstraints = {
            video: deviceId ? { deviceId } : true
          };
          mediaStream = await navigator.mediaDevices.getUserMedia(constraints);
        } catch (secondErr) {
          console.warn("Fallback 1 failed, retrying with fallback 2...", secondErr);
          // Fallback 2: absolute minimum (any video)
          mediaStream = await navigator.mediaDevices.getUserMedia({ video: true });
        }
      }

      setStream(mediaStream);
      if (videoRef.current) {
        videoRef.current.srcObject = mediaStream;
      }

      // Enumerate camera devices
      const allDevices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = allDevices.filter((d) => d.kind === "videoinput");
      setDevices(videoDevices);

      // Save active device ID
      if (!deviceId && videoDevices.length > 0) {
        const activeTrack = mediaStream.getVideoTracks()[0];
        const activeSettings = activeTrack?.getSettings();
        if (activeSettings?.deviceId) {
          setSelectedDeviceId(activeSettings.deviceId);
        } else {
          setSelectedDeviceId(videoDevices[0].deviceId);
        }
      }
    } catch (err: any) {
      console.error("Camera access error:", err);
      setCameraError("Tidak dapat mengakses kamera. Pastikan izin kamera telah diberikan.");
      setPhotoMode("none");
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach((track) => track.stop());
      setStream(null);
    }
  };

  const handleCameraChange = async (e: React.ChangeEvent<HTMLSelectElement>) => {
    const newDeviceId = e.target.value;
    setSelectedDeviceId(newDeviceId);
    if (newDeviceId) {
      await startCamera(newDeviceId);
    }
  };

  const capturePhoto = () => {
    if (videoRef.current) {
      const canvas = document.createElement("canvas");
      canvas.width = videoRef.current.videoWidth || 640;
      canvas.height = videoRef.current.videoHeight || 480;
      const ctx = canvas.getContext("2d");
      if (ctx) {
        ctx.drawImage(videoRef.current, 0, 0, canvas.width, canvas.height);
        const dataUrl = canvas.toDataURL("image/jpeg", 0.8);
        setFotoBukti(dataUrl);
        stopCamera();
        setPhotoMode("none");
      }
    }
  };

  // File Upload Drag and Drop handlers
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (e.type === "dragenter" || e.type === "dragover") {
      setIsDragActive(true);
    } else if (e.type === "dragleave") {
      setIsDragActive(false);
    }
  };

  const processFile = (file: File) => {
    if (!file.type.startsWith("image/")) {
      setError("Hanya file gambar yang diperbolehkan");
      return;
    }
    const reader = new FileReader();
    reader.onload = (e) => {
      if (e.target?.result) {
        setFotoBukti(e.target.result as string);
        setError("");
      }
    };
    reader.readAsDataURL(file);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setIsDragActive(false);
    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      processFile(e.target.files[0]);
    }
  };

  // Handle Save
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (!selectedMember) {
      setError("Silakan pilih KK dan NIK penerima manfaat");
      return;
    }
    if (!tanggalDiterima) {
      setError("Silakan isi tanggal penerimaan");
      return;
    }
    if (!keterangan.trim()) {
      setError("Silakan isi rincian/keterangan barang yang diterima");
      return;
    }
    if (!fotoBukti) {
      setError("Silakan ambil foto bukti penyerahan atau unggah file");
      return;
    }

    setLoading(true);
    try {
      await addPenerimaManfaat({
        individuId: selectedMember.id,
        tanggalDiterima,
        keterangan,
        fotoBukti,
      });
      router.push("/dashboard/penerima-manfaat");
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan data tanda terima");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      {/* Header and Back Button */}
      <div className="flex flex-col gap-2">
        <button
          onClick={() => {
            stopCamera();
            router.push("/dashboard/penerima-manfaat");
          }}
          className="flex items-center gap-1.5 text-xs font-semibold text-tertiary hover:underline self-start cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">arrow_back</span>
          <span>Kembali ke Daftar Penerima</span>
        </button>
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-background">
            Catat Tanda Terima Baru
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Input bukti fisik penyerahan bantuan kepada member aktif Posyandu.
          </p>
        </div>
      </div>

      <Card className="border border-outline-variant/20 shadow-md bg-white p-6 rounded-2xl">
        <CardContent className="p-0">
          <form onSubmit={handleSave} className="space-y-6">
            {error && (
              <div className="p-3 text-xs bg-error-container text-error rounded-xl border border-error/20 flex items-center gap-2">
                <span className="material-symbols-outlined text-sm">error</span>
                <span>{error}</span>
              </div>
            )}

            {/* Row KK & NIK */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="kk-select">Nomor KK Terdaftar</Label>
                <select
                  id="kk-select"
                  value={selectedKk}
                  onChange={handleKkChange}
                  className="w-full h-11 rounded-xl border border-outline-variant/40 px-3 bg-white text-sm focus:border-tertiary outline-none transition"
                >
                  <option value="">-- Pilih KK --</option>
                  {uniqueKks.map((kk) => (
                    <option key={kk} value={kk}>
                      {kk}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="nik-select">NIK Penerima</Label>
                <select
                  id="nik-select"
                  value={selectedNik}
                  onChange={handleNikChange}
                  disabled={!selectedKk}
                  className="w-full h-11 rounded-xl border border-outline-variant/40 px-3 bg-white text-sm focus:border-tertiary outline-none transition disabled:bg-surface-variant/30"
                >
                  <option value="">-- Pilih NIK --</option>
                  {filteredNiks.map((m) => (
                    <option key={m.nik} value={m.nik}>
                      {m.nik} - {m.nama}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* Nama Penerima (Auto-linked info card) */}
            {selectedMember && (
              <div className="p-4 bg-tertiary-container/30 border border-tertiary/10 rounded-2xl flex items-center justify-between">
                <div className="flex flex-col">
                  <span className="text-[10px] text-tertiary font-bold tracking-wider uppercase">Nama Penerima</span>
                  <span className="text-base font-bold text-on-surface">{selectedMember.nama}</span>
                </div>
                <div className="flex flex-col text-right">
                  <span className="text-[10px] text-tertiary font-bold tracking-wider uppercase">Status KK</span>
                  <span className="text-sm text-on-surface-variant font-medium">No. KK: {selectedMember.noKk}</span>
                </div>
              </div>
            )}

            {/* Tanggal & Keterangan */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="space-y-1.5 md:col-span-1">
                <Label htmlFor="tanggal">Tanggal Diterima</Label>
                <input
                  id="tanggal"
                  type="date"
                  value={tanggalDiterima}
                  onChange={(e) => setTanggalDiterima(e.target.value)}
                  className="w-full h-11 rounded-xl border border-outline-variant/40 px-3 bg-white text-sm focus:border-tertiary outline-none transition"
                />
              </div>

              <div className="space-y-1.5 md:col-span-2">
                <Label htmlFor="keterangan">Rincian Barang / Catatan Penerimaan</Label>
                <textarea
                  id="keterangan"
                  rows={2}
                  placeholder="Contoh: Bantuan Sembako Beras 5kg & Telur 1 kg, PMT Makanan Bergizi Balita"
                  value={keterangan}
                  onChange={(e) => setKeterangan(e.target.value)}
                  className="w-full min-h-[44px] max-h-[120px] rounded-xl border border-outline-variant/40 p-3 bg-white text-sm focus:border-tertiary outline-none transition resize-y"
                />
              </div>
            </div>

            {/* Foto Bukti Camera/Upload */}
            <div className="space-y-2">
              <Label>Bukti Foto Penyerahan</Label>

              {cameraError && (
                <p className="text-xs text-error font-medium">{cameraError}</p>
              )}

              {/* Preview Image */}
              {fotoBukti && photoMode === "none" && (
                <div className="relative rounded-2xl overflow-hidden border border-outline-variant/40 bg-black/5 flex items-center justify-center max-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img src={fotoBukti} alt="Preview Bukti" className="object-contain max-h-[300px]" />
                  <button
                    type="button"
                    onClick={() => setFotoBukti("")}
                    className="absolute top-3 right-3 bg-error hover:bg-error/95 text-white w-9 h-9 rounded-full flex items-center justify-center cursor-pointer shadow-md"
                  >
                    <span className="material-symbols-outlined text-base">delete</span>
                  </button>
                </div>
              )}

              {/* Webcam Live Capture Container */}
              {photoMode === "camera" && (
                <div className="relative rounded-2xl overflow-hidden border border-outline-variant/60 bg-black flex flex-col items-center">
                  {devices.length > 1 && (
                    <div className="absolute top-3 left-3 z-10 max-w-[240px] shadow-lg">
                      <select
                        value={selectedDeviceId}
                        onChange={handleCameraChange}
                        className="w-full h-9 rounded-xl bg-black/80 text-white text-xs px-3 border border-white/20 focus:outline-none backdrop-blur-sm cursor-pointer font-medium hover:bg-black/90 transition"
                      >
                        {devices.map((device, idx) => (
                          <option key={device.deviceId} value={device.deviceId} className="bg-slate-900 text-white text-xs">
                            {device.label || `Kamera ${idx + 1}`}
                          </option>
                        ))}
                      </select>
                    </div>
                  )}
                  <video ref={videoRef} autoPlay playsInline className="w-full max-h-[320px] object-cover" />
                  <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-3">
                    <button
                      type="button"
                      onClick={capturePhoto}
                      className="h-11 px-5 bg-tertiary hover:bg-tertiary/90 text-white rounded-full flex items-center gap-2 shadow font-bold text-xs cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">photo_camera</span>
                      <span>Ambil Gambar</span>
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        stopCamera();
                        setPhotoMode("none");
                      }}
                      className="h-11 px-5 bg-white hover:bg-slate-100 text-on-surface rounded-full flex items-center gap-2 shadow font-bold text-xs cursor-pointer border border-outline-variant/40"
                    >
                      <span>Batal</span>
                    </button>
                  </div>
                </div>
              )}

              {/* Upload Selector & Drag Drop Zone */}
              {photoMode === "upload" && (
                <div
                  onDragEnter={handleDrag}
                  onDragOver={handleDrag}
                  onDragLeave={handleDrag}
                  onDrop={handleDrop}
                  className={`relative flex flex-col items-center justify-center border-2 border-dashed rounded-2xl p-8 text-center cursor-pointer transition-all duration-300 ${
                    isDragActive
                      ? "border-tertiary bg-tertiary-container/30 scale-[0.98] shadow-inner"
                      : "border-outline-variant/60 hover:border-tertiary bg-white/40"
                  }`}
                >
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleFileChange}
                    className="absolute inset-0 w-full h-full opacity-0 cursor-pointer"
                  />
                  
                  <div className={`transition-all duration-300 flex flex-col items-center ${isDragActive ? "animate-pulse scale-105" : ""}`}>
                    <span className={`material-symbols-outlined text-4xl mb-2 transition-colors duration-300 ${isDragActive ? "text-tertiary" : "text-outline"}`}>
                      cloud_upload
                    </span>
                    <span className="text-sm font-semibold text-on-surface block">
                      {isDragActive ? "Lepaskan file disini!" : "Seret dan Lepaskan Gambar Disini"}
                    </span>
                    <span className="text-xs text-on-surface-variant mt-1 block">
                      atau klik untuk mencari berkas foto dari komputer Anda
                    </span>
                  </div>
                </div>
              )}

              {/* Mode selection buttons */}
              {photoMode === "none" && !fotoBukti && (
                <div className="flex gap-3 w-full">
                  <button
                    type="button"
                    onClick={startCamera}
                    className="flex-1 h-12 bg-white hover:bg-tertiary/10 hover:border-tertiary hover:text-tertiary text-on-surface border border-outline-variant/40 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">photo_camera</span>
                    <span>Gunakan Kamera</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => setPhotoMode("upload")}
                    className="flex-1 h-12 bg-white hover:bg-tertiary/10 hover:border-tertiary hover:text-tertiary text-on-surface border border-outline-variant/40 rounded-xl flex items-center justify-center gap-2 text-sm font-semibold transition cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-base">cloud_upload</span>
                    <span>Unggah File</span>
                  </button>
                </div>
              )}
              
              {/* Show change buttons if file upload zone is active */}
              {photoMode === "upload" && (
                <button
                  type="button"
                  onClick={() => setPhotoMode("none")}
                  className="w-full h-10 bg-slate-50 hover:bg-slate-100 border border-outline-variant/30 rounded-xl text-xs font-semibold cursor-pointer text-center block"
                >
                  Kembali ke Opsi Kamera
                </button>
              )}
            </div>

            {/* Submission buttons */}
            <div className="pt-4 flex w-full justify-end gap-3 border-t border-outline-variant/30">
              <Button
                type="button"
                variant="ghost"
                onClick={() => {
                  stopCamera();
                  router.push("/dashboard/penerima-manfaat");
                }}
                disabled={loading}
              >
                Batal
              </Button>
              <Button
                type="submit"
                disabled={loading}
                className="bg-tertiary text-white hover:bg-tertiary/90 font-bold px-6"
              >
                {loading ? "Menyimpan..." : "Simpan Penerimaan"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
