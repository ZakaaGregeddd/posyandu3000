"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { addKK, AnggotaKeluargaInput } from "@/lib/fetch/keluarga";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";

export default function TambahKKPage() {
  const router = useRouter();

  // Form States
  const [noKk, setNoKk] = useState("");
  const [phone, setPhone] = useState("");
  const [alamat, setAlamat] = useState("");
  const [rt, setRt] = useState("");
  const [rw, setRw] = useState("");

  // Father States
  const [nikAyah, setNikAyah] = useState("");
  const [namaAyah, setNamaAyah] = useState("");
  const [tanggalLahirAyah, setTanggalLahirAyah] = useState("");
  const [tempatLahirAyah, setTempatLahirAyah] = useState("");
  const [telpAyah, setTelpAyah] = useState("");

  // Mother States
  const [nikIbu, setNikIbu] = useState("");
  const [namaIbu, setNamaIbu] = useState("");
  const [tanggalLahirIbu, setTanggalLahirIbu] = useState("");
  const [tempatLahirIbu, setTempatLahirIbu] = useState("");
  const [telpIbu, setTelpIbu] = useState("");
  const [anggotaList, setAnggotaList] = useState<AnggotaKeluargaInput[]>([]);

  const addAnggota = () => {
    setAnggotaList((prev) => [
      ...prev,
      { nama: "", tanggalLahir: "", tempatLahir: "", jenisKelamin: "L", statusKeluarga: "Anak", nik: "", noTelp: "" },
    ]);
  };

  const removeAnggota = (index: number) => {
    setAnggotaList((prev) => prev.filter((_, i) => i !== index));
  };

  const updateAnggota = (index: number, field: keyof AnggotaKeluargaInput, value: string) => {
    setAnggotaList((prev) =>
      prev.map((item, i) => (i === index ? { ...item, [field]: value } : item))
    );
  };

  // UI States
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [showSuccess, setShowSuccess] = useState(false);

  // Filter input to numbers only and max length
  const handleNumericInput = (
    val: string,
    maxLength: number,
    setter: (v: string) => void,
  ) => {
    const clean = val.replace(/[^0-9]/g, "").substring(0, maxLength);
    setter(clean);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");

    if (noKk.length !== 16) {
      setError("Nomor KK harus tepat 16 digit");
      return;
    }
    if (nikAyah && nikAyah.length !== 16) {
      setError("NIK Ayah harus tepat 16 digit");
      return;
    }
    if (nikIbu && nikIbu.length !== 16) {
      setError("NIK Ibu harus tepat 16 digit");
      return;
    }
    if (!namaAyah && !namaIbu) {
      setError(
        "Harap masukkan setidaknya nama salah satu orang tua (Ayah atau Ibu)",
      );
      return;
    }
    if (namaAyah && !tanggalLahirAyah) {
      setError("Tanggal lahir Ayah wajib diisi kalau nama Ayah diisi");
      return;
    }
    if (namaIbu && !tanggalLahirIbu) {
      setError("Tanggal lahir Ibu wajib diisi kalau nama Ibu diisi");
      return;
    }

    // Validate members
    for (let i = 0; i < anggotaList.length; i++) {
      const m = anggotaList[i];
      if (!m.nama) {
        setError(`Nama Lengkap anggota ke-${i + 1} wajib diisi`);
        return;
      }
      if (!m.tanggalLahir) {
        setError(`Tanggal Lahir anggota ke-${i + 1} wajib diisi`);
        return;
      }
      if (m.nik && m.nik.length !== 16) {
        setError(`NIK anggota ke-${i + 1} harus tepat 16 digit`);
        return;
      }
    }

    setLoading(true);

    try {
      await addKK({
        noKk,
        alamat: alamat || "Jl. Raya Posyandu",
        rt: rt || "01",
        rw: rw || "05",
        nikAyah: nikAyah || undefined,
        namaAyah: namaAyah || undefined,
        tanggalLahirAyah: tanggalLahirAyah || undefined,
        tempatLahirAyah: tempatLahirAyah || undefined,
        telpAyah: telpAyah || undefined,
        nikIbu: nikIbu || undefined,
        namaIbu: namaIbu || undefined,
        tanggalLahirIbu: tanggalLahirIbu || undefined,
        tempatLahirIbu: tempatLahirIbu || undefined,
        telpIbu: telpIbu || undefined,
        noTelp: phone || telpAyah || telpIbu || undefined,
        anggotaKeluarga: anggotaList.length > 0 ? anggotaList : undefined,
      });

      setLoading(false);
      setShowSuccess(true);
    } catch (err: any) {
      setError(err.message || "Gagal menyimpan KK baru");
      setLoading(false);
    }
  };

  const handleCloseSuccess = () => {
    setShowSuccess(false);
    router.push("/dashboard/kk-terdaftar");
  };

  return (
    <div className="max-w-6xl mx-auto w-full space-y-6 animate-in fade-in duration-300">
      {/* Header Section */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-end gap-4">
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-background">
            Registrasi Keluarga
          </h2>
          <p className="text-sm text-on-surface-variant mt-1 max-w-lg">
            Silakan masukkan data Kartu Keluarga baru untuk mempermudah
            pemantauan kesehatan anggota keluarga secara digital.
          </p>
        </div>
        <div className="flex gap-2">
          <span className="bg-secondary-container text-on-secondary-container px-4 py-2 rounded-full text-xs font-semibold flex items-center gap-2">
            <span className="material-symbols-outlined text-sm">info</span>
            Pastikan NIK sesuai KTP
          </span>
        </div>
      </div>

      {/* Form Card */}
      <Card className="relative overflow-hidden border border-outline-variant/30 bg-white">
        <div className="absolute top-0 right-0 w-32 h-32 bg-secondary-container/10 rounded-bl-full pointer-events-none" />

        <form onSubmit={handleSubmit} className="space-y-6 p-6 relative z-10">
          {error && (
            <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl">
              {error}
            </div>
          )}

          {/* Section 1: Informasi Kartu Keluarga */}
          <div className="space-y-4">
            <div className="border-b border-outline-variant/30 pb-2">
              <h3 className="font-headline text-md font-bold text-tertiary flex items-center gap-2">
                <span className="material-symbols-outlined">badge</span>
                Informasi Kartu Keluarga
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <div className="flex justify-between items-center">
                  <Label htmlFor="no_kk">No. Kartu Keluarga (KK)</Label>
                  <span
                    className={`text-[11px] font-semibold transition-all ${
                      noKk.length === 16
                        ? "text-teal-600 font-bold"
                        : "text-on-surface-variant/80"
                    }`}
                  >
                    {noKk.length} / 16 digit
                  </span>
                </div>
                <Input
                  id="no_kk"
                  placeholder="16 digit nomor KK"
                  value={noKk}
                  onChange={(e) =>
                    handleNumericInput(e.target.value, 16, setNoKk)
                  }
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="phone">Nomor Telepon Keluarga (Umum)</Label>
                <Input
                  id="phone"
                  placeholder="Contoh: 081234567890"
                  value={phone}
                  onChange={(e) =>
                    handleNumericInput(e.target.value, 13, setPhone)
                  }
                />
              </div>
            </div>
          </div>

          {/* Section 2: Identitas Orang Tua */}
          <div className="space-y-4">
            <div className="border-b border-outline-variant/30 pb-2">
              <h3 className="font-headline text-md font-bold text-tertiary flex items-center gap-2">
                <span className="material-symbols-outlined">
                  family_restroom
                </span>
                Identitas Orang Tua
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {/* Father's Card */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 border border-outline-variant/30">
                <h4 className="text-sm font-bold text-primary flex items-center gap-2 border-b border-outline-variant/10 pb-2">
                  <span className="material-symbols-outlined text-sky-500">
                    man
                  </span>
                  Data Ayah
                </h4>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="nik_ayah">NIK Ayah</Label>
                      <span
                        className={`text-[11px] font-semibold transition-all ${
                          nikAyah.length === 16
                            ? "text-teal-600 font-bold"
                            : "text-on-surface-variant/80"
                        }`}
                      >
                        {nikAyah.length} / 16 digit
                      </span>
                    </div>
                    <Input
                      id="nik_ayah"
                      placeholder="16 digit NIK Ayah"
                      value={nikAyah}
                      onChange={(e) =>
                        handleNumericInput(e.target.value, 16, setNikAyah)
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="nama_ayah">Nama Lengkap Ayah</Label>
                    <Input
                      id="nama_ayah"
                      placeholder="Nama sesuai KTP"
                      value={namaAyah}
                      onChange={(e) => setNamaAyah(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="tempat_lahir_ayah">Tempat Lahir</Label>
                      <Input
                        id="tempat_lahir_ayah"
                        placeholder="Kota Lahir"
                        value={tempatLahirAyah}
                        onChange={(e) => setTempatLahirAyah(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tgl_lahir_ayah">Tanggal Lahir</Label>
                      <Input
                        id="tgl_lahir_ayah"
                        type="date"
                        value={tanggalLahirAyah}
                        onChange={(e) => setTanggalLahirAyah(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="telp_ayah">No. Telp / WA Ayah</Label>
                    <Input
                      id="telp_ayah"
                      placeholder="No HP Ayah"
                      value={telpAyah}
                      onChange={(e) =>
                        handleNumericInput(e.target.value, 13, setTelpAyah)
                      }
                    />
                  </div>
                </div>
              </div>

              {/* Mother's Card */}
              <div className="space-y-4 p-4 rounded-xl bg-slate-50/50 border border-outline-variant/30">
                <h4 className="text-sm font-bold text-tertiary flex items-center gap-2 border-b border-outline-variant/10 pb-2">
                  <span className="material-symbols-outlined text-pink-500">
                    woman
                  </span>
                  Data Ibu
                </h4>

                <div className="space-y-3">
                  <div className="space-y-1.5">
                    <div className="flex justify-between items-center">
                      <Label htmlFor="nik_ibu">NIK Ibu</Label>
                      <span
                        className={`text-[11px] font-semibold transition-all ${
                          nikIbu.length === 16
                            ? "text-teal-600 font-bold"
                            : "text-on-surface-variant/80"
                        }`}
                      >
                        {nikIbu.length} / 16 digit
                      </span>
                    </div>
                    <Input
                      id="nik_ibu"
                      placeholder="16 digit NIK Ibu"
                      value={nikIbu}
                      onChange={(e) =>
                        handleNumericInput(e.target.value, 16, setNikIbu)
                      }
                    />
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="nama_ibu">Nama Lengkap Ibu</Label>
                    <Input
                      id="nama_ibu"
                      placeholder="Nama sesuai KTP"
                      value={namaIbu}
                      onChange={(e) => setNamaIbu(e.target.value)}
                    />
                  </div>

                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-1.5">
                      <Label htmlFor="tempat_lahir_ibu">Tempat Lahir</Label>
                      <Input
                        id="tempat_lahir_ibu"
                        placeholder="Kota Lahir"
                        value={tempatLahirIbu}
                        onChange={(e) => setTempatLahirIbu(e.target.value)}
                      />
                    </div>
                    <div className="space-y-1.5">
                      <Label htmlFor="tgl_lahir_ibu">Tanggal Lahir</Label>
                      <Input
                        id="tgl_lahir_ibu"
                        type="date"
                        value={tanggalLahirIbu}
                        onChange={(e) => setTanggalLahirIbu(e.target.value)}
                      />
                    </div>
                  </div>

                  <div className="space-y-1.5">
                    <Label htmlFor="telp_ibu">No. Telp / WA Ibu</Label>
                    <Input
                      id="telp_ibu"
                      placeholder="No HP Ibu"
                      value={telpIbu}
                      onChange={(e) =>
                        handleNumericInput(e.target.value, 13, setTelpIbu)
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Section: Anggota Keluarga */}
          <div className="space-y-4">
            <div className="border-b border-outline-variant/30 pb-2 flex justify-between items-center">
              <h3 className="font-headline text-md font-bold text-tertiary flex items-center gap-2">
                <span className="material-symbols-outlined">group</span>
                Anggota Keluarga Lainnya
              </h3>
              <Button
                type="button"
                onClick={addAnggota}
                variant="outline"
                className="flex items-center gap-2 border-primary text-primary hover:bg-primary/5 font-semibold text-xs"
              >
                <span className="material-symbols-outlined text-sm">add</span>
                <span>Tambah Anggota Keluarga</span>
              </Button>
            </div>

            {anggotaList.length === 0 ? (
              <div className="text-center py-6 border border-dashed border-outline-variant/60 rounded-xl bg-slate-50/30">
                <p className="text-sm text-on-surface-variant">Belum ada anggota keluarga tambahan. Klik tombol di atas untuk menambahkan.</p>
              </div>
            ) : (
              <div className="space-y-4">
                {anggotaList.map((m, idx) => (
                  <div key={idx} className="space-y-4 p-4 rounded-xl bg-slate-50/50 border border-outline-variant/30 relative">
                    <div className="flex justify-between items-center border-b border-outline-variant/10 pb-2">
                      <h4 className="text-sm font-bold text-primary flex items-center gap-2">
                        <span className="material-symbols-outlined text-sky-500">person</span>
                        Anggota Keluarga #{idx + 1}
                      </h4>
                      <Button
                        type="button"
                        onClick={() => removeAnggota(idx)}
                        variant="ghost"
                        className="text-red-600 hover:text-red-700 hover:bg-red-50 p-1 h-8 w-8 rounded-full"
                      >
                        <span className="material-symbols-outlined text-sm">delete</span>
                      </Button>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div className="space-y-1.5">
                        <div className="flex justify-between items-center">
                          <Label>NIK Anggota</Label>
                          <span className={`text-[10px] font-semibold ${m.nik?.length === 16 ? "text-teal-600 font-bold" : "text-on-surface-variant/80"}`}>
                            {m.nik?.length || 0} / 16 digit
                          </span>
                        </div>
                        <Input
                          placeholder="16 digit NIK"
                          value={m.nik || ""}
                          onChange={(e) => updateAnggota(idx, "nik", e.target.value.replace(/[^0-9]/g, "").substring(0, 16))}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Nama Lengkap *</Label>
                        <Input
                          placeholder="Nama Lengkap"
                          value={m.nama}
                          onChange={(e) => updateAnggota(idx, "nama", e.target.value)}
                          required
                        />
                      </div>


                      <div className="space-y-1.5">
                        <Label>Tempat Lahir</Label>
                        <Input
                          placeholder="Kota Lahir"
                          value={m.tempatLahir || ""}
                          onChange={(e) => updateAnggota(idx, "tempatLahir", e.target.value)}
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Tanggal Lahir *</Label>
                        <Input
                          type="date"
                          value={m.tanggalLahir}
                          onChange={(e) => updateAnggota(idx, "tanggalLahir", e.target.value)}
                          required
                        />
                      </div>

                      <div className="space-y-1.5">
                        <Label>Jenis Kelamin *</Label>
                        <select
                          value={m.jenisKelamin}
                          onChange={(e) => updateAnggota(idx, "jenisKelamin", e.target.value as "L" | "P")}
                          className="w-full h-10 rounded-lg border border-outline-variant/40 px-3 text-sm bg-white"
                        >
                          <option value="L">Laki-laki</option>
                          <option value="P">Perempuan</option>
                        </select>
                      </div>

                      <div className="space-y-1.5">
                        <Label>No. Telp / WA Anggota</Label>
                        <Input
                          placeholder="No. Telp"
                          value={m.noTelp || ""}
                          onChange={(e) => updateAnggota(idx, "noTelp", e.target.value.replace(/[^0-9]/g, "").substring(0, 13))}
                        />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Section 3: Alamat detail */}
          <div className="space-y-4">
            <div className="border-b border-outline-variant/30 pb-2">
              <h3 className="font-headline text-md font-bold text-tertiary flex items-center gap-2">
                <span className="material-symbols-outlined">home</span>
                Alamat Tinggal
              </h3>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="alamat">Alamat Lengkap</Label>
                <Input
                  id="alamat"
                  placeholder="Nama Jalan, Blok, No Rumah"
                  value={alamat}
                  onChange={(e) => setAlamat(e.target.value)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rt">RT</Label>
                <Input
                  id="rt"
                  placeholder="01"
                  value={rt}
                  onChange={(e) => handleNumericInput(e.target.value, 3, setRt)}
                />
              </div>
              <div className="space-y-1.5">
                <Label htmlFor="rw">RW</Label>
                <Input
                  id="rw"
                  placeholder="05"
                  value={rw}
                  onChange={(e) => handleNumericInput(e.target.value, 3, setRw)}
                />
              </div>
            </div>
          </div>

          {/* Submission Panel */}
          <div className="pt-4 flex w-full justify-between sm:justify-end gap-4 border-t border-outline-variant/30">
            <Button
              type="button"
              variant="outline"
              onClick={() => router.push("/dashboard/kk-terdaftar")}
              className="flex items-center justify-center flex-1 sm:flex-initial"
            >
              Batalkan
            </Button>

            <Button
              type="submit"
              disabled={loading}
              className="flex items-center justify-center gap-2 cursor-pointer bg-tertiary hover:bg-tertiary/90 text-white font-bold flex-1 sm:flex-initial"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
              ) : (
                <>
                  <span className="material-symbols-outlined">save</span>
                  <span>Simpan Data</span>
                </>
              )}
            </Button>
          </div>
        </form>
      </Card>

      {/* Success Modal */}
      <Dialog isOpen={showSuccess} onClose={handleCloseSuccess}>
        <DialogHeader>
          <div className="w-16 h-16 bg-green-50 border border-green-200 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4 animate-bounce">
            <span className="material-symbols-outlined text-4xl">
              check_circle
            </span>
          </div>
          <DialogTitle className="text-center text-green-700">
            Pendaftaran Berhasil!
          </DialogTitle>
          <DialogDescription className="text-center mt-1">
            Data Kartu Keluarga {noKk} telah berhasil disimpan ke dalam sistem
            Posyandu Digital.
          </DialogDescription>
        </DialogHeader>
        <DialogContent />
        <DialogFooter className="sm:justify-center">
          <Button onClick={handleCloseSuccess} className="w-full">
            Lihat KK Terdaftar
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
