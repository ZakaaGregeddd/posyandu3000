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
  getIbuHamils,
  addIbuHamil,
  getKKs,
  IbuHamil,
  KKOption,
} from "@/lib/fetch/ibuHamil";
import { calculateAge, calculateGestationWeeks } from "@/lib/utils/health";

export default function IbuHamilPage() {
  const [bumils, setBumils] = useState<IbuHamil[]>([]);
  const [kks, setKks] = useState<KKOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 3;

  // Form states
  const [noKk, setNoKk] = useState("");
  const [nama, setNama] = useState("");
  const [nik, setNik] = useState("");
  const [tempatLahir, setTempatLahir] = useState("");
  const [tanggalLahir, setTanggalLahir] = useState("");
  const [hpht, setHpht] = useState("");
  const [formError, setFormError] = useState("");

  useEffect(() => {
    let active = true;

    (async () => {
      try {
        const [bumilData, kkData] = await Promise.all([
          getIbuHamils(),
          getKKs(),
        ]);
        if (!active) return;
        setBumils(bumilData);
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
    setCurrentPage(1);
  }, [searchTerm]);

  const handleRegisterBumil = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (!noKk || !nama || !tempatLahir || !tanggalLahir || !hpht || !nik) {
      setFormError("Semua field wajib diisi");
      return;
    }

    if (noKk.length !== 16) {
      setFormError("Nomor KK harus tepat 16 digit");
      return;
    }

    if (nik.length !== 16) {
      setFormError("NIK harus tepat 16 digit");
      return;
    }

    setIsSubmitting(true);

    try {
      const newBumil = await addIbuHamil({
        nama,
        tempatLahir,
        tanggalLahir,
        noKk,
        nik,
        hpht,
        statusHidup: "Hidup",
      });

      setBumils((prev) => [...prev, newBumil]);
      setIsModalOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(err.message || "Gagal menambahkan ibu hamil");
    } finally {
      setIsSubmitting(false);
    }
  };

  const resetForm = () => {
    setNoKk("");
    setNama("");
    setNik("");
    setTempatLahir("");
    setTanggalLahir("");
    setHpht("");
    setFormError("");
  };

  // Filters
  const filteredBumils = bumils.filter(
    (b) =>
      b.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.noKk.includes(searchTerm) ||
      b.nik.includes(searchTerm),
  );

  const totalPages = Math.max(
    Math.ceil(filteredBumils.length / itemsPerPage),
    1,
  );
  const paginatedBumils = filteredBumils.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  );

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-background">
            Manajemen Ibu Hamil
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Pantauan HPHT, taksiran kelahiran (HPL), usia kehamilan, dan rujukan
            melahirkan otomatis.
          </p>
        </div>
        <Button
          onClick={() => setIsModalOpen(true)}
          className="flex items-center gap-2 cursor-pointer"
        >
          <span className="material-symbols-outlined">add</span>
          <span>Daftarkan Ibu Hamil</span>
        </Button>
      </div>

      {loadError && (
        <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl">
          {loadError}
        </div>
      )}

      {/* Search */}
      <div className="relative max-w-md">
        <span className="material-symbols-outlined absolute left-4 top-1/2 -translate-y-1/2 text-on-surface-variant">
          search
        </span>
        <Input
          placeholder="Cari nama ibu hamil, NIK atau nomor KK..."
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
        <Card className="border border-outline-variant/15 overflow-hidden p-0 bg-transparent shadow-none border-none">
          <CardContent className="p-0">
            <div className="w-full overflow-x-auto pb-2">
              <table className="w-full border-separate border-spacing-y-2 min-w-[850px]">
              <thead>
                <tr className="text-left text-xs font-bold uppercase tracking-wider text-on-surface-variant">
                  <th className="px-6 py-4 bg-secondary-container rounded-l-xl">
                    Status Kelahiran
                  </th>
                  <th className="px-6 py-4 bg-secondary-container">
                    No. KK / NIK
                  </th>
                  <th className="px-6 py-4 bg-secondary-container">
                    Nama Anggota
                  </th>
                  <th className="px-6 py-4 bg-secondary-container">Usia Ibu</th>
                  <th className="px-6 py-4 bg-secondary-container">
                    Usia Kandungan
                  </th>
                  <th className="px-6 py-4 bg-secondary-container">Status</th>
                  <th className="px-6 py-4 text-right bg-secondary-container rounded-r-xl">
                    Aksi
                  </th>
                </tr>
              </thead>
              <tbody>
                {paginatedBumils.length === 0 ? (
                  <tr className="bg-white">
                    <td
                      colSpan={7}
                      className="text-center text-on-surface-variant py-8 border border-outline-variant/10 rounded-xl"
                    >
                      Tidak ada data ibu hamil ditemukan
                    </td>
                  </tr>
                ) : (
                  paginatedBumils.map((bumil) => (
                    <tr
                      key={bumil.id}
                      className={`bg-white hover:bg-slate-50 transition-colors ${bumil.statusHidup === "Meninggal" ? "opacity-75" : ""}`}
                    >
                      <td className="px-6 py-4 border-y border-l border-outline-variant/10 rounded-l-xl">
                        <span
                          className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${
                            bumil.postBirthRecord
                              ? "bg-teal-50 text-teal-700 border-teal-200"
                              : "bg-amber-50 text-amber-700 border-amber-200"
                          }`}
                        >
                          {bumil.postBirthRecord
                            ? "Sudah Lahir"
                            : "Belum Lahir"}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-sm border-y border-outline-variant/10 text-on-surface">
                        <div className="flex flex-col">
                          <span className="font-medium text-on-surface-variant">
                            {bumil.noKk}
                          </span>
                          <span className="text-xs text-outline">
                            {bumil.nik}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-sm font-bold border-y border-outline-variant/10 text-on-surface">
                        {bumil.nama}
                      </td>
                      <td className="px-6 py-4 text-sm border-y border-outline-variant/10 text-on-surface">
                        {calculateAge(bumil.tanggalLahir).text}
                      </td>
                      <td className="px-6 py-4 text-sm border-y border-outline-variant/10 text-on-surface">
                        {bumil.postBirthRecord ? (
                          <span className="text-xs text-on-surface-variant italic">
                            Melahirkan pada{" "}
                            {new Date(
                              bumil.postBirthRecord.tanggalLahir,
                            ).toLocaleDateString("id-ID")}
                          </span>
                        ) : (
                          <span className="text-xs font-semibold text-tertiary">
                            {calculateGestationWeeks(bumil.hpht)}
                          </span>
                        )}
                      </td>
                      <td className="px-6 py-4 border-y border-outline-variant/10">
                        <span
                          className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                            bumil.statusHidup === "Hidup"
                              ? "bg-teal-50 text-teal-700 border border-teal-200"
                              : "bg-red-50 text-red-700 border border-red-200"
                          }`}
                        >
                          {bumil.statusHidup}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-right border-y border-r border-outline-variant/10 rounded-r-xl">
                        <Link href={`/dashboard/ibu-hamil/${bumil.id}`}>
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
            </div>

            {/* Pagination */}
            {filteredBumils.length > itemsPerPage && (
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

      {/* Add Ibu Hamil Modal */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form
          onSubmit={handleRegisterBumil}
          className="flex flex-col max-h-[85vh] overflow-hidden"
        >
          <DialogHeader>
            <DialogTitle>Tambah Data Ibu Hamil</DialogTitle>
            <DialogDescription>
              Masukkan identitas ibu hamil baru beserta Hari Pertama Haid
              Terakhir (HPHT).
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
                <Label htmlFor="modal_no_kk">KK Terdaftar</Label>
                <input
                  id="modal_no_kk"
                  type="text"
                  pattern="[0-9]*"
                  inputMode="numeric"
                  placeholder="Ketik 16 digit nomor KK..."
                  list="kk_options"
                  value={noKk}
                  onChange={(e) => {
                    const cleanVal = e.target.value.replace(/[^0-9]/g, "").substring(0, 16);
                    setNoKk(cleanVal);
                  }}
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all"
                  required
                />
                <datalist id="kk_options">
                  {kks.map((k) => (
                    <option key={k.noKk} value={k.noKk} />
                  ))}
                </datalist>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal_nik">NIK Ibu</Label>
                <Input
                  id="modal_nik"
                  placeholder="16 digit NIK Ibu"
                  list="ibu_nik_options"
                  value={nik}
                  onChange={(e) => {
                    const clean = e.target.value
                      .replace(/[^0-9]/g, "")
                      .substring(0, 16);
                    setNik(clean);
                    const selectedKK = kks.find(k => k.noKk === noKk);
                    if (selectedKK && clean === selectedKK.nikIbu) {
                      if (selectedKK.namaIbu) setNama(selectedKK.namaIbu);
                      if (selectedKK.tempatLahirIbu) setTempatLahir(selectedKK.tempatLahirIbu);
                      if (selectedKK.tanggalLahirIbu) setTanggalLahir(selectedKK.tanggalLahirIbu);
                    }
                  }}
                  required
                />
                {kks.find(k => k.noKk === noKk)?.nikIbu && (
                  <datalist id="ibu_nik_options">
                    <option value={kks.find(k => k.noKk === noKk)?.nikIbu} />
                  </datalist>
                )}
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="modal_nama">Nama Lengkap</Label>
                <Input
                  id="modal_nama"
                  placeholder="Nama Lengkap Ibu Hamil"
                  list="ibu_nama_options"
                  value={nama}
                  onChange={(e) => {
                    const val = e.target.value;
                    setNama(val);
                    const selectedKK = kks.find(k => k.noKk === noKk);
                    if (selectedKK && val.toLowerCase() === selectedKK.namaIbu?.toLowerCase()) {
                      if (selectedKK.nikIbu) setNik(selectedKK.nikIbu);
                      if (selectedKK.tempatLahirIbu) setTempatLahir(selectedKK.tempatLahirIbu);
                      if (selectedKK.tanggalLahirIbu) setTanggalLahir(selectedKK.tanggalLahirIbu);
                    }
                  }}
                  required
                />
                {kks.find(k => k.noKk === noKk)?.namaIbu && (
                  <datalist id="ibu_nama_options">
                    <option value={kks.find(k => k.noKk === noKk)?.namaIbu} />
                  </datalist>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal_tempat">Tempat Lahir</Label>
                <Input
                  id="modal_tempat"
                  placeholder="Kota / Kabupaten"
                  list="ibu_tempat_options"
                  value={tempatLahir}
                  onChange={(e) => setTempatLahir(e.target.value)}
                  required
                />
                {kks.find(k => k.noKk === noKk)?.tempatLahirIbu && (
                  <datalist id="ibu_tempat_options">
                    <option value={kks.find(k => k.noKk === noKk)?.tempatLahirIbu} />
                  </datalist>
                )}
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal_tanggal">Tanggal Lahir</Label>
                <Input
                  id="modal_tanggal"
                  type="date"
                  list="ibu_tgl_options"
                  value={tanggalLahir}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setTanggalLahir(e.target.value)}
                  required
                />
                {kks.find(k => k.noKk === noKk)?.tanggalLahirIbu && (
                  <datalist id="ibu_tgl_options">
                    <option value={kks.find(k => k.noKk === noKk)?.tanggalLahirIbu} />
                  </datalist>
                )}
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="modal_hpht">
                  Hari Pertama Haid Terakhir (HPHT)
                </Label>
                <Input
                  id="modal_hpht"
                  type="date"
                  value={hpht}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setHpht(e.target.value)}
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
