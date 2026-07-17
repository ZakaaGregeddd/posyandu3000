import { createClient } from "@/lib/supabase/client";

export type StatusHidup = "Hidup" | "Meninggal";

export interface Balita {
  id: string; // = NIK, dipakai juga sebagai param routing /dashboard/balita/[id]
  nik: string;
  noKk: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  namaIbu: string;
  ttlIbu: string;
  namaAyah: string;
  ttlAyah: string;
  golonganDarah?: string;
  statusHidup: StatusHidup;
  tanggalMeninggal?: string;
  penyebabMeninggal?: string;
  caraLahir?: "SC" | "Normal";
  usiaKehamilanSaatLahirWeeks?: number;
}

export interface BalitaRecord {
  id: string;
  balitaId: string;
  tanggalPemeriksaan: string;
  tinggiBadan: number;
  beratBadan: number;
  lingkarKepala: number;
  lingkarLengan: number;
  imunisasi: string;
  obatVitamin: string;
  imt: number;
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
function mapRowToBalita(row: any): Balita {
  return {
    id: row.nik,
    nik: row.nik,
    noKk: row.no_kk,
    nama: row.nama,
    tempatLahir: row.tempat_lahir ?? "",
    tanggalLahir: row.tanggal_lahir,
    jenisKelamin: row.jenis_kelamin,
    namaIbu: row.nama_ibu ?? "",
    ttlIbu: row.tanggal_lahir_ibu ?? "",
    namaAyah: row.nama_ayah ?? "",
    ttlAyah: row.tanggal_lahir_ayah ?? "",
    golonganDarah: row.golongan_darah ?? undefined,
    statusHidup: row.status_hidup,
    tanggalMeninggal: row.tanggal_meninggal ?? undefined,
    penyebabMeninggal: row.keterangan_meninggal ?? undefined,
    caraLahir: row.cara_lahir ?? undefined,
    usiaKehamilanSaatLahirWeeks: row.usia_kehamilan_lahir_minggu ?? undefined,
  };
}

function mapRowToRecord(row: any): BalitaRecord {
  return {
    id: row.id,
    balitaId: row.nik,
    tanggalPemeriksaan: row.tanggal_pemeriksaan,
    tinggiBadan: Number(row.tinggi_badan),
    beratBadan: Number(row.berat_badan),
    lingkarKepala: Number(row.lingkar_kepala),
    lingkarLengan: Number(row.lingkar_lengan),
    imunisasi: row.imunisasi ?? "",
    obatVitamin: row.obat_vitamin ?? "",
    imt: Number(row.imt),
  };
}

// ---------------------------------------------------------------------------
// DAFTAR BALITA
// ---------------------------------------------------------------------------
export async function getBalitas(): Promise<Balita[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_balita_lengkap")
    .select("*")
    .order("tanggal_lahir", { ascending: false });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRowToBalita);
}

export async function getBalitaById(nik: string): Promise<Balita | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_balita_lengkap")
    .select("*")
    .eq("nik", nik)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRowToBalita(data) : null;
}

