import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import { Balita, BalitaRecord } from "@/lib/fetch/balita";
import { Lansia, LansiaRecord } from "@/lib/fetch/lansia";
import { IbuHamil, IbuHamilRecord } from "@/lib/fetch/ibuHamil";
import {
  calculateAge,
  calculateGestationWeeks,
  classifyCategory,
} from "@/lib/utils/health";

function addHeader(doc: jsPDF, title: string) {
  doc.setFontSize(16);
  doc.setFont("helvetica", "bold");
  doc.text("Posyandu Digital", 14, 15);

  doc.setFontSize(11);
  doc.setFont("helvetica", "normal");
  doc.text(title, 14, 22);

  doc.setFontSize(9);
  doc.setTextColor(120);
  doc.text(
    `Dicetak pada: ${new Date().toLocaleDateString("id-ID", {
      day: "numeric",
      month: "long",
      year: "numeric",
    })}`,
    14,
    27,
  );
  doc.setTextColor(0);
}

function addFooter(doc: jsPDF) {
  const pageCount = doc.getNumberOfPages();
  for (let i = 1; i <= pageCount; i++) {
    doc.setPage(i);
    const pageHeight = doc.internal.pageSize.height;
    doc.setFontSize(8);
    doc.setTextColor(150);
    doc.text(`Halaman ${i} dari ${pageCount}`, 14, pageHeight - 10);
    doc.setTextColor(0);
  }
}

// Ambil baris TERAKHIR (kronologis) per key dari array yang terurut ASC.
function latestPerKey<T>(
  records: T[],
  keyOf: (r: T) => string,
): Map<string, T> {
  const map = new Map<string, T>();
  records.forEach((r) => map.set(keyOf(r), r)); // baris belakangan menimpa -> otomatis jadi yang terbaru
  return map;
}

// Kelompokkan SEMUA record per key (dipakai untuk bagian riwayat pemeriksaan).
function groupByKey<T>(
  records: T[],
  keyOf: (r: T) => string,
): Map<string, T[]> {
  const map = new Map<string, T[]>();
  records.forEach((r) => {
    const key = keyOf(r);
    const list = map.get(key) ?? [];
    list.push(r);
    map.set(key, list);
  });
  return map;
}

// Render bagian "Riwayat Pemeriksaan per Orang" secara generik, dipakai
// bersama oleh laporan Balita, Lansia, dan Ibu Hamil supaya tidak duplikasi.
function addRiwayatPemeriksaanSection<T>(
  doc: jsPDF,
  judul: string,
  peopleWithRecords: { nama: string; nik: string; records: T[] }[],
  head: string[],
  rowMapper: (r: T) => (string | number)[],
) {
  if (peopleWithRecords.length === 0) return;

  doc.addPage();
  doc.setFontSize(13);
  doc.setFont("helvetica", "bold");
  doc.text(judul, 14, 15);
  doc.setFont("helvetica", "normal");

  let cursorY = 24;
  const pageHeight = doc.internal.pageSize.height;

  peopleWithRecords.forEach((p) => {
    if (cursorY > pageHeight - 40) {
      doc.addPage();
      cursorY = 15;
    }

    doc.setFontSize(10);
    doc.setFont("helvetica", "bold");
    doc.text(`${p.nama} (NIK: ${p.nik || "-"})`, 14, cursorY);
    doc.setFont("helvetica", "normal");
    cursorY += 4;

    autoTable(doc, {
      startY: cursorY,
      margin: { left: 14, right: 14 },
      head: [head],
      body: p.records.map(rowMapper),
      styles: { fontSize: 7, cellPadding: 1.5 },
      headStyles: { fillColor: [107, 90, 96] },
    });

    // lastAutoTable disediakan runtime oleh plugin jspdf-autotable
    cursorY = (doc as any).lastAutoTable.finalY + 10;
  });
}

// ============================================================================
// BALITA & BAYI
// ============================================================================
export function generateBalitaReport(
  data: Balita[],
  allRecords: BalitaRecord[],
): jsPDF {
  const doc = new jsPDF({ orientation: "landscape" });
  addHeader(doc, `Rekap Data Balita & Bayi (${data.length} anggota)`);

  const latestByNik = latestPerKey(allRecords, (r) => r.balitaId);

  const rows = data.map((b, i) => {
    const latest = latestByNik.get(b.nik);
    return [
      i + 1,
      b.nama,
      b.nik || "-",
      b.noKk,
      b.jenisKelamin === "L" ? "Laki-laki" : "Perempuan",
      b.namaIbu || "-",
      `${b.tempatLahir || "-"}, ${new Date(b.tanggalLahir).toLocaleDateString("id-ID")}`,
      latest ? `${latest.beratBadan} kg` : "-",
      latest ? latest.imt : "-",
      latest?.imunisasi || "-",
      b.statusHidup,
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [
      [
        "No",
        "Nama",
        "NIK",
        "No. KK",
        "JK",
        "Nama Ibu",
        "TTL",
        "Berat Badan",
        "IMT",
        "Imunisasi Terakhir",
        "Status",
      ],
    ],
    body: rows,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [171, 44, 93] },
    alternateRowStyles: { fillColor: [250, 245, 247] },
  });

  // ---- Bagian Riwayat Pemeriksaan per Balita ----
  const recordsByNik = groupByKey(allRecords, (r) => r.balitaId);
  const balitaWithRecords = data
    .filter((b) => (recordsByNik.get(b.nik)?.length ?? 0) > 0)
    .map((b) => ({
      nama: b.nama,
      nik: b.nik,
      records: recordsByNik.get(b.nik) ?? [],
    }));

  addRiwayatPemeriksaanSection(
    doc,
    "Riwayat Pemeriksaan per Balita",
    balitaWithRecords,
    ["Tanggal", "Berat Badan", "IMT", "Imunisasi"],
    (r) => [
      new Date(r.tanggalPemeriksaan).toLocaleDateString("id-ID"),
      `${r.beratBadan} kg`,
      r.imt,
      r.imunisasi || "-",
    ],
  );

  addFooter(doc);
  return doc;
}

