"use client";

import React, { useState, useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
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
  updateIbuHamilData,
  deleteIbuHamil,
  IbuHamil,
  KKOption,
} from "@/lib/fetch/ibuHamil";
import { calculateAge, calculateGestationWeeks } from "@/lib/utils/health";

export default function IbuHamilPage() {
  const router = useRouter();
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
  const [tanggalPemeriksaan, setTanggalPemeriksaan] = useState(new Date().toISOString().split("T")[0]);
  const [formError, setFormError] = useState("");

  // Edit states
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);
  const [selectedBumilForEdit, setSelectedBumilForEdit] = useState<IbuHamil | null>(null);
  const [editNama, setEditNama] = useState("");
  const [editNik, setEditNik] = useState("");
  const [editTempatLahir, setEditTempatLahir] = useState("");
  const [editTanggalLahir, setEditTanggalLahir] = useState("");
  const [editHpht, setEditHpht] = useState("");
  const [editGolonganDarah, setEditGolonganDarah] = useState("");
  const [editFormError, setEditFormError] = useState("");
  const [isSubmittingEdit, setIsSubmittingEdit] = useState(false);

  // Delete states
  const [bumilToDelete, setBumilToDelete] = useState<IbuHamil | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  const [stage, setStage] = useState<1 | 2>(1);
  const [isOpenKkDropdown, setIsOpenKkDropdown] = useState(false);
  const [kkSearchQuery, setKkSearchQuery] = useState("");
  const dropdownRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsOpenKkDropdown(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
    };
  }, []);

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
        tanggalPemeriksaan,
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

  const handleNoKk = () => {
    setIsModalOpen(false);
    resetForm();
    router.push("/dashboard/tambah-kk");
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setNoKk("");
    setNama("");
    setNik("");
    setTempatLahir("");
    setTanggalLahir("");
    setHpht("");
    setFormError("");
    setStage(1);
    setIsOpenKkDropdown(false);
    setKkSearchQuery("");
    setTanggalPemeriksaan(new Date().toISOString().split("T")[0]);
  };

  const handleEdit = (bumil: IbuHamil) => {
    setSelectedBumilForEdit(bumil);
    setEditNama(bumil.nama);
    setEditNik(bumil.nik);
    setEditTempatLahir(bumil.tempatLahir);
    setEditTanggalLahir(bumil.tanggalLahir);
    setEditHpht(bumil.hpht);
    setEditGolonganDarah(bumil.golonganDarah || "");
    setEditFormError("");
    setIsEditModalOpen(true);
  };

  const handleSaveEdit = async (e: React.FormEvent) => {
    e.preventDefault();
    setEditFormError("");

    if (!editNama || !editTempatLahir || !editTanggalLahir || !editHpht) {
      setEditFormError("Semua field wajib diisi");
      return;
    }

    setIsSubmittingEdit(true);

    try {
      const updatedBumil = await updateIbuHamilData({
        id: selectedBumilForEdit!.id,
        nik: editNik,
        nama: editNama,
        tempatLahir: editTempatLahir,
        tanggalLahir: editTanggalLahir,
        hpht: editHpht,
        golonganDarah: editGolonganDarah || undefined,
      });

      setBumils((prev) =>
        prev.map((b) => (b.id === selectedBumilForEdit!.id ? updatedBumil : b))
      );
      setIsEditModalOpen(false);
      setSelectedBumilForEdit(null);
    } catch (err: any) {
      setEditFormError(err.message || "Gagal memperbarui data ibu hamil");
    } finally {
      setIsSubmittingEdit(false);
    }
  };

  const handleConfirmDelete = (bumil: IbuHamil) => {
    setBumilToDelete(bumil);
  };

  const handleDelete = async () => {
    if (!bumilToDelete) return;
    setIsDeleting(true);
    try {
      await deleteIbuHamil(bumilToDelete.id);
      setBumils((prev) => prev.filter((b) => b.id !== bumilToDelete.id));
      setBumilToDelete(null);
    } catch (err: any) {
      alert(err.message || "Gagal menghapus data ibu hamil");
    } finally {
      setIsDeleting(false);
    }
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
                    <th className="px-6 py-4 bg-secondary-container">
                      Usia Ibu
                    </th>
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
                            className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                              bumil.postBirthRecord
                                ? "bg-teal-50 text-teal-700 border border-teal-200"
                                : "bg-amber-50 text-amber-700 border border-amber-200"
                            }`}
                          >
                            {bumil.postBirthRecord ? "Melahirkan" : "Belum"}
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
                          <div className="flex justify-end items-center gap-2">
                            <Link href={`/dashboard/ibu-hamil/${bumil.id}`}>
                              <button className="px-3 py-1.5 bg-secondary-container hover:bg-tertiary/10 text-tertiary font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1">
                                <span className="material-symbols-outlined text-[14px]">visibility</span>
                                <span>Detail</span>
                              </button>
                            </Link>
                            <button
                              onClick={() => handleEdit(bumil)}
                              className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-on-surface font-bold text-xs rounded-lg transition cursor-pointer flex items-center gap-1"
                            >
                              <span className="material-symbols-outlined text-[14px]">edit</span>
                              <span>Edit</span>
                            </button>
                            <button
                              onClick={() => handleConfirmDelete(bumil)}
                              className="w-8 h-8 rounded-lg hover:bg-error-container text-error flex items-center justify-center transition cursor-pointer"
                              title="Hapus"
                            >
                              <span className="material-symbols-outlined text-[18px]">delete</span>
                            </button>
                          </div>
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
      <Dialog isOpen={isModalOpen} onClose={handleCloseModal}>
        <form
          onSubmit={handleRegisterBumil}
          className="flex flex-col max-h-[85vh] overflow-hidden"
        >
          <DialogHeader>
            <DialogTitle className="text-center font-headline text-lg font-bold">Daftarkan Ibu Hamil</DialogTitle>
            <DialogDescription className="text-center mt-1">
              {stage === 1
                ? "Apakah Anda ingin menggunakan data Kartu Keluarga (KK) yang sudah terdaftar?"
                : "Pilih nomor KK terdaftar untuk mengambil data Ibu."}
            </DialogDescription>
          </DialogHeader>

          <DialogContent className={`py-4 transition-all duration-300 ${stage === 2 ? "min-h-[420px]" : ""}`}>
            {formError && (
              <div className="text-xs font-semibold text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {formError}
              </div>
            )}

            {stage === 2 && (
              <div className="space-y-4 relative" ref={dropdownRef}>
                <div className="space-y-2">
                  <Label>Pilih Nomor KK</Label>
                  
                  {/* Custom Select Button */}
                  <button
                    type="button"
                    onClick={() => setIsOpenKkDropdown(!isOpenKkDropdown)}
                    className="w-full min-h-[58px] rounded-xl border border-outline-variant/40 px-4 py-2.5 text-left bg-white shadow-sm flex items-center justify-between cursor-pointer hover:border-primary/50 transition-all focus:outline-none"
                  >
                    {noKk ? (
                      (() => {
                        const selectedObj = kks.find((k) => k.noKk === noKk);
                        return (
                          <div className="flex flex-col gap-0.5">
                            <span className="font-headline font-bold text-sm text-on-surface">
                              No. KK: {noKk}
                            </span>
                            <span className="text-xs text-on-surface-variant">
                              Ayah: {selectedObj?.namaAyah || "-"} | Ibu: {selectedObj?.namaIbu || "-"}
                            </span>
                          </div>
                        );
                      })()
                    ) : (
                      <span className="text-sm text-on-surface-variant/70">
                        -- Pilih Nomor KK --
                      </span>
                    )}
                    <span className="material-symbols-outlined text-on-surface-variant">
                      {isOpenKkDropdown ? "keyboard_arrow_up" : "keyboard_arrow_down"}
                    </span>
                  </button>

                  {/* Dropdown Menu Card */}
                  {isOpenKkDropdown && (
                    <div className="absolute left-0 right-0 z-50 mt-1 bg-white border border-outline-variant/30 rounded-xl shadow-xl overflow-hidden flex flex-col max-h-[320px]">
                      {/* Search Box */}
                      <div className="p-2 border-b border-outline-variant/10 bg-slate-50/80">
                        <input
                          type="text"
                          placeholder="Cari Nomor KK, nama Ayah atau Ibu..."
                          value={kkSearchQuery}
                          onChange={(e) => setKkSearchQuery(e.target.value)}
                          className="w-full h-9 rounded-lg border border-outline-variant/40 px-3 text-xs bg-white focus:outline-none focus:border-primary"
                        />
                      </div>

                      {/* KK Items List */}
                      <div className="overflow-y-auto flex-1 divide-y divide-outline-variant/10">
                        {kks
                          .filter((k) => {
                            const query = kkSearchQuery.toLowerCase();
                            return (
                              k.noKk.toLowerCase().includes(query) ||
                              (k.namaAyah || "").toLowerCase().includes(query) ||
                              (k.namaIbu || "").toLowerCase().includes(query)
                            );
                          })
                          .map((k) => (
                            <button
                              key={k.noKk}
                              type="button"
                              onClick={() => {
                                setNoKk(k.noKk);
                                setNik(k.nikIbu || "");
                                setNama(k.namaIbu || "");
                                setTempatLahir(k.tempatLahirIbu || "");
                                setTanggalLahir(k.tanggalLahirIbu || "");
                                setIsOpenKkDropdown(false);
                                setKkSearchQuery("");
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-slate-50 transition-colors flex flex-col gap-1 ${
                                noKk === k.noKk ? "bg-primary/5 hover:bg-primary/10" : ""
                              }`}
                            >
                              <div className="flex justify-between items-center">
                                <span className="font-bold text-xs text-primary">
                                  {k.noKk}
                                </span>
                                {k.rt && k.rw && (
                                  <span className="text-[10px] bg-slate-100 px-1.5 py-0.5 rounded text-on-surface-variant font-semibold">
                                    RT {k.rt} / RW {k.rw}
                                  </span>
                                )}
                              </div>
                              <div className="text-[11px] text-on-surface-variant flex flex-wrap gap-x-2">
                                <span>👨 Ayah: <strong className="text-on-surface">{k.namaAyah || "-"}</strong></span>
                                <span className="text-slate-300">|</span>
                                <span>👩 Ibu: <strong className="text-on-surface">{k.namaIbu || "-"}</strong></span>
                              </div>
                            </button>
                          ))}
                      </div>
                    </div>
                  )}
                </div>

                {noKk && (() => {
                  const selectedObj = kks.find((k) => k.noKk === noKk);
                  const hasMother = !!(selectedObj?.namaIbu && selectedObj?.nikIbu);
                  
                  if (!hasMother) {
                    return (
                      <div className="text-xs font-semibold text-amber-700 bg-amber-50 p-3.5 rounded-xl border border-amber-200">
                        ⚠️ Peringatan: Kartu Keluarga ini tidak memiliki data Ibu/Istri. 
                        Silakan tambahkan data Ibu di KK Terdaftar terlebih dahulu, atau gunakan KK Baru.
                      </div>
                    );
                  }

                  return (
                    <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 border border-outline-variant/30 animate-in fade-in duration-200">
                      <div className="grid grid-cols-2 gap-2 text-xs">
                        <div>
                          <span className="text-on-surface-variant font-semibold">Nama Ibu:</span>
                          <p className="font-bold text-on-surface mt-0.5">{selectedObj.namaIbu}</p>
                        </div>
                        <div>
                          <span className="text-on-surface-variant font-semibold">NIK Ibu:</span>
                          <p className="font-bold text-on-surface mt-0.5">{selectedObj.nikIbu}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 gap-3 border-t border-outline-variant/10 pt-3">
                        <div className="space-y-1.5">
                          <Label htmlFor="modal_tanggal_pemeriksaan">
                            Tanggal Pemeriksaan *
                          </Label>
                          <Input
                            id="modal_tanggal_pemeriksaan"
                            type="date"
                            value={tanggalPemeriksaan}
                            max={new Date().toISOString().split("T")[0]}
                            onChange={(e) => setTanggalPemeriksaan(e.target.value)}
                            required
                          />
                        </div>

                        <div className="space-y-1.5">
                          <Label htmlFor="modal_hpht">
                            Hari Pertama Haid Terakhir (HPHT) *
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
                    </div>
                  );
                })()}
              </div>
            )}
          </DialogContent>

          <DialogFooter className="sm:justify-center gap-2 pt-2 border-t border-outline-variant/10">
            {stage === 1 ? (
              <>
                <Button
                  type="button"
                  onClick={handleNoKk}
                  variant="outline"
                  className="w-full sm:w-auto font-semibold"
                >
                  Tidak, saya ingin KK baru
                </Button>
                <Button
                  type="button"
                  onClick={() => setStage(2)}
                  className="w-full sm:w-auto font-bold bg-primary hover:bg-primary/95 text-white"
                >
                  Ya, Gunakan data KK yang ada
                </Button>
              </>
            ) : (
              <>
                <Button
                  type="button"
                  onClick={() => {
                    setStage(1);
                    setNoKk("");
                    setNik("");
                    setNama("");
                  }}
                  variant="outline"
                  className="w-full sm:w-auto font-semibold"
                >
                  Kembali
                </Button>
                <Button
                  type="submit"
                  disabled={isSubmitting || !noKk || !hpht || !(() => {
                    const selectedObj = kks.find((k) => k.noKk === noKk);
                    return !!(selectedObj?.namaIbu && selectedObj?.nikIbu);
                  })()}
                  className="w-full sm:w-auto font-bold bg-tertiary hover:bg-tertiary/95 text-white"
                >
                  {isSubmitting ? "Menyimpan..." : "Konfirmasi & Simpan"}
                </Button>
              </>
            )}
          </DialogFooter>
        </form>
      </Dialog>

      {/* Edit Ibu Hamil Modal */}
      <Dialog isOpen={isEditModalOpen} onClose={() => setIsEditModalOpen(false)}>
        <form
          onSubmit={handleSaveEdit}
          className="flex flex-col max-h-[85vh] overflow-hidden"
        >
          <DialogHeader>
            <DialogTitle className="text-center font-headline text-lg font-bold">Ubah Data Ibu Hamil</DialogTitle>
            <DialogDescription className="text-center mt-1">
              Ubah data identitas ibu dan tanggal HPHT kehamilan.
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="py-4 space-y-4 overflow-y-auto">
            {editFormError && (
              <div className="text-xs font-semibold text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {editFormError}
              </div>
            )}

            <div className="space-y-1.5">
              <Label htmlFor="edit_nik">NIK Ibu</Label>
              <Input
                id="edit_nik"
                value={editNik}
                disabled
                className="bg-slate-50 cursor-not-allowed"
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_nama">Nama Lengkap Ibu *</Label>
              <Input
                id="edit_nama"
                value={editNama}
                disabled
                className="bg-slate-50 cursor-not-allowed"
              />
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div className="space-y-1.5">
                <Label htmlFor="edit_tempat_lahir">Tempat Lahir *</Label>
                <Input
                  id="edit_tempat_lahir"
                  value={editTempatLahir}
                  disabled
                  className="bg-slate-50 cursor-not-allowed"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="edit_tanggal_lahir">Tanggal Lahir *</Label>
                <Input
                  id="edit_tanggal_lahir"
                  type="date"
                  value={editTanggalLahir}
                  disabled
                  className="bg-slate-50 cursor-not-allowed"
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="edit_hpht">
                Hari Pertama Haid Terakhir (HPHT) *
              </Label>
              <Input
                id="edit_hpht"
                type="date"
                value={editHpht}
                max={new Date().toISOString().split("T")[0]}
                onChange={(e) => setEditHpht(e.target.value)}
                required
              />
            </div>

            <div className="space-y-1.5">
              <Label>Golongan Darah</Label>
              <div className="flex gap-1.5">
                {["", "A", "B", "AB", "O"].map((type) => (
                  <button
                    key={type}
                    type="button"
                    disabled
                    className={`flex-1 h-10 text-xs font-bold rounded-xl border transition-all cursor-not-allowed ${
                      editGolonganDarah === type
                        ? "bg-tertiary/75 text-white/90 border-tertiary shadow-sm"
                        : "bg-slate-50 text-on-surface-variant/50 border-outline-variant/20"
                    }`}
                  >
                    {type || "-"}
                  </button>
                ))}
              </div>
            </div>
          </DialogContent>

          <DialogFooter className="sm:justify-end gap-2 pt-2 border-t border-outline-variant/10">
            <Button
              type="button"
              onClick={() => setIsEditModalOpen(false)}
              variant="outline"
              className="w-full sm:w-auto font-semibold"
            >
              Batal
            </Button>
            <Button
              type="submit"
              disabled={isSubmittingEdit}
              className="w-full sm:w-auto font-bold bg-tertiary hover:bg-tertiary/95 text-white"
            >
              {isSubmittingEdit ? "Menyimpan..." : "Simpan Perubahan"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Delete Confirmation Modal */}
      {bumilToDelete && (
        <Dialog isOpen={!!bumilToDelete} onClose={() => setBumilToDelete(null)}>
          <DialogHeader>
            <DialogTitle className="text-center font-headline text-lg font-bold">
              Konfirmasi Hapus Data Kehamilan
            </DialogTitle>
            <DialogDescription className="text-center mt-1">
              Apakah Anda yakin ingin menghapus data kehamilan untuk <strong>{bumilToDelete.nama}</strong>? 
              Tindakan ini akan menghapus seluruh data pemeriksaan ANC yang berkaitan dengan episode kehamilan ini dan tidak dapat dibatalkan.
            </DialogDescription>
          </DialogHeader>

          <DialogFooter>
            <Button
              type="button"
              variant="ghost"
              onClick={() => setBumilToDelete(null)}
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