// ---------------------------------------------------------------------------
// DAFTAR KK (untuk dropdown "Nomor KK" di form tambah balita)
// ---------------------------------------------------------------------------
export async function getKKs(): Promise<KKOption[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("keluarga")
    .select(`
      no_kk, 
      alamat, 
      no_telp, 
      rt, 
      rw,
      nik_ayah,
      nik_ibu,
      ayah:individu!fk_keluarga_nik_ayah(nama, tempat_lahir, tanggal_lahir),
      ibu:individu!fk_keluarga_nik_ibu(nama, tempat_lahir, tanggal_lahir)
    `)
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
// TAMBAH BALITA
// Catatan: namaAyah/namaIbu TIDAK dikirim di sini lagi — itu sekarang murni
// hasil JOIN dari keluarga.nik_ayah/nik_ibu. Pastikan KK yang dipilih sudah
// punya nik_ayah/nik_ibu terisi, kalau tidak nama ortu akan tampil kosong.
// ---------------------------------------------------------------------------
export interface AddBalitaInput {
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  noKk: string;
  statusHidup: StatusHidup;
  nik?: string;
  caraLahir?: "SC" | "Normal";
  usiaKehamilanSaatLahirWeeks?: number;
  golonganDarah?: string;
}

// NIK asli seharusnya selalu diisi manual (16 digit). Ini hanya fallback
// supaya insert tidak gagal kalau kader belum sempat input NIK resmi.
function generateTempNik(): string {
  return `TMP${Date.now()}`.padEnd(16, "0").slice(0, 16);
}

export async function addBalita(input: AddBalitaInput): Promise<Balita> {
  const supabase = createClient();
  const nik =
    input.nik && input.nik.length === 16 ? input.nik : generateTempNik();

  const { error: individuError } = await supabase.from("individu").insert({
    nik,
    no_kk: input.noKk,
    nama: input.nama,
    tempat_lahir: input.tempatLahir,
    tanggal_lahir: input.tanggalLahir,
    jenis_kelamin: input.jenisKelamin,
    hubungan_keluarga: "Anak",
  });

  if (individuError) throw new Error(individuError.message);

  // Tabel `bayi` cuma diisi kalau ada salah satu datanya (opsional semua)
  if (
    input.caraLahir ||
    input.usiaKehamilanSaatLahirWeeks ||
    input.golonganDarah
  ) {
    const { error: bayiError } = await supabase.from("bayi").insert({
      nik,
      cara_lahir: input.caraLahir ?? null,
      usia_kehamilan_lahir_minggu: input.usiaKehamilanSaatLahirWeeks ?? null,
      golongan_darah: input.golonganDarah ?? null,
    });
    if (bayiError) throw new Error(bayiError.message);
  }

  const balita = await getBalitaById(nik);
  if (!balita) throw new Error("Data tersimpan tapi gagal dimuat ulang");
  return balita;
}

// ---------------------------------------------------------------------------
// UPDATE STATUS HIDUP / MENINGGAL
// ---------------------------------------------------------------------------
export interface UpdateBalitaInput {
  id: string; // nik
  statusHidup: StatusHidup;
  tanggalMeninggal?: string;
  penyebabMeninggal?: string;
}

export async function updateBalita(input: UpdateBalitaInput): Promise<Balita> {
  const supabase = createClient();
  const { error } = await supabase
    .from("individu")
    .update({
      status_hidup: input.statusHidup,
      tanggal_meninggal: input.tanggalMeninggal || null,
      keterangan_meninggal: input.penyebabMeninggal || null,
    })
    .eq("nik", input.id);

  if (error) throw new Error(error.message);

  const balita = await getBalitaById(input.id);
  if (!balita) throw new Error("Data balita tidak ditemukan setelah update");
  return balita;
}

// ---------------------------------------------------------------------------
// HAPUS BALITA
// ---------------------------------------------------------------------------
export async function deleteBalita(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("individu").delete().eq("nik", id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// RIWAYAT PEMERIKSAAN
// ---------------------------------------------------------------------------
export async function getBalitaRecords(
  balitaId: string,
): Promise<BalitaRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("balita_pemeriksaan")
    .select("*")
    .eq("nik", balitaId)
    .order("tanggal_pemeriksaan", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRowToRecord);
}

export interface AddBalitaRecordInput {
  balitaId: string;
  tanggalPemeriksaan: string;
  tinggiBadan: number;
  beratBadan: number;
  lingkarKepala: number;
  lingkarLengan: number;
  imunisasi: string;
  obatVitamin: string;
}

// Catatan: IMT TIDAK dikirim dari sini — dihitung otomatis oleh database
// (generated column), jadi hasilnya lebih bisa diandalkan (satu sumber
// kebenaran) daripada dihitung ulang di frontend.
export async function addBalitaRecord(
  input: AddBalitaRecordInput,
): Promise<BalitaRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("balita_pemeriksaan")
    .insert({
      nik: input.balitaId,
      tanggal_pemeriksaan: input.tanggalPemeriksaan,
      tinggi_badan: input.tinggiBadan,
      berat_badan: input.beratBadan,
      lingkar_kepala: input.lingkarKepala,
      lingkar_lengan: input.lingkarLengan,
      imunisasi: input.imunisasi,
      obat_vitamin: input.obatVitamin,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRowToRecord(data);
}
