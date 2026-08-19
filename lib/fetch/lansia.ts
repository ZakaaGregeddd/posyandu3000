import { dbQuery } from "@/lib/db/db-client";

export type StatusHidup = "Hidup" | "Meninggal";

export interface Lansia {
  id: string; // UUID
  nik: string;
  noKk?: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  namaAyah: string; // Used for Nama Wali in the UI
  namaIbu: string;  // Used for No. Telp Wali in the UI
  golonganDarah?: string;
  statusHidup: StatusHidup;
  tanggalMeninggal?: string;
  penyebabMeninggal?: string;
}

export interface LansiaRecord {
  id: string;
  lansiaId: string;
  tanggalPemeriksaan: string;
  tinggiBadan: number;
  beratBadan: number;
  tekananDarahSistolik: number;
  tekananDarahDiastolik: number;
  riwayatPenyakit: string;
  obat: string;
  penyakitBaru: string;
  imt: number;
}

export interface KKOption {
  noKk: string;
  alamat?: string;
  noTelp?: string;
  rt?: string;
  rw?: string;
}

interface LansiaMeta {
  tinggiBadan: number;
  beratBadan: number;
  tekananDarahSistolik: number;
  tekananDarahDiastolik: number;
  obat: string;
  noTelpWali: string;
  penyakitBaru: string;
}

function parseKeterangan(ket: string | null): LansiaMeta {
  const defaultMeta: LansiaMeta = {
    tinggiBadan: 0,
    beratBadan: 0,
    tekananDarahSistolik: 0,
    tekananDarahDiastolik: 0,
    obat: "",
    noTelpWali: "",
    penyakitBaru: ""
  };
  if (!ket) return defaultMeta;
  try {
    return { ...defaultMeta, ...JSON.parse(ket) };
  } catch {
    return { ...defaultMeta, obat: ket };
  }
}

function serializeKeterangan(meta: LansiaMeta): string {
  return JSON.stringify(meta);
}

function mapRowToLansia(row: any): Lansia {
  const exams = row.master_pemeriksaan || [];
  const latestExam = exams[exams.length - 1]?.pemeriksaan_lansia;
  const meta = parseKeterangan(latestExam?.keterangan);

  return {
    id: row.id,
    nik: row.nik || "",
    noKk: row.keluarga?.no_kk || undefined,
    nama: row.nama,
    tempatLahir: row.tempat_lahir ?? "",
    tanggalLahir: row.tanggal_lahir,
    jenisKelamin: row.jenis_kelamin,
    namaAyah: latestExam?.nama_wali || "",
    namaIbu: meta.noTelpWali || "",
    golonganDarah: row.golongan_darah ?? undefined,
    statusHidup: row.status_hidup,
    tanggalMeninggal: row.tanggal_meninggal ?? undefined,
    penyebabMeninggal: row.keterangan_meninggal ?? undefined,
  };
}

function mapRowToRecord(row: any, episodeId: string): LansiaRecord {
  const detail = row.pemeriksaan_lansia || {};
  const meta = parseKeterangan(detail.keterangan);
  const imt = meta.tinggiBadan > 0 ? Number((meta.beratBadan / Math.pow(meta.tinggiBadan / 100, 2)).toFixed(2)) : 0;

  return {
    id: row.id,
    lansiaId: episodeId,
    tanggalPemeriksaan: row.tanggal_pemeriksaan,
    tinggiBadan: meta.tinggiBadan,
    beratBadan: meta.beratBadan,
    tekananDarahSistolik: meta.tekananDarahSistolik,
    tekananDarahDiastolik: meta.tekananDarahDiastolik,
    riwayatPenyakit: detail.penyakit || "",
    obat: meta.obat || "",
    penyakitBaru: meta.penyakitBaru || "",
    imt,
  };
}

