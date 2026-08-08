import { createClient } from "@/lib/supabase/client";

export type StatusHidup = "Hidup" | "Meninggal";

export interface PostBirthRecord {
  nama: string;
  tempat: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  caraLahir: "Normal" | "SC";
  usiaKehamilanSaatLahirWeeks: number;
}

export interface IbuHamil {
  id: string; // representative pemeriksaan_id (episode)
  nik: string;
  noKk: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  hpht: string;
  golonganDarah?: string;
  statusHidup: StatusHidup;
  tanggalMeninggal?: string;
  penyebabMeninggal?: string;
  postBirthRecord?: PostBirthRecord;
}

export interface IbuHamilRecord {
  id: string;
  ibuHamilId: string;
  tanggalPemeriksaan: string;
  beratBadan: number;
  tinggiBadan?: number;
  tekananDarahSistolik: number;
  tekananDarahDiastolik: number;
  usiaKehamilanWeeks: number;
  kunjunganKe: number;
  vitamin: string;
}

export interface KKOption {
  noKk: string;
  alamat?: string;
  noTelp?: string;
  rt?: string;
  rw?: string;
  nikAyah?: string;
  namaAyah?: string;
  tempatLahirAyah?: string;
  tanggalLahirAyah?: string;
  nikIbu?: string;
  namaIbu?: string;
  tempatLahirIbu?: string;
  tanggalLahirIbu?: string;
}

function parseAlamat(alamatRaw: string | null) {
  if (!alamatRaw) return { alamat: "", rt: "", rw: "" };
  const rtMatch = alamatRaw.match(/\[RT:\s*([^\]]+)\]/);
  const rwMatch = alamatRaw.match(/\[RW:\s*([^\]]+)\]/);
  let cleanAlamat = alamatRaw.replace(/\[RT:\s*[^\]]+\]/g, "").replace(/\[RW:\s*[^\]]+\]/g, "").trim();
  return {
    alamat: cleanAlamat,
    rt: rtMatch ? rtMatch[1] : "",
    rw: rwMatch ? rwMatch[1] : ""
  };
}

function mapRowToIbuHamil(row: any): IbuHamil {
  const detail = Array.isArray(row.pemeriksaan_ibu_hamil)
    ? row.pemeriksaan_ibu_hamil[0]
    : row.pemeriksaan_ibu_hamil;
  const birth = detail?.kelahiran?.[0] || detail?.kelahiran;
  const child = birth?.child;

  return {
    id: row.id, // pemeriksaan_id representing this episode
    nik: row.individu?.nik || "",
    noKk: row.individu?.keluarga?.no_kk || "",
    nama: row.individu?.nama || "",
    tempatLahir: row.individu?.tempat_lahir || "",
    tanggalLahir: row.individu?.tanggal_lahir || "",
    hpht: detail?.tanggal_hpht || "",
    golonganDarah: row.individu?.golongan_darah || undefined,
    statusHidup: row.individu?.status_hidup || "Hidup",
    tanggalMeninggal: row.individu?.tanggal_meninggal || undefined,
    penyebabMeninggal: row.individu?.keterangan_meninggal || undefined,
    postBirthRecord: birth
      ? {
          nama: child?.nama || "",
          tempat: birth.tempat_kelahiran || "",
          tanggalLahir: birth.tanggal_kelahiran || "",
          jenisKelamin: child?.jenis_kelamin || "P",
          caraLahir: birth.cara_kelahiran || "Normal",
          usiaKehamilanSaatLahirWeeks: birth.usia_kehamilan_minggu || 40,
        }
      : undefined,
  };
}

function mapRowToRecord(row: any, episodeId: string): IbuHamilRecord {
  const detail = row.pemeriksaan_ibu_hamil || {};
  return {
    id: row.id,
    ibuHamilId: episodeId,
    tanggalPemeriksaan: row.tanggal_pemeriksaan,
    beratBadan: detail.berat_badan ? Number(detail.berat_badan) : 0,
    tinggiBadan: detail.tinggi_badan ? Number(detail.tinggi_badan) : undefined,
    tekananDarahSistolik: detail.tekanan_sistolik ? Number(detail.tekanan_sistolik) : 0,
    tekananDarahDiastolik: detail.tekanan_diastolik ? Number(detail.tekanan_diastolik) : 0,
    usiaKehamilanWeeks: detail.usia_kehamilan_minggu ? Number(detail.usia_kehamilan_minggu) : 0,
    kunjunganKe: row.kunjungan_ke ? Number(row.kunjungan_ke) : 0,
    vitamin: detail.vitamin ?? "",
  };
}

