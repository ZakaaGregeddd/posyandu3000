"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import {
  getBalitaById,
  updateBalita,
  getBalitaRecords,
  addBalitaRecord,
  updateBalitaRecord,
  deleteBalitaRecord,
  getKKs,
  Balita,
  BalitaRecord,
  StatusHidup,
} from "@/lib/fetch/balita";
import { calculateAge, isRecordEntryLocked } from "@/lib/utils/health";

// ---------------------------------------------------------------------------
// Konfirmasi & Toast generik - menggantikan window.confirm()/alert() bawaan
// browser (yang menampilkan "localhost says") dengan modal & notifikasi
// yang konsisten dengan desain aplikasi.
// ---------------------------------------------------------------------------
interface ConfirmState {
  title: string;
  message: string;
  confirmLabel?: string;
  variant?: "danger" | "default";
  onConfirm: () => void;
}

interface ToastState {
  type: "error" | "success";
  message: string;
}

export default function BalitaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);

  // States
  const [balita, setBalita] = useState<Balita | null>(null);
  const [records, setRecords] = useState<BalitaRecord[]>([]);
  const [alamatKk, setAlamatKk] = useState("-");
  const [ttlAyah, setTtlAyah] = useState("-");
  const [ttlIbu, setTtlIbu] = useState("-");
  const [isLoading, setIsLoading] = useState(true);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  // Konfirmasi & toast
  const [confirmState, setConfirmState] = useState<ConfirmState | null>(null);
  const [isConfirmSubmitting, setIsConfirmSubmitting] = useState(false);
  const [toast, setToast] = useState<ToastState | null>(null);

  // Ubah Status Hidup modal (menggantikan window.confirm + window.prompt)
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [statusTarget, setStatusTarget] = useState<StatusHidup>("Meninggal");
  const [statusTanggalMeninggal, setStatusTanggalMeninggal] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [statusPenyebab, setStatusPenyebab] = useState("");
  const [isSubmittingStatus, setIsSubmittingStatus] = useState(false);

  // Exam Form States (dipakai untuk TAMBAH & EDIT - lihat editingRecordId)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [tanggalPemeriksaan, setTanggalPemeriksaan] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [tinggiBadan, setTinggiBadan] = useState("");
  const [beratBadan, setBeratBadan] = useState("");
  const [lingkarKepala, setLingkarKepala] = useState("");
  const [lingkarLengan, setLingkarLengan] = useState("");
  const [imunisasi, setImunisasi] = useState("-");
  const [obatVitamin, setObatVitamin] = useState("-");
  const [formError, setFormError] = useState("");

  // Auto-dismiss toast setelah beberapa detik
  useEffect(() => {
    if (!toast) return;
    const t = setTimeout(() => setToast(null), 4000);
    return () => clearTimeout(t);
  }, [toast]);

  // Resolve params (Next.js 15 async params)
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    let active = true;

    (async () => {
      try {
        const data = await getBalitaById(id);
        if (!active) return;

        if (!data) {
          router.push("/dashboard/balita");
          return;
        }
        setBalita(data);

        const kks = await getKKs();
        const kk = kks.find((k) => k.noKk === data.noKk);
        if (active && kk) {
          const rtRw =
            kk.rt || kk.rw ? `, RT ${kk.rt || "-"}/RW ${kk.rw || "-"}` : "";
          setAlamatKk(`${kk.alamat || "-"}${rtRw}`);

          // TTL Ayah/Ibu diambil langsung dari data KK (bukan dari view
          // v_balita_lengkap yang kolom ttl_ayah/ttl_ibu-nya kosong),
          // karena getKKs() sudah mengembalikan tempatLahirAyah/Ibu dan
          // tanggalLahirAyah/Ibu lewat join ke tabel individu.
          if (kk.tempatLahirAyah || kk.tanggalLahirAyah) {
            const tglAyah = kk.tanggalLahirAyah
              ? new Date(kk.tanggalLahirAyah).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "-";
            setTtlAyah(`${kk.tempatLahirAyah || "-"}, ${tglAyah}`);
          }

          if (kk.tempatLahirIbu || kk.tanggalLahirIbu) {
            const tglIbu = kk.tanggalLahirIbu
              ? new Date(kk.tanggalLahirIbu).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })
              : "-";
            setTtlIbu(`${kk.tempatLahirIbu || "-"}, ${tglIbu}`);
          }
        }

        const recs = await getBalitaRecords(id);
        if (active) setRecords(recs);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, router]);

  if (isLoading || !balita) {
    return (
      <div className="flex-1 flex items-center justify-center min-h-[300px]">
        <div className="flex flex-col items-center gap-4">
          <span
            className="material-symbols-outlined text-5xl text-tertiary animate-heartbeat"
            style={{ fontVariationSettings: "'FILL' 1" }}
          >
            favorite
          </span>
          <div className="w-24 h-1 bg-tertiary-fixed rounded-full overflow-hidden relative">
            <div className="absolute top-0 left-0 h-full w-full bg-tertiary rounded-full animate-progress-slide" />
          </div>
        </div>
      </div>
    );
  }

  const age = calculateAge(balita.tanggalLahir);
  const isLocked = isRecordEntryLocked(balita.tanggalLahir, "balita");
  const isDeceased = balita.statusHidup === "Meninggal";
  const canAddRecord = !isLocked && !isDeceased;

  // Handle status update
  const handleStatusChange = async (
    status: StatusHidup,
    tanggal?: string,
    penyebab?: string,
  ) => {
    try {
      const updated = await updateBalita({
        id: balita.id,
        statusHidup: status,
        tanggalMeninggal: tanggal,
        penyebabMeninggal: penyebab,
      });
      setBalita(updated);
      setToast({ type: "success", message: "Status hidup berhasil diubah." });
    } catch (err: any) {
      setToast({
        type: "error",
        message: err.message || "Gagal mengubah status",
      });
    }
  };

  // Buka modal "Ubah Status Hidup" (menggantikan window.confirm + window.prompt)
  const openStatusModal = () => {
    setIsMenuOpen(false);
    const target: StatusHidup =
      balita.statusHidup === "Hidup" ? "Meninggal" : "Hidup";
    setStatusTarget(target);
    setStatusTanggalMeninggal(new Date().toISOString().split("T")[0]);
    setStatusPenyebab("");
    setIsStatusModalOpen(true);
  };

  const handleConfirmStatusChange = async () => {
    setIsSubmittingStatus(true);
    try {
      if (statusTarget === "Meninggal") {
        await handleStatusChange(
          "Meninggal",
          statusTanggalMeninggal,
          statusPenyebab,
        );
      } else {
        await handleStatusChange("Hidup");
      }
      setIsStatusModalOpen(false);
    } finally {
      setIsSubmittingStatus(false);
    }
  };

  // Handle new/edit exam record (submit tunggal, tergantung editingRecordId)
  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError("");

    if (
      !tanggalPemeriksaan ||
      !tinggiBadan ||
      !beratBadan ||
      !lingkarKepala ||
      !lingkarLengan
    ) {
      setFormError("Semua parameter vital wajib diisi");
      return;
    }

    const tbNum = parseFloat(tinggiBadan);
    const bbNum = parseFloat(beratBadan);
    const lkNum = parseFloat(lingkarKepala);
    const llNum = parseFloat(lingkarLengan);

    if (isNaN(tbNum) || tbNum <= 0 || isNaN(bbNum) || bbNum <= 0) {
      setFormError("Tinggi dan Berat badan harus bernilai positif");
      return;
    }

    setIsSubmittingExam(true);

    try {
      if (editingRecordId) {
        // IMT tidak dikirim - dihitung ulang otomatis oleh database.
        const updatedRec = await updateBalitaRecord({
          id: editingRecordId,
          tanggalPemeriksaan,
          tinggiBadan: tbNum,
          beratBadan: bbNum,
          lingkarKepala: lkNum,
          lingkarLengan: llNum,
          imunisasi,
          obatVitamin,
        });

        setRecords((prev) =>
          prev
            .map((r) => (r.id === editingRecordId ? updatedRec : r))
            .sort(
              (a, b) =>
                new Date(a.tanggalPemeriksaan).getTime() -
                new Date(b.tanggalPemeriksaan).getTime(),
            ),
        );
      } else {
        const newRec = await addBalitaRecord({
          balitaId: balita.id,
          tanggalPemeriksaan,
          tinggiBadan: tbNum,
          beratBadan: bbNum,
          lingkarKepala: lkNum,
          lingkarLengan: llNum,
          imunisasi,
          obatVitamin,
        });

        setRecords((prev) =>
          [...prev, newRec].sort(
            (a, b) =>
              new Date(a.tanggalPemeriksaan).getTime() -
              new Date(b.tanggalPemeriksaan).getTime(),
          ),
        );
      }

      setIsExamModalOpen(false);
      resetForm();
    } catch (err: any) {
      setFormError(
        err.message ||
          (editingRecordId
            ? "Gagal menyimpan perubahan pemeriksaan"
            : "Gagal menyimpan pemeriksaan"),
      );
    } finally {
      setIsSubmittingExam(false);
    }
  };

  const resetForm = () => {
    setEditingRecordId(null);
    setTanggalPemeriksaan(new Date().toISOString().split("T")[0]);
    setTinggiBadan("");
    setBeratBadan("");
    setLingkarKepala("");
    setLingkarLengan("");
    setImunisasi("-");
    setObatVitamin("-");
    setFormError("");
  };

  const openAddExamModal = () => {
    resetForm();
    setIsExamModalOpen(true);
  };

  const openEditExamModal = (r: BalitaRecord) => {
    setEditingRecordId(r.id);
    setTanggalPemeriksaan(r.tanggalPemeriksaan.split("T")[0]);
    setTinggiBadan(String(r.tinggiBadan));
    setBeratBadan(String(r.beratBadan));
    setLingkarKepala(String(r.lingkarKepala));
    setLingkarLengan(String(r.lingkarLengan));
    setImunisasi(r.imunisasi || "-");
    setObatVitamin(r.obatVitamin || "-");
    setFormError("");
    setIsExamModalOpen(true);
  };

  const handleDeleteRecord = (recordId: string) => {
    setConfirmState({
      title: "Hapus Data Pemeriksaan",
      message:
        "Apakah Anda yakin ingin menghapus data pemeriksaan ini? Tindakan ini tidak dapat dibatalkan.",
      confirmLabel: "Hapus",
      variant: "danger",
      onConfirm: async () => {
        setIsConfirmSubmitting(true);
        try {
          await deleteBalitaRecord(recordId);
          setRecords((prev) => prev.filter((r) => r.id !== recordId));
          setToast({
            type: "success",
            message: "Data pemeriksaan berhasil dihapus.",
          });
          setConfirmState(null);
        } catch (err: any) {
          setToast({
            type: "error",
            message: err.message || "Gagal menghapus data pemeriksaan",
          });
        } finally {
          setIsConfirmSubmitting(false);
        }
      },
    });
  };

  // Formatting chart data
  const chartData = records.map((r) => ({
    tanggal: new Date(r.tanggalPemeriksaan).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
    "Berat Badan": r.beratBadan,
    "Panjang Badan": r.tinggiBadan,
    "Lingkar Lengan": r.lingkarLengan,
    "Lingkar Kepala": r.lingkarKepala,
  }));

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Profile Card Section */}
      <section className="glass-card rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="space-y-4">
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface uppercase">
              {balita.nama}
            </h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block px-3 py-1 bg-tertiary-fixed text-black rounded-full text-xs font-bold tracking-wider">
                {age.totalMonths <= 12 ? "Bayi" : "Balita"}
              </span>
              <span
                className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                  balita.statusHidup === "Hidup"
                    ? "bg-teal-50 text-teal-700 border border-teal-200"
                    : "bg-red-50 text-red-700 border border-red-200"
                }`}
              >
                {balita.statusHidup}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
            <span className="material-symbols-outlined text-tertiary text-sm">
              location_on
            </span>
            <p>
              TTL: {balita.tempatLahir.toUpperCase()},{" "}
              {new Date(balita.tanggalLahir).toLocaleDateString("id-ID", {
                day: "numeric",
                month: "long",
                year: "numeric",
              })}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative">
          <Button
            onClick={openAddExamModal}
            disabled={!canAddRecord}
            className="flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-tertiary text-white hover:bg-[#8b224a] px-6 py-3 rounded-xl text-sm font-bold animate-all"
          >
            <span className="material-symbols-outlined text-sm">
              add_circle
            </span>
            <span>Update Pemeriksaan</span>
          </Button>

          {/* More options menu */}
          <div className="relative">
            <button
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 text-outline hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-outline-variant/20 z-20 overflow-hidden">
                <button
                  onClick={openStatusModal}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-on-surface hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm">
                    settings_heart
                  </span>
                  <span>Ubah Status Hidup</span>
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Warnings */}
      {isLocked && (
        <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl flex gap-2 items-start">
          <span className="material-symbols-outlined text-sm">lock</span>
          <p>
            Riwayat entri data dibekukan karena balita telah mencapai usia 5
            tahun ke atas.
          </p>
        </div>
      )}
      {isDeceased && (
        <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl flex gap-2 items-start">
          <span className="material-symbols-outlined text-sm">block</span>
          <p>Riwayat entri data dikunci karena status kematian anggota.</p>
        </div>
      )}

      {/* Grid Layout for Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Individu */}
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <h3 className="font-headline text-lg font-bold text-tertiary">
            Data Individu
          </h3>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="font-bold text-outline text-xs mb-1">
                Jenis Kelamin
              </p>
              <p className="font-semibold text-on-surface">
                {balita.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
              </p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">
                Golongan Darah
              </p>
              <p className="font-semibold text-on-surface">
                {balita.golonganDarah || "-"}
              </p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">
                Alamat (dari KK)
              </p>
              <p className="font-semibold text-on-surface">{alamatKk}</p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">Cara Lahir</p>
              <p className="font-semibold text-on-surface">
                {balita.caraLahir || "-"}
              </p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">
                Usia Kehamilan Saat Lahir
              </p>
              <p className="font-semibold text-on-surface">
                {balita.usiaKehamilanSaatLahirWeeks
                  ? `${balita.usiaKehamilanSaatLahirWeeks} week`
                  : "-"}
              </p>
            </div>
          </div>
        </div>

        {/* Data Orang Tua */}
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <h3 className="font-headline text-lg font-bold text-tertiary">
            Data Orang Tua
          </h3>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="font-bold text-outline text-xs mb-1">Nama Ayah</p>
              <p className="font-semibold text-on-surface">
                {(balita.namaAyah || "-").toUpperCase()}
              </p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">Nama Ibu</p>
              <p className="font-semibold text-on-surface">
                {(balita.namaIbu || "-").toUpperCase()}
              </p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">TTL Ayah</p>
              <p className="font-semibold text-on-surface">
                {ttlAyah.toUpperCase()}
              </p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">TTL Ibu</p>
              <p className="font-semibold text-on-surface">
                {ttlIbu.toUpperCase()}
              </p>
            </div>
          </div>
          <p className="text-xs text-on-surface-variant italic">
            Nama & TTL orang tua diambil dari data KK dan tidak diedit di
            halaman ini.
          </p>
        </div>
      </div>

      {/* Grafik Perkembangan */}
      {records.length > 0 && (
        <section className="space-y-6">
          <h3 className="font-headline text-xl font-bold text-on-surface">
            Grafik Perkembangan
          </h3>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weight Chart */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-bold text-sm text-on-surface mb-4">
                Berat Badan (kg)
              </h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="Berat Badan"
                      stroke="#ab2c5d"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Height Chart */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-bold text-sm text-on-surface mb-4">
                Panjang Badan (cm)
              </h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="Panjang Badan"
                      stroke="#0284c7"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Arm Chart */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-bold text-sm text-on-surface mb-4">
                Lingkar Lengan (cm)
              </h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="Lingkar Lengan"
                      stroke="#10b981"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Head Chart */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-bold text-sm text-on-surface mb-4">
                Lingkar Kepala (cm)
              </h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line
                      type="monotone"
                      dataKey="Lingkar Kepala"
                      stroke="#f59e0b"
                      strokeWidth={3}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Riwayat Pemeriksaan Section */}
      <section className="space-y-6">
        <h3 className="font-headline text-xl font-bold text-on-surface">
          Riwayat Pemeriksaan
        </h3>

        <div className="space-y-6">
          {records.length === 0 ? (
            <div className="glass-card p-8 text-center text-on-surface-variant font-medium rounded-2xl">
              Belum ada riwayat pemeriksaan.
            </div>
          ) : (
            records
              .slice()
              .reverse()
              .map((r, idx) => (
                <div
                  key={r.id}
                  className={`glass-card p-8 rounded-2xl space-y-6 relative ${
                    idx > 0
                      ? "opacity-85 hover:opacity-100 transition-opacity"
                      : ""
                  }`}
                >
                  <div className="flex justify-between items-start">
                    <div className="flex items-center gap-3">
                      <span className="material-symbols-outlined text-tertiary">
                        calendar_month
                      </span>
                      <p className="font-headline font-bold text-on-surface text-lg">
                        {new Date(r.tanggalPemeriksaan).toLocaleDateString(
                          "id-ID",
                          {
                            day: "numeric",
                            month: "long",
                            year: "numeric",
                          },
                        )}
                      </p>
                      {idx === 0 ? (
                        <span className="px-3 py-1 bg-secondary-container text-tertiary rounded-full text-xs font-bold">
                          Terbaru
                        </span>
                      ) : idx === records.length - 1 ? (
                        <span className="px-3 py-1 bg-secondary-container/50 text-on-surface-variant rounded-full text-xs font-semibold">
                          Lahir
                        </span>
                      ) : null}
                    </div>

                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => openEditExamModal(r)}
                        title="Edit data pemeriksaan"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-slate-100 hover:text-tertiary transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">
                          edit
                        </span>
                      </button>
                      <button
                        type="button"
                        onClick={() => handleDeleteRecord(r.id)}
                        title="Hapus data pemeriksaan"
                        className="w-8 h-8 rounded-full flex items-center justify-center text-on-surface-variant hover:bg-red-50 hover:text-red-600 transition-colors cursor-pointer"
                      >
                        <span className="material-symbols-outlined text-lg">
                          delete
                        </span>
                      </button>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-outline">
                        Berat Badan
                      </p>
                      <p className="text-sm font-bold text-on-surface">
                        {r.beratBadan} kg
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-outline">
                        Panjang Badan
                      </p>
                      <p className="text-sm font-bold text-on-surface">
                        {r.tinggiBadan} cm
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-outline">
                        Lingkar Lengan
                      </p>
                      <p className="text-sm font-bold text-on-surface">
                        {r.lingkarLengan} cm
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-outline">
                        Lingkar Kepala
                      </p>
                      <p className="text-sm font-bold text-on-surface">
                        {r.lingkarKepala} cm
                      </p>
                    </div>
                    <div className="space-y-1">
                      <p className="text-xs font-bold text-outline">IMT</p>
                      <p className="text-sm font-bold text-on-surface">
                        {r.imt}
                      </p>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <p className="text-xs font-bold text-outline">
                        Imunisasi
                      </p>
                      <p className="text-sm font-semibold text-on-surface">
                        {r.imunisasi || "-"}
                      </p>
                    </div>
                    <div className="col-span-2 space-y-2">
                      <p className="text-xs font-bold text-outline">
                        Pemberian Vitamin/Obat
                      </p>
                      <p className="text-sm font-semibold text-on-surface">
                        {r.obatVitamin || "-"}
                      </p>
                    </div>
                  </div>
                </div>
              ))
          )}
        </div>
      </section>

      {/* Add/Edit Examination Modal */}
      <Dialog
        isOpen={isExamModalOpen}
        onClose={() => {
          setIsExamModalOpen(false);
          resetForm();
        }}
      >
        <form
          onSubmit={handleSubmitExam}
          className="flex flex-col max-h-[85vh] overflow-hidden"
        >
          <DialogHeader>
            <DialogTitle>
              {editingRecordId
                ? "Edit Data Pemeriksaan"
                : "Update Pemeriksaan Balita"}
            </DialogTitle>
            <DialogDescription>
              {editingRecordId
                ? "Perbarui hasil pengukuran antropometri dan pemberian obat/vitamin untuk tanggal ini."
                : "Masukkan hasil pengukuran antropometri dan pemberian obat/vitamin terbaru."}
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
                <Label htmlFor="exam_date">Tanggal Pemeriksaan</Label>
                <Input
                  id="exam_date"
                  type="date"
                  value={tanggalPemeriksaan}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setTanggalPemeriksaan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam_tb">Tinggi Badan (cm)</Label>
                <Input
                  id="exam_tb"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 75.5"
                  value={tinggiBadan}
                  onChange={(e) => setTinggiBadan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam_bb">Berat Badan (kg)</Label>
                <Input
                  id="exam_bb"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 9.8"
                  value={beratBadan}
                  onChange={(e) => setBeratBadan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam_lk">Lingkar Kepala (cm)</Label>
                <Input
                  id="exam_lk"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 45.2"
                  value={lingkarKepala}
                  onChange={(e) => setLingkarKepala(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam_ll">Lingkar Lengan Atas (cm)</Label>
                <Input
                  id="exam_ll"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 14.5"
                  value={lingkarLengan}
                  onChange={(e) => setLingkarLengan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam_imunisasi">Imunisasi Diberikan</Label>
                <Input
                  id="exam_imunisasi"
                  placeholder="BCG / Polio / DPT / dll."
                  value={imunisasi}
                  onChange={(e) => setImunisasi(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="exam_vitamin">Pemberian Obat / Vitamin</Label>
                <Input
                  id="exam_vitamin"
                  placeholder="Vitamin A Merah / Obat Cacing / dll."
                  value={obatVitamin}
                  onChange={(e) => setObatVitamin(e.target.value)}
                />
              </div>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsExamModalOpen(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmittingExam}>
              {isSubmittingExam
                ? "Menyimpan..."
                : editingRecordId
                  ? "Simpan Perubahan"
                  : "Simpan Pemeriksaan"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Ubah Status Hidup Modal (pengganti window.confirm + window.prompt) */}
      <Dialog
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
      >
        <div className="flex flex-col max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Ubah Status Hidup</DialogTitle>
            <DialogDescription>
              {statusTarget === "Meninggal"
                ? "Anggota ini akan ditandai sebagai Meninggal. Isi tanggal dan penyebab (opsional) di bawah."
                : `Status anggota akan diubah kembali menjadi "Hidup".`}
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-4">
            {statusTarget === "Meninggal" && (
              <>
                <div className="space-y-1.5">
                  <Label htmlFor="status_tanggal">Tanggal Meninggal</Label>
                  <Input
                    id="status_tanggal"
                    type="date"
                    value={statusTanggalMeninggal}
                    max={new Date().toISOString().split("T")[0]}
                    onChange={(e) => setStatusTanggalMeninggal(e.target.value)}
                  />
                </div>
                <div className="space-y-1.5">
                  <Label htmlFor="status_penyebab">
                    Penyebab Meninggal (Opsional)
                  </Label>
                  <Input
                    id="status_penyebab"
                    placeholder="Contoh: Sakit, kecelakaan, dll."
                    value={statusPenyebab}
                    onChange={(e) => setStatusPenyebab(e.target.value)}
                  />
                </div>
              </>
            )}
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="button"
              onClick={handleConfirmStatusChange}
              disabled={isSubmittingStatus}
              className={
                statusTarget === "Meninggal"
                  ? "bg-red-600 hover:bg-red-700"
                  : ""
              }
            >
              {isSubmittingStatus ? "Menyimpan..." : "Konfirmasi"}
            </Button>
          </DialogFooter>
        </div>
      </Dialog>

      {/* Modal Konfirmasi generik (pengganti window.confirm) */}
      <Dialog isOpen={!!confirmState} onClose={() => setConfirmState(null)}>
        {confirmState && (
          <div className="flex flex-col max-h-[85vh] overflow-hidden">
            <DialogHeader>
              <DialogTitle>{confirmState.title}</DialogTitle>
              <DialogDescription>{confirmState.message}</DialogDescription>
            </DialogHeader>

            <DialogFooter>
              <Button
                type="button"
                variant="outline"
                onClick={() => setConfirmState(null)}
                disabled={isConfirmSubmitting}
              >
                Batal
              </Button>
              <Button
                type="button"
                onClick={confirmState.onConfirm}
                disabled={isConfirmSubmitting}
                className={
                  confirmState.variant === "danger"
                    ? "bg-red-600 hover:bg-red-700"
                    : ""
                }
              >
                {isConfirmSubmitting
                  ? "Memproses..."
                  : confirmState.confirmLabel || "Konfirmasi"}
              </Button>
            </DialogFooter>
          </div>
        )}
      </Dialog>

      {/* Toast notifikasi (pengganti window.alert) */}
      {toast && (
        <div
          className={`fixed bottom-6 right-6 z-50 max-w-sm rounded-xl shadow-lg border px-4 py-3 flex items-start gap-3 animate-in fade-in slide-in-from-bottom-2 duration-200 ${
            toast.type === "error"
              ? "bg-red-50 border-red-200 text-red-700"
              : "bg-teal-50 border-teal-200 text-teal-800"
          }`}
        >
          <span className="material-symbols-outlined text-lg">
            {toast.type === "error" ? "error" : "check_circle"}
          </span>
          <p className="text-sm font-semibold flex-1">{toast.message}</p>
          <button
            onClick={() => setToast(null)}
            className="text-current opacity-60 hover:opacity-100 cursor-pointer"
          >
            <span className="material-symbols-outlined text-base">close</span>
          </button>
        </div>
      )}
    </div>
  );
}