// ---------------------------------------------------------------------------
// DAFTAR LANSIA
// ---------------------------------------------------------------------------
export async function getLansias(): Promise<Lansia[]> {
  const individuals = await dbQuery("SELECT * FROM individu ORDER BY tanggal_lahir ASC");
  const keluargaList = await dbQuery("SELECT * FROM keluarga");
  const masterExams = await dbQuery(`
    SELECT m.id, m.individu_id, m.jenis_pemeriksaan, p.nama_wali, p.keterangan
    FROM master_pemeriksaan m
    JOIN pemeriksaan_lansia p ON m.id = p.pemeriksaan_id
    WHERE m.jenis_pemeriksaan = 'Lansia'
    ORDER BY m.tanggal_pemeriksaan ASC
  `);

  const keluargaMap = new Map(keluargaList.map((k: any) => [k.id, k]));
  
  const examsByIndividu = new Map<string, any[]>();
  masterExams.forEach((me: any) => {
    if (!examsByIndividu.has(me.individu_id)) {
      examsByIndividu.set(me.individu_id, []);
    }
    examsByIndividu.get(me.individu_id)!.push({
      id: me.id,
      jenis_pemeriksaan: me.jenis_pemeriksaan,
      pemeriksaan_lansia: {
        nama_wali: me.nama_wali,
        keterangan: me.keterangan
      }
    });
  });

  const lansias = individuals.filter((r: any) => {
    const birthDate = new Date(r.tanggal_lahir);
    const today = new Date();
    let ageYears = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      ageYears--;
    }
    return ageYears >= 60;
  });

  return lansias.map((row: any) => {
    const exams = examsByIndividu.get(row.id) || [];
    const keluarga = keluargaMap.get(row.keluarga_id) as any;
    return mapRowToLansia({
      ...row,
      keluarga: keluarga ? { no_kk: keluarga.no_kk } : null,
      master_pemeriksaan: exams
    });
  });
}

export async function getLansiaById(id: string): Promise<Lansia | null> {
  const individuals = await getLansias();
  return individuals.find(b => b.id === id || b.nik === id) || null;
}

// ---------------------------------------------------------------------------
// DAFTAR KK (untuk dropdown "Nomor KK")
// ---------------------------------------------------------------------------
export async function getKKs(): Promise<KKOption[]> {
  const keluargaList = await dbQuery("SELECT no_kk, alamat, no_telp FROM keluarga ORDER BY no_kk");
  return keluargaList.map((k: any) => ({
    noKk: k.no_kk || "",
    alamat: k.alamat ?? undefined,
    noTelp: k.no_telp ?? undefined,
  }));
}

// ---------------------------------------------------------------------------
// TAMBAH LANSIA BARU
// ---------------------------------------------------------------------------
export interface AddLansiaInput {
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  noKk: string;
  statusHidup: StatusHidup;
  nik?: string;
  namaAyah: string; // nama wali
  namaIbu: string;  // no telp wali
  golonganDarah?: string;
}

function generateTempNik(): string {
  return `TMP${Date.now()}`.padEnd(16, "0").slice(0, 16);
}

