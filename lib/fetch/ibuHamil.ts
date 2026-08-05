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
  id: string; // = ibu_hamil.id (episode kehamilan), dipakai untuk routing /dashboard/ibu-hamil/[id]
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

// ---------------------------------------------------------------------------
// Mapper: baris dari Supabase (snake_case) -> tipe yang dipakai komponen
// ---------------------------------------------------------------------------
function mapRowToIbuHamil(row: any): IbuHamil {
  const hasBirth = !!row.riwayat_kelahiran_id;
  return {
    id: row.id,
    nik: row.nik,
    noKk: row.no_kk,
    nama: row.nama,
    tempatLahir: row.tempat_lahir ?? "",
    tanggalLahir: row.tanggal_lahir,
    hpht: row.hpht,
    golonganDarah: row.golongan_darah ?? undefined,
    statusHidup: row.status_hidup,
    tanggalMeninggal: row.tanggal_meninggal ?? undefined,
    penyebabMeninggal: row.keterangan_meninggal ?? undefined,
    postBirthRecord: hasBirth
      ? {
          nama: row.anak_nama ?? "",
          tempat: row.anak_tempat_lahir ?? "",
          tanggalLahir: row.anak_tanggal_lahir,
          jenisKelamin: row.anak_jenis_kelamin,
          caraLahir: row.anak_cara_lahir,
          usiaKehamilanSaatLahirWeeks: row.anak_usia_kehamilan_minggu,
        }
      : undefined,
  };
}

function mapRowToRecord(row: any): IbuHamilRecord {
  return {
    id: row.id,
    ibuHamilId: row.ibu_hamil_id,
    tanggalPemeriksaan: row.tanggal_pemeriksaan,
    beratBadan: Number(row.berat_badan),
    tinggiBadan:
      row.tinggi_badan != null ? Number(row.tinggi_badan) : undefined,
    tekananDarahSistolik: Number(row.tekanan_sistolik),
    tekananDarahDiastolik: Number(row.tekanan_diastolik),
    usiaKehamilanWeeks: Number(row.usia_kehamilan_minggu),
    kunjunganKe: Number(row.kunjungan_ke),
    vitamin: row.vitamin ?? "",
  };
}

// ---------------------------------------------------------------------------
// DAFTAR IBU HAMIL
// ---------------------------------------------------------------------------
export async function getIbuHamils(): Promise<IbuHamil[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_ibu_hamil_lengkap")
    .select("*")
    .order("hpht", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRowToIbuHamil);
}

export async function getIbuHamilById(id: string): Promise<IbuHamil | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_ibu_hamil_lengkap")
    .select("*")
    .eq("id", id)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRowToIbuHamil(data) : null;
}

// ---------------------------------------------------------------------------
// DAFTAR KK (untuk dropdown "Nomor KK" di form tambah ibu hamil)
// ---------------------------------------------------------------------------
export async function getKKs(): Promise<KKOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("keluarga")
    .select(
      `
      no_kk, 
      alamat, 
      no_telp, 
      rt, 
      rw,
      nik_ayah,
      nik_ibu,
      ayah:individu!fk_keluarga_nik_ayah(nama, tempat_lahir, tanggal_lahir),
      ibu:individu!fk_keluarga_nik_ibu(nama, tempat_lahir, tanggal_lahir)
    `,
    )
    .order("no_kk");

  if (error) throw new Error(error.message);
  return (data ?? []).map((k: any) => ({
    noKk: k.no_kk,
    alamat: k.alamat ?? undefined,
    noTelp: k.no_telp ?? undefined,
    rt: k.rt ?? undefined,
    rw: k.rw ?? undefined,
    nikAyah: k.nik_ayah ?? undefined,
    namaAyah: k.ayah?.nama ?? undefined,
    tempatLahirAyah: k.ayah?.tempat_lahir ?? undefined,
    tanggalLahirAyah: k.ayah?.tanggal_lahir ?? undefined,
    nikIbu: k.nik_ibu ?? undefined,
    namaIbu: k.ibu?.nama ?? undefined,
    tempatLahirIbu: k.ibu?.tempat_lahir ?? undefined,
    tanggalLahirIbu: k.ibu?.tanggal_lahir ?? undefined,
  }));
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

