"use client";

import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import {
  Table,
  TableHeader,
  TableBody,
  TableRow,
  TableHead,
  TableCell,
} from "@/components/ui/table";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogContent,
  DialogFooter,
} from "@/components/ui/dialog";
import StatusHidupControl from "@/components/shared/StatusHidupControl";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import {
  getIbuHamilById,
  updateIbuHamil,
  getIbuHamilRecords,
  addIbuHamilRecord,
  updateIbuHamilRecord,
  deleteIbuHamilRecord,
  addPostBirthRecord,
  IbuHamil,
  IbuHamilRecord,
  StatusHidup,
} from "@/lib/fetch/ibuHamil";
import { calculateAge } from "@/lib/utils/health";

export default function IbuHamilDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);

  // States
  const [bumil, setBumil] = useState<IbuHamil | null>(null);
  const [records, setRecords] = useState<IbuHamilRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isBirthModalOpen, setIsBirthModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);
  const [isSubmittingBirth, setIsSubmittingBirth] = useState(false);

  // Exam Form States (dipakai untuk TAMBAH & EDIT - lihat editingRecordId)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);
  const [tanggalPemeriksaan, setTanggalPemeriksaan] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [beratBadan, setBeratBadan] = useState("");
  const [tinggiBadan, setTinggiBadan] = useState("");
  const [sistolik, setSistolik] = useState("");
  const [diastolik, setDiastolik] = useState("");
  const [usiaKehamilanWeeks, setUsiaKehamilanWeeks] = useState("");
  const [kunjunganKe, setKunjunganKe] = useState("1");
  const [vitamin, setVitamin] = useState("Asam Folat");
  const [examError, setExamError] = useState("");

  // Birth Form States
  const [babyNama, setBabyNama] = useState("");
  const [babyTempat, setBabyTempat] = useState("");
  const [babyTanggal, setBabyTanggal] = useState("");
  const [babyJk, setBabyJk] = useState<"L" | "P">("L");
  const [babyCara, setBabyCara] = useState<"Normal" | "SC">("Normal");
  const [babyGestationWeeks, setBabyGestationWeeks] = useState("39");
  const [babyGolonganDarah, setBabyGolonganDarah] = useState("");
  const [birthError, setBirthError] = useState("");

  // Resolve params (Next.js 15 async params)
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    let active = true;

    (async () => {
      try {
        const data = await getIbuHamilById(id);
        if (!active) return;

        if (!data) {
          router.push("/dashboard/ibu-hamil");
          return;
        }
        setBumil(data);

        const recs = await getIbuHamilRecords(id);
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

  if (isLoading || !bumil) {
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

  const age = calculateAge(bumil.tanggalLahir);
  const isDeceased = bumil.statusHidup === "Meninggal";
  const hasBorn = !!bumil.postBirthRecord;
  const canAddRecord = !isDeceased && !hasBorn;

  // HPL = HPHT + 280 days
  const calculateHPL = (hphtStr: string) => {
    const date = new Date(hphtStr);
    date.setDate(date.getDate() + 280);
    return date.toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    });
  };

  // Gestation Age helper
  const getGestationAge = (hphtStr: string) => {
    const hphtDate = new Date(hphtStr);
    const today = new Date();
    const diffTime = Math.abs(today.getTime() - hphtDate.getTime());
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
    const weeks = Math.floor(diffDays / 7);
    const remainingDays = diffDays % 7;
    return `${weeks} minggu ${remainingDays} hari`;
  };

  const handleStatusChange = async (
    status: StatusHidup,
    tanggal?: string,
    penyebab?: string,
  ) => {
    try {
      const updated = await updateIbuHamil({
        id: bumil.id,
        nik: bumil.nik,
        statusHidup: status,
        tanggalMeninggal: tanggal,
        penyebabMeninggal: penyebab,
      });
      setBumil(updated);
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status");
    }
  };

  // Handle new/edit exam record (submit tunggal, tergantung editingRecordId)
  const handleSubmitExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setExamError("");

    if (
      !tanggalPemeriksaan ||
      !beratBadan ||
      !tinggiBadan ||
      !sistolik ||
      !diastolik ||
      !usiaKehamilanWeeks
    ) {
      setExamError("Semua field pemeriksaan harus diisi");
      return;
    }

    const bbNum = parseFloat(beratBadan);
    const tbNum = parseFloat(tinggiBadan);
    const sisNum = parseInt(sistolik);
    const diaNum = parseInt(diastolik);
    const ukNum = parseInt(usiaKehamilanWeeks);

    if (
      isNaN(bbNum) ||
      bbNum <= 0 ||
      isNaN(tbNum) ||
      tbNum <= 0 ||
      isNaN(sisNum) ||
      isNaN(diaNum) ||
      isNaN(ukNum)
    ) {
      setExamError("Nilai numerik harus positif dan valid");
      return;
    }

    setIsSubmittingExam(true);

    try {
      if (editingRecordId) {
        const updatedRec = await updateIbuHamilRecord({
          id: editingRecordId,
          tanggalPemeriksaan,
          beratBadan: bbNum,
          tinggiBadan: tbNum,
          tekananDarahSistolik: sisNum,
          tekananDarahDiastolik: diaNum,
          usiaKehamilanWeeks: ukNum,
          kunjunganKe: parseInt(kunjunganKe),
          vitamin,
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
        const newRec = await addIbuHamilRecord({
          ibuHamilId: id!,
          tanggalPemeriksaan,
          beratBadan: bbNum,
          tinggiBadan: tbNum,
          tekananDarahSistolik: sisNum,
          tekananDarahDiastolik: diaNum,
          usiaKehamilanWeeks: ukNum,
          kunjunganKe: parseInt(kunjunganKe),
          vitamin,
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
      resetExamForm();
    } catch (err: any) {
      setExamError(
        err.message ||
          (editingRecordId
            ? "Gagal menyimpan perubahan pemeriksaan"
            : "Gagal menyimpan pemeriksaan"),
      );
    } finally {
      setIsSubmittingExam(false);
    }
  };

  const handleDeleteRecord = async (recordId: string) => {
    const confirmDel = window.confirm(
      "Apakah Anda yakin ingin menghapus data pemeriksaan ini?",
    );
    if (!confirmDel) return;

    try {
      await deleteIbuHamilRecord(recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (err: any) {
      alert(err.message || "Gagal menghapus data pemeriksaan");
    }
  };

  const handleAddBirth = async (e: React.FormEvent) => {
    e.preventDefault();
    setBirthError("");

    if (!babyNama || !babyTempat || !babyTanggal || !babyGestationWeeks) {
      setBirthError("Semua parameter kelahiran harus diisi");
      return;
    }

    setIsSubmittingBirth(true);

    try {
      const updated = await addPostBirthRecord(id!, {
        nama: babyNama,
        tempat: babyTempat,
        tanggalLahir: babyTanggal,
        jenisKelamin: babyJk,
        caraLahir: babyCara,
        usiaKehamilanSaatLahirWeeks: parseInt(babyGestationWeeks) || 39,
        golonganDarah: babyGolonganDarah || undefined,
      });

      setBumil(updated);
      setIsBirthModalOpen(false);
      alert(
        "Kelahiran terdaftar! Bayi baru telah otomatis ditambahkan ke database Balita.",
      );
    } catch (err: any) {
      setBirthError(err.message || "Gagal menyimpan data kelahiran");
    } finally {
      setIsSubmittingBirth(false);
    }
  };

  const resetExamForm = () => {
    setEditingRecordId(null);
    setTanggalPemeriksaan(new Date().toISOString().split("T")[0]);
    setBeratBadan("");
    setTinggiBadan("");
    setSistolik("");
    setDiastolik("");
    setUsiaKehamilanWeeks("");
    setKunjunganKe("1");
    setVitamin("Asam Folat");
    setExamError("");
  };

  const openAddExamModal = () => {
    resetExamForm();
    setIsExamModalOpen(true);
  };

  const openEditExamModal = (r: IbuHamilRecord) => {
    setEditingRecordId(r.id);
    setTanggalPemeriksaan(r.tanggalPemeriksaan.split("T")[0]);
    setBeratBadan(String(r.beratBadan));
    setTinggiBadan(r.tinggiBadan != null ? String(r.tinggiBadan) : "");
    setSistolik(String(r.tekananDarahSistolik));
    setDiastolik(String(r.tekananDarahDiastolik));
    setUsiaKehamilanWeeks(String(r.usiaKehamilanWeeks));
    setKunjunganKe(String(r.kunjunganKe));
    setVitamin(r.vitamin || "Asam Folat");
    setExamError("");
    setIsExamModalOpen(true);
  };

  const latestRecord = records[records.length - 1];

  // Chart data
  const chartData = records.map((r) => ({
    tanggal: new Date(r.tanggalPemeriksaan).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
    "Berat Badan (kg)": r.beratBadan,
    "Sistolik (mmHg)": r.tekananDarahSistolik,
    "Diastolik (mmHg)": r.tekananDarahDiastolik,
  }));

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Profile Header */}
      <Card className="p-6 border border-outline-variant/20 relative bg-white">
        <div className="absolute inset-0 overflow-hidden rounded-xl pointer-events-none">
          <div className="absolute -right-20 -top-20 w-64 h-64 bg-tertiary-fixed/30 opacity-50 rounded-full blur-3xl" />
        </div>
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-6 relative z-10">
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-background">
              Halo, {bumil.nama}! 👋
            </h2>
            <p className="text-sm text-on-surface-variant mt-0.5">
              Kelola data rekam medis kehamilan di bawah ini.
            </p>
            {!hasBorn && !isDeceased && (
              <div className="flex items-center gap-2 bg-white border border-outline-variant/30 px-4 py-2 rounded-full mt-3 shadow-sm inline-flex">
                <span className="text-xs font-semibold text-on-surface-variant">
                  Usia Kandungan:
                </span>
                <span className="text-sm font-bold text-tertiary">
                  {getGestationAge(bumil.hpht)}
                </span>
              </div>
            )}
            {hasBorn && (
              <div className="flex items-center gap-2 bg-teal-50 border border-teal-200 px-4 py-2 rounded-full mt-3 shadow-sm inline-flex">
                <span className="material-symbols-outlined text-teal-600 text-sm">
                  child_care
                </span>
                <span className="text-xs font-bold text-teal-800">
                  Sudah Melahirkan
                </span>
              </div>
            )}
          </div>

          {/* Aksi: samakan pola dengan halaman Balita - tombol utama + menu "lainnya" */}
          <div className="flex items-center gap-3 relative">
            <StatusHidupControl
              currentStatus={bumil.statusHidup}
              tanggalMeninggal={bumil.tanggalMeninggal}
              penyebabMeninggal={bumil.penyebabMeninggal}
              onStatusChange={handleStatusChange}
            />

            <Button
              onClick={openAddExamModal}
              disabled={!canAddRecord}
              className="flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span>Update Pemeriksaan</span>
            </Button>

            {/* More options menu */}
            <div className="relative">
              <button
                onClick={() => setIsMenuOpen(!isMenuOpen)}
                className="p-3 text-outline hover:bg-slate-100 border border-outline-variant/20 rounded-xl transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined">more_vert</span>
              </button>
              {isMenuOpen && (
                <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-outline-variant/20 z-20 overflow-hidden">
                  <button
                    onClick={() => {
                      setIsMenuOpen(false);
                      setIsBirthModalOpen(true);
                    }}
                    disabled={isDeceased || hasBorn}
                    className="w-full px-4 py-3 text-left text-xs font-bold text-pink-700 hover:bg-pink-50 transition-colors flex items-center gap-2 cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed"
                  >
                    <span className="material-symbols-outlined text-sm">
                      child_care
                    </span>
                    <span>Sudah Melahirkan</span>
                  </button>
                </div>
              )}
            </div>
          </div>
        </div>
      </Card>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-5 gap-4">
        <Card className="p-5 flex flex-col justify-between h-28 bg-white border border-outline-variant/20">
          <span className="text-xs text-on-surface-variant font-medium">
            Berat Badan Terbaru
          </span>
          <p className="text-2xl font-extrabold text-on-background">
            {latestRecord?.beratBadan || "-"}{" "}
            <span className="text-sm font-normal text-on-surface-variant">
              kg
            </span>
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between h-28 bg-white border border-outline-variant/20">
          <span className="text-xs text-on-surface-variant font-medium">
            Tinggi Badan Terbaru
          </span>
          <p className="text-2xl font-extrabold text-on-background">
            {latestRecord?.tinggiBadan || "-"}{" "}
            <span className="text-sm font-normal text-on-surface-variant">
              cm
            </span>
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between h-28 bg-white border border-outline-variant/20">
          <span className="text-xs text-on-surface-variant font-medium">
            Tekanan Darah Terbaru
          </span>
          <p className="text-2xl font-extrabold text-on-background">
            {latestRecord
              ? `${latestRecord.tekananDarahSistolik}/${latestRecord.tekananDarahDiastolik}`
              : "-"}
            <span className="text-sm font-normal text-on-surface-variant">
              {" "}
              mmHg
            </span>
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between h-28 bg-white border border-outline-variant/20">
          <span className="text-xs text-on-surface-variant font-medium">
            HPHT
          </span>
          <p className="text-sm font-bold text-on-background">
            {new Date(bumil.hpht).toLocaleDateString("id-ID", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between h-28 bg-white border border-outline-variant/20">
          <span className="text-xs text-on-surface-variant font-medium">
            HPL (Perkiraan Lahir)
          </span>
          <p className="text-sm font-bold text-tertiary">
            {calculateHPL(bumil.hpht)}
          </p>
        </Card>
      </section>

      {/* Post Birth Details if applicable */}
      {bumil.postBirthRecord && (
        <Card className="p-6 border border-teal-200 bg-teal-50/20 rounded-xl space-y-4">
          <h3 className="text-md font-bold text-teal-800 flex items-center gap-2">
            <span className="material-symbols-outlined">
              baby_changing_station
            </span>
            Riwayat Kelahiran Anak
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-teal-900">
            <p>
              <span className="font-semibold">Nama Anak:</span>{" "}
              {bumil.postBirthRecord.nama}
            </p>
            <p>
              <span className="font-semibold">Tempat/Tgl Lahir:</span>{" "}
              {bumil.postBirthRecord.tempat},{" "}
              {new Date(bumil.postBirthRecord.tanggalLahir).toLocaleDateString(
                "id-ID",
              )}
            </p>
            <p>
              <span className="font-semibold">Jenis Kelamin:</span>{" "}
              {bumil.postBirthRecord.jenisKelamin === "L"
                ? "Laki-laki"
                : "Perempuan"}
            </p>
            <p>
              <span className="font-semibold">Cara Lahir:</span>{" "}
              {bumil.postBirthRecord.caraLahir}
            </p>
            <p>
              <span className="font-semibold">Usia Kehamilan saat Lahir:</span>{" "}
              {bumil.postBirthRecord.usiaKehamilanSaatLahirWeeks} minggu
            </p>
          </div>
        </Card>
      )}

      {/* Charts */}
      {records.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 bg-white border border-outline-variant/20">
            <h4 className="font-bold text-sm text-on-background mb-4">
              Grafik Berat Badan Ibu (kg)
            </h4>
            <div className="h-[250px] w-full">
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
                    dataKey="Berat Badan (kg)"
                    stroke="#ab2c5d"
                    strokeWidth={3}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
          <Card className="p-5 bg-white border border-outline-variant/20">
            <h4 className="font-bold text-sm text-on-background mb-4">
              Grafik Tensi Darah (mmHg)
            </h4>
            <div className="h-[250px] w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: -20, bottom: 0 }}
                >
                  <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                  <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} />
                  <YAxis tick={{ fontSize: 10 }} />
                  <Tooltip />
                  <Legend />
                  <Line
                    type="monotone"
                    dataKey="Sistolik (mmHg)"
                    stroke="#0284c7"
                    strokeWidth={2}
                  />
                  <Line
                    type="monotone"
                    dataKey="Diastolik (mmHg)"
                    stroke="#10b981"
                    strokeWidth={2}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          </Card>
        </section>
      )}

      {/* Table of History */}
      <section className="space-y-4">
        <h3 className="font-headline text-lg font-bold text-on-background flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">
            history
          </span>
          Riwayat Pemeriksaan Kehamilan
        </h3>

        <Card className="border border-outline-variant/20 overflow-hidden p-0 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Kunjungan</TableHead>
                <TableHead>Tanggal Pemeriksaan</TableHead>
                <TableHead>Berat Badan (kg)</TableHead>
                <TableHead>Tinggi Badan (cm)</TableHead>
                <TableHead>Tekanan Darah (mmHg)</TableHead>
                <TableHead>Usia Kehamilan (Wk)</TableHead>
                <TableHead>Vitamin Diberikan</TableHead>
                <TableHead className="text-right">Aksi</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {records.length === 0 ? (
                <TableRow>
                  <TableCell
                    colSpan={8}
                    className="text-center text-on-surface-variant py-8"
                  >
                    Belum ada riwayat pemeriksaan kehamilan.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-bold text-tertiary">
                      K-#{r.kunjunganKe}
                    </TableCell>
                    <TableCell>
                      {new Date(r.tanggalPemeriksaan).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </TableCell>
                    <TableCell>{r.beratBadan} kg</TableCell>
                    <TableCell>{r.tinggiBadan} cm</TableCell>
                    <TableCell>
                      {r.tekananDarahSistolik}/{r.tekananDarahDiastolik} mmHg
                    </TableCell>
                    <TableCell>{r.usiaKehamilanWeeks} minggu</TableCell>
                    <TableCell>{r.vitamin || "-"}</TableCell>
                    <TableCell className="text-right">
                      <div className="inline-flex items-center gap-1">
                        <button
                          type="button"
                          onClick={() => openEditExamModal(r)}
                          title="Edit data pemeriksaan"
                          className="inline-flex items-center gap-1 text-on-surface-variant hover:bg-slate-100 hover:text-tertiary px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">
                            edit
                          </span>
                        </button>
                        <button
                          type="button"
                          onClick={() => handleDeleteRecord(r.id)}
                          title="Hapus data pemeriksaan"
                          className="inline-flex items-center gap-1 text-red-600 hover:bg-red-50 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
                        >
                          <span className="material-symbols-outlined text-sm">
                            delete
                          </span>
                        </button>
                      </div>
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* Add/Edit Examination Modal */}
      <Dialog
        isOpen={isExamModalOpen}
        onClose={() => {
          setIsExamModalOpen(false);
          resetExamForm();
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
                : "Update Data Pemeriksaan Bumil"}
            </DialogTitle>
            <DialogDescription>
              {editingRecordId
                ? "Perbarui hasil pemeriksaan klinis berkala ibu hamil untuk tanggal ini."
                : "Masukkan hasil pemeriksaan klinis berkala ibu hamil."}
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-4">
            {examError && (
              <div className="text-xs font-semibold text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {examError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="ex_date">Tanggal Pemeriksaan</Label>
                <Input
                  id="ex_date"
                  type="date"
                  value={tanggalPemeriksaan}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setTanggalPemeriksaan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ex_bb">Berat Badan Ibu (kg)</Label>
                <Input
                  id="ex_bb"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 65"
                  value={beratBadan}
                  onChange={(e) => setBeratBadan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ex_tb">Tinggi Badan Ibu (cm)</Label>
                <Input
                  id="ex_tb"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 158"
                  value={tinggiBadan}
                  onChange={(e) => setTinggiBadan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ex_sis">Tensi Sistolik (mmHg)</Label>
                <Input
                  id="ex_sis"
                  type="number"
                  placeholder="Contoh: 120"
                  value={sistolik}
                  onChange={(e) => setSistolik(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ex_dia">Tensi Diastolik (mmHg)</Label>
                <Input
                  id="ex_dia"
                  type="number"
                  placeholder="Contoh: 80"
                  value={diastolik}
                  onChange={(e) => setDiastolik(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ex_weeks">Usia Kehamilan (Minggu)</Label>
                <Input
                  id="ex_weeks"
                  type="number"
                  placeholder="Contoh: 12"
                  value={usiaKehamilanWeeks}
                  onChange={(e) => setUsiaKehamilanWeeks(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ex_visit">Kunjungan Ke</Label>
                <select
                  id="ex_visit"
                  value={kunjunganKe}
                  onChange={(e) => setKunjunganKe(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all"
                >
                  {[1, 2, 3, 4, 5, 6, 7, 8].map((n) => (
                    <option
                      key={n}
                      value={n.toString()}
                      className="text-xs md:text-sm bg-white text-on-surface"
                    >
                      Kunjungan Ke-{n}
                    </option>
                  ))}
                </select>
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="ex_vitamin">Vitamin / Suplemen Diberikan</Label>
                <Input
                  id="ex_vitamin"
                  placeholder="Contoh: Tablet Fe, Kalsium, Asam Folat"
                  value={vitamin}
                  onChange={(e) => setVitamin(e.target.value)}
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
                resetExamForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit" disabled={isSubmittingExam}>
              {isSubmittingExam
                ? "Menyimpan..."
                : editingRecordId
                  ? "Simpan Perubahan"
                  : "Simpan Data"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>

      {/* Sudah Melahirkan Modal */}
      <Dialog
        isOpen={isBirthModalOpen}
        onClose={() => setIsBirthModalOpen(false)}
      >
        <form
          onSubmit={handleAddBirth}
          className="flex flex-col max-h-[85vh] overflow-hidden"
        >
          <DialogHeader>
            <DialogTitle>Formulir Kelahiran Bayi</DialogTitle>
            <DialogDescription>
              Isi data kelahiran bayi untuk mengakhiri keaktifan masa hamil ibu
              dan mendaftarkan bayi di database.
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-4">
            {birthError && (
              <div className="text-xs font-semibold text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {birthError}
              </div>
            )}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="baby_name">Nama Lengkap Bayi</Label>
                <Input
                  id="baby_name"
                  placeholder="Nama Lengkap Bayi"
                  value={babyNama}
                  onChange={(e) => setBabyNama(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="baby_gender">Jenis Kelamin</Label>
                <select
                  id="baby_gender"
                  value={babyJk}
                  onChange={(e) => setBabyJk(e.target.value as "L" | "P")}
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all"
                >
                  <option
                    value="L"
                    className="text-xs md:text-sm bg-white text-on-surface"
                  >
                    Laki-laki
                  </option>
                  <option
                    value="P"
                    className="text-xs md:text-sm bg-white text-on-surface"
                  >
                    Perempuan
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="baby_cara">Cara Lahir</Label>
                <select
                  id="baby_cara"
                  value={babyCara}
                  onChange={(e) =>
                    setBabyCara(e.target.value as "Normal" | "SC")
                  }
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all"
                >
                  <option
                    value="Normal"
                    className="text-xs md:text-sm bg-white text-on-surface"
                  >
                    Normal (Pervaginam)
                  </option>
                  <option
                    value="SC"
                    className="text-xs md:text-sm bg-white text-on-surface"
                  >
                    Sectio Caesarea (SC)
                  </option>
                </select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="baby_place">Tempat Lahir</Label>
                <Input
                  id="baby_place"
                  placeholder="Kota / Kabupaten Lahir"
                  value={babyTempat}
                  onChange={(e) => setBabyTempat(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="baby_date">Tanggal Lahir Bayi</Label>
                <Input
                  id="baby_date"
                  type="date"
                  value={babyTanggal}
                  max={new Date().toISOString().split("T")[0]}
                  onChange={(e) => setBabyTanggal(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="baby_weeks">
                  Lahir Pada Usia Kehamilan (Minggu)
                </Label>
                <Input
                  id="baby_weeks"
                  type="number"
                  placeholder="Contoh: 38"
                  value={babyGestationWeeks}
                  onChange={(e) => setBabyGestationWeeks(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="baby_golongan_darah">
                  Golongan Darah Bayi (Opsional)
                </Label>
                <select
                  id="baby_golongan_darah"
                  value={babyGolonganDarah}
                  onChange={(e) => setBabyGolonganDarah(e.target.value)}
                  className="w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 transition-all"
                >
                  <option value="">Tidak diketahui</option>
                  {["A", "B", "AB", "O"].map((gd) => (
                    <option key={gd} value={gd}>
                      {gd}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsBirthModalOpen(false)}
            >
              Batal
            </Button>
            <Button
              type="submit"
              className="bg-teal-600 hover:bg-teal-700"
              disabled={isSubmittingBirth}
            >
              {isSubmittingBirth ? "Menyimpan..." : "Konfirmasi Kelahiran"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