export async function addLansia(input: AddLansiaInput): Promise<Lansia> {
  const kkList = await dbQuery("SELECT id FROM keluarga WHERE no_kk = ? LIMIT 1", [input.noKk]);
  const kk = kkList[0];
  if (!kk) throw new Error(`Keluarga dengan nomor KK ${input.noKk} tidak ditemukan.`);

  const nik = input.nik && input.nik.length === 16 ? input.nik : generateTempNik();
  const id = crypto.randomUUID();

  await dbQuery(
    `INSERT INTO individu (id, keluarga_id, nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, status_keluarga, status_hidup, golongan_darah)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Anak', ?, ?)`,
    [id, kk.id, nik, input.nama, input.tempatLahir, input.tanggalLahir, input.jenisKelamin, input.statusHidup, input.golonganDarah ?? null]
  );

  if (input.namaAyah || input.namaIbu) {
    const examId = crypto.randomUUID();
    const kunjunganKe = 1;
    await dbQuery(
      `INSERT INTO master_pemeriksaan (id, individu_id, tanggal_pemeriksaan, kunjungan_ke, jenis_pemeriksaan)
       VALUES (?, ?, ?, ?, 'Lansia')`,
      [examId, id, input.tanggalLahir, kunjunganKe]
    );

    const serialized = serializeKeterangan({
      tinggiBadan: 0,
      beratBadan: 0,
      tekananDarahSistolik: 0,
      tekananDarahDiastolik: 0,
      obat: "",
      noTelpWali: input.namaIbu,
      penyakitBaru: ""
    });

    await dbQuery(
      `INSERT INTO pemeriksaan_lansia (pemeriksaan_id, nama_wali, penyakit, keterangan)
       VALUES (?, ?, '', ?)`,
      [examId, input.namaAyah, serialized]
    );
  }

  const lansia = await getLansiaById(id);
  if (!lansia) throw new Error("Data tersimpan tapi gagal dimuat ulang");
  return lansia;
}

// ---------------------------------------------------------------------------
// UPDATE STATUS HIDUP
// ---------------------------------------------------------------------------
export interface UpdateLansiaInput {
  id: string; // UUID or NIK
  statusHidup: StatusHidup;
  tanggalMeninggal?: string;
  penyebabMeninggal?: string;
}

export async function updateLansia(input: UpdateLansiaInput): Promise<Lansia> {
  const isUuid = input.id.length === 36;
  const updateQuery = isUuid
    ? "UPDATE individu SET status_hidup = ?, tanggal_meninggal = ?, keterangan_meninggal = ? WHERE id = ?"
    : "UPDATE individu SET status_hidup = ?, tanggal_meninggal = ?, keterangan_meninggal = ? WHERE nik = ?";
  
  await dbQuery(updateQuery, [
    input.statusHidup,
    input.statusHidup === "Meninggal" ? input.tanggalMeninggal ?? null : null,
    input.statusHidup === "Meninggal" ? input.penyebabMeninggal ?? null : null,
    input.id
  ]);

  const lansia = await getLansiaById(input.id);
  if (!lansia) throw new Error("Gagal memuat ulang data lansia");
  return lansia;
}

// ---------------------------------------------------------------------------
// HAPUS LANSIA
// ---------------------------------------------------------------------------
export async function deleteLansia(id: string): Promise<void> {
  if (id.length === 36) {
    await dbQuery("DELETE FROM individu WHERE id = ?", [id]);
  } else {
    await dbQuery("DELETE FROM individu WHERE nik = ?", [id]);
  }
}

// ---------------------------------------------------------------------------
// RIWAYAT PEMERIKSAAN LANSIA
// ---------------------------------------------------------------------------
export async function getLansiaRecords(lansiaId: string): Promise<LansiaRecord[]> {
  let individuId = lansiaId;
  if (lansiaId.length !== 36) {
    const rows = await dbQuery("SELECT id FROM individu WHERE nik = ? LIMIT 1", [lansiaId]);
    if (rows.length > 0) individuId = rows[0].id;
  }

  const rows = await dbQuery(`
    SELECT m.id, m.tanggal_pemeriksaan, p.penyakit, p.keterangan
    FROM master_pemeriksaan m
    JOIN pemeriksaan_lansia p ON m.id = p.pemeriksaan_id
    WHERE m.individu_id = ? AND m.jenis_pemeriksaan = 'Lansia'
    ORDER BY m.tanggal_pemeriksaan ASC
  `, [individuId]);

  return rows.map((r: any) => {
    return mapRowToRecord({
      id: r.id,
      tanggal_pemeriksaan: r.tanggal_pemeriksaan,
      pemeriksaan_lansia: {
        penyakit: r.penyakit,
        keterangan: r.keterangan
      }
    }, lansiaId);
  });
}

