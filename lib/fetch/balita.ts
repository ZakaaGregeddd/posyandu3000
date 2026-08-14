import { createClient } from "@/lib/supabase/client";

export type StatusHidup = "Hidup" | "Meninggal";

export interface Balita {
  id: string; // UUID
  nik: string;
  noKk: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  namaIbu: string;
  namaAyah: string;
  golonganDarah?: string;
  statusHidup: StatusHidup;
  tanggalMeninggal?: string;
  penyebabMeninggal?: string;
  caraLahir?: "SC" | "Normal";
  usiaKehamilanSaatLahirWeeks?: number;
  ttlAyah?: string;
  ttlIbu?: string;
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

function mapRowToBalita(row: any): Balita {
  const members = row.keluarga?.members || [];
  const ayah = members.find((m: any) => m.status_keluarga === "Kepala Keluarga" || m.status_keluarga === "Ayah");
  const ibu = members.find((m: any) => m.status_keluarga === "Istri" || m.status_keluarga === "Ibu");
  const birthRecord = row.kelahiran?.[0] || row.kelahiran;

  return {
    id: row.id,
    nik: row.nik || "",
    noKk: row.keluarga?.no_kk || "",
    nama: row.nama,
    tempatLahir: row.tempat_lahir ?? "",
    tanggalLahir: row.tanggal_lahir,
    jenisKelamin: row.jenis_kelamin,
    namaIbu: ibu?.nama || "",
    namaAyah: ayah?.nama || "",
    golonganDarah: row.golongan_darah ?? undefined,
    statusHidup: row.status_hidup,
    tanggalMeninggal: row.tanggal_meninggal ?? undefined,
    penyebabMeninggal: row.keterangan_meninggal ?? undefined,
    caraLahir: birthRecord?.cara_kelahiran ?? undefined,
    usiaKehamilanSaatLahirWeeks: birthRecord?.usia_kehamilan_minggu ?? undefined,
    ttlAyah: ayah ? `${ayah.tempat_lahir ?? ""}, ${ayah.tanggal_lahir ?? ""}` : undefined,
    ttlIbu: ibu ? `${ibu.tempat_lahir ?? ""}, ${ibu.tanggal_lahir ?? ""}` : undefined,
  };
}

// ---------------------------------------------------------------------------
// DAFTAR BALITA
// ---------------------------------------------------------------------------
export async function getBalitas(): Promise<Balita[]> {
  const supabase = createClient();
  const { data, error } = await supabase
    .from("individu")
    .select(`
      *,
      keluarga:keluarga(
        id,
        no_kk,
        alamat,
        no_telp,
        members:individu(
          id,
          nik,
          nama,
          status_keluarga,
          tanggal_lahir,
          tempat_lahir
        )
      ),
      kelahiran:kelahiran!kelahiran_individu_anak_id_fkey(
        cara_kelahiran,
        usia_kehamilan_minggu
      )
    `);

  if (error) throw new Error(error.message);

  const balitas = (data ?? []).filter((r: any) => {
    const birthDate = new Date(r.tanggal_lahir);
    const today = new Date();
    let ageYears = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      ageYears--;
    }
    return ageYears <= 5 || r.status_keluarga === "Anak";
  });

  return balitas.map(mapRowToBalita);
}

