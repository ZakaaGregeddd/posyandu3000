"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from "@/components/ui/dialog";
import { getPenerimaManfaatList, deletePenerimaManfaat, PenerimaManfaatRecord } from "@/lib/fetch/penerima-manfaat";

export default function PenerimaManfaatPage() {
  const router = useRouter();
  const [list, setList] = useState<PenerimaManfaatRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");

  // Modal control
  const [selectedRecord, setSelectedRecord] = useState<PenerimaManfaatRecord | null>(null);
  
  // Delete confirmation modal states
  const [recordToDelete, setRecordToDelete] = useState<PenerimaManfaatRecord | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const loadData = async () => {
    setIsLoading(true);
    setLoadError("");
    try {
      const data = await getPenerimaManfaatList();
      setList(data);
    } catch (err: any) {
      setLoadError(err.message || "Gagal memuat data penerima manfaat");
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadData();
  }, []);

  const handleConfirmDelete = (e: React.MouseEvent, record: PenerimaManfaatRecord) => {
    e.stopPropagation();
    setRecordToDelete(record);
  };

  const handleDelete = async () => {
    if (!recordToDelete) return;
    setIsDeleting(true);
    try {
      await deletePenerimaManfaat(recordToDelete.id);
      setRecordToDelete(null);
      await loadData();
    } catch (err: any) {
      alert(err.message || "Gagal menghapus catatan");
    } finally {
      setIsDeleting(false);
    }
  };

  const formatDate = (dateStr: string) => {
    if (!dateStr) return "-";
    try {
      const options: Intl.DateTimeFormatOptions = { day: "numeric", month: "long", year: "numeric" };
      return new Date(dateStr).toLocaleDateString("id-ID", options);
    } catch {
      return dateStr;
    }
  };

  const [isExporting, setIsExporting] = useState(false);

  const handleDownloadPNG = async (record: PenerimaManfaatRecord) => {
    const el = document.getElementById("receipt-print-area");
    if (!el) return;
    setIsExporting(true);
    try {
      const { toPng } = await import("html-to-image");
      // Give browser a split second to ensure standard rendering is stable
      await new Promise((r) => setTimeout(r, 150));
      
      const dataUrl = await toPng(el, {
        backgroundColor: '#FFFDFE',
        style: {
          borderRadius: '0',
          margin: '0',
        },
        pixelRatio: 2, // High resolution crisp image
        skipFonts: true, // Prevents html-to-image from accessing stylesheets for webfonts, resolving the cssRules console error completely.
      });
      
      const link = document.createElement('a');
      link.download = `tanda-terima-${record.nama.toLowerCase().replace(/\s+/g, '-')}-${record.tanggalDiterima}.png`;
      link.href = dataUrl;
      link.click();
    } catch (error) {
      console.error('oops, something went wrong!', error);
      alert('Gagal mengekspor gambar');
    } finally {
      setIsExporting(false);
    }
  };

  const currentYear = new Date().getFullYear().toString();
  const currentMonth = `${new Date().getFullYear()}-${String(new Date().getMonth() + 1).padStart(2, "0")}`;

  const totalPenerima = list.length;
  
  const penerimaBulanIni = list.filter((r) => {
    return r.tanggalDiterima && r.tanggalDiterima.startsWith(currentMonth);
  }).length;

  const penerimaTahunIni = list.filter((r) => {
    return r.tanggalDiterima && r.tanggalDiterima.startsWith(currentYear);
  }).length;

  const filteredList = list.filter((r) => {
    const term = searchTerm.toLowerCase();
    return (
      r.noKk.toLowerCase().includes(term) ||
      r.nik.toLowerCase().includes(term) ||
      r.nama.toLowerCase().includes(term) ||
      r.keterangan.toLowerCase().includes(term)
    );
  });

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-background">
            Penerima Manfaat
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Daftar bukti tanda terima bantuan (sembako, PMT, makanan bergizi, dll.) oleh anggota Posyandu.
          </p>
        </div>
        <Button
          onClick={() => router.push("/dashboard/penerima-manfaat/tambah")}
          className="flex items-center gap-2 bg-tertiary hover:bg-tertiary/90 text-white font-bold"
        >
          <span className="material-symbols-outlined text-sm">featured_seasonal_and_gifts</span>
          <span>Catat Penerima Manfaat</span>
        </Button>
      </div>

      {loadError && (
        <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl">
          {loadError}
        </div>
      )}

      {/* Stats Bento Box */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <Card className="p-6 flex flex-col justify-between h-28 border border-outline-variant/20 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] bg-white">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm text-on-surface-variant">
              Total Log Penerimaan
            </span>
            <span className="material-symbols-outlined text-tertiary">
              receipt_long
            </span>
          </div>
          <div className="font-headline text-2xl md:text-3xl font-extrabold text-on-background">
            {totalPenerima}
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between h-28 border border-outline-variant/20 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] bg-white">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm text-on-surface-variant">
              Penerima Bulan Ini
            </span>
            <span className="material-symbols-outlined text-tertiary">
              calendar_month
            </span>
          </div>
          <div className="font-headline text-2xl md:text-3xl font-extrabold text-on-background">
            {penerimaBulanIni}
          </div>
        </Card>

        <Card className="p-6 flex flex-col justify-between h-28 border border-outline-variant/20 shadow-[0px_4px_20px_rgba(0,0,0,0.03)] bg-white">
          <div className="flex justify-between items-start">
            <span className="font-medium text-sm text-on-surface-variant">
              Penerima Tahun Ini
            </span>
            <span className="material-symbols-outlined text-tertiary">
              event_note
            </span>
          </div>
          <div className="font-headline text-2xl md:text-3xl font-extrabold text-on-background">
            {penerimaTahunIni}
          </div>
        </Card>
      </div>

      {/* Search and Table Area */}
      <div className="space-y-4">
        <div className="relative max-w-md">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <Input
            placeholder="Cari No KK, NIK, Nama, atau Keterangan..."
            className="pl-9 bg-white border border-outline-variant/40"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>

        {isLoading ? (
          <div className="text-center text-sm text-on-surface-variant py-12">
            Memuat data...
          </div>
        ) : filteredList.length === 0 ? (
          <div className="bg-white p-12 rounded-xl text-center border border-outline-variant/20 text-on-surface-variant">
            Tidak ada data log penerima manfaat ditemukan.
          </div>
        ) : (
          <Card className="border border-outline-variant/15 overflow-hidden p-0 bg-transparent shadow-none border-none">
            <CardContent className="p-0">
              <div className="w-full overflow-x-auto pb-2">
                <table className="w-full border-separate border-spacing-y-2 min-w-[750px]">
                  <thead>
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      <th className="px-6 py-4 bg-secondary-container rounded-l-xl">No. KK</th>
                      <th className="px-6 py-4 bg-secondary-container">NIK</th>
                      <th className="px-6 py-4 bg-secondary-container">Nama Anggota</th>
                      <th className="px-6 py-4 bg-secondary-container">Tanggal Diterima</th>
                      <th className="px-6 py-4 bg-secondary-container">Barang / Catatan</th>
                      <th className="px-6 py-4 text-right bg-secondary-container rounded-r-xl">Aksi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {filteredList.map((record) => (
                      <tr
                        key={record.id}
                        className="bg-white hover:bg-slate-50 transition-colors shadow-sm"
                      >
                        <td className="px-6 py-4 font-bold text-xs text-tertiary rounded-l-xl">
                          {record.noKk}
                        </td>
                        <td className="px-6 py-4 text-xs font-medium text-on-surface-variant">
                          {record.nik}
                        </td>
                        <td className="px-6 py-4 text-sm font-semibold text-on-surface">
                          {record.nama}
                        </td>
                        <td className="px-6 py-4 text-xs text-on-surface-variant">
                          {formatDate(record.tanggalDiterima)}
                        </td>
                        <td className="px-6 py-4 text-xs text-on-surface truncate max-w-[200px]">
                          {record.keterangan}
                        </td>
                        <td className="px-6 py-4 text-right rounded-r-xl">
                          <div className="flex justify-end items-center gap-2">
                            <button
                              onClick={() => setSelectedRecord(record)}
                              className="px-3 py-1.5 bg-secondary-container hover:bg-tertiary/10 text-tertiary font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">visibility</span>
                              <span>Detail</span>
                            </button>
                            <button
                              onClick={() => router.push(`/dashboard/penerima-manfaat/tambah?edit=${record.id}`)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-on-surface font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={(e) => handleConfirmDelete(e, record)}
                              className="w-8 h-8 rounded-lg hover:bg-error-container text-error flex items-center justify-center transition cursor-pointer"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </CardContent>
          </Card>
        )}
      </div>


      {/* Detail Modal */}
      {selectedRecord && (
        <Dialog isOpen={!!selectedRecord} onClose={() => setSelectedRecord(null)}>
          <DialogHeader>
            <DialogTitle className="text-center font-headline text-lg font-bold text-tertiary">
              Detail Penerima Manfaat
            </DialogTitle>
            <DialogDescription className="text-center mt-0.5">
              Rincian tanda terima bantuan / manfaat sosial.
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
            <div id="receipt-print-area" className="p-5 bg-white space-y-4 rounded-2xl border border-outline-variant/30 text-on-surface">
              {/* Header logo */}
              <div className="text-center pb-3 border-b border-dashed border-outline-variant/50">
                <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-9 h-9 mx-auto text-tertiary">
                  <path d="M12 21.35l-1.45-1.32C5.4 15.36 2 12.28 2 8.5 2 5.42 4.42 3 7.5 3c1.74 0 3.41.81 4.5 2.09C13.09 3.81 14.76 3 16.5 3 19.58 3 22 5.42 22 8.5c0 3.78-3.4 6.86-8.55 11.54L12 21.35z" />
                </svg>
                <h3 className="font-headline font-bold text-lg text-tertiary mt-1">POSYANDU DIGITAL</h3>
                <p className="text-[10px] text-on-surface-variant font-bold tracking-wider uppercase">Bukti Tanda Terima Manfaat</p>
              </div>

              {/* Info Details */}
              <div className="border border-outline-variant/30 rounded-2xl p-4 bg-slate-50/50 space-y-3">
                <div className="grid grid-cols-2 gap-4 text-xs">
                  <div>
                    <span className="text-on-surface-variant font-semibold block">Nomor KK</span>
                    <span className="font-bold text-on-surface text-sm">{selectedRecord.noKk}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-semibold block">NIK</span>
                    <span className="font-bold text-on-surface text-sm">{selectedRecord.nik}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-on-surface-variant font-semibold block">Nama Penerima</span>
                    <span className="font-bold text-on-surface text-sm text-tertiary">{selectedRecord.nama}</span>
                  </div>
                  <div className="col-span-2">
                    <span className="text-on-surface-variant font-semibold block">Alamat KK</span>
                    <span className="text-on-surface text-sm font-medium">{selectedRecord.alamat || "-"}</span>
                  </div>
                  <div>
                    <span className="text-on-surface-variant font-semibold block">Tanggal Diterima</span>
                    <span className="font-semibold text-on-surface">{formatDate(selectedRecord.tanggalDiterima)}</span>
                  </div>
                </div>
              </div>

              {/* Keterangan */}
              <div className="space-y-1">
                <span className="text-xs text-on-surface-variant font-bold block">Barang / Catatan Penerimaan</span>
                <div className="bg-white border border-outline-variant/30 rounded-xl p-3.5 text-xs text-on-surface font-medium leading-relaxed min-h-[50px] shadow-sm">
                  {selectedRecord.keterangan}
                </div>
              </div>

              {/* Bukti Foto */}
              <div className="space-y-1">
                <span className="text-xs text-on-surface-variant font-bold block">Bukti Foto Penyerahan</span>
                <div className="border border-outline-variant/30 rounded-2xl overflow-hidden bg-black/5 flex items-center justify-center max-h-[300px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={selectedRecord.fotoBukti}
                    alt="Bukti Penyerahan"
                    className="object-contain w-full max-h-[300px]"
                  />
                </div>
              </div>
              
              {/* Footer */}
              <div className="text-center pt-3 border-t border-dashed border-outline-variant/50 text-[10px] text-on-surface-variant font-semibold mt-2">
                Posyandu 3000 Desktop App &bull; Sehat dan Ceria
              </div>
            </div>
          </DialogContent>

          <DialogFooter className="flex flex-row justify-between w-full gap-2">
            <Button
              onClick={() => handleDownloadPNG(selectedRecord)}
              disabled={isExporting}
              variant="outline"
              className="group border-none bg-secondary-container text-tertiary hover:bg-transparent font-bold flex items-center gap-1.5"
            >
              <span className="material-symbols-outlined text-[18px]">download</span>
              <span className="group-hover:underline">{isExporting ? "Mengekspor..." : "Unduh Gambar (PNG)"}</span>
            </Button>
            <Button onClick={() => setSelectedRecord(null)} className="bg-tertiary text-white hover:bg-tertiary/90">
              Tutup
            </Button>
          </DialogFooter>
        </Dialog>
      )}

      {/* Delete Confirmation Modal */}
      {recordToDelete && (
        <Dialog isOpen={!!recordToDelete} onClose={() => setRecordToDelete(null)}>
          <DialogHeader>
            <DialogTitle className="text-center font-headline text-lg font-bold">
              Konfirmasi Hapus
            </DialogTitle>
            <DialogDescription className="text-center mt-1">
              Apakah Anda yakin ingin menghapus log tanda terima manfaat untuk <strong>{recordToDelete.nama}</strong>? Tindakan ini tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setRecordToDelete(null)}
              disabled={isDeleting}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleDelete}
              disabled={isDeleting}
              className="bg-error text-white hover:bg-error/90"
            >
              {isDeleting ? "Menghapus..." : "Hapus"}
            </Button>
          </DialogFooter>
        </Dialog>
      )}
    </div>
  );
}