export async function addIbuHamil(input: AddIbuHamilInput): Promise<IbuHamil> {
  const supabase = createClient();

  // Cek dulu apakah individu dengan NIK ini SUDAH ada (mis. ini kehamilan
  // ke-2/3 orang yang sama). Kalau sudah ada, jangan insert biodata lagi -
  // cukup tambah episode kehamilan baru untuk NIK yang sama.
  const { data: existing, error: checkError } = await supabase
    .from("individu")
    .select("nik")
    .eq("nik", input.nik)
    .maybeSingle();

  if (checkError) throw new Error(checkError.message);

  if (!existing) {
    const { error: individuError } = await supabase.from("individu").insert({
      nik: input.nik,
      no_kk: input.noKk,
      nama: input.nama,
      tempat_lahir: input.tempatLahir,
      tanggal_lahir: input.tanggalLahir,
      jenis_kelamin: "P",
      hubungan_keluarga: "Istri",
    });
    if (individuError) throw new Error(individuError.message);
  }

  const { data: episode, error: ibuHamilError } = await supabase
    .from("ibu_hamil")
    .insert({
      nik: input.nik,
      hpht: input.hpht,
      golongan_darah: input.golonganDarah ?? null,
    })
    .select()
    .single();

  if (ibuHamilError) throw new Error(ibuHamilError.message);

  const ibuHamil = await getIbuHamilById(episode.id);
  if (!ibuHamil) throw new Error("Data tersimpan tapi gagal dimuat ulang");
  return ibuHamil;
}

// ---------------------------------------------------------------------------
// UPDATE STATUS HIDUP / MENINGGAL (status milik ORANG, bukan episode)
// ---------------------------------------------------------------------------
export interface UpdateIbuHamilInput {
  id: string; // episode id, dipakai untuk reload data setelah update
  nik: string; // dipakai untuk UPDATE individu
  statusHidup: StatusHidup;
  tanggalMeninggal?: string;
  penyebabMeninggal?: string;
}

export async function updateIbuHamil(
  input: UpdateIbuHamilInput,
): Promise<IbuHamil> {
  const supabase = createClient();
  const { error } = await supabase
    .from("individu")
    .update({
      status_hidup: input.statusHidup,
      tanggal_meninggal: input.tanggalMeninggal || null,
      keterangan_meninggal: input.penyebabMeninggal || null,
    })
    .eq("nik", input.nik);

  if (error) throw new Error(error.message);

  const ibuHamil = await getIbuHamilById(input.id);
  if (!ibuHamil) throw new Error("Data tidak ditemukan setelah update");
  return ibuHamil;
}

// ---------------------------------------------------------------------------
// EDIT IDENTITAS & DATA KEHAMILAN (nama, tempat/tgl lahir, HPHT, gol. darah)
// ---------------------------------------------------------------------------
export interface UpdateIbuHamilDataInput {
  id: string; // episode id (ibu_hamil.id)
  nik: string; // dipakai untuk UPDATE biodata di tabel individu
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

  const { error: individuError } = await supabase
    .from("individu")
    .update({
      nama: input.nama,
      tempat_lahir: input.tempatLahir,
      tanggal_lahir: input.tanggalLahir,
    })
    .eq("nik", input.nik);

  if (individuError) throw new Error(individuError.message);

  const { error: ibuHamilError } = await supabase
    .from("ibu_hamil")
    .update({
      hpht: input.hpht,
      golongan_darah: input.golonganDarah || null,
    })
    .eq("id", input.id);

  if (ibuHamilError) throw new Error(ibuHamilError.message);

  const updated = await getIbuHamilById(input.id);
  if (!updated) throw new Error("Data tidak ditemukan setelah update");
  return updated;
}

