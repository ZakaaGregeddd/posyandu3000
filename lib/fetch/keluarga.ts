import { createClient } from "@/lib/supabase/client";

export interface KK {
  noKk: string;
  namaKepalaKeluarga: string;
  alamat: string;
  rt: string;
  rw: string;
  noTelp?: string;
  nikAyah?: string;
  namaAyah?: string;
  tanggalLahirAyah?: string;
  tempatLahirAyah?: string;
  nikIbu?: string;
  namaIbu?: string;
  tanggalLahirIbu?: string;
  tempatLahirIbu?: string;
}

export interface KKMember {
  id: string; // = nik
  nama: string;
  role: string; // 'Ayah' | 'Ibu' | 'Balita' | 'Lansia' | 'Ibu Hamil' | 'Dewasa'
  hubunganKeluarga?: string;
  tanggalLahir: string;
  tempatLahir: string;
  jenisKelamin: "L" | "P";
  statusHidup: "Hidup" | "Meninggal";
  routePath: string; // link ke halaman detail program terkait, '#' kalau tidak ada
}

// ---------------------------------------------------------------------------
// Mapper
// ---------------------------------------------------------------------------
function mapRowToKK(row: any): KK {
  return {
    noKk: row.no_kk,
    namaKepalaKeluarga: row.nama_ayah || row.nama_ibu || "-",
    alamat: row.alamat ?? "",
    rt: row.rt ?? "",
    rw: row.rw ?? "",
    noTelp: row.no_telp ?? undefined,
    nikAyah: row.nik_ayah ?? undefined,
    namaAyah: row.nama_ayah ?? undefined,
    tanggalLahirAyah: row.tanggal_lahir_ayah ?? undefined,
    tempatLahirAyah: row.tempat_lahir_ayah ?? undefined,
    nikIbu: row.nik_ibu ?? undefined,
    namaIbu: row.nama_ibu ?? undefined,
    tanggalLahirIbu: row.tanggal_lahir_ibu ?? undefined,
    tempatLahirIbu: row.tempat_lahir_ibu ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// DAFTAR KK
// ---------------------------------------------------------------------------
export async function getKKs(): Promise<KK[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_keluarga_lengkap")
    .select("*")
    .order("no_kk");

  if (error) throw new Error(error.message);
  return (data ?? []).map(mapRowToKK);
}

export async function getKKByNoKk(noKk: string): Promise<KK | null> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("v_keluarga_lengkap")
    .select("*")
    .eq("no_kk", noKk)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRowToKK(data) : null;
}

// ---------------------------------------------------------------------------
// JUMLAH ANGGOTA per KK (untuk badge "X Anggota" di halaman daftar) -
// 1 query untuk semua KK sekaligus, jauh lebih efisien dibanding
// query per-KK satu-satu.
// ---------------------------------------------------------------------------
export async function getAnggotaCountMap(): Promise<Map<string, number>> {
  const supabase = createClient();
  const { data, error } = await supabase.from("individu").select("no_kk");
  if (error) throw new Error(error.message);

  const map = new Map<string, number>();
  (data ?? []).forEach((row: any) => {
    map.set(row.no_kk, (map.get(row.no_kk) ?? 0) + 1);
  });
  return map;
}

// ---------------------------------------------------------------------------
// ANGGOTA KELUARGA (dipakai di halaman detail KK)
// Menggantikan logic cross-check manual ke balita/ibuHamil/lansia di kode
// lama - sekarang cukup query v_individu (yang sudah tahu kategori umur
// masing-masing orang), lalu cek tambahan status hamil aktif.
// ---------------------------------------------------------------------------
export async function getKKMembers(noKk: string): Promise<KKMember[]> {
  const supabase = createClient();

  const { data, error } = await supabase
    .from("v_individu")
    .select("*")
    .eq("no_kk", noKk)
    .order("tanggal_lahir");

  if (error) throw new Error(error.message);
  const rows = data ?? [];
  const niks = rows.map((r: any) => r.nik);

  // Episode kehamilan terbaru per NIK (untuk link "Lihat Detail"),
  // dan set NIK yang SEDANG hamil aktif (belum ada riwayat_kelahiran)
  // untuk keperluan label role "Ibu Hamil".
  const latestEpisodeMap = new Map<string, string>();
  const activeNiks = new Set<string>();

  if (niks.length > 0) {
    const { data: episodes, error: epError } = await supabase
      .from("ibu_hamil")
      .select("id, nik, created_at")
      .in("nik", niks)
      .order("created_at", { ascending: false });
    if (epError) throw new Error(epError.message);

    (episodes ?? []).forEach((ep: any) => {
      if (!latestEpisodeMap.has(ep.nik)) latestEpisodeMap.set(ep.nik, ep.id);
    });

    const episodeIds = (episodes ?? []).map((e: any) => e.id);
    if (episodeIds.length > 0) {
      const { data: births, error: birthError } = await supabase
        .from("riwayat_kelahiran")
        .select("ibu_hamil_id")
        .in("ibu_hamil_id", episodeIds);
      if (birthError) throw new Error(birthError.message);

      const birthedIds = new Set(
        (births ?? []).map((b: any) => b.ibu_hamil_id),
      );
      (episodes ?? []).forEach((ep: any) => {
        if (!birthedIds.has(ep.id)) activeNiks.add(ep.nik);
      });
    }
  }

  return rows.map((r: any) => {
    let role: string;
    let routePath = "#";
    const hasEpisode = latestEpisodeMap.has(r.nik);

    if (
      r.kategori === "Bayi (0-12 bulan)" ||
      r.kategori === "Balita (1-5 tahun)"
    ) {
      role = "Balita";
      routePath = `/dashboard/balita/${r.nik}`;
    } else if (
      r.kategori === "Pralansia" ||
      r.kategori === "Lansia" ||
      r.kategori === "Lansia Risiko Tinggi"
    ) {
      role = "Lansia";
      routePath = `/dashboard/lansia/${r.nik}`;
    } else if (activeNiks.has(r.nik)) {
      role = "Ibu Hamil";
      routePath = `/dashboard/ibu-hamil/${latestEpisodeMap.get(r.nik)}`;
    } else if (r.hubungan_keluarga === "Kepala Keluarga") {
      role = "Ayah";
      if (hasEpisode)
        routePath = `/dashboard/ibu-hamil/${latestEpisodeMap.get(r.nik)}`;
    } else if (r.hubungan_keluarga === "Istri") {
      role = "Ibu";
      if (hasEpisode)
        routePath = `/dashboard/ibu-hamil/${latestEpisodeMap.get(r.nik)}`;
    } else {
      role = "Dewasa";
      if (hasEpisode)
        routePath = `/dashboard/ibu-hamil/${latestEpisodeMap.get(r.nik)}`;
    }

    return {
      id: r.nik,
      nama: r.nama,
      role,
      hubunganKeluarga: r.hubungan_keluarga ?? undefined,
      tanggalLahir: r.tanggal_lahir,
      tempatLahir: r.tempat_lahir ?? "",
      jenisKelamin: r.jenis_kelamin,
      statusHidup: r.status_hidup,
      routePath,
    };
  });
}

// ---------------------------------------------------------------------------
// TAMBAH KK BARU (+ opsional biodata Ayah/Ibu langsung)
// ---------------------------------------------------------------------------
export interface AddKKInput {
  noKk: string;
  alamat?: string;
  rt?: string;
  rw?: string;
  noTelp?: string;
  nikAyah?: string;
  namaAyah?: string;
  tanggalLahirAyah?: string;
  tempatLahirAyah?: string;
  telpAyah?: string;
  nikIbu?: string;
  namaIbu?: string;
  tanggalLahirIbu?: string;
  tempatLahirIbu?: string;
  telpIbu?: string;
}

function generateTempNik(): string {
  return `TMP${Date.now()}`.padEnd(16, "0").slice(0, 16);
}

export async function addKK(input: AddKKInput): Promise<KK> {
  const supabase = createClient();

  if (!input.namaAyah && !input.namaIbu) {
    throw new Error(
      "Harap masukkan setidaknya nama salah satu orang tua (Ayah atau Ibu)",
    );
  }
  if (input.namaAyah && !input.tanggalLahirAyah) {
    throw new Error("Tanggal lahir Ayah wajib diisi kalau nama Ayah diisi");
  }
  if (input.namaIbu && !input.tanggalLahirIbu) {
    throw new Error("Tanggal lahir Ibu wajib diisi kalau nama Ibu diisi");
  }

  const noTelp = input.noTelp || input.telpAyah || input.telpIbu || null;

  // 1. Buat baris keluarga dulu (nik_ayah/nik_ibu masih null)
  const { error: kkError } = await supabase.from("keluarga").insert({
    no_kk: input.noKk,
    alamat: input.alamat || null,
    rt: input.rt || null,
    rw: input.rw || null,
    no_telp: noTelp,
  });
  if (kkError) throw new Error(kkError.message);

  let nikAyah: string | null = null;
  let nikIbu: string | null = null;

  try {
    if (input.namaAyah) {
      nikAyah =
        input.nikAyah && input.nikAyah.length === 16
          ? input.nikAyah
          : generateTempNik();
      const { error } = await supabase.from("individu").insert({
        nik: nikAyah,
        no_kk: input.noKk,
        nama: input.namaAyah,
        tempat_lahir: input.tempatLahirAyah || null,
        tanggal_lahir: input.tanggalLahirAyah,
        jenis_kelamin: "L",
        hubungan_keluarga: "Kepala Keluarga",
      });
      if (error) throw new Error(error.message);
    }

    if (input.namaIbu) {
      nikIbu =
        input.nikIbu && input.nikIbu.length === 16
          ? input.nikIbu
          : generateTempNik();
      const { error } = await supabase.from("individu").insert({
        nik: nikIbu,
        no_kk: input.noKk,
        nama: input.namaIbu,
        tempat_lahir: input.tempatLahirIbu || null,
        tanggal_lahir: input.tanggalLahirIbu,
        jenis_kelamin: "P",
        hubungan_keluarga: "Istri",
      });
      if (error) throw new Error(error.message);
    }

    const { error: updateError } = await supabase
      .from("keluarga")
      .update({ nik_ayah: nikAyah, nik_ibu: nikIbu })
      .eq("no_kk", input.noKk);
    if (updateError) throw new Error(updateError.message);
  } catch (err) {
    // Rollback manual: hapus keluarga yang terlanjur dibuat kalau langkah berikutnya gagal
    await supabase.from("keluarga").delete().eq("no_kk", input.noKk);
    throw err;
  }

  const kk = await getKKByNoKk(input.noKk);
  if (!kk) throw new Error("Data tersimpan tapi gagal dimuat ulang");
  return kk;
}

// ---------------------------------------------------------------------------
// EDIT KK (alamat/kontak + biodata Ayah/Ibu - update kalau sudah ada,
// buat baru & tautkan kalau belum ada sama sekali)
// ---------------------------------------------------------------------------
export interface UpdateKKInput {
  noKk: string;
  alamat?: string;
  rt?: string;
  rw?: string;
  noTelp?: string;
  nikAyah?: string;
  namaAyah?: string;
  tanggalLahirAyah?: string;
  tempatLahirAyah?: string;
  nikIbu?: string;
  namaIbu?: string;
  tanggalLahirIbu?: string;
  tempatLahirIbu?: string;
}

export async function updateKK(input: UpdateKKInput): Promise<KK> {
  const supabase = createClient();

  const existingKK = await getKKByNoKk(input.noKk);
  if (!existingKK) throw new Error("KK tidak ditemukan");

  if (input.namaAyah && !input.tanggalLahirAyah) {
    throw new Error("Tanggal lahir Ayah wajib diisi kalau nama Ayah diisi");
  }
  if (input.namaIbu && !input.tanggalLahirIbu) {
    throw new Error("Tanggal lahir Ibu wajib diisi kalau nama Ibu diisi");
  }

  // 1. Update data keluarga (alamat, rt, rw, no_telp)
  const { error: kkError } = await supabase
    .from("keluarga")
    .update({
      alamat: input.alamat || null,
      rt: input.rt || null,
      rw: input.rw || null,
      no_telp: input.noTelp || null,
    })
    .eq("no_kk", input.noKk);
  if (kkError) throw new Error(kkError.message);

  // 2. Ayah: update kalau sudah ada individu-nya, buat baru kalau belum
  if (input.namaAyah) {
    if (existingKK.nikAyah) {
      const { error } = await supabase
        .from("individu")
        .update({
          nama: input.namaAyah,
          tanggal_lahir: input.tanggalLahirAyah,
          tempat_lahir: input.tempatLahirAyah || null,
        })
        .eq("nik", existingKK.nikAyah);
      if (error) throw new Error(error.message);
    } else {
      const nikAyah =
        input.nikAyah && input.nikAyah.length === 16
          ? input.nikAyah
          : generateTempNik();
      const { error } = await supabase.from("individu").insert({
        nik: nikAyah,
        no_kk: input.noKk,
        nama: input.namaAyah,
        tempat_lahir: input.tempatLahirAyah || null,
        tanggal_lahir: input.tanggalLahirAyah,
        jenis_kelamin: "L",
        hubungan_keluarga: "Kepala Keluarga",
      });
      if (error) throw new Error(error.message);

      const { error: linkError } = await supabase
        .from("keluarga")
        .update({ nik_ayah: nikAyah })
        .eq("no_kk", input.noKk);
      if (linkError) throw new Error(linkError.message);
    }
  }

  // 3. Ibu: update kalau sudah ada individu-nya, buat baru kalau belum
  if (input.namaIbu) {
    if (existingKK.nikIbu) {
      const { error } = await supabase
        .from("individu")
        .update({
          nama: input.namaIbu,
          tanggal_lahir: input.tanggalLahirIbu,
          tempat_lahir: input.tempatLahirIbu || null,
        })
        .eq("nik", existingKK.nikIbu);
      if (error) throw new Error(error.message);
    } else {
      const nikIbu =
        input.nikIbu && input.nikIbu.length === 16
          ? input.nikIbu
          : generateTempNik();
      const { error } = await supabase.from("individu").insert({
        nik: nikIbu,
        no_kk: input.noKk,
        nama: input.namaIbu,
        tempat_lahir: input.tempatLahirIbu || null,
        tanggal_lahir: input.tanggalLahirIbu,
        jenis_kelamin: "P",
        hubungan_keluarga: "Istri",
      });
      if (error) throw new Error(error.message);

      const { error: linkError } = await supabase
        .from("keluarga")
        .update({ nik_ibu: nikIbu })
        .eq("no_kk", input.noKk);
      if (linkError) throw new Error(linkError.message);
    }
  }

  const updated = await getKKByNoKk(input.noKk);
  if (!updated) throw new Error("Gagal memuat ulang data setelah update");
  return updated;
}

// ---------------------------------------------------------------------------
// HAPUS KK (cascade menghapus semua individu & seluruh riwayat mereka -
// balita, ibu hamil, lansia - karena FK on delete cascade dari individu.no_kk)
// ---------------------------------------------------------------------------
export async function deleteKK(noKk: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("keluarga").delete().eq("no_kk", noKk);
  if (error) throw new Error(error.message);
}
