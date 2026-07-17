import { createClient } from "@/lib/supabase/client";

export type StatusHidup = "Hidup" | "Meninggal";

export interface Lansia {
  id: string; // = NIK, dipakai juga sebagai param routing /dashboard/lansia/[id]
  nik: string;
  noKk: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  namaAyah: string; // teks bebas, tersimpan langsung di tabel lansia
  namaIbu: string; // teks bebas, tersimpan langsung di tabel lansia
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
function mapRowToLansia(row: any): Lansia {
  return {
    id: row.nik,
    nik: row.nik,
    noKk: row.no_kk,
    nama: row.nama,
    tempatLahir: row.tempat_lahir ?? "",
    tanggalLahir: row.tanggal_lahir,
    jenisKelamin: row.jenis_kelamin,
    namaAyah: row.nama_ayah ?? "",
    namaIbu: row.nama_ibu ?? "",
    golonganDarah: row.golongan_darah ?? undefined,
    statusHidup: row.status_hidup,
    tanggalMeninggal: row.tanggal_meninggal ?? undefined,
    penyebabMeninggal: row.keterangan_meninggal ?? undefined,
  };
}

function mapRowToRecord(row: any): LansiaRecord {
  return {
    id: row.id,
    lansiaId: row.nik,
    tanggalPemeriksaan: row.tanggal_pemeriksaan,
    tinggiBadan: Number(row.tinggi_badan),
    beratBadan: Number(row.berat_badan),
    tekananDarahSistolik: Number(row.tekanan_sistolik),
    tekananDarahDiastolik: Number(row.tekanan_diastolik),
    riwayatPenyakit: row.riwayat_penyakit ?? "",
    obat: row.obat ?? "",
    penyakitBaru: row.penyakit_baru ?? "",
    imt: Number(row.imt),
  };
}

// ---------------------------------------------------------------------------
// DAFTAR LANSIA
// ---------------------------------------------------------------------------
export async function getLansias(): Promise<Lansia[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_lansia_lengkap")
    .select("*")
    .order("tanggal_lahir", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRowToLansia);
}

export async function getLansiaById(nik: string): Promise<Lansia | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_lansia_lengkap")
    .select("*")
    .eq("nik", nik)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRowToLansia(data) : null;
}

// ---------------------------------------------------------------------------
// DAFTAR KK (untuk dropdown "Nomor KK" di form tambah lansia)
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
// TAMBAH LANSIA
// ---------------------------------------------------------------------------
export interface AddLansiaInput {
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  noKk: string;
  namaAyah: string;
  namaIbu: string;
  statusHidup: StatusHidup;
  nik?: string;
  golonganDarah?: string;
}

// NIK asli seharusnya selalu diisi manual (16 digit). Ini hanya fallback
// supaya insert tidak gagal kalau kader belum sempat input NIK resmi.
function generateTempNik(): string {
  return `TMP${Date.now()}`.padEnd(16, "0").slice(0, 16);
}

export async function addLansia(input: AddLansiaInput): Promise<Lansia> {
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
  });

  if (individuError) throw new Error(individuError.message);

  const { error: lansiaError } = await supabase.from("lansia").insert({
    nik,
    nama_ayah: input.namaAyah,
    nama_ibu: input.namaIbu,
    golongan_darah: input.golonganDarah ?? null,
  });

  if (lansiaError) throw new Error(lansiaError.message);

  const lansia = await getLansiaById(nik);
  if (!lansia) throw new Error("Data tersimpan tapi gagal dimuat ulang");
  return lansia;
}

// ---------------------------------------------------------------------------
// UPDATE STATUS HIDUP / MENINGGAL
// ---------------------------------------------------------------------------
export interface UpdateLansiaInput {
  id: string; // nik
  statusHidup: StatusHidup;
  tanggalMeninggal?: string;
  penyebabMeninggal?: string;
}

export async function updateLansia(input: UpdateLansiaInput): Promise<Lansia> {
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

  const lansia = await getLansiaById(input.id);
  if (!lansia) throw new Error("Data lansia tidak ditemukan setelah update");
  return lansia;
}

// ---------------------------------------------------------------------------
// HAPUS LANSIA
// ---------------------------------------------------------------------------
export async function deleteLansia(id: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("individu").delete().eq("nik", id);
  if (error) throw new Error(error.message);
}

// ---------------------------------------------------------------------------
// RIWAYAT PEMERIKSAAN
// ---------------------------------------------------------------------------
export async function getLansiaRecords(
  lansiaId: string,
): Promise<LansiaRecord[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lansia_pemeriksaan")
    .select("*")
    .eq("nik", lansiaId)
    .order("tanggal_pemeriksaan", { ascending: true });

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRowToRecord);
}

// ---------------------------------------------------------------------------
// STATISTIK PENYAKIT DOMINAN
// Diambil dari catatan riwayat_penyakit TERBARU tiap lansia (bukan semua
// riwayat historisnya - kalau semua riwayat ikut dihitung, penyakit yang
// sudah sembuh/berubah tetap ikut ke-count).
// ---------------------------------------------------------------------------
export interface DiseaseStat {
  name: string;
  count: number;
}

export async function getDiseaseStats(): Promise<DiseaseStat[]> {
  const supabase = createClient();

  // Ambil SEMUA baris pemeriksaan, urut terbaru dulu -> baris pertama yang
  // ditemukan untuk tiap nik otomatis jadi "pemeriksaan terakhir" nik itu.
  const { data, error } = await supabase
    .from("lansia_pemeriksaan")
    .select("nik, riwayat_penyakit, tanggal_pemeriksaan")
    .order("tanggal_pemeriksaan", { ascending: false });

  if (error) throw new Error(error.message);

  const latestPerNik = new Map<string, string>();
  (data ?? []).forEach((row) => {
    if (!latestPerNik.has(row.nik) && row.riwayat_penyakit) {
      latestPerNik.set(row.nik, row.riwayat_penyakit);
    }
  });

  const diseaseMap: Record<string, number> = {};
  latestPerNik.forEach((riwayat) => {
    if (riwayat && riwayat !== "-") {
      riwayat
        .split(",")
        .map((d) => d.trim())
        .forEach((d) => {
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

// Catatan: IMT TIDAK dikirim dari sini — dihitung otomatis oleh database
// (generated column).
export async function addLansiaRecord(
  input: AddLansiaRecordInput,
): Promise<LansiaRecord> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("lansia_pemeriksaan")
    .insert({
      nik: input.lansiaId,
      tanggal_pemeriksaan: input.tanggalPemeriksaan,
      tinggi_badan: input.tinggiBadan,
      berat_badan: input.beratBadan,
      tekanan_sistolik: input.tekananDarahSistolik,
      tekanan_diastolik: input.tekananDarahDiastolik,
      riwayat_penyakit: input.riwayatPenyakit,
      obat: input.obat,
      penyakit_baru: input.penyakitBaru,
    })
    .select()
    .single();

  if (error) throw new Error(error.message);
  return mapRowToRecord(data);
}