// ---------------------------------------------------------------------------
// DAFTAR IBU HAMIL
// ---------------------------------------------------------------------------
export async function getIbuHamils(): Promise<IbuHamil[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("master_pemeriksaan")
    .select(`
      id,
      individu_id,
      tanggal_pemeriksaan,
      kunjungan_ke,
      jenis_pemeriksaan,
      pemeriksaan_ibu_hamil(
        tanggal_hpht,
        status_kelahiran,
        kelahiran:kelahiran!kelahiran_pemeriksaan_ibu_hamil_id_fkey(
          id,
          cara_kelahiran,
          tanggal_kelahiran,
          tempat_kelahiran,
          usia_kehamilan_minggu,
          child:individu!kelahiran_individu_anak_id_fkey(
            id,
            nama,
            jenis_kelamin
          )
        )
      ),
      individu(
        id,
        nik,
        nama,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin,
        golongan_darah,
        status_hidup,
        tanggal_meninggal,
        keterangan_meninggal,
        keluarga(id, no_kk)
      )
    `)
    .eq("jenis_pemeriksaan", "Ibu Hamil")
    .order("tanggal_pemeriksaan", { ascending: false });

  if (error) throw new Error(error.message);

  // Group by (individu_id, tanggal_hpht)
  const episodes: Record<string, any> = {};
  for (const row of (data ?? []) as any[]) {
    const detail = Array.isArray(row.pemeriksaan_ibu_hamil)
      ? row.pemeriksaan_ibu_hamil[0]
      : row.pemeriksaan_ibu_hamil;
    const hpht = detail?.tanggal_hpht || "";
    const key = `${row.individu_id}_${hpht}`;
    if (!episodes[key]) {
      episodes[key] = row; // Keep the latest exam as representative
    }
  }

  return Object.values(episodes).map(mapRowToIbuHamil);
}

export async function getIbuHamilById(id: string): Promise<IbuHamil | null> {
  const supabase = createClient();
  let query = supabase
    .from("master_pemeriksaan")
    .select(`
      id,
      individu_id,
      tanggal_pemeriksaan,
      kunjungan_ke,
      jenis_pemeriksaan,
      pemeriksaan_ibu_hamil(
        tanggal_hpht,
        status_kelahiran,
        kelahiran:kelahiran!kelahiran_pemeriksaan_ibu_hamil_id_fkey(
          id,
          cara_kelahiran,
          tanggal_kelahiran,
          tempat_kelahiran,
          usia_kehamilan_minggu,
          child:individu!kelahiran_individu_anak_id_fkey(
            id,
            nama,
            jenis_kelamin
          )
        )
      ),
      individu(
        id,
        nik,
        nama,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin,
        golongan_darah,
        status_hidup,
        tanggal_meninggal,
        keterangan_meninggal,
        keluarga(id, no_kk)
      )
    `);

  if (id.length === 36) {
    query = query.eq("id", id);
  } else {
    // If it's a NIK, get the latest pregnancy for this individual
    const { data: ind } = await supabase.from("individu").select("id").eq("nik", id).maybeSingle();
    if (!ind) return null;
    query = query.eq("individu_id", ind.id).eq("jenis_pemeriksaan", "Ibu Hamil").limit(1);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRowToIbuHamil(data) : null;
}

// ---------------------------------------------------------------------------
// DAFTAR KK (untuk dropdown "Nomor KK")
// ---------------------------------------------------------------------------
export async function getKKs(): Promise<KKOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("keluarga")
    .select(`
      id,
      no_kk,
      alamat,
      no_telp,
      members:individu(
        id,
        nik,
        nama,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin,
        status_keluarga
      )
    `)
    .order("no_kk");

  if (error) throw new Error(error.message);

  return (data ?? []).map((k: any) => {
    const { alamat, rt, rw } = parseAlamat(k.alamat);
    const ayah = k.members?.find((m: any) => m.status_keluarga === "Kepala Keluarga" || m.status_keluarga === "Ayah");
    const ibu = k.members?.find((m: any) => m.status_keluarga === "Istri" || m.status_keluarga === "Ibu");

    return {
      noKk: k.no_kk || "",
      alamat: alamat,
      noTelp: k.no_telp ?? undefined,
      rt,
      rw,
      nikAyah: ayah?.nik || ayah?.id || undefined,
      namaAyah: ayah?.nama ?? undefined,
      tempatLahirAyah: ayah?.tempat_lahir ?? undefined,
      tanggalLahirAyah: ayah?.tanggal_lahir ?? undefined,
      nikIbu: ibu?.nik || ibu?.id || undefined,
      namaIbu: ibu?.nama ?? undefined,
      tempatLahirIbu: ibu?.tempat_lahir ?? undefined,
      tanggalLahirIbu: ibu?.tanggal_lahir ?? undefined,
    };
  });
}

