"use client";

import React, { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { getBalitas, getKKs, Balita, KKOption } from "@/lib/fetch/balita";
import { calculateAge } from "@/lib/utils/health";
import BalitaTable from "@/components/balita/BalitaTable";
import TambahBalitaModal from "@/components/balita/TambahBalitaModal";

export default function BalitaPage() {
  const [balitas, setBalitas] = useState<Balita[]>([]);
  const [kks, setKks] = useState<KKOption[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [loadError, setLoadError] = useState("");
  const [searchTerm, setSearchTerm] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [currentPageBayi, setCurrentPageBayi] = useState(1);
  const [currentPageBalita, setCurrentPageBalita] = useState(1);
<<<<<<< HEAD
=======
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
  const [usiaKehamilanUnit, setUsiaKehamilanUnit] = useState<"minggu" | "tahun">("minggu");
  const [namaAyah, setNamaAyah] = useState("");
  const [namaIbu, setNamaIbu] = useState("");
  const [formError, setFormError] = useState("");
>>>>>>> 666352cf46373eaf70fd6d6274e030f7516150d9

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

<<<<<<< HEAD
=======
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
      const val = parseInt(usiaKehamilanSaatLahir);
      const ageInWeeks = isNaN(val) ? undefined : (usiaKehamilanUnit === "tahun" ? val * 52 : val);

      const newBalita = await addBalita({
        nama,
        tempatLahir,
        tanggalLahir,
        jenisKelamin,
        noKk,
        statusHidup: "Hidup",
        nik: nik || undefined,
        caraLahir: caraLahir || undefined,
        usiaKehamilanSaatLahirWeeks: ageInWeeks,
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
    setUsiaKehamilanUnit("minggu");
    setNamaAyah("");
    setNamaIbu("");
    setFormError("");
  };

  // Filter lists based on search and categories
>>>>>>> 666352cf46373eaf70fd6d6274e030f7516150d9
  const filteredBalitas = balitas.filter(
    (b) =>
      b.nama.toLowerCase().includes(searchTerm.toLowerCase()) ||
      b.noKk.includes(searchTerm),
  );

  const bayiList = filteredBalitas.filter(
    (b) => calculateAge(b.tanggalLahir).totalMonths <= 12,
  );
  const balitaList = filteredBalitas.filter(
    (b) => calculateAge(b.tanggalLahir).totalMonths > 12,
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
          <BalitaTable
            title="Data Bayi (0-12 Bulan)"
            icon="child_care"
            iconBgClass="bg-tertiary-fixed"
            list={bayiList}
            currentPage={currentPageBayi}
            onPageChange={setCurrentPageBayi}
            emptyMessage="Tidak ada data bayi ditemukan"
          />

          <BalitaTable
            title="Data Balita (1-5 Tahun)"
            icon="accessibility_new"
            iconBgClass="bg-secondary-container"
            list={balitaList}
            currentPage={currentPageBalita}
            onPageChange={setCurrentPageBalita}
            showLockBadge
            emptyMessage="Tidak ada data balita ditemukan"
          />
        </>
      )}

<<<<<<< HEAD
      <TambahBalitaModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        kks={kks}
        onSuccess={(newBalita) => setBalitas((prev) => [...prev, newBalita])}
      />
=======
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
                    const kk = kks.find(k => k.noKk === cleanVal);
                    if (kk) {
                      setNamaAyah(kk.namaAyah || "");
                      setNamaIbu(kk.namaIbu || "");
                    }
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
                <Label htmlFor="modal_nama_ayah">Nama Ayah</Label>
                <Input
                  id="modal_nama_ayah"
                  value={namaAyah}
                  onChange={(e) => setNamaAyah(e.target.value)}
                  placeholder="Nama Ayah"
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="modal_nama_ibu">Nama Ibu</Label>
                <Input
                  id="modal_nama_ibu"
                  value={namaIbu}
                  onChange={(e) => setNamaIbu(e.target.value)}
                  placeholder="Nama Ibu"
                />
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

              <div className="space-y-1.5 col-span-2 md:col-span-1">
                <Label htmlFor="modal_usia_kehamilan">Usia</Label>
                <div className="flex gap-2">
                  <Input
                    id="modal_usia_kehamilan"
                    type="number"
                    placeholder="Contoh: 38 atau 2"
                    value={usiaKehamilanSaatLahir}
                    onChange={(e) => setUsiaKehamilanSaatLahir(e.target.value)}
                    className="flex-1"
                  />
                  <select
                    value={usiaKehamilanUnit}
                    onChange={(e) => setUsiaKehamilanUnit(e.target.value as "minggu" | "tahun")}
                    className="rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all w-28"
                  >
                    <option value="minggu">minggu</option>
                    <option value="tahun">tahun</option>
                  </select>
                </div>
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
>>>>>>> 666352cf46373eaf70fd6d6274e030f7516150d9
    </div>
  );
}