// ============================================================================
// LANSIA (+ riwayat pemeriksaan per orang di halaman berikutnya)
// ============================================================================
export function generateLansiaReport(
  data: Lansia[],
  allRecords: LansiaRecord[],
): jsPDF {
  const doc = new jsPDF({ orientation: "landscape" });
  addHeader(doc, `Rekap Data Lansia (${data.length} anggota)`);

  const rows = data.map((l, i) => [
    i + 1,
    l.nama,
    l.nik,
    l.noKk || "-",
    l.jenisKelamin === "L" ? "Laki-laki" : "Perempuan",
    `${calculateAge(l.tanggalLahir).years} tahun`,
    classifyCategory(l.tanggalLahir, "lansia"),
    l.golonganDarah || "-",
    l.statusHidup,
  ]);

  autoTable(doc, {
    startY: 32,
    head: [
      [
        "No",
        "Nama",
        "NIK",
        "No. KK",
        "JK",
        "Usia",
        "Kategori",
        "Gol. Darah",
        "Status",
      ],
    ],
    body: rows,
    styles: { fontSize: 8, cellPadding: 2 },
    headStyles: { fillColor: [171, 44, 93] },
    alternateRowStyles: { fillColor: [250, 245, 247] },
  });

  // ---- Bagian Riwayat Pemeriksaan per Lansia ----
  const recordsByNik = groupByKey(allRecords, (r) => r.lansiaId);
  const lansiaWithRecords = data
    .filter((l) => (recordsByNik.get(l.nik)?.length ?? 0) > 0)
    .map((l) => ({
      nama: l.nama,
      nik: l.nik,
      records: recordsByNik.get(l.nik) ?? [],
    }));

  addRiwayatPemeriksaanSection(
    doc,
    "Riwayat Pemeriksaan per Lansia",
    lansiaWithRecords,
    ["Tanggal", "TB (cm)", "BB (kg)", "IMT", "Tensi", "Penyakit Baru", "Obat"],
    (r) => [
      new Date(r.tanggalPemeriksaan).toLocaleDateString("id-ID"),
      r.tinggiBadan,
      r.beratBadan,
      r.imt,
      `${r.tekananDarahSistolik}/${r.tekananDarahDiastolik}`,
      r.penyakitBaru || "-",
      r.obat || "-",
    ],
  );

  addFooter(doc);
  return doc;
}

// ============================================================================
// IBU HAMIL
// ============================================================================
export function generateIbuHamilReport(
  data: IbuHamil[],
  allRecords: IbuHamilRecord[],
): jsPDF {
  const doc = new jsPDF({ orientation: "landscape" });
  addHeader(doc, `Rekap Data Ibu Hamil (${data.length} anggota)`);

  const latestByEpisode = latestPerKey(allRecords, (r) => r.ibuHamilId);

  const rows = data.map((b, i) => {
    const latest = latestByEpisode.get(b.id);
    return [
      i + 1,
      b.nama,
      b.nik,
      b.noKk,
      new Date(b.hpht).toLocaleDateString("id-ID"),
      b.postBirthRecord ? "Sudah Lahir" : calculateGestationWeeks(b.hpht),
      latest ? `${latest.beratBadan} kg` : "-",
      latest?.tinggiBadan ? `${latest.tinggiBadan} cm` : "-",
      latest
        ? `${latest.tekananDarahSistolik}/${latest.tekananDarahDiastolik}`
        : "-",
      b.golonganDarah || "-",
      b.statusHidup,
    ];
  });

  autoTable(doc, {
    startY: 32,
    head: [
      [
        "No",
        "Nama",
        "NIK",
        "No. KK",
        "HPHT",
        "Status Kandungan",
        "Berat Badan",
        "Tinggi Badan",
        "Tekanan Darah",
        "Gol. Darah",
        "Status",
      ],
    ],
    body: rows,
    styles: { fontSize: 7, cellPadding: 1.5 },
    headStyles: { fillColor: [171, 44, 93] },
    alternateRowStyles: { fillColor: [250, 245, 247] },
  });

  // ---- Bagian Riwayat Pemeriksaan per Ibu Hamil ----
  const recordsById = groupByKey(allRecords, (r) => r.ibuHamilId);
  const ibuHamilWithRecords = data
    .filter((b) => (recordsById.get(b.id)?.length ?? 0) > 0)
    .map((b) => ({
      nama: b.nama,
      nik: b.nik,
      records: recordsById.get(b.id) ?? [],
    }));

  addRiwayatPemeriksaanSection(
    doc,
    "Riwayat Pemeriksaan per Ibu Hamil",
    ibuHamilWithRecords,
    ["Tanggal", "Berat Badan", "Tinggi Badan", "Tensi"],
    (r) => [
      new Date(r.tanggalPemeriksaan).toLocaleDateString("id-ID"),
      `${r.beratBadan} kg`,
      r.tinggiBadan ? `${r.tinggiBadan} cm` : "-",
      `${r.tekananDarahSistolik}/${r.tekananDarahDiastolik}`,
    ],
  );

  addFooter(doc);
  return doc;
}