// ---------------------------------------------------------------------------
// TAMBAH IBU HAMIL (episode kehamilan baru)
// ---------------------------------------------------------------------------
export interface AddIbuHamilInput {
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  noKk: string;
  nik: string;
  hpht: string;
  statusHidup: StatusHidup;
  golonganDarah?: string;
}

function generateTempNik(): string {
  return `TMP${Date.now()}`.padEnd(16, "0").slice(0, 16);
}

export async function addIbuHamil(input: AddIbuHamilInput): Promise<IbuHamil> {
  const supabase = createClient();

  const { data: kk } = await supabase.from("keluarga").select("id").eq("no_kk", input.noKk).single();
  if (!kk) throw new Error("Nomor KK tidak terdaftar");

  let motherId = "";
  const cleanNik = input.nik && input.nik.length === 16 ? input.nik : generateTempNik();

  const { data: existing } = await supabase
    .from("individu")
    .select("id")
    .eq("nik", cleanNik)
    .maybeSingle();

  if (existing) {
    motherId = existing.id;
  } else {
    const { data: ind, error: individuError } = await supabase
      .from("individu")
      .insert({
        keluarga_id: kk.id,
        nik: cleanNik,
        nama: input.nama,
        tempat_lahir: input.tempatLahir,
        tanggal_lahir: input.tanggalLahir,
        jenis_kelamin: "P",
        status_keluarga: "Istri",
        golongan_darah: input.golonganDarah ?? null,
      })
      .select("id")
      .single();

    if (individuError) throw new Error(individuError.message);
    motherId = ind.id;
  }

  // Create representative master pemeriksaan to establish episode
  const { data: master, error: masterError } = await supabase
    .from("master_pemeriksaan")
    .insert({
      individu_id: motherId,
      tanggal_pemeriksaan: new Date().toISOString().split("T")[0],
      kunjungan_ke: 1,
      jenis_pemeriksaan: "Ibu Hamil",
    })
    .select("id")
    .single();

  if (masterError) {
    // clean up if just inserted
    if (!existing) await supabase.from("individu").delete().eq("id", motherId);
    throw new Error(masterError.message);
  }

  const { error: detailError } = await supabase
    .from("pemeriksaan_ibu_hamil")
    .insert({
      pemeriksaan_id: master.id,
      tanggal_hpht: input.hpht,
      catatan: "Pendaftaran Kehamilan",
    });

  if (detailError) {
    await supabase.from("master_pemeriksaan").delete().eq("id", master.id);
    if (!existing) await supabase.from("individu").delete().eq("id", motherId);
    throw new Error(detailError.message);
  }

  const ibuHamil = await getIbuHamilById(master.id);
  if (!ibuHamil) throw new Error("Data tersimpan tapi gagal dimuat ulang");
  return ibuHamil;
}

// ---------------------------------------------------------------------------
// UPDATE STATUS HIDUP
// ---------------------------------------------------------------------------
export interface UpdateIbuHamilInput {
  id: string; // episode id
  nik: string; // NIK or UUID
  statusHidup: StatusHidup;
  tanggalMeninggal?: string;
  penyebabMeninggal?: string;
}

export async function updateIbuHamil(
  input: UpdateIbuHamilInput,
): Promise<IbuHamil> {
  const supabase = createClient();
  let query = supabase.from("individu").update({
    status_hidup: input.statusHidup,
    tanggal_meninggal: input.tanggalMeninggal || null,
    keterangan_meninggal: input.penyebabMeninggal || null,
  });

  if (input.nik.length === 36) {
    query = query.eq("id", input.nik);
  } else {
    query = query.eq("nik", input.nik);
  }

  const { error } = await query;
  if (error) throw new Error(error.message);

  const ibuHamil = await getIbuHamilById(input.id);
  if (!ibuHamil) throw new Error("Data tidak ditemukan setelah update");
  return ibuHamil;
}