export async function getBalitaById(id: string): Promise<Balita | null> {
  const supabase = createClient();
  let query = supabase
    .from("individu")
    .select(`
      *,
      keluarga:keluarga(
        id,
        no_kk,
        alamat,
        no_telp,
        members:individu(
          id,
          nik,
          nama,
          status_keluarga,
          tanggal_lahir,
          tempat_lahir
        )
      ),
      kelahiran:kelahiran!kelahiran_individu_anak_id_fkey(
        cara_kelahiran,
        usia_kehamilan_minggu
      )
    `);

  if (id.length === 36) {
    query = query.eq("id", id);
  } else {
    query = query.eq("nik", id);
  }

  const { data, error } = await query.maybeSingle();
  if (error) throw new Error(error.message);
  return data ? mapRowToBalita(data) : null;
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
// TAMBAH BALITA
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

function generateTempNik(): string {
  return `TMP${Date.now()}`.padEnd(16, "0").slice(0, 16);
}

export async function addBalita(input: AddBalitaInput): Promise<Balita> {
  const supabase = createClient();

  // Find keluarga_id by noKk
  const { data: kk } = await supabase
    .from("keluarga")
    .select("id")
    .eq("no_kk", input.noKk)
    .single();

  if (!kk) throw new Error(`Keluarga dengan nomor KK ${input.noKk} tidak ditemukan.`);

  const nik = input.nik && input.nik.length === 16 ? input.nik : generateTempNik();

  const { data: individu, error: individuError } = await supabase
    .from("individu")
    .insert({
      keluarga_id: kk.id,
      nik,
      nama: input.nama,
      tempat_lahir: input.tempatLahir,
      tanggal_lahir: input.tanggalLahir,
      jenis_kelamin: input.jenisKelamin,
      status_keluarga: "Anak",
      status_hidup: input.statusHidup,
      golongan_darah: input.golonganDarah ?? null,
    })
    .select("id")
    .single();

  if (individuError) throw new Error(individuError.message);

  if (input.caraLahir || input.usiaKehamilanSaatLahirWeeks) {
    const { error: birthError } = await supabase.from("kelahiran").insert({
      pemeriksaan_ibu_hamil_id: "00000000-0000-0000-0000-000000000000", // Dummy/fallback if independent birth
      individu_anak_id: individu.id,
      cara_kelahiran: input.caraLahir ?? null,
      usia_kehamilan_minggu: input.usiaKehamilanSaatLahirWeeks ?? null,
      tanggal_kelahiran: input.tanggalLahir,
      tempat_kelahiran: input.tempatLahir,
    });

    if (birthError) {
      // rollback
      await supabase.from("individu").delete().eq("id", individu.id);
      throw new Error(birthError.message);
    }
  }

  const balita = await getBalitaById(individu.id);
  if (!balita) throw new Error("Data tersimpan tapi gagal dimuat ulang");
  return balita;
}

// ---------------------------------------------------------------------------
// UPDATE STATUS HIDUP
// ---------------------------------------------------------------------------
export interface UpdateBalitaInput {
  id: string; // UUID or NIK
  statusHidup: StatusHidup;
  tanggalMeninggal?: string;
  penyebabMeninggal?: string;
}

export async function updateBalita(input: UpdateBalitaInput): Promise<Balita> {
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

  const balita = await getBalitaById(input.id);
  if (!balita) throw new Error("Data balita tidak ditemukan setelah update");
  return balita;
}

// ---------------------------------------------------------------------------
// EDIT IDENTITAS & DATA KELAHIRAN
// ---------------------------------------------------------------------------
export interface UpdateBalitaDataInput {
  id: string; // UUID or NIK
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  caraLahir?: "SC" | "Normal";
  usiaKehamilanSaatLahirWeeks?: number;
  golonganDarah?: string;
}

export async function updateBalitaData(
  input: UpdateBalitaDataInput,
): Promise<Balita> {
  const supabase = createClient();
  let id = input.id;
  if (id.length !== 36) {
    const { data } = await supabase.from("individu").select("id").eq("nik", id).maybeSingle();
    if (data) id = data.id;
  }

  const { error: individuError } = await supabase
    .from("individu")
    .update({
      nama: input.nama,
      tempat_lahir: input.tempatLahir,
      tanggal_lahir: input.tanggalLahir,
      jenis_kelamin: input.jenisKelamin,
      golongan_darah: input.golonganDarah || null,
    })
    .eq("id", id);

  if (individuError) throw new Error(individuError.message);

  if (input.caraLahir || input.usiaKehamilanSaatLahirWeeks) {
    const { error: birthError } = await supabase.from("kelahiran").upsert(
      {
        individu_anak_id: id,
        cara_kelahiran: input.caraLahir ?? null,
        usia_kehamilan_minggu: input.usiaKehamilanSaatLahirWeeks ?? null,
        pemeriksaan_ibu_hamil_id: "00000000-0000-0000-0000-000000000000" // dummy if not exists
      },
      { onConflict: "individu_anak_id" }
    );
    if (birthError) throw new Error(birthError.message);
  }

  const updated = await getBalitaById(id);
  if (!updated) throw new Error("Data tidak ditemukan setelah update");
  return updated;
}

// ---------------------------------------------------------------------------
// HAPUS BALITA
// ---------------------------------------------------------------------------
export async function deleteBalita(id: string): Promise<void> {
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
export async function getBalitaRecords(
  balitaId: string,
): Promise<BalitaRecord[]> {
  const supabase = createClient();
  let indId = balitaId;
  if (balitaId.length !== 36) {
    const { data: indData } = await supabase.from("individu").select("id").eq("nik", balitaId).maybeSingle();
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
      pemeriksaan_balita(
        berat_badan,
        tinggi_badan,
        lingkar_kepala,
        lingkar_lengan,
        imunisasi,
        obat_vitamin,
        imt,
        catatan
      )
    `)
    .eq("individu_id", indId)
    .eq("jenis_pemeriksaan", "Balita")
    .order("tanggal_pemeriksaan", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const pb = row.pemeriksaan_balita || {};
    return {
      id: row.id,
      balitaId: row.individu_id,
      tanggalPemeriksaan: row.tanggal_pemeriksaan,
      tinggiBadan: pb.tinggi_badan ? Number(pb.tinggi_badan) : 0,
      beratBadan: pb.berat_badan ? Number(pb.berat_badan) : 0,
      lingkarKepala: pb.lingkar_kepala ? Number(pb.lingkar_kepala) : 0,
      lingkarLengan: pb.lingkar_lengan ? Number(pb.lingkar_lengan) : 0,
      imunisasi: pb.imunisasi ?? "",
      obatVitamin: pb.obat_vitamin ?? "",
      imt: pb.imt ? Number(pb.imt) : 0,
    };
  });
}

// ---------------------------------------------------------------------------
// BULK FETCH
// ---------------------------------------------------------------------------
export async function getBalitaRecordsForNiks(
  niksOrIds: string[],
): Promise<BalitaRecord[]> {
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
      pemeriksaan_balita(
        berat_badan,
        tinggi_badan,
        lingkar_kepala,
        lingkar_lengan,
        imunisasi,
        obat_vitamin,
        imt,
        catatan
      ),
      individu!inner(id, nik)
    `)
    .eq("jenis_pemeriksaan", "Balita");

  if (niksOrIds[0].length === 36) {
    query = query.in("individu_id", niksOrIds);
  } else {
    query = query.in("individu.nik", niksOrIds);
  }

  const { data, error } = await query
    .order("tanggal_pemeriksaan", { ascending: true });

  if (error) throw new Error(error.message);

  return (data ?? []).map((row: any) => {
    const pb = row.pemeriksaan_balita || {};
    return {
      id: row.id,
      balitaId: row.individu_id,
      tanggalPemeriksaan: row.tanggal_pemeriksaan,
      tinggiBadan: pb.tinggi_badan ? Number(pb.tinggi_badan) : 0,
      beratBadan: pb.berat_badan ? Number(pb.berat_badan) : 0,
      lingkarKepala: pb.lingkar_kepala ? Number(pb.lingkar_kepala) : 0,
      lingkarLengan: pb.lingkar_lengan ? Number(pb.lingkar_lengan) : 0,
      imunisasi: pb.imunisasi ?? "",
      obatVitamin: pb.obat_vitamin ?? "",
      imt: pb.imt ? Number(pb.imt) : 0,
    };
  });
}

export interface AddBalitaRecordInput {
  balitaId: string; // UUID or NIK
  tanggalPemeriksaan: string;
  tinggiBadan: number;
  beratBadan: number;
  lingkarKepala: number;
  lingkarLengan: number;
  imunisasi: string;
  obatVitamin: string;
}

export async function addBalitaRecord(
  input: AddBalitaRecordInput,
): Promise<BalitaRecord> {
  const supabase = createClient();

  let individuId = input.balitaId;
  if (input.balitaId.length !== 36) {
    const { data: ind } = await supabase.from("individu").select("id").eq("nik", input.balitaId).single();
    if (ind) individuId = ind.id;
  }

  const { count } = await supabase
    .from("master_pemeriksaan")
    .select("*", { count: "exact", head: true })
    .eq("individu_id", individuId)
    .eq("jenis_pemeriksaan", "Balita");

  const kunjunganKe = (count || 0) + 1;

  const { data: master, error: masterError } = await supabase
    .from("master_pemeriksaan")
    .insert({
      individu_id: individuId,
      tanggal_pemeriksaan: input.tanggalPemeriksaan,
      kunjungan_ke: kunjunganKe,
      jenis_pemeriksaan: "Balita",
    })
    .select("id")
    .single();

  if (masterError) throw new Error(masterError.message);

  const imt = input.tinggiBadan > 0 ? Number((input.beratBadan / Math.pow(input.tinggiBadan / 100, 2)).toFixed(2)) : 0;

  const { data: detail, error: detailError } = await supabase
    .from("pemeriksaan_balita")
    .insert({
      pemeriksaan_id: master.id,
      berat_badan: input.beratBadan,
      tinggi_badan: input.tinggiBadan,
      lingkar_kepala: input.lingkarKepala,
      lingkar_lengan: input.lingkarLengan,
      imunisasi: input.imunisasi,
      obat_vitamin: input.obatVitamin,
      imt: imt,
      catatan: "",
    })
    .select()
    .single();

  if (detailError) {
    await supabase.from("master_pemeriksaan").delete().eq("id", master.id);
    throw new Error(detailError.message);
  }

  return {
    id: master.id,
    balitaId: individuId,
    tanggalPemeriksaan: input.tanggalPemeriksaan,
    tinggiBadan: Number(detail.tinggi_badan),
    beratBadan: Number(detail.berat_badan),
    lingkarKepala: Number(detail.lingkar_kepala),
    lingkarLengan: Number(detail.lingkar_lengan),
    imunisasi: detail.imunisasi ?? "",
    obatVitamin: detail.obat_vitamin ?? "",
    imt: Number(detail.imt),
  };
}

// ---------------------------------------------------------------------------
// EDIT SATU DATA PEMERIKSAAN
// ---------------------------------------------------------------------------
export interface UpdateBalitaRecordInput {
  id: string; // record id (master_pemeriksaan id)
  tanggalPemeriksaan: string;
  tinggiBadan: number;
  beratBadan: number;
  lingkarKepala: number;
  lingkarLengan: number;
  imunisasi: string;
  obatVitamin: string;
}

export async function updateBalitaRecord(
  input: UpdateBalitaRecordInput,
): Promise<BalitaRecord> {
  const supabase = createClient();

  const { error: masterError } = await supabase
    .from("master_pemeriksaan")
    .update({
      tanggal_pemeriksaan: input.tanggalPemeriksaan,
    })
    .eq("id", input.id);

  if (masterError) throw new Error(masterError.message);

  const imt = input.tinggiBadan > 0 ? Number((input.beratBadan / Math.pow(input.tinggiBadan / 100, 2)).toFixed(2)) : 0;

  const { data: detail, error: detailError } = await supabase
    .from("pemeriksaan_balita")
    .update({
      berat_badan: input.beratBadan,
      tinggi_badan: input.tinggiBadan,
      lingkar_kepala: input.lingkarKepala,
      lingkar_lengan: input.lingkarLengan,
      imunisasi: input.imunisasi,
      obat_vitamin: input.obatVitamin,
      imt: imt,
    })
    .eq("pemeriksaan_id", input.id)
    .select()
    .single();

  if (detailError) throw new Error(detailError.message);

  // Get master pemeriksaan to return balitaId
  const { data: master } = await supabase
    .from("master_pemeriksaan")
    .select("individu_id")
    .eq("id", input.id)
    .single();

  return {
    id: input.id,
    balitaId: master?.individu_id || "",
    tanggalPemeriksaan: input.tanggalPemeriksaan,
    tinggiBadan: Number(detail.tinggi_badan),
    beratBadan: Number(detail.berat_badan),
    lingkarKepala: Number(detail.lingkar_kepala),
    lingkarLengan: Number(detail.lingkar_lengan),
    imunisasi: detail.imunisasi ?? "",
    obatVitamin: detail.obat_vitamin ?? "",
    imt: Number(detail.imt),
  };
}

// ---------------------------------------------------------------------------
// HAPUS SATU DATA PEMERIKSAAN
// ---------------------------------------------------------------------------
export async function deleteBalitaRecord(recordId: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase
    .from("master_pemeriksaan")
    .delete()
    .eq("id", recordId);

  if (error) throw new Error(error.message);
}

