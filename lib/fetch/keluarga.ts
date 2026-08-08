import { createClient } from "@/lib/supabase/client";

export interface KK {
  id?: string; // UUID of keluarga
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
  id: string; // UUID of individual
  nik: string | null;
  nama: string;
  role: string; // 'Ayah' | 'Ibu' | 'Balita' | 'Lansia' | 'Ibu Hamil' | 'Dewasa'
  hubunganKeluarga?: string;
  tanggalLahir: string;
  tempatLahir: string;
  jenisKelamin: "L" | "P";
  statusHidup: "Hidup" | "Meninggal";
  routePath: string; // link to detail page
}

// Helper to parse RT/RW from combined alamat field
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

function formatAlamat(alamat: string, rt: string, rw: string) {
  return `${alamat} [RT: ${rt || ""}] [RW: ${rw || ""}]`;
}

function mapRowToKK(row: any): KK {
  const { alamat, rt, rw } = parseAlamat(row.alamat);
  const members = row.members || [];
  const ayah = members.find((m: any) => m.status_keluarga === "Kepala Keluarga" || m.status_keluarga === "Ayah");
  const ibu = members.find((m: any) => m.status_keluarga === "Istri" || m.status_keluarga === "Ibu");

  return {
    id: row.id,
    noKk: row.no_kk || "",
    namaKepalaKeluarga: ayah?.nama || ibu?.nama || "-",
    alamat: alamat,
    rt: rt,
    rw: rw,
    noTelp: row.no_telp ?? undefined,
    nikAyah: ayah?.nik || ayah?.id || undefined,
    namaAyah: ayah?.nama ?? undefined,
    tanggalLahirAyah: ayah?.tanggal_lahir ?? undefined,
    tempatLahirAyah: ayah?.tempat_lahir ?? undefined,
    nikIbu: ibu?.nik || ibu?.id || undefined,
    namaIbu: ibu?.nama ?? undefined,
    tanggalLahirIbu: ibu?.tanggal_lahir ?? undefined,
    tempatLahirIbu: ibu?.tempat_lahir ?? undefined,
  };
}

// ---------------------------------------------------------------------------
// DAFTAR KK
// ---------------------------------------------------------------------------
export async function getKKs(): Promise<KK[]> {
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
  return (data ?? []).map(mapRowToKK);
}