// ---------------------------------------------------------------------------
// EDIT IDENTITAS & DATA KEHAMILAN
// ---------------------------------------------------------------------------
export interface UpdateIbuHamilDataInput {
  id: string; // representative pemeriksaan_id
  nik: string; // NIK or UUID
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  hpht: string;
  golonganDarah?: string;
}

export async function updateIbuHamilData(
  input: UpdateIbuHamilDataInput,
): Promise<IbuHamil> {
  const supabase = createClient();

  let indQuery = supabase.from("individu").update({
    nama: input.nama,
    tempat_lahir: input.tempatLahir,
    tanggal_lahir: input.tanggalLahir,
    golongan_darah: input.golonganDarah || null,
  });

  if (input.nik.length === 36) {
    indQuery = indQuery.eq("id", input.nik);
  } else {
    indQuery = indQuery.eq("nik", input.nik);
  }

  const { error: individuError } = await indQuery;
  if (individuError) throw new Error(individuError.message);

  // Update HPHT in all examinations under this episode
  const episode = await supabase
    .from("master_pemeriksaan")
    .select("individu_id, pemeriksaan_ibu_hamil(tanggal_hpht)")
    .eq("id", input.id)
    .single();

  if (episode.data) {
    const detail = Array.isArray(episode.data.pemeriksaan_ibu_hamil)
      ? episode.data.pemeriksaan_ibu_hamil[0]
      : episode.data.pemeriksaan_ibu_hamil;
    const oldHpht = detail?.tanggal_hpht;
    const motherId = episode.data.individu_id;

    // Get all examinations for this mother and pregnancy
    const { data: exams } = await supabase
      .from("master_pemeriksaan")
      .select("id")
      .eq("individu_id", motherId)
      .eq("jenis_pemeriksaan", "Ibu Hamil");

    const examIds = (exams ?? []).map(e => e.id);
    if (examIds.length > 0) {
      await supabase
        .from("pemeriksaan_ibu_hamil")
        .update({ tanggal_hpht: input.hpht })
        .in("pemeriksaan_id", examIds)
        .eq("tanggal_hpht", oldHpht);
    }
  }

  const updated = await getIbuHamilById(input.id);
  if (!updated) throw new Error("Data tidak ditemukan setelah update");
  return updated;
}

// ---------------------------------------------------------------------------
// HAPUS EPISODE
// ---------------------------------------------------------------------------
export async function deleteIbuHamil(id: string): Promise<void> {
  const supabase = createClient();
  
  const { data: target } = await supabase
    .from("master_pemeriksaan")
    .select("individu_id, pemeriksaan_ibu_hamil(tanggal_hpht)")
    .eq("id", id)
    .single();

  if (target) {
    const detail = Array.isArray(target.pemeriksaan_ibu_hamil)
      ? target.pemeriksaan_ibu_hamil[0]
      : target.pemeriksaan_ibu_hamil;
    const hpht = detail?.tanggal_hpht;
    const motherId = target.individu_id;

    // Fetch all examinations matching this pregnancy episode
    const { data: exams } = await supabase
      .from("master_pemeriksaan")
      .select("id, pemeriksaan_ibu_hamil!inner(tanggal_hpht)")
      .eq("individu_id", motherId)
      .eq("jenis_pemeriksaan", "Ibu Hamil")
      .eq("pemeriksaan_ibu_hamil.tanggal_hpht", hpht);

    const examIds = (exams ?? []).map(e => e.id);
    if (examIds.length > 0) {
      await supabase.from("master_pemeriksaan").delete().in("id", examIds);
    }
  }
}

