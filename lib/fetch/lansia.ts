import { createClient } from "@/lib/supabase/client";

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
    // fallback if raw text
    return { ...defaultMeta, obat: ket };
  }
}

function serializeKeterangan(meta: LansiaMeta): string {
  return JSON.stringify(meta);
}

function mapRowToLansia(row: any): Lansia {
  // Find the latest examination to fetch the wali info
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
  const supabase = createClient();
  const { data, error } = await supabase
    .from("individu")
    .select(`
      *,
      keluarga:keluarga(no_kk),
      master_pemeriksaan(
        id,
        jenis_pemeriksaan,
        pemeriksaan_lansia(
          nama_wali,
          keterangan
        )
      )
    `)
    .order("tanggal_lahir", { ascending: true });

  if (error) throw new Error(error.message);

  const lansias = (data ?? []).filter((r: any) => {
    const birthDate = new Date(r.tanggal_lahir);
    const today = new Date();
    let ageYears = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      ageYears--;
    }
    return ageYears >= 60;
  });

  return lansias.map(mapRowToLansia);
}

export async function getLansiaById(id: string): Promise<Lansia | null> {
  const supabase = createClient();
  let query = supabase
    .from("individu")
    .select(`
      *,
      keluarga:keluarga(no_kk),
      master_pemeriksaan(
        id,
        jenis_pemeriksaan,
        pemeriksaan_lansia(
          nama_wali,
          keterangan
        )
      )
    `);

  if (id.length === 36) {
    query = query.eq("id", id);
  } else {
    query = query.eq("nik", id);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRowToLansia(data) : null;
}

// ---------------------------------------------------------------------------
// DAFTAR KK (untuk dropdown "Nomor KK")
// ---------------------------------------------------------------------------
export async function getKKs(): Promise<KKOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("keluarga")
    .select("no_kk, alamat, no_telp")
    .order("no_kk");

  if (error) throw new Error(error.message);
  return (data ?? []).map((k) => {
    return {
      noKk: k.no_kk || "",
      alamat: k.alamat ?? undefined,
      noTelp: k.no_telp ?? undefined,
    };
  });
}

// ---------------------------------------------------------------------------
// TAMBAH LANSIA
// ---------------------------------------------------------------------------
export interface AddLansiaInput {
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  noKk?: string;
  namaAyah: string; // Used as Nama Wali
  namaIbu: string;  // Used as No. Telp Wali
  statusHidup: StatusHidup;
  nik?: string;
  golonganDarah?: string;
}

function generateTempNik(): string {
  return `TMP${Date.now()}`.padEnd(16, "0").slice(0, 16);
}

export async function addLansia(input: AddLansiaInput): Promise<Lansia> {
  const supabase = createClient();

  let keluargaId = null;
  if (input.noKk) {
    const { data: kk } = await supabase.from("keluarga").select("id").eq("no_kk", input.noKk).single();
    if (kk) keluargaId = kk.id;
  }

  const nik = input.nik && input.nik.length === 16 ? input.nik : generateTempNik();

  const { data: individu, error: individuError } = await supabase
    .from("individu")
    .insert({
      keluarga_id: keluargaId,
      nik,
      nama: input.nama,
      tempat_lahir: input.tempatLahir,
      tanggal_lahir: input.tanggalLahir,
      jenis_kelamin: input.jenisKelamin,
      status_hidup: input.statusHidup,
      golongan_darah: input.golonganDarah ?? null,
    })
    .select("id")
    .single();

  if (individuError) throw new Error(individuError.message);

  // Store the initial Wali information in a representative examination
  const { data: master, error: masterError } = await supabase
    .from("master_pemeriksaan")
    .insert({
      individu_id: individu.id,
      tanggal_pemeriksaan: new Date().toISOString().split("T")[0],
      kunjungan_ke: 1,
      jenis_pemeriksaan: "Lansia",
    })
    .select("id")
    .single();

  if (!masterError) {
    const serialized = serializeKeterangan({
      tinggiBadan: 0,
      beratBadan: 0,
      tekananDarahSistolik: 0,
      tekananDarahDiastolik: 0,
      obat: "",
      noTelpWali: input.namaIbu,
      penyakitBaru: ""
    });

    await supabase.from("pemeriksaan_lansia").insert({
      pemeriksaan_id: master.id,
      nama_wali: input.namaAyah,
      penyakit: "",
      keterangan: serialized,
    });
  }

  const lansia = await getLansiaById(individu.id);
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
  const supabase = createClient();
  let query = supabase.from("individu").update({
    status_hidup: input.statusHidup,
    tanggal_meninggal: input.tanggalMeninggal || null,
    keterangan_meninggal: input.penyebabMeninggal || null,
  });

  if (input.id.length === 36) {
    query = query.eq("id", input.id);
  } else {
    query = query.eq("nik", input.id);
  }

  const { error } = await query;
  if (error) throw new Error(error.message);

  const lansia = await getLansiaById(input.id);
  if (!lansia) throw new Error("Data lansia tidak ditemukan setelah update");
  return lansia;
}