export async function getKKByNoKk(noKkOrId: string): Promise<KK | null> {
  const supabase = createClient();
  let query = supabase
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
    `);

  if (noKkOrId.length === 36) {
    query = query.eq("id", noKkOrId);
  } else {
    query = query.eq("no_kk", noKkOrId);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRowToKK(data) : null;
}

// ---------------------------------------------------------------------------
// JUMLAH ANGGOTA per KK
// ---------------------------------------------------------------------------
export async function getAnggotaCountMap(): Promise<Map<string, number>> {
  const supabase = createClient();
  // Join with keluarga to map count by no_kk
  const { data, error } = await supabase
    .from("individu")
    .select(`
      id,
      keluarga:keluarga(no_kk)
    `);
  if (error) throw new Error(error.message);

  const map = new Map<string, number>();
  (data ?? []).forEach((row: any) => {
    const noKk = row.keluarga?.no_kk;
    if (noKk) {
      map.set(noKk, (map.get(noKk) ?? 0) + 1);
    }
  });
  return map;
}

// Helper to calculate category/role based on age and gender
function getKategoriAndRole(tanggalLahirStr: string, jenisKelamin: string, statusKeluarga: string, isHamil: boolean) {
  const birthDate = new Date(tanggalLahirStr);
  const today = new Date();
  let ageYears = today.getFullYear() - birthDate.getFullYear();
  const m = today.getMonth() - birthDate.getMonth();
  if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
    ageYears--;
  }

  let role = "Dewasa";
  if (ageYears <= 5) {
    role = "Balita";
  } else if (ageYears >= 60) {
    role = "Lansia";
  } else if (isHamil) {
    role = "Ibu Hamil";
  } else if (statusKeluarga === "Kepala Keluarga" || statusKeluarga === "Ayah") {
    role = "Ayah";
  } else if (statusKeluarga === "Istri" || statusKeluarga === "Ibu") {
    role = "Ibu";
  }

  return role;
}

// ---------------------------------------------------------------------------
// ANGGOTA KELUARGA
// ---------------------------------------------------------------------------
export async function getKKMembers(noKkOrId: string): Promise<KKMember[]> {
  const supabase = createClient();

  // Dapatkan keluarga_id (UUID)
  let kkQuery = supabase.from("keluarga").select("id");
  if (noKkOrId.length === 36) {
    kkQuery = kkQuery.eq("id", noKkOrId);
  } else {
    kkQuery = kkQuery.eq("no_kk", noKkOrId);
  }
  const { data: kkData, error: kkError } = await kkQuery.maybeSingle();
  if (kkError) throw new Error(kkError.message);
  if (!kkData) return [];

  const keluargaId = kkData.id;

  const { data, error } = await supabase
    .from("individu")
    .select(`
      *,
      master_pemeriksaan(
        id,
        jenis_pemeriksaan,
        pemeriksaan_ibu_hamil(status_kelahiran)
      )
    `)
    .eq("keluarga_id", keluargaId)
    .order("tanggal_lahir");

  if (error) throw new Error(error.message);
  const rows = data ?? [];

  return rows.map((r: any) => {
    // Check if there is an active pregnancy (has examination of type 'Ibu Hamil' and no status_kelahiran/not birthed yet)
    const pregExams = r.master_pemeriksaan?.filter((mp: any) => mp.jenis_pemeriksaan === "Ibu Hamil") || [];
    const isHamil = pregExams.some((mp: any) => {
      const detail = mp.pemeriksaan_ibu_hamil;
      return !detail || !detail.status_kelahiran;
    });

    const role = getKategoriAndRole(r.tanggal_lahir, r.jenis_kelamin, r.status_keluarga, isHamil);
    let routePath = "#";

    if (role === "Balita") {
      routePath = `/dashboard/balita/${r.id}`;
    } else if (role === "Lansia") {
      routePath = `/dashboard/lansia/${r.id}`;
    } else if (role === "Ibu Hamil") {
      // Find the examination ID for routing
      const latestPregExam = pregExams[pregExams.length - 1];
      routePath = `/dashboard/ibu-hamil/${latestPregExam?.id || r.id}`;
    }

    return {
      id: r.id, // UUID
      nik: r.nik,
      nama: r.nama,
      role,
      hubunganKeluarga: r.status_keluarga ?? undefined,
      tanggalLahir: r.tanggal_lahir,
      tempatLahir: r.tempat_lahir ?? "",
      jenisKelamin: r.jenis_kelamin,
      statusHidup: r.status_hidup,
      routePath,
    };
  });
}

// ---------------------------------------------------------------------------
// TAMBAH KK BARU
// ---------------------------------------------------------------------------
export interface AnggotaKeluargaInput {
  nik?: string;
  nama: string;
  tempatLahir?: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  statusKeluarga: string;
  noTelp?: string;
}

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
  anggotaKeluarga?: AnggotaKeluargaInput[];
}

function generateTempNik(): string {
  return `TMP${Date.now()}`.padEnd(16, "0").slice(0, 16);
}

export async function addKK(input: AddKKInput): Promise<KK> {
  const supabase = createClient();

  if (!input.namaAyah && !input.namaIbu) {
    throw new Error("Harap masukkan setidaknya nama salah satu orang tua (Ayah atau Ibu)");
  }
  if (input.namaAyah && !input.tanggalLahirAyah) {
    throw new Error("Tanggal lahir Ayah wajib diisi kalau nama Ayah diisi");
  }
  if (input.namaIbu && !input.tanggalLahirIbu) {
    throw new Error("Tanggal lahir Ibu wajib diisi kalau nama Ibu diisi");
  }

  const combinedAlamat = formatAlamat(input.alamat || "", input.rt || "", input.rw || "");
  const noTelp = input.noTelp || input.telpAyah || input.telpIbu || null;

  // 1. Buat baris keluarga
  const { data: kkData, error: kkError } = await supabase
    .from("keluarga")
    .insert({
      no_kk: input.noKk || null,
      alamat: combinedAlamat,
      no_telp: noTelp,
    })
    .select("id")
    .single();

  if (kkError) throw new Error(kkError.message);
  const keluargaId = kkData.id;

  try {
    if (input.namaAyah) {
      const nikAyah = input.nikAyah && input.nikAyah.length === 16 ? input.nikAyah : generateTempNik();
      const { error } = await supabase.from("individu").insert({
        keluarga_id: keluargaId,
        nik: nikAyah,
        nama: input.namaAyah,
        tempat_lahir: input.tempatLahirAyah || null,
        tanggal_lahir: input.tanggalLahirAyah,
        jenis_kelamin: "L",
        status_keluarga: "Kepala Keluarga",
      });
      if (error) throw new Error(error.message);
    }

    if (input.namaIbu) {
      const nikIbu = input.nikIbu && input.nikIbu.length === 16 ? input.nikIbu : generateTempNik();
      const { error } = await supabase.from("individu").insert({
        keluarga_id: keluargaId,
        nik: nikIbu,
        nama: input.namaIbu,
        tempat_lahir: input.tempatLahirIbu || null,
        tanggal_lahir: input.tanggalLahirIbu,
        jenis_kelamin: "P",
        status_keluarga: "Istri",
      });
      if (error) throw new Error(error.message);
    }

    if (input.anggotaKeluarga && input.anggotaKeluarga.length > 0) {
      for (const member of input.anggotaKeluarga) {
        const memberNik = member.nik && member.nik.length === 16 ? member.nik : generateTempNik();
        const { error } = await supabase.from("individu").insert({
          keluarga_id: keluargaId,
          nik: memberNik,
          nama: member.nama,
          tempat_lahir: member.tempatLahir || null,
          tanggal_lahir: member.tanggalLahir,
          jenis_kelamin: member.jenisKelamin,
          status_keluarga: member.statusKeluarga,
          no_telp: member.noTelp || null,
        });
        if (error) throw new Error(error.message);
      }
    }
  } catch (err) {
    // Rollback keluarga
    await supabase.from("keluarga").delete().eq("id", keluargaId);
    throw err;
  }

  const kk = await getKKByNoKk(keluargaId);
  if (!kk) throw new Error("Data tersimpan tapi gagal dimuat ulang");
  return kk;
}

// ---------------------------------------------------------------------------
// EDIT KK
// ---------------------------------------------------------------------------
export interface UpdateKKInput {
  id?: string; // UUID (fallback from noKk)
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
  const identifier = input.id || input.noKk;

  const existingKK = await getKKByNoKk(identifier);
  if (!existingKK) throw new Error("KK tidak ditemukan");

  if (input.namaAyah && !input.tanggalLahirAyah) {
    throw new Error("Tanggal lahir Ayah wajib diisi kalau nama Ayah diisi");
  }
  if (input.namaIbu && !input.tanggalLahirIbu) {
    throw new Error("Tanggal lahir Ibu wajib diisi kalau nama Ibu diisi");
  }

  const combinedAlamat = formatAlamat(input.alamat || "", input.rt || "", input.rw || "");

  // Update data keluarga
  let kkQuery = supabase.from("keluarga").update({
    no_kk: input.noKk || null,
    alamat: combinedAlamat,
    no_telp: input.noTelp || null,
  });

  if (existingKK.id) {
    kkQuery = kkQuery.eq("id", existingKK.id);
  } else {
    kkQuery = kkQuery.eq("no_kk", input.noKk);
  }

  const { error: kkError } = await kkQuery;
  if (kkError) throw new Error(kkError.message);

  const keluargaId = existingKK.id;
  if (!keluargaId) throw new Error("ID Keluarga tidak valid");

  // Fetch current father/mother in this keluarga
  const { data: members, error: memError } = await supabase
    .from("individu")
    .select("id, status_keluarga")
    .eq("keluarga_id", keluargaId);

  if (memError) throw new Error(memError.message);

  const existingAyah = members?.find((m: any) => m.status_keluarga === "Kepala Keluarga" || m.status_keluarga === "Ayah");
  const existingIbu = members?.find((m: any) => m.status_keluarga === "Istri" || m.status_keluarga === "Ibu");

  // Update/insert Ayah
  if (input.namaAyah) {
    if (existingAyah) {
      const { error } = await supabase
        .from("individu")
        .update({
          nama: input.namaAyah,
          tanggal_lahir: input.tanggalLahirAyah,
          tempat_lahir: input.tempatLahirAyah || null,
        })
        .eq("id", existingAyah.id);
      if (error) throw new Error(error.message);
    } else {
      const nikAyah = input.nikAyah && input.nikAyah.length === 16 ? input.nikAyah : generateTempNik();
      const { error } = await supabase.from("individu").insert({
        keluarga_id: keluargaId,
        nik: nikAyah,
        nama: input.namaAyah,
        tempat_lahir: input.tempatLahirAyah || null,
        tanggal_lahir: input.tanggalLahirAyah,
        jenis_kelamin: "L",
        status_keluarga: "Kepala Keluarga",
      });
      if (error) throw new Error(error.message);
    }
  }

  // Update/insert Ibu
  if (input.namaIbu) {
    if (existingIbu) {
      const { error } = await supabase
        .from("individu")
        .update({
          nama: input.namaIbu,
          tanggal_lahir: input.tanggalLahirIbu,
          tempat_lahir: input.tempatLahirIbu || null,
        })
        .eq("id", existingIbu.id);
      if (error) throw new Error(error.message);
    } else {
      const nikIbu = input.nikIbu && input.nikIbu.length === 16 ? input.nikIbu : generateTempNik();
      const { error } = await supabase.from("individu").insert({
        keluarga_id: keluargaId,
        nik: nikIbu,
        nama: input.namaIbu,
        tempat_lahir: input.tempatLahirIbu || null,
        tanggal_lahir: input.tanggalLahirIbu,
        jenis_kelamin: "P",
        status_keluarga: "Istri",
      });
      if (error) throw new Error(error.message);
    }
  }

  const updated = await getKKByNoKk(keluargaId);
  if (!updated) throw new Error("Gagal memuat ulang data setelah update");
  return updated;
}

// ---------------------------------------------------------------------------
// HAPUS KK
// ---------------------------------------------------------------------------
export async function deleteKK(noKkOrId: string): Promise<void> {
  const supabase = createClient();
  let query = supabase.from("keluarga").delete();
  if (noKkOrId.length === 36) {
    query = query.eq("id", noKkOrId);
  } else {
    query = query.eq("no_kk", noKkOrId);
  }
  const { error } = await query;
  if (error) throw new Error(error.message);
}