// ---------------------------------------------------------------------------
// RIWAYAT PEMERIKSAAN (ANC)
// ---------------------------------------------------------------------------
export async function getIbuHamilRecords(
  ibuHamilId: string,
): Promise<IbuHamilRecord[]> {
  const supabase = createClient();
  const target = await supabase
    .from("master_pemeriksaan")
    .select("individu_id, pemeriksaan_ibu_hamil(tanggal_hpht)")
    .eq("id", ibuHamilId)
    .single();

  if (!target.data) return [];
  const detail = Array.isArray(target.data.pemeriksaan_ibu_hamil)
    ? target.data.pemeriksaan_ibu_hamil[0]
    : target.data.pemeriksaan_ibu_hamil;
  const hpht = detail?.tanggal_hpht;
  const motherId = target.data.individu_id;

  const { data, error } = await supabase
    .from("master_pemeriksaan")
    .select(`
      id,
      individu_id,
      tanggal_pemeriksaan,
      kunjungan_ke,
      jenis_pemeriksaan,
      pemeriksaan_ibu_hamil!inner(
        tanggal_hpht,
        berat_badan,
        tinggi_badan,
        tekanan_sistolik,
        tekanan_diastolik,
        usia_kehamilan_minggu,
        vitamin,
        catatan
      )
    `)
    .eq("individu_id", motherId)
    .eq("jenis_pemeriksaan", "Ibu Hamil")
    .eq("pemeriksaan_ibu_hamil.tanggal_hpht", hpht)
    .order("tanggal_pemeriksaan", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => mapRowToRecord(row, ibuHamilId));
}

export interface AddIbuHamilRecordInput {
  ibuHamilId: string; // representative pemeriksaan_id
  tanggalPemeriksaan: string;
  beratBadan: number;
  tinggiBadan: number;
  tekananDarahSistolik: number;
  tekananDarahDiastolik: number;
  usiaKehamilanWeeks: number;
  kunjunganKe: number;
  vitamin: string;
}

export async function addIbuHamilRecord(
  input: AddIbuHamilRecordInput,
): Promise<IbuHamilRecord> {
  const supabase = createClient();
  
  const target = await supabase
    .from("master_pemeriksaan")
    .select("individu_id, pemeriksaan_ibu_hamil(tanggal_hpht)")
    .eq("id", input.ibuHamilId)
    .single();

  if (!target.data) throw new Error("Pregnancy episode not found");
  const detail = Array.isArray(target.data.pemeriksaan_ibu_hamil)
    ? target.data.pemeriksaan_ibu_hamil[0]
    : target.data.pemeriksaan_ibu_hamil;
  const hpht = detail?.tanggal_hpht;
  const motherId = target.data.individu_id;

  const { data: master, error: masterError } = await supabase
    .from("master_pemeriksaan")
    .insert({
      individu_id: motherId,
      tanggal_pemeriksaan: input.tanggalPemeriksaan,
      kunjungan_ke: input.kunjunganKe,
      jenis_pemeriksaan: "Ibu Hamil",
    })
    .select("id")
    .single();

  if (masterError) throw new Error(masterError.message);

  const { data: insertedDetail, error: detailError } = await supabase
    .from("pemeriksaan_ibu_hamil")
    .insert({
      pemeriksaan_id: master.id,
      tanggal_hpht: hpht,
      berat_badan: input.beratBadan,
      tinggi_badan: input.tinggiBadan,
      tekanan_sistolik: input.tekananDarahSistolik,
      tekanan_diastolik: input.tekananDarahDiastolik,
      usia_kehamilan_minggu: input.usiaKehamilanWeeks,
      vitamin: input.vitamin,
      catatan: "",
    })
    .select()
    .single();

  if (detailError) {
    await supabase.from("master_pemeriksaan").delete().eq("id", master.id);
    throw new Error(detailError.message);
  }

  return mapRowToRecord({ ...master, pemeriksaan_ibu_hamil: insertedDetail }, input.ibuHamilId);
}

// ---------------------------------------------------------------------------
// EDIT SATU DATA PEMERIKSAAN
// ---------------------------------------------------------------------------
export interface UpdateIbuHamilRecordInput {
  id: string; // record id (pemeriksaan_id)
  tanggalPemeriksaan: string;
  beratBadan: number;
  tinggiBadan: number;
  tekananDarahSistolik: number;
  tekananDarahDiastolik: number;
  usiaKehamilanWeeks: number;
  kunjunganKe: number;
  vitamin: string;
}

