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
  getBalitas,
  addBalita,
  getKKs,
  Balita,
  KKOption,
} from "@/lib/fetch/balita";
import { calculateAge } from "@/lib/utils/health";

export default function BalitaPage() {
  const [balitas, setBalitas] = useState<Balita[]>([]);
  const [kks, setKks] = useState<KKOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination states
  const [currentPageBayi, setCurrentPageBayi] = useState(1);
  const [currentPageBalita, setCurrentPageBalita] = useState(1);
  const itemsPerPage = 3;

  // Form states
  const [noKk, setNoKk] = useState("");
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [jenisKelamin, setJenisKelamin] = useState<"L" | "P">("L");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [golonganDarah, setGolonganDarah] = useState("");
  const [caraLahir, setCaraLahir] = useState<"SC" | "Normal" | "">("");
  const [usiaKehamilanSaatLahir, setUsiaKehamilanSaatLahir] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [balitaData, kkData] = await Promise.all([
          getBalitas(),
          getKKs(),
        ]);
        if (!active) return;
        setBalitas(balitaData);
        setKks(kkData);
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
    setCurrentPageBayi(1);
    setCurrentPageBalita(1);
  }, [searchTerm]);

  const handleRegisterBalita = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!noKk || !nama || !tempatLahir || !tanggalLahir) {
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
      const newBalita = await addBalita({
        nama,
        tempatLahir,
        tanggalLahir,
        jenisKelamin,
        noKk,
        statusHidup: "Hidup",
        nik: nik || undefined,
        caraLahir: caraLahir || undefined,
        usiaKehamilanSaatLahirWeeks: usiaKehamilanSaatLahir
          ? parseInt(usiaKehamilanSaatLahir)
          : undefined,
        golonganDarah: golonganDarah || undefined,
      });

      setBalitas((prev) => [...prev, newBalita]);
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || "Gagal menambahkan anggota");
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
    setGolonganDarah("");
    setCaraLahir("");
    setUsiaKehamilanSaatLahir("");
    setFormError("");
  };

  // Filter lists based on search and categories
  const filteredBalitas = balitas.filter(
    (b) =>
      b.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.noKk.includes(searchTerm),
  );

  const bayiList = filteredBalitas.filter((b) => {
    const age = calculateAge(b.tanggalLahir);
    return age.totalMonths <= 12;
  });

  const balitaList = filteredBalitas.filter((b) => {
    const age = calculateAge(b.tanggalLahir);
    return age.totalMonths > 12;
  });

  // Paginated lists
  const totalPagesBayi = Math.max(Math.ceil(bayiList.length / itemsPerPage), 1);
  const paginatedBayiList = bayiList.slice(
    (currentPageBayi - 1) * itemsPerPage,
    currentPageBayi * itemsPerPage,
  );

  const totalPagesBalita = Math.max(
    Math.ceil(balitaList.length / itemsPerPage),
    1,
  );
  const paginatedBalitaList = balitaList.slice(
    (currentPageBalita - 1) * itemsPerPage,
    currentPageBalita * itemsPerPage,
  );

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-background">
            Data Balita & Bayi
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Manajemen rekapitulasi data imunisasi dan grafik perkembangan
            Balita.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined">add</span>
          <span>Tambah Anggota Balita</span>
        </Button>
      </div>

      {loadError && (
        <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl">
          {loadError}
        </div>
      )}

      {/* Global Search */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
          search
        </span>
        <Input
          placeholder="Cari nama balita atau nomor KK..."
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          className="pl-12"
        />
      </div>

      {isLoading ? (
        <div className="text-center text-sm text-on-surface-variant py-12">
          Memuat data...
        </div>
      ) : (
        <>
          {/* Section 1: Bayi (0-12 Bulan) */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-tertiary-fixed flex items-center justify-center text-tertiary shadow-sm">
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  child_care
                </span>
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-on-background">
                  Data Bayi (0-12 Bulan)
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {bayiList.length} anggota terdaftar
                </p>
              </div>
            </div>

            <Card className="border border-outline-variant/15 overflow-hidden p-0 bg-transparent shadow-none border-none">
              <CardContent className="p-0">
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      <th className="px-6 py-4 bg-secondary-container rounded-l-xl">
                        No. KK
                      </th>
                      <th className="px-6 py-4 bg-secondary-container">NIK</th>
                      <th className="px-6 py-4 bg-secondary-container">
                        Nama Anggota
                      </th>
                      <th className="px-6 py-4 bg-secondary-container">Usia</th>
                      <th className="px-6 py-4 bg-secondary-container">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right bg-secondary-container rounded-r-xl">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBayiList.length === 0 ? (
                      <tr className="bg-white">
                        <td
                          colSpan={6}
                          className="text-center text-on-surface-variant py-8 border border-outline-variant/10 rounded-xl"
                        >
                          Tidak ada data bayi ditemukan
                        </td>
                      </tr>
                    ) : (
                      paginatedBayiList.map((baby) => (
                        <tr
                          key={baby.id}
                          className={`bg-white hover:bg-slate-50 transition-colors ${baby.statusHidup === "Meninggal" ? "opacity-75" : ""}`}
                        >
                          <td className="px-6 py-4 text-sm font-medium border-y border-l border-outline-variant/10 rounded-l-xl text-on-surface">
                            {baby.noKk}
                          </td>
                          <td className="px-6 py-4 text-sm border-y border-outline-variant/10 text-on-surface">
                            {baby.nik || "-"}
                          </td>
                          <td className="px-6 py-4 text-sm font-bold border-y border-outline-variant/10 text-on-surface">
                            {baby.nama}
                          </td>
                          <td className="px-6 py-4 border-y border-outline-variant/10">
                            <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed-variant rounded-full text-xs font-bold whitespace-nowrap">
                              {calculateAge(baby.tanggalLahir).text}
                            </span>
                          </td>
                          <td className="px-6 py-4 border-y border-outline-variant/10">
                            <span
                              className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                baby.statusHidup === "Hidup"
                                  ? "bg-teal-50 text-teal-700 border border-teal-200"
                                  : "bg-red-50 text-red-700 border border-red-200"
                              }`}
                            >
                              {baby.statusHidup}
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right border-y border-r border-outline-variant/10 rounded-r-xl">
                            <Link href={`/dashboard/balita/${baby.id}`}>
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

                {/* Pagination Bayi */}
                {bayiList.length > itemsPerPage && (
                  <div className="flex justify-center items-center gap-6 py-4 text-sm font-medium text-on-surface-variant bg-white/50 rounded-xl border border-outline-variant/10 mt-2">
                    <button
                      onClick={() =>
                        setCurrentPageBayi((p) => Math.max(p - 1, 1))
                      }
                      disabled={currentPageBayi === 1}
                      className="flex items-center gap-1 hover:text-tertiary disabled:opacity-40 disabled:hover:text-on-surface-variant cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        chevron_left
                      </span>
                      <span>Previous</span>
                    </button>

                    <span>
                      <span className="font-bold text-on-background">
                        {currentPageBayi}
                      </span>{" "}
                      dari{" "}
                      <span className="font-bold text-on-background">
                        {totalPagesBayi}
                      </span>
                    </span>

                    <button
                      onClick={() =>
                        setCurrentPageBayi((p) =>
                          Math.min(p + 1, totalPagesBayi),
                        )
                      }
                      disabled={currentPageBayi === totalPagesBayi}
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
          </section>

          {/* Section 2: Balita (1-5 Tahun) */}
          <section className="space-y-4">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-secondary-container flex items-center justify-center text-tertiary shadow-sm">
                <span
                  className="material-symbols-outlined text-2xl"
                  style={{ fontVariationSettings: "'FILL' 1" }}
                >
                  accessibility_new
                </span>
              </div>
              <div>
                <h3 className="font-headline text-lg font-bold text-on-background">
                  Data Balita (1-5 Tahun)
                </h3>
                <p className="text-xs text-on-surface-variant">
                  {balitaList.length} anggota terdaftar
                </p>
              </div>
            </div>

            <Card className="border border-outline-variant/15 overflow-hidden p-0 bg-transparent shadow-none border-none">
              <CardContent className="p-0">
                <table className="w-full border-separate border-spacing-y-2">
                  <thead>
                    <tr className="text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                      <th className="px-6 py-4 bg-secondary-container rounded-l-xl">
                        No. KK
                      </th>
                      <th className="px-6 py-4 bg-secondary-container">NIK</th>
                      <th className="px-6 py-4 bg-secondary-container">
                        Nama Anggota
                      </th>
                      <th className="px-6 py-4 bg-secondary-container">Usia</th>
                      <th className="px-6 py-4 bg-secondary-container">
                        Status
                      </th>
                      <th className="px-6 py-4 text-right bg-secondary-container rounded-r-xl">
                        Aksi
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {paginatedBalitaList.length === 0 ? (
                      <tr className="bg-white">
                        <td
                          colSpan={6}
                          className="text-center text-on-surface-variant py-8 border border-outline-variant/10 rounded-xl"
                        >
                          Tidak ada data balita ditemukan
                        </td>
                      </tr>
                    ) : (
                      paginatedBalitaList.map((child) => {
                        const isLocked =
                          calculateAge(child.tanggalLahir).years >= 5;
                        return (
                          <tr
                            key={child.id}
                            className={`bg-white hover:bg-slate-50 transition-colors ${child.statusHidup === "Meninggal" ? "opacity-75" : ""}`}
                          >
                            <td className="px-6 py-4 text-sm font-medium border-y border-l border-outline-variant/10 rounded-l-xl text-on-surface">
                              {child.noKk}
                            </td>
                            <td className="px-6 py-4 text-sm border-y border-outline-variant/10 text-on-surface">
                              {child.nik || "-"}
                            </td>
                            <td className="px-6 py-4 text-sm font-bold border-y border-outline-variant/10 text-on-surface">
                              <div className="flex items-center gap-2">
                                <span>{child.nama}</span>
                                {isLocked && (
                                  <span
                                    className="text-[10px] bg-red-100 text-red-800 font-bold px-2 py-0.5 rounded-full"
                                    title="Usia >= 5 tahun, entri data dibekukan"
                                  >
                                    Terkunci
                                  </span>
                                )}
                              </div>
                            </td>
                            <td className="px-6 py-4 border-y border-outline-variant/10">
                              <span className="px-3 py-1 bg-secondary-fixed text-on-secondary-fixed-variant rounded-full text-xs font-bold whitespace-nowrap">
                                {calculateAge(child.tanggalLahir).text}
                              </span>
                            </td>
                            <td className="px-6 py-4 border-y border-outline-variant/10">
                              <span
                                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                                  child.statusHidup === "Hidup"
                                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                                    : "bg-red-50 text-red-700 border border-red-200"
                                }`}
                              >
                                {child.statusHidup}
                              </span>
                            </td>
                            <td className="px-6 py-4 text-right border-y border-r border-outline-variant/10 rounded-r-xl">
                              <Link href={`/dashboard/balita/${child.id}`}>
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
                        );
                      })
                    )}
                  </tbody>
                </table>

                {/* Pagination Balita */}
                {balitaList.length > itemsPerPage && (
                  <div className="flex justify-center items-center gap-6 py-4 text-sm font-medium text-on-surface-variant bg-white/50 rounded-xl border border-outline-variant/10 mt-2">
                    <button
                      onClick={() =>
                        setCurrentPageBalita((p) => Math.max(p - 1, 1))
                      }
                      disabled={currentPageBalita === 1}
                      className="flex items-center gap-1 hover:text-tertiary disabled:opacity-40 disabled:hover:text-on-surface-variant cursor-pointer transition-colors"
                    >
                      <span className="material-symbols-outlined text-sm">
                        chevron_left
                      </span>
                      <span>Previous</span>
                    </button>

                    <span>
                      <span className="font-bold text-on-background">
                        {currentPageBalita}
                      </span>{" "}
                      dari{" "}
                      <span className="font-bold text-on-background">
                        {totalPagesBalita}
                      </span>
                    </span>

                    <button
                      onClick={() =>
                        setCurrentPageBalita((p) =>
                          Math.min(p + 1, totalPagesBalita),
                        )
                      }
                      disabled={currentPageBalita === totalPagesBalita}
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
          </section>
        </>
      )}

      {/* Add Balita Modal */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form
          onSubmit={handleRegisterBalita}
          className="flex flex-col max-h-[85vh] overflow-hidden"
        >
          <DialogHeader>
            <DialogTitle>Tambah Data Balita / Bayi</DialogTitle>
            <DialogDescription>
              Masukkan informasi detail balita baru. Pastikan nomor KK telah
              terdaftar di sistem.
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
                <Label htmlFor="modal_no_kk">Nomor KK</Label>
                <select
                  id="modal_no_kk"
                  value={noKk}
                  onChange={(e) => setNoKk(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all"
                  required
                >
                  <option value="">-- Pilih No KK --</option>
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
                  placeholder="Nama Lengkap Balita"
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

              <div className="md:col-span-2 text-xs text-on-surface-variant bg-secondary-container/40 rounded-lg px-3 py-2">
                Nama Ayah/Ibu otomatis diambil dari data KK yang dipilih.
                Pastikan KK sudah memiliki data ayah/ibu yang lengkap.
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal_cara_lahir">Cara Lahir (Opsional)</Label>
                <select
                  id="modal_cara_lahir"
                  value={caraLahir}
                  onChange={(e) =>
                    setCaraLahir(e.target.value as "SC" | "Normal" | "")
                  }
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all"
                >
                  <option value="">-- Pilih Cara Lahir --</option>
                  <option value="Normal">Normal</option>
                  <option value="SC">SC</option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal_usia_kehamilan">
                  Usia Kehamilan (Weeks - Opsional)
                </Label>
                <Input
                  id="modal_usia_kehamilan"
                  type="number"
                  placeholder="Contoh: 38"
                  value={usiaKehamilanSaatLahir}
                  onChange={(e) => setUsiaKehamilanSaatLahir(e.target.value)}
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