// ---------------------------------------------------------------------------
// HAPUS LANSIA
// ---------------------------------------------------------------------------
export async function deleteLansia(id: string): Promise<void> {
  const supabase = createClient();
  let query = supabase.from("individu").delete();
  if (id.length === 36) {
    query = query.eq("id", id);
  } else {
    query = query.eq("nik", id);
  }
  const { error } = await query;
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// RIWAYAT PEMERIKSAAN
// ---------------------------------------------------------------------------
export async function getLansiaRecords(
  lansiaId: string,
): Promise<LansiaRecord[]> {
  const supabase = createClient();
  let indId = lansiaId;
  if (lansiaId.length !== 36) {
    const { data: indData } = await supabase.from("individu").select("id").eq("nik", lansiaId).maybeSingle();
    if (indData) indId = indData.id;
  }

  const { data, error } = await supabase
    .from("master_pemeriksaan")
    .select(`
      id,
      individu_id,
      tanggal_pemeriksaan,
      kunjungan_ke,
      jenis_pemeriksaan,
      pemeriksaan_lansia(
        nama_wali,
        penyakit,
        keterangan
      )
    `)
    .eq("individu_id", indId)
    .eq("jenis_pemeriksaan", "Lansia")
    .order("tanggal_pemeriksaan", { ascending: true });

  if (error) throw new Error(error.message);

  // Filter out the initial "dummy" pendaftaran if there are real examinations
  const list = data ?? [];
  return list.map((row: any) => mapRowToRecord(row, indId));
}

export async function getLansiaRecordsForNiks(
  niksOrIds: string[],
): Promise<LansiaRecord[]> {
  if (niksOrIds.length === 0) return [];

  const supabase = createClient();
  let query = supabase
    .from("master_pemeriksaan")
    .select(`
      id,
      individu_id,
      tanggal_pemeriksaan,
      kunjungan_ke,
      jenis_pemeriksaan,
      pemeriksaan_lansia(
        nama_wali,
        penyakit,
        keterangan
      ),
      individu!inner(id, nik)
    `)
    .eq("jenis_pemeriksaan", "Lansia");

  if (niksOrIds[0].length === 36) {
    query = query.in("individu_id", niksOrIds);
  } else {
    query = query.in("individu.nik", niksOrIds);
  }

  const { data, error } = await query
    .order("tanggal_pemeriksaan", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => mapRowToRecord(row, row.individu_id));
}

// ---------------------------------------------------------------------------
// STATISTIK PENYAKIT DOMINAN
// ---------------------------------------------------------------------------
export interface DiseaseStat {
  name: string;
  count: number;
}

export async function getDiseaseStats(): Promise<DiseaseStat[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("master_pemeriksaan")
    .select(`
      individu_id,
      pemeriksaan_lansia!inner(
        penyakit
      )
    `)
    .eq("jenis_pemeriksaan", "Lansia");

  if (error) throw new Error(error.message);

  const diseaseMap: Record<string, number> = {};
  (data ?? []).forEach((row: any) => {
    const riwayat = row.pemeriksaan_lansia?.penyakit;
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
  const supabase = createClient();
  
  let individuId = input.lansiaId;
  if (input.lansiaId.length !== 36) {
    const { data: ind } = await supabase.from("individu").select("id").eq("nik", input.lansiaId).single();
    if (ind) individuId = ind.id;
  }

  const { count } = await supabase
    .from("master_pemeriksaan")
    .select("*", { count: "exact", head: true })
    .eq("individu_id", individuId)
    .eq("jenis_pemeriksaan", "Lansia");

  const kunjunganKe = (count || 0) + 1;

  const { data: master, error: masterError } = await supabase
    .from("master_pemeriksaan")
    .insert({
      individu_id: individuId,
      tanggal_pemeriksaan: input.tanggalPemeriksaan,
      kunjungan_ke: kunjunganKe,
      jenis_pemeriksaan: "Lansia",
    })
    .select("id, tanggal_pemeriksaan")
    .single();

  if (masterError) throw new Error(masterError.message);

  // Fetch current wali from previous records if any
  let currentWali = "";
  let currentTelp = "";
  const { data: prevRecord } = await supabase
    .from("master_pemeriksaan")
    .select("pemeriksaan_lansia(nama_wali, keterangan)")
    .eq("individu_id", individuId)
    .eq("jenis_pemeriksaan", "Lansia")
    .order("tanggal_pemeriksaan", { ascending: false })
    .limit(1);

  if (prevRecord?.[0]?.pemeriksaan_lansia) {
    const detail = Array.isArray(prevRecord[0].pemeriksaan_lansia)
      ? prevRecord[0].pemeriksaan_lansia[0]
      : prevRecord[0].pemeriksaan_lansia;
    currentWali = detail?.nama_wali || "";
    const parsed = parseKeterangan(detail?.keterangan);
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

  const { data: detail, error: detailError } = await supabase
    .from("pemeriksaan_lansia")
    .insert({
      pemeriksaan_id: master.id,
      nama_wali: currentWali,
      penyakit: input.riwayatPenyakit,
      keterangan: serialized,
    })
    .select()
    .single();

  if (detailError) {
    await supabase.from("master_pemeriksaan").delete().eq("id", master.id);
    throw new Error(detailError.message);
  }

  return mapRowToRecord({ ...master, pemeriksaan_lansia: detail }, individuId);
}

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
  const supabase = createClient();

  const { error: masterError } = await supabase
    .from("master_pemeriksaan")
    .update({
      tanggal_pemeriksaan: input.tanggalPemeriksaan,
    })
    .eq("id", input.id);

  if (masterError) throw new Error(masterError.message);

  // Fetch current record to preserve unchanged fields like nama_wali
  const { data: current } = await supabase
    .from("pemeriksaan_lansia")
    .select("nama_wali, keterangan")
    .eq("pemeriksaan_id", input.id)
    .single();

  const currentMeta = parseKeterangan(current?.keterangan);

  const serialized = serializeKeterangan({
    tinggiBadan: input.tinggiBadan,
    beratBadan: input.beratBadan,
    tekananDarahSistolik: input.tekananDarahSistolik,
    tekananDarahDiastolik: input.tekananDarahDiastolik,
    obat: input.obat,
    noTelpWali: currentMeta.noTelpWali || "",
    penyakitBaru: input.penyakitBaru,
  });

  const { data: detail, error: detailError } = await supabase
    .from("pemeriksaan_lansia")
    .update({
      penyakit: input.riwayatPenyakit,
      keterangan: serialized,
    })
    .eq("pemeriksaan_id", input.id)
    .select()
    .single();

  if (detailError) throw new Error(detailError.message);

  const { data: master } = await supabase
    .from("master_pemeriksaan")
    .select("individu_id")
    .eq("id", input.id)
    .single();

  return mapRowToRecord({ id: input.id, tanggal_pemeriksaan: input.tanggalPemeriksaan, pemeriksaan_lansia: detail }, master?.individu_id || "");
}

export async function deleteLansiaRecord(recordId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("master_pemeriksaan")
    .delete()
    .eq("id", recordId);

  if (error) throw new Error(error.message);
}


