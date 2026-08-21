"use client";

import React, { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { getBalitas, getBalitaRecordsForNiks } from "@/lib/fetch/balita";
import { getLansias, getLansiaRecordsForNiks } from "@/lib/fetch/lansia";
import { getIbuHamils, getIbuHamilRecordsForIds } from "@/lib/fetch/ibuHamil";
import { getPenerimaManfaatList } from "@/lib/fetch/penerima-manfaat";
import {
  generateBalitaReport,
  generateLansiaReport,
  generateIbuHamilReport,
  generatePenerimaManfaatReport,
} from "@/lib/pdf/laporan";
import type jsPDF from "jspdf";

type Kategori = "balita" | "lansia" | "ibu_hamil" | "penerima_manfaat";

const KATEGORI_OPTIONS: { value: Kategori; label: string; icon: string }[] = [
  { value: "balita", label: "Balita & Bayi", icon: "child_care" },
  { value: "lansia", label: "Lansia", icon: "elderly" },
  { value: "ibu_hamil", label: "Ibu Hamil", icon: "pregnant_woman" },
  { value: "penerima_manfaat", label: "Penerima Manfaat", icon: "featured_seasonal_and_gifts" },
];

export default function LaporanPdfPage() {
  const [kategori, setKategori] = useState<Kategori>("balita");
  const [isGenerating, setIsGenerating] = useState(false);
  const [error, setError] = useState("");
  const [previewUrl, setPreviewUrl] = useState<string | null>(null);
  const [docInstance, setDocInstance] = useState<jsPDF | null>(null);
  const [jumlahData, setJumlahData] = useState<number | null>(null);

  const resetPreview = () => {
    if (previewUrl) URL.revokeObjectURL(previewUrl);
    setPreviewUrl(null);
    setDocInstance(null);
    setJumlahData(null);
  };

  const handlePilihKategori = (value: Kategori) => {
    setKategori(value);
    resetPreview();
  };

  const handleGeneratePreview = async () => {
    setError("");
    setIsGenerating(true);
    resetPreview();

    try {
      let doc: jsPDF;
      let jumlah: number;

      if (kategori === "balita") {
        const data = await getBalitas();
        const records = await getBalitaRecordsForNiks(data.map((b) => b.nik));
        doc = generateBalitaReport(data, records);
        jumlah = data.length;
      } else if (kategori === "lansia") {
        const data = await getLansias();
        const records = await getLansiaRecordsForNiks(data.map((l) => l.nik));
        doc = generateLansiaReport(data, records);
        jumlah = data.length;
      } else if (kategori === "ibu_hamil") {
        const data = await getIbuHamils();
        const records = await getIbuHamilRecordsForIds(data.map((b) => b.id));
        doc = generateIbuHamilReport(data, records);
        jumlah = data.length;
      } else {
        const data = await getPenerimaManfaatList();
        doc = generatePenerimaManfaatReport(data);
        jumlah = data.length;
      }

      const url = doc.output("bloburl") as unknown as string;
      setPreviewUrl(url);
      setDocInstance(doc);
      setJumlahData(jumlah);
    } catch (err: any) {
      setError(err.message || "Gagal membuat laporan PDF");
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = () => {
    if (!docInstance) return;
    const tanggal = new Date().toISOString().split("T")[0];
    const namaFile = `laporan-${kategori}-${tanggal}.pdf`;
    docInstance.save(namaFile);
  };

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="font-headline text-3xl font-bold text-on-background">
          Ekstraksi Laporan PDF
        </h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Buat rekap data anggota dalam format PDF, lihat pratinjau dulu sebelum
          diunduh.
        </p>
      </div>

      <Card className="p-6 space-y-5 bg-white border border-outline-variant/20">
        <div className="space-y-2">
          <Label>Pilih Kategori Data</Label>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {KATEGORI_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                type="button"
                onClick={() => handlePilihKategori(opt.value)}
                className={`flex items-center gap-3 px-4 py-3 rounded-xl border text-left transition-all cursor-pointer ${
                  kategori === opt.value
                    ? "border-tertiary bg-tertiary/5 text-tertiary"
                    : "border-outline-variant/30 text-on-surface-variant hover:bg-slate-50"
                }`}
              >
                <span className="material-symbols-outlined">{opt.icon}</span>
                <span className="text-sm font-semibold">{opt.label}</span>
              </button>
            ))}
          </div>
        </div>

        {error && (
          <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg">
            {error}
          </div>
        )}

        <div className="flex flex-wrap items-center gap-3">
          <Button
            onClick={handleGeneratePreview}
            disabled={isGenerating}
            className="flex items-center gap-2 cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">
              visibility
            </span>
            <span>
              {isGenerating ? "Membuat Pratinjau..." : "Buat Pratinjau"}
            </span>
          </Button>

          {previewUrl && (
            <Button
              onClick={handleDownload}
              variant="outline"
              className="flex items-center gap-2 cursor-pointer"
            >
              <span className="material-symbols-outlined text-sm">
                download
              </span>
              <span>Unduh PDF</span>
            </Button>
          )}

          {jumlahData !== null && (
            <span className="text-xs text-on-surface-variant">
              {jumlahData} data ditemukan
            </span>
          )}
        </div>
      </Card>

      {previewUrl && (
        <Card className="p-2 bg-white border border-outline-variant/20 overflow-hidden">
          <iframe
            src={previewUrl}
            className="w-full h-[75vh] rounded-lg"
            title="Pratinjau Laporan PDF"
          />
        </Card>
      )}
    </div>
  );
}