export async function getLansiaRecordsForNiks(
  niksOrIds: string[],
): Promise<LansiaRecord[]> {
  if (niksOrIds.length === 0) return [];

  const placeholders = niksOrIds.map(() => "?").join(",");
  const queryField = niksOrIds[0].length === 36 ? "m.individu_id" : "i.nik";

  const rows = await dbQuery(`
    SELECT m.id, m.individu_id, m.tanggal_pemeriksaan, p.penyakit, p.keterangan
    FROM master_pemeriksaan m
    JOIN pemeriksaan_lansia p ON m.id = p.pemeriksaan_id
    JOIN individu i ON m.individu_id = i.id
    WHERE m.jenis_pemeriksaan = 'Lansia' AND ${queryField} IN (${placeholders})
    ORDER BY m.tanggal_pemeriksaan ASC
  `, niksOrIds);

  return rows.map((r: any) => {
    return mapRowToRecord({
      id: r.id,
      tanggal_pemeriksaan: r.tanggal_pemeriksaan,
      pemeriksaan_lansia: {
        penyakit: r.penyakit,
        keterangan: r.keterangan
      }
    }, r.individu_id);
  });
}

// ---------------------------------------------------------------------------
// PENYAKIT PALING BANYAK (DASHBOARD STATS)
// ---------------------------------------------------------------------------
export async function getDiseaseStats(): Promise<{ name: string; count: number }[]> {
  const data = await dbQuery(`
    SELECT p.penyakit
    FROM master_pemeriksaan m
    JOIN pemeriksaan_lansia p ON m.id = p.pemeriksaan_id
    WHERE m.jenis_pemeriksaan = 'Lansia'
  `);

  const diseaseMap: Record<string, number> = {};
  (data ?? []).forEach((row: any) => {
    const riwayat = row.penyakit;
    if (riwayat && riwayat !== "-") {
      riwayat
        .split(",")
        .map((d: string) => d.trim())
        .forEach((d: string) => {
          if (d) diseaseMap[d] = (diseaseMap[d] || 0) + 1;
        });
    }
  });

  return Object.entries(diseaseMap)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}

// ---------------------------------------------------------------------------
// TAMBAH RIWAYAT PEMERIKSAAN
// ---------------------------------------------------------------------------
export interface AddLansiaRecordInput {
  lansiaId: string;
  tanggalPemeriksaan: string;
  tinggiBadan: number;
  beratBadan: number;
  tekananDarahSistolik: number;
  tekananDarahDiastolik: number;
  riwayatPenyakit: string;
  obat: string;
  penyakitBaru: string;
}

export async function addLansiaRecord(
  input: AddLansiaRecordInput,
): Promise<LansiaRecord> {
  let individuId = input.lansiaId;
  if (input.lansiaId.length !== 36) {
    const rows = await dbQuery("SELECT id FROM individu WHERE nik = ? LIMIT 1", [input.lansiaId]);
    if (rows.length > 0) individuId = rows[0].id;
  }

  const counts = await dbQuery(
    "SELECT COUNT(*) as count FROM master_pemeriksaan WHERE individu_id = ? AND jenis_pemeriksaan = 'Lansia'",
    [individuId]
  );
  const kunjunganKe = (counts[0]?.count || 0) + 1;

  const masterId = crypto.randomUUID();
  await dbQuery(
    "INSERT INTO master_pemeriksaan (id, individu_id, tanggal_pemeriksaan, kunjungan_ke, jenis_pemeriksaan) VALUES (?, ?, ?, ?, 'Lansia')",
    [masterId, individuId, input.tanggalPemeriksaan, kunjunganKe]
  );

  let currentWali = "";
  let currentTelp = "";

  const prevRecord = await dbQuery(`
    SELECT p.nama_wali, p.keterangan
    FROM master_pemeriksaan m
    JOIN pemeriksaan_lansia p ON m.id = p.pemeriksaan_id
    WHERE m.individu_id = ? AND m.jenis_pemeriksaan = 'Lansia'
    ORDER BY m.tanggal_pemeriksaan DESC
    LIMIT 1
  `, [individuId]);

  if (prevRecord.length > 0) {
    currentWali = prevRecord[0].nama_wali || "";
    const parsed = parseKeterangan(prevRecord[0].keterangan);
    currentTelp = parsed.noTelpWali || "";
  }

  const serialized = serializeKeterangan({
    tinggiBadan: input.tinggiBadan,
    beratBadan: input.beratBadan,
    tekananDarahSistolik: input.tekananDarahSistolik,
    tekananDarahDiastolik: input.tekananDarahDiastolik,
    obat: input.obat,
    noTelpWali: currentTelp,
    penyakitBaru: input.penyakitBaru,
  });

  try {
    await dbQuery(
      "INSERT INTO pemeriksaan_lansia (pemeriksaan_id, nama_wali, penyakit, keterangan) VALUES (?, ?, ?, ?)",
      [masterId, currentWali, input.riwayatPenyakit, serialized]
    );
  } catch (err) {
    await dbQuery("DELETE FROM master_pemeriksaan WHERE id = ?", [masterId]);
    throw err;
  }

  return mapRowToRecord({
    id: masterId,
    tanggal_pemeriksaan: input.tanggalPemeriksaan,
    pemeriksaan_lansia: {
      penyakit: input.riwayatPenyakit,
      keterangan: serialized
    }
  }, individuId);
}