// ---------------------------------------------------------------------------
// HAPUS (menghapus EPISODE kehamilan ini saja, bukan biodata orangnya -
// individu bisa saja masih dipakai di riwayat/KK lain)
// ---------------------------------------------------------------------------
export async function deleteIbuHamil(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("ibu_hamil").delete().eq("id", id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// RIWAYAT PEMERIKSAAN (ANC)
// ---------------------------------------------------------------------------
export async function getIbuHamilRecords(
  ibuHamilId: string,
): Promise<IbuHamilRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("ibu_hamil_pemeriksaan")
    .select("*")
    .eq("ibu_hamil_id", ibuHamilId)
    .order("tanggal_pemeriksaan", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRowToRecord);
}

export interface AddIbuHamilRecordInput {
  ibuHamilId: string;
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
  const { data, error } = await supabase
    .from("ibu_hamil_pemeriksaan")
    .insert({
      ibu_hamil_id: input.ibuHamilId,
      tanggal_pemeriksaan: input.tanggalPemeriksaan,
      berat_badan: input.beratBadan,
      tinggi_badan: input.tinggiBadan,
      tekanan_sistolik: input.tekananDarahSistolik,
      tekanan_diastolik: input.tekananDarahDiastolik,
      usia_kehamilan_minggu: input.usiaKehamilanWeeks,
      kunjungan_ke: input.kunjunganKe,
      vitamin: input.vitamin,
    })
    .select()
    .single();

  if (error) {
    // Kunjungan ke-N untuk episode yang sama tidak boleh dobel (unique constraint)
    if (error.code === "23505") {
      throw new Error(
        `Kunjungan ke-${input.kunjunganKe} untuk episode ini sudah pernah diinput sebelumnya.`,
      );
    }
    throw new Error(error.message);
  }

  return mapRowToRecord(data);
}

// ---------------------------------------------------------------------------
// EDIT SATU DATA PEMERIKSAAN (ANC) YANG SUDAH ADA
// ---------------------------------------------------------------------------
export interface UpdateIbuHamilRecordInput {
  id: string; // id baris ibu_hamil_pemeriksaan yang diedit
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
  const { data, error } = await supabase
    .from("ibu_hamil_pemeriksaan")
    .update({
      tanggal_pemeriksaan: input.tanggalPemeriksaan,
      berat_badan: input.beratBadan,
      tinggi_badan: input.tinggiBadan,
      tekanan_sistolik: input.tekananDarahSistolik,
      tekanan_diastolik: input.tekananDarahDiastolik,
      usia_kehamilan_minggu: input.usiaKehamilanWeeks,
      kunjungan_ke: input.kunjunganKe,
      vitamin: input.vitamin,
    })
    .eq("id", input.id)
    .select()
    .single();

  if (error) {
    // Kunjungan ke-N untuk episode yang sama tidak boleh dobel (unique constraint)
    if (error.code === "23505") {
      throw new Error(
        `Kunjungan ke-${input.kunjunganKe} untuk episode ini sudah pernah diinput sebelumnya.`,
      );
    }
    throw new Error(error.message);
  }

  return mapRowToRecord(data);
}

// ---------------------------------------------------------------------------
// HAPUS SATU DATA PEMERIKSAAN (ANC)
// ---------------------------------------------------------------------------
export async function deleteIbuHamilRecord(recordId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("ibu_hamil_pemeriksaan")
    .delete()
    .eq("id", recordId);

  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// BULK FETCH riwayat pemeriksaan untuk beberapa episode sekaligus (dipakai
// oleh laporan PDF, supaya tidak query satu-satu per episode)
// ---------------------------------------------------------------------------
export async function getIbuHamilRecordsForIds(
  ibuHamilIds: string[],
): Promise<IbuHamilRecord[]> {
  if (ibuHamilIds.length === 0) return [];

  const supabase = createClient();
  const { data, error } = await supabase
    .from("ibu_hamil_pemeriksaan")
    .select("*")
    .in("ibu_hamil_id", ibuHamilIds)
    .order("ibu_hamil_id", { ascending: true })
    .order("tanggal_pemeriksaan", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRowToRecord);
}

// ---------------------------------------------------------------------------
// CATAT KELAHIRAN (mengakhiri masa hamil + otomatis daftarkan bayi baru)
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

// NIK asli bayi sebaiknya diisi belakangan setelah terbit dari Dukcapil.
function generateTempNik(): string {
  return `TMP${Date.now()}`.padEnd(16, "0").slice(0, 16);
}

export async function addPostBirthRecord(
  ibuHamilId: string,
  input: AddPostBirthRecordInput,
): Promise<IbuHamil> {
  const supabase = createClient();

  const bumil = await getIbuHamilById(ibuHamilId);
  if (!bumil) throw new Error("Data ibu hamil tidak ditemukan");

  const babyNik = generateTempNik();

  // 1. Daftarkan bayi sebagai individu baru (otomatis muncul di halaman
  //    Balita karena umurnya 0 bulan), satu KK dengan ibunya.
  const { error: individuError } = await supabase.from("individu").insert({
    nik: babyNik,
    no_kk: bumil.noKk,
    nama: input.nama,
    tempat_lahir: input.tempat,
    tanggal_lahir: input.tanggalLahir,
    jenis_kelamin: input.jenisKelamin,
    hubungan_keluarga: "Anak",
  });
  if (individuError) throw new Error(individuError.message);

  // 2. Catat riwayat kelahiran, ditautkan ke episode kehamilan ini
  const { error: rkError } = await supabase.from("riwayat_kelahiran").insert({
    ibu_hamil_id: ibuHamilId,
    nik_anak: babyNik,
    tempat_lahir: input.tempat,
    tanggal_lahir: input.tanggalLahir,
    jenis_kelamin: input.jenisKelamin,
    cara_lahir: input.caraLahir,
    usia_kehamilan_minggu: input.usiaKehamilanSaatLahirWeeks,
  });
  if (rkError) throw new Error(rkError.message);

  // 3. Isi tabel `bayi` dengan data cara lahir / usia kehamilan / golongan
  //    darah - ini sumber data yang dibaca halaman Balita (v_balita_lengkap),
  //    jadi tanpa langkah ini field-field tsb akan tampil kosong di sana.
  const { error: bayiError } = await supabase.from("bayi").insert({
    nik: babyNik,
    cara_lahir: input.caraLahir,
    usia_kehamilan_lahir_minggu: input.usiaKehamilanSaatLahirWeeks,
    golongan_darah: input.golonganDarah ?? null,
  });
  if (bayiError) throw new Error(bayiError.message);

  const updated = await getIbuHamilById(ibuHamilId);
  if (!updated)
    throw new Error("Gagal memuat ulang data setelah kelahiran dicatat");
  return updated;
}
