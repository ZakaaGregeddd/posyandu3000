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
  getLansiaById,
  updateLansia,
  getLansiaRecords,
  addLansiaRecord,
  Lansia,
  LansiaRecord,
  StatusHidup,
} from "@/lib/fetch/lansia";
import { calculateAge, classifyCategory } from "@/lib/utils/health";

export default function LansiaDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);

  // States
  const [lansia, setLansia] = useState<Lansia | null>(null);
  const [records, setRecords] = useState<LansiaRecord[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isSubmittingExam, setIsSubmittingExam] = useState(false);

  // Sedang mengedit pemeriksaan yang mana (null = mode tambah baru)
  const [editingRecordId, setEditingRecordId] = useState<string | null>(null);

  // Exam Form States
  const [tanggalPemeriksaan, setTanggalPemeriksaan] = useState(
    new Date().toISOString().split("T")[0],
  );
  const [tinggiBadan, setTinggiBadan] = useState("");
  const [beratBadan, setBeratBadan] = useState("");
  const [sistolik, setSistolik] = useState("");
  const [diastolik, setDiastolik] = useState("");
  const [riwayatPenyakit, setRiwayatPenyakit] = useState("-");
  const [obat, setObat] = useState("-");
  const [penyakitBaru, setPenyakitBaru] = useState("-");
  const [examError, setExamError] = useState("");

  // Resolve params (Next.js 15 async params)
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  useEffect(() => {
    if (!id) return;
    let active = true;

    (async () => {
      try {
        const data = await getLansiaById(id);
        if (!active) return;

        if (!data) {
          router.push("/dashboard/lansia");
          return;
        }
        setLansia(data);

        const recs = await getLansiaRecords(id);
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

  if (isLoading || !lansia) {
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

  const age = calculateAge(lansia.tanggalLahir);
  const isDeceased = lansia.statusHidup === "Meninggal";
  const category = classifyCategory(lansia.tanggalLahir, "lansia");
  const canAddRecord = !isDeceased;

  const handleStatusChange = async (
    status: StatusHidup,
    tanggal?: string,
    penyebab?: string,
  ) => {
    try {
      const updated = await updateLansia({
        id: lansia.id,
        statusHidup: status,
        tanggalMeninggal: tanggal,
        penyebabMeninggal: penyebab,
      });
      setLansia(updated);
    } catch (err: any) {
      alert(err.message || "Gagal mengubah status");
    }
  };

  const handleAddExam = async (e: React.FormEvent) => {
    e.preventDefault();
    setExamError("");

    if (
      !tanggalPemeriksaan ||
      !tinggiBadan ||
      !beratBadan ||
      !sistolik ||
      !diastolik
    ) {
      setExamError("Semua parameter vital wajib diisi");
      return;
    }

    const tbNum = parseFloat(tinggiBadan);
    const bbNum = parseFloat(beratBadan);
    const sisNum = parseInt(sistolik);
    const diaNum = parseInt(diastolik);

    if (
      isNaN(tbNum) ||
      tbNum <= 0 ||
      isNaN(bbNum) ||
      bbNum <= 0 ||
      isNaN(sisNum) ||
      isNaN(diaNum)
    ) {
      setExamError("Masukkan parameter vital berupa angka yang valid");
      return;
    }

    setIsSubmittingExam(true);

    try {
      // IMT tidak dihitung di sini - database yang menghitung otomatis.
      if (editingRecordId) {
        const updatedRec = await updateLansiaRecord({
          id: editingRecordId,
          tanggalPemeriksaan,
          tinggiBadan: tbNum,
          beratBadan: bbNum,
          tekananDarahSistolik: sisNum,
          tekananDarahDiastolik: diaNum,
          riwayatPenyakit: riwayatPenyakit || "-",
          obat: obat || "-",
          penyakitBaru: penyakitBaru || "-",
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
        const newRec = await addLansiaRecord({
          lansiaId: lansia.id,
          tanggalPemeriksaan,
          tinggiBadan: tbNum,
          beratBadan: bbNum,
          tekananDarahSistolik: sisNum,
          tekananDarahDiastolik: diaNum,
          riwayatPenyakit: riwayatPenyakit || "-",
          obat: obat || "-",
          penyakitBaru: penyakitBaru || "-",
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
      setExamError(err.message || "Gagal menyimpan pemeriksaan");
    } finally {
      setIsSubmittingExam(false);
    }
  };

  const resetExamForm = () => {
    setTanggalPemeriksaan(new Date().toISOString().split("T")[0]);
    setTinggiBadan("");
    setBeratBadan("");
    setSistolik("");
    setDiastolik("");
    setRiwayatPenyakit("-");
    setObat("-");
    setPenyakitBaru("-");
    setExamError("");
    setEditingRecordId(null);
  };

  const openAddExamModal = () => {
    resetExamForm();
    setIsExamModalOpen(true);
  };

  const openEditExamModal = (r: LansiaRecord) => {
    setEditingRecordId(r.id);
    setTanggalPemeriksaan(r.tanggalPemeriksaan.split("T")[0]);
    setTinggiBadan(String(r.tinggiBadan));
    setBeratBadan(String(r.beratBadan));
    setSistolik(String(r.tekananDarahSistolik));
    setDiastolik(String(r.tekananDarahDiastolik));
    setRiwayatPenyakit(r.riwayatPenyakit || "-");
    setObat(r.obat || "-");
    setPenyakitBaru(r.penyakitBaru || "-");
    setExamError("");
    setIsExamModalOpen(true);
  };

  const handleDeleteRecord = async (recordId: string) => {
    const confirmDel = window.confirm(
      "Apakah Anda yakin ingin menghapus data pemeriksaan ini?",
    );
    if (!confirmDel) return;

    try {
      await deleteLansiaRecord(recordId);
      setRecords((prev) => prev.filter((r) => r.id !== recordId));
    } catch (err: any) {
      alert(err.message || "Gagal menghapus data pemeriksaan");
    }
  };

  const latestRecord = records[records.length - 1];

  // Chart data
  const chartData = records.map((r) => ({
    tanggal: new Date(r.tanggalPemeriksaan).toLocaleDateString("id-ID", {
      day: "numeric",
      month: "short",
    }),
    "IMT (BB/TB²)": r.imt,
    "Sistolik (mmHg)": r.tekananDarahSistolik,
    "Diastolik (mmHg)": r.tekananDarahDiastolik,
  }));

  return (
    <div className="max-w-5xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Profile Header */}
      <Card className="p-6 border border-outline-variant/20 relative overflow-hidden bg-white">
        <div className="flex flex-col md:flex-row justify-between items-start gap-6">
          <div className="space-y-3 flex-1">
            <div>
              <h2 className="font-headline text-2xl font-bold text-on-background">
                {lansia.nama}
              </h2>
              <div className="flex gap-2 items-center mt-1.5 flex-wrap">
                <span
                  className={`px-2.5 py-0.5 rounded-full text-xs font-bold border ${
                    category.includes("Resiko")
                      ? "bg-red-50 text-red-700 border-red-200"
                      : category.includes("Pralansia")
                        ? "bg-amber-50 text-amber-700 border-amber-200"
                        : "bg-orange-50 text-orange-700 border-orange-200"
                  }`}
                >
                  {category.toUpperCase()}
                </span>
                <span className="text-xs text-on-surface-variant">•</span>
                <span className="text-xs font-semibold text-on-surface-variant">
                  No. KK: {lansia.noKk}
                </span>
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-2 gap-x-6 text-sm text-on-surface-variant pt-2 border-t border-outline-variant/10">
              <p>
                <span className="font-medium text-on-surface">TTL:</span>{" "}
                {lansia.tempatLahir},{" "}
                {new Date(lansia.tanggalLahir).toLocaleDateString("id-ID", {
                  day: "numeric",
                  month: "long",
                  year: "numeric",
                })}
              </p>
              <p>
                <span className="font-medium text-on-surface">Usia:</span>{" "}
                {age.years} tahun
              </p>
              <p>
                <span className="font-medium text-on-surface">Nama Wali:</span>{" "}
                {lansia.namaAyah || "-"}
              </p>
              <p>
                <span className="font-medium text-on-surface">
                  No. Telp Wali:
                </span>{" "}
                {lansia.namaIbu || "-"}
              </p>
              <p>
                <span className="font-medium text-on-surface">
                  Jenis Kelamin:
                </span>{" "}
                {lansia.jenisKelamin === "L" ? "Laki-laki" : "Perempuan"}
              </p>
              <p>
                <span className="font-medium text-on-surface">
                  Golongan Darah:
                </span>{" "}
                {lansia.golonganDarah || "-"}
              </p>
            </div>
          </div>

          <div className="flex flex-col gap-4 items-stretch md:items-end w-full md:w-auto">
            {/* Status Control */}
            <StatusHidupControl
              currentStatus={lansia.statusHidup}
              tanggalMeninggal={lansia.tanggalMeninggal}
              penyebabMeninggal={lansia.penyebabMeninggal}
              onStatusChange={handleStatusChange}
            />

            {isDeceased && (
              <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3 rounded-xl max-w-xs flex gap-2 items-start">
                <span className="material-symbols-outlined text-sm">block</span>
                <p>Riwayat entri dikunci karena status kematian anggota.</p>
              </div>
            )}

            <Button
              onClick={openAddExamModal}
              disabled={!canAddRecord}
              className="flex items-center justify-center gap-2 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed w-full md:w-auto"
            >
              <span className="material-symbols-outlined">add_circle</span>
              <span>Update Pemeriksaan</span>
            </Button>
          </div>
        </div>
      </Card>

      {/* Stats Bento Grid */}
      <section className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <Card className="p-5 flex flex-col justify-between h-28 bg-white border border-outline-variant/20">
          <span className="text-xs text-on-surface-variant font-medium">
            IMT Terakhir
          </span>
          <p className="text-2xl font-extrabold text-tertiary">
            {latestRecord?.imt || "-"}
          </p>
        </Card>
        <Card className="p-5 flex flex-col justify-between h-28 bg-white border border-outline-variant/20">
          <span className="text-xs text-on-surface-variant font-medium">
            Berat Badan
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
            Tinggi Badan
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
            Tekanan Darah
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
      </section>

      {/* Disease and Medicine Summary Card */}
      {latestRecord && (
        <Card className="p-6 bg-white border border-outline-variant/20 rounded-xl space-y-4">
          <h3 className="text-md font-bold text-tertiary flex items-center gap-2">
            <span className="material-symbols-outlined">
              medical_information
            </span>
            Rangkuman Riwayat Klinis
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 text-sm text-on-surface-variant">
            <div>
              <span className="font-semibold text-on-surface block mb-1">
                Riwayat Penyakit:
              </span>
              <p className="bg-secondary-container/10 border border-outline-variant/10 rounded-lg p-3 text-xs font-medium text-on-surface">
                {latestRecord.riwayatPenyakit || "-"}
              </p>
            </div>
            <div>
              <span className="font-semibold text-on-surface block mb-1">
                Obat Rutin yang Diminum:
              </span>
              <p className="bg-secondary-container/10 border border-outline-variant/10 rounded-lg p-3 text-xs font-medium text-on-surface">
                {latestRecord.obat || "-"}
              </p>
            </div>
            <div>
              <span className="font-semibold text-on-surface block mb-1">
                Penyakit Baru Terdeteksi:
              </span>
              <p className="bg-red-50/50 border border-red-100 rounded-lg p-3 text-xs font-bold text-red-800">
                {latestRecord.penyakitBaru || "-"}
              </p>
            </div>
          </div>
        </Card>
      )}

      {/* Charts */}
      {records.length > 0 && (
        <section className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <Card className="p-5 bg-white border border-outline-variant/20">
            <h4 className="font-bold text-sm text-on-background mb-4">
              Grafik Tren IMT Lansia
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
                    dataKey="IMT (BB/TB²)"
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

      {/* Historical Record Table */}
      <section className="space-y-4">
        <h3 className="font-headline text-lg font-bold text-on-background flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">
            history
          </span>
          Riwayat Pemeriksaan Lansia
        </h3>

        <Card className="border border-outline-variant/20 overflow-hidden p-0 bg-white">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Tanggal Pemeriksaan</TableHead>
                <TableHead>TB (cm)</TableHead>
                <TableHead>BB (kg)</TableHead>
                <TableHead>IMT (BB/TB²)</TableHead>
                <TableHead>Tensi (mmHg)</TableHead>
                <TableHead>Penyakit Baru</TableHead>
                <TableHead>Obat</TableHead>
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
                    Belum ada riwayat pemeriksaan lansia.
                  </TableCell>
                </TableRow>
              ) : (
                records.map((r) => (
                  <TableRow key={r.id}>
                    <TableCell className="font-medium">
                      {new Date(r.tanggalPemeriksaan).toLocaleDateString(
                        "id-ID",
                        {
                          day: "numeric",
                          month: "long",
                          year: "numeric",
                        },
                      )}
                    </TableCell>
                    <TableCell>{r.tinggiBadan} cm</TableCell>
                    <TableCell>{r.beratBadan} kg</TableCell>
                    <TableCell className="font-bold text-tertiary">
                      {r.imt}
                    </TableCell>
                    <TableCell>
                      {r.tekananDarahSistolik}/{r.tekananDarahDiastolik} mmHg
                    </TableCell>
                    <TableCell className="text-red-700 font-medium">
                      {r.penyakitBaru || "-"}
                    </TableCell>
                    <TableCell>{r.obat || "-"}</TableCell>
                    <TableCell className="text-right whitespace-nowrap">
                      <button
                        type="button"
                        onClick={() => openEditExamModal(r)}
                        title="Edit data pemeriksaan"
                        className="inline-flex items-center gap-1 text-tertiary hover:bg-secondary-container/40 px-2.5 py-1.5 rounded-lg transition-colors cursor-pointer"
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
                    </TableCell>
                  </TableRow>
                ))
              )}
            </TableBody>
          </Table>
        </Card>
      </section>

      {/* Update / Edit Examination Modal */}
      <Dialog
        isOpen={isExamModalOpen}
        onClose={() => {
          setIsExamModalOpen(false);
          resetExamForm();
        }}
      >
        <form
          onSubmit={handleAddExam}
          className="flex flex-col max-h-[85vh] overflow-hidden"
        >
          <DialogHeader>
            <DialogTitle>
              {editingRecordId
                ? "Edit Data Pemeriksaan Lansia"
                : "Update Pemeriksaan Lansia"}
            </DialogTitle>
            <DialogDescription>
              Masukkan hasil pengukuran antropometri, tensi, obat rutin, dan
              diagnosa penyakit baru.
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
                <Label htmlFor="ex_tb">Tinggi Badan (cm)</Label>
                <Input
                  id="ex_tb"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 165"
                  value={tinggiBadan}
                  onChange={(e) => setTinggiBadan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ex_bb">Berat Badan (kg)</Label>
                <Input
                  id="ex_bb"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 60"
                  value={beratBadan}
                  onChange={(e) => setBeratBadan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ex_sis">Tensi Sistolik (mmHg)</Label>
                <Input
                  id="ex_sis"
                  type="number"
                  placeholder="Contoh: 130"
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
                  placeholder="Contoh: 85"
                  value={diastolik}
                  onChange={(e) => setDiastolik(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ex_disease">Riwayat Penyakit</Label>
                <Input
                  id="ex_disease"
                  placeholder="Contoh: Hipertensi, Kolesterol"
                  value={riwayatPenyakit}
                  onChange={(e) => setRiwayatPenyakit(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ex_meds">Obat yang Diminum</Label>
                <Input
                  id="ex_meds"
                  placeholder="Contoh: Amlodipine 5mg"
                  value={obat}
                  onChange={(e) => setObat(e.target.value)}
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="ex_new_disease">Penyakit Baru Terdeteksi</Label>
                <Input
                  id="ex_new_disease"
                  placeholder="Contoh: Asam Urat / -"
                  value={penyakitBaru}
                  onChange={(e) => setPenyakitBaru(e.target.value)}
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
                  : "Simpan Pemeriksaan"}
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