export async function updateIbuHamilRecord(
  input: UpdateIbuHamilRecordInput,
): Promise<IbuHamilRecord> {
  const supabase = createClient();
  
  const { error: masterError } = await supabase
    .from("master_pemeriksaan")
    .update({
      tanggal_pemeriksaan: input.tanggalPemeriksaan,
      kunjungan_ke: input.kunjunganKe,
    })
    .eq("id", input.id);

  if (masterError) throw new Error(masterError.message);

  const { data: detail, error: detailError } = await supabase
    .from("pemeriksaan_ibu_hamil")
    .update({
      berat_badan: input.beratBadan,
      tinggi_badan: input.tinggiBadan,
      tekanan_sistolik: input.tekananDarahSistolik,
      tekanan_diastolik: input.tekananDarahDiastolik,
      usia_kehamilan_minggu: input.usiaKehamilanWeeks,
      vitamin: input.vitamin,
    })
    .eq("pemeriksaan_id", input.id)
    .select()
    .single();

  if (detailError) throw new Error(detailError.message);

  return mapRowToRecord({ id: input.id, tanggal_pemeriksaan: input.tanggalPemeriksaan, kunjungan_ke: input.kunjunganKe, pemeriksaan_ibu_hamil: detail }, input.id);
}

// ---------------------------------------------------------------------------
// HAPUS SATU DATA PEMERIKSAAN
// ---------------------------------------------------------------------------
export async function deleteIbuHamilRecord(recordId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("master_pemeriksaan")
    .delete()
    .eq("id", recordId);

  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// BULK FETCH
// ---------------------------------------------------------------------------
export async function getIbuHamilRecordsForIds(
  ibuHamilIds: string[],
): Promise<IbuHamilRecord[]> {
  if (ibuHamilIds.length === 0) return [];

  const records: IbuHamilRecord[] = [];
  for (const id of ibuHamilIds) {
    const list = await getIbuHamilRecords(id);
    records.push(...list);
  }
  return records;
}

// ---------------------------------------------------------------------------
// CATAT KELAHIRAN
// ---------------------------------------------------------------------------
export interface AddPostBirthRecordInput {
  nama: string;
  tempat: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  caraLahir: "Normal" | "SC";
  usiaKehamilanSaatLahirWeeks: number;
  golonganDarah?: string;
}

export async function addPostBirthRecord(
  ibuHamilId: string,
  input: AddPostBirthRecordInput,
): Promise<IbuHamil> {
  const supabase = createClient();

  const bumil = await getIbuHamilById(ibuHamilId);
  if (!bumil) throw new Error("Data ibu hamil tidak ditemukan");

  // Get keluarga_id of mother
  const { data: motherInd } = await supabase
    .from("individu")
    .select("keluarga_id")
    .eq("nik", bumil.nik)
    .single();

  const keluargaId = motherInd?.keluarga_id;
  if (!keluargaId) throw new Error("Keluarga ID ibu tidak ditemukan");

  const babyNik = generateTempNik();

  // 1. Daftarkan bayi
  const { data: baby, error: individuError } = await supabase
    .from("individu")
    .insert({
      keluarga_id: keluargaId,
      nik: babyNik,
      nama: input.nama,
      tempat_lahir: input.tempat,
      tanggal_lahir: input.tanggalLahir,
      jenis_kelamin: input.jenisKelamin,
      status_keluarga: "Anak",
      golongan_darah: input.golonganDarah ?? null,
    })
    .select("id")
    .single();

  if (individuError) throw new Error(individuError.message);

  // 2. Tandai status_kelahiran di pemeriksaan_ibu_hamil
  await supabase
    .from("pemeriksaan_ibu_hamil")
    .update({ status_kelahiran: "Melahirkan" })
    .eq("pemeriksaan_id", ibuHamilId);

  // 3. Catat di kelahiran
  const { error: birthError } = await supabase
    .from("kelahiran")
    .insert({
      pemeriksaan_ibu_hamil_id: ibuHamilId,
      individu_anak_id: baby.id,
      cara_kelahiran: input.caraLahir,
      tanggal_kelahiran: input.tanggalLahir,
      tempat_kelahiran: input.tempat,
      usia_kehamilan_minggu: input.usiaKehamilanSaatLahirWeeks,
      berat_badan: null,
      tinggi_badan: null,
    });

  if (birthError) {
    // rollback baby
    await supabase.from("individu").delete().eq("id", baby.id);
    throw new Error(birthError.message);
  }

  const updated = await getIbuHamilById(ibuHamilId);
  if (!updated) throw new Error("Gagal memuat ulang data setelah kelahiran dicatat");
  return updated;
}