// ---------------------------------------------------------------------------
// UPDATE RIWAYAT PEMERIKSAAN LANSIA
// ---------------------------------------------------------------------------
export interface UpdateLansiaRecordInput {
  id: string; // record id (pemeriksaan_id)
  tanggalPemeriksaan: string;
  tinggiBadan: number;
  beratBadan: number;
  tekananDarahSistolik: number;
  tekananDarahDiastolik: number;
  riwayatPenyakit: string;
  obat: string;
  penyakitBaru: string;
}

export async function updateLansiaRecord(
  input: UpdateLansiaRecordInput,
): Promise<LansiaRecord> {
  await dbQuery(
    "UPDATE master_pemeriksaan SET tanggal_pemeriksaan = ? WHERE id = ?",
    [input.tanggalPemeriksaan, input.id]
  );

  const current = await dbQuery(
    "SELECT nama_wali, keterangan FROM pemeriksaan_lansia WHERE pemeriksaan_id = ? LIMIT 1",
    [input.id]
  );

  const currentMeta = parseKeterangan(current[0]?.keterangan);

  const serialized = serializeKeterangan({
    tinggiBadan: input.tinggiBadan,
    beratBadan: input.beratBadan,
    tekananDarahSistolik: input.tekananDarahSistolik,
    tekananDarahDiastolik: input.tekananDarahDiastolik,
    obat: input.obat,
    noTelpWali: currentMeta.noTelpWali || "",
    penyakitBaru: input.penyakitBaru,
  });

  await dbQuery(
    "UPDATE pemeriksaan_lansia SET penyakit = ?, keterangan = ? WHERE pemeriksaan_id = ?",
    [input.riwayatPenyakit, serialized, input.id]
  );

  const master = await dbQuery(
    "SELECT individu_id FROM master_pemeriksaan WHERE id = ? LIMIT 1",
    [input.id]
  );

  return mapRowToRecord({
    id: input.id,
    tanggal_pemeriksaan: input.tanggalPemeriksaan,
    pemeriksaan_lansia: {
      nama_wali: current[0]?.nama_wali || "",
      penyakit: input.riwayatPenyakit,
      keterangan: serialized
    }
  }, master[0]?.individu_id || "");
}

// ---------------------------------------------------------------------------
// HAPUS RIWAYAT PEMERIKSAAN
// ---------------------------------------------------------------------------
export async function deleteLansiaRecord(recordId: string): Promise<void> {
  await dbQuery("DELETE FROM master_pemeriksaan WHERE id = ?", [recordId]);
}
