"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
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
import {
  getLansias,
  addLansia,
  getKKs,
  getDiseaseStats,
  Lansia,
  KKOption,
} from "@/lib/fetch/lansia";
import { calculateAge, classifyCategory } from "@/lib/utils/health";

export default function LansiaPage() {
  const [lansias, setLansias] = useState<Lansia[]>([]);
  const [kks, setKks] = useState<KKOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [diseaseStats, setDiseaseStats] = useState<
    { name: string; count: number }[]
  >([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Form states
  const [noKk, setNoKk] = useState("");
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"L" | "P">("L");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [namaIbu, setNamaIbu] = useState("");
  const [namaAyah, setNamaAyah] = useState("");
  const [golonganDarah, setGolonganDarah] = useState("");
  const [formError, setFormError] = useState("");

  // Active Category Tab
  const [activeTab, setActiveTab] = useState<
    "all" | "pralansia" | "lansia" | "resikoTinggi"
  >("all");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [list, kkData, stats] = await Promise.all([
          getLansias(),
          getKKs(),
          getDiseaseStats(),
        ]);
        if (!active) return;
        setLansias(list);
        setKks(kkData);
        setDiseaseStats(stats);
      } catch (err: any) {
        if (active) setLoadError(err.message || "Gagal memuat data");
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, []);

  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, activeTab]);

  const handleRegisterLansia = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!nama || !tempatLahir || !tanggalLahir || !namaIbu || !namaAyah) {
      setFormError("Semua field wajib diisi");
      return;
    }

    if (nik && nik.length !== 16) {
      setFormError(
        "NIK harus tepat 16 digit (atau kosongkan dulu jika belum ada)",
      );
      return;
    }

    setIsSubmitting(true);

    try {
      const newLansia = await addLansia({
        nama,
        tempatLahir,
        tanggalLahir,
        jenisKelamin,
        noKk: noKk || undefined,
        namaIbu,
        namaAyah,
        statusHidup: "Hidup",
        nik: nik || undefined,
        golonganDarah: golonganDarah || undefined,
      });

      setLansias((prev) => [...prev, newLansia]);
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || "Gagal mendaftarkan lansia");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNoKk("");
    setNama("");
    setNik("");
    setJenisKelamin("L");
    setTempatLahir("");
    setTanggalLahir("");
    setNamaIbu("");
    setNamaAyah("");
    setGolonganDarah("");
    setFormError("");
  };

  // Filters
  const filteredLansias = lansias.filter((l) => {
    const age = calculateAge(l.tanggalLahir);
    const matchesSearch =
      l.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (l.noKk || "").includes(searchTerm);

    if (!matchesSearch) return false;

    if (activeTab === "pralansia") {
      return age.years >= 45 && age.years < 50;
    }
    if (activeTab === "lansia") {
      return age.years >= 50 && age.years < 60;
    }
    if (activeTab === "resikoTinggi") {
      return age.years >= 60;
    }
    return true; // all
  });

  const totalPages = Math.max(
    Math.ceil(filteredLansias.length / itemsPerPage),
    1,
  );
  const paginatedLansias = filteredLansias.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-background">
            Manajemen Lansia
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Rekapitulasi riwayat penyakit kronis, obat rutin, dan pantauan gizi
            Lansia.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined">add_circle</span>
          <span>Tambah Data Lansia</span>
        </Button>
      </div>

      {loadError && (
        <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl">
          {loadError}
        </div>
      )}

      {/* Aggregate Stats Widget */}
      {diseaseStats.length > 0 && (
        <Card className="border border-outline-variant/30 bg-secondary-container/10 p-5 rounded-xl">
          <h3 className="font-headline text-sm font-bold text-tertiary mb-3 flex items-center gap-2">
            <span className="material-symbols-outlined">analytics</span>
            Penyakit Dominan Terdeteksi
          </h3>
          <div className="flex gap-4 flex-wrap">
            {diseaseStats.slice(0, 4).map((stat) => (
              <div
                key={stat.name}
                className="bg-white px-4 py-2 rounded-lg border border-outline-variant/20 shadow-sm flex items-center gap-3"
              >
                <span className="text-sm font-bold text-on-background">
                  {stat.name}
                </span>
                <span className="w-5 h-5 rounded-full bg-red-100 text-red-700 text-xs font-bold flex items-center justify-center">
                  {stat.count}
                </span>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Tabs Toolbar */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        {/* Tabs */}
        <div className="flex bg-secondary-container/20 p-1.5 rounded-full border border-outline-variant/20 gap-1 overflow-x-auto w-full sm:w-auto">
          {[
            { id: "all", label: "Semua" },
            { id: "pralansia", label: "Pralansia (45-50 th)" },
            { id: "lansia", label: "Lansia (50-60 th)" },
            { id: "resikoTinggi", label: "Resiko Tinggi (60+ th)" },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as any)}
              className={`px-4 py-2 rounded-full text-xs font-bold transition-all cursor-pointer whitespace-nowrap ${
                activeTab === tab.id
                  ? "bg-tertiary text-white shadow-sm"
                  : "text-on-surface-variant hover:bg-secondary-fixed/50"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Search */}
        <div className="relative w-full sm:w-72">
          <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-on-surface-variant text-sm">
            search
          </span>
          <Input
            placeholder="Cari nama atau KK..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10 h-10 text-xs bg-white"
          />
        </div>
      </div>

      {isLoading ? (
        <div className="text-center text-sm text-on-surface-variant py-12">
          Memuat data...
        </div>
      ) : (
        <Card className="border border-outline-variant/15 overflow-hidden p-0 bg-transparent shadow-none border-none">
          <CardContent className="p-0">
            <table className="w-full border-separate border-spacing-y-2">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-6 py-4 bg-secondary-container rounded-l-xl">
                    No. KK
                  </th>
                  <th className="px-6 py-4 bg-secondary-container">
                    Nama Lansia
                  </th>
                  <th className="px-6 py-4 bg-secondary-container">Usia</th>
                  <th className="px-6 py-4 bg-secondary-container">
                    Kategori Lansia
                  </th>
                  <th className="px-6 py-4 bg-secondary-container">Status</th>
                  <th className="px-6 py-4 text-right bg-secondary-container rounded-r-xl">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedLansias.length === 0 ? (
                  <tr className="bg-white">
                    <td
                      colSpan={6}
                      className="text-center text-on-surface-variant py-8 border border-outline-variant/10 rounded-xl"
                    >
                      Tidak ada data lansia ditemukan
                    </td>
                  </tr>
                ) : (
                  paginatedLansias.map((l) => (
                    <tr
                      key={l.id}
                      className={`bg-white hover:bg-slate-50 transition-colors ${l.statusHidup === "Meninggal" ? "opacity-75" : ""}`}
                    >
                      <td className="px-6 py-4 text-sm font-medium border-y border-l border-outline-variant/10 rounded-l-xl text-on-surface">
                        {l.noKk || (
                          <span className="text-on-surface-variant italic">
                            Tanpa KK
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm font-bold border-y border-outline-variant/10 text-on-surface">
                        {l.nama}
                      </td>
                      <td className="px-6 py-4 text-sm border-y border-outline-variant/10 text-on-surface">
                        {calculateAge(l.tanggalLahir).years} tahun
                      </td>
                      <td className="px-6 py-4 border-y border-outline-variant/10">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold border ${
                            classifyCategory(l.tanggalLahir, "lansia").includes(
                              "Resiko",
                            )
                              ? "bg-red-50 text-red-700 border-red-200"
                              : classifyCategory(
                                    l.tanggalLahir,
                                    "lansia",
                                  ).includes("Pralansia")
                                ? "bg-amber-50 text-amber-700 border-amber-200"
                                : "bg-orange-50 text-orange-700 border-orange-200"
                          }`}
                        >
                          {classifyCategory(l.tanggalLahir, "lansia")}
                        </span>
                      </td>
                      <td className="px-6 py-4 border-y border-outline-variant/10">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            l.statusHidup === "Hidup"
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {l.statusHidup}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right border-y border-r border-outline-variant/10 rounded-r-xl">
                        <Link href={`/dashboard/lansia/${l.id}`}>
                          <button className="group inline-flex items-center gap-2 text-tertiary hover:bg-secondary-brand/40 px-4 py-2 rounded-lg transition-all whitespace-nowrap cursor-pointer">
                            <span className="text-xs font-bold">
                              Lihat Detail
                            </span>
                            <span className="material-symbols-outlined text-sm group-hover:translate-x-1 transition-transform">
                              arrow_forward
                            </span>
                          </button>
                        </Link>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            {/* Pagination */}
            {filteredLansias.length > itemsPerPage && (
              <div className="flex justify-center items-center gap-6 py-4 text-sm font-medium text-on-surface-variant bg-white/50 rounded-xl border border-outline-variant/10 mt-2">
                <button
                  onClick={() => setCurrentPage((p) => Math.max(p - 1, 1))}
                  disabled={currentPage === 1}
                  className="flex items-center gap-1 hover:text-tertiary disabled:opacity-40 disabled:hover:text-on-surface-variant cursor-pointer transition-colors"
                >
                  <span className="material-symbols-outlined text-sm">
                    chevron_left
                  </span>
                  <span>Previous</span>
                </button>

                <span>
                  <span className="font-bold text-on-background">
                    {currentPage}
                  </span>{" "}
                  dari{" "}
                  <span className="font-bold text-on-background">
                    {totalPages}
                  </span>
                </span>

                <button
                  onClick={() =>
                    setCurrentPage((p) => Math.min(p + 1, totalPages))
                  }
                  disabled={currentPage === totalPages}
                  className="flex items-center gap-1 hover:text-tertiary disabled:opacity-40 disabled:hover:text-on-surface-variant cursor-pointer transition-colors"
                >
                  <span>Next</span>
                  <span className="material-symbols-outlined text-sm">
                    chevron_right
                  </span>
                </button>
              </div>
            )}
          </CardContent>
        </Card>
      )}

      {/* Add Lansia Modal */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form
          onSubmit={handleRegisterLansia}
          className="flex flex-col max-h-[85vh] overflow-hidden"
        >
          <DialogHeader>
            <DialogTitle>Tambah Data Lansia</DialogTitle>
            <DialogDescription>
              Masukkan identitas warga pralansia atau lansia untuk rekam medis
              berkala.
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-4">
            {formError && (
              <div className="text-xs font-semibold text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {formError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="modal_no_kk">Nomor KK (Opsional)</Label>
                <select
                  id="modal_no_kk"
                  value={noKk}
                  onChange={(e) => setNoKk(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all"
                >
                  <option value="">-- Tanpa KK / Berdiri Sendiri --</option>
                  {kks.map((k) => (
                    <option key={k.noKk} value={k.noKk}>
                      {k.noKk}
                    </option>
                  ))}
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal_nik">NIK</Label>
                <Input
                  id="modal_nik"
                  placeholder="Masukkan 16 digit NIK"
                  value={nik}
                  onChange={(e) => {
                    const clean = e.target.value
                      .replace(/[^0-9]/g, "")
                      .substring(0, 16);
                    setNik(clean);
                  }}
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="modal_nama">Nama Lengkap</Label>
                <Input
                  id="modal_nama"
                  placeholder="Nama Lengkap Lansia"
                  value={nama}
                  onChange={(e) => setNama(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal_jk">Jenis Kelamin</Label>
                <select
                  id="modal_jk"
                  value={jenisKelamin}
                  onChange={(e) => setJenisKelamin(e.target.value as "L" | "P")}
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all"
                >
                  <option value="L">Laki-laki</option>
                  <option value="P">Perempuan</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal_golongan_darah">
                  Golongan Darah (Opsional)
                </Label>
                <select
                  id="modal_golongan_darah"
                  value={golonganDarah}
                  onChange={(e) => setGolonganDarah(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all"
                >
                  <option value="">-- Belum diketahui --</option>
                  <option value="A">A</option>
                  <option value="B">B</option>
                  <option value="AB">AB</option>
                  <option value="O">O</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal_tempat">Tempat Lahir</Label>
                <Input
                  id="modal_tempat"
                  placeholder="Kota / Kabupaten"
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal_tanggal">Tanggal Lahir</Label>
                <Input
                  id="modal_tanggal"
                  type="date"
                  value={tanggalLahir}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal_ayah">Nama Ayah</Label>
                <Input
                  id="modal_ayah"
                  placeholder="Nama Lengkap Ayah (boleh tidak terdaftar di sistem)"
                  value={namaAyah}
                  onChange={(e) => setNamaAyah(e.target.value)}
                  required
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="modal_ibu">Nama Ibu</Label>
                <Input
                  id="modal_ibu"
                  placeholder="Nama Lengkap Ibu (boleh tidak terdaftar di sistem)"
                  value={namaIbu}
                  onChange={(e) => setNamaIbu(e.target.value)}
                  required
                />
              </div>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsModalOpen(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? "Menyimpan..." : "Simpan Data"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
