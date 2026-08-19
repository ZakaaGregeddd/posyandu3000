import { dbQuery } from "@/lib/db/db-client";

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
  hasPemeriksaan?: boolean;
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
  const cleanAlamat = alamatRaw.replace(/\[RT:\s*[^\]]+\]/g, "").replace(/\[RW:\s*[^\]]+\]/g, "").trim();
  return {
    alamat: cleanAlamat,
    rt: rtMatch ? rtMatch[1] : "",
    rw: rwMatch ? rwMatch[1] : ""
  };
}



// ---------------------------------------------------------------------------
// DAFTAR BALITA
// ---------------------------------------------------------------------------
export async function getBalitas(): Promise<Balita[]> {
  const individuals = await dbQuery("SELECT * FROM individu");
  const keluargaList = await dbQuery("SELECT * FROM keluarga");
  const kelahiranList = await dbQuery("SELECT * FROM kelahiran");
  const exams = await dbQuery("SELECT DISTINCT individu_id FROM master_pemeriksaan WHERE jenis_pemeriksaan = 'Balita'");

  const keluargaMap = new Map(keluargaList.map((k: any) => [k.id, k]));
  const kelahiranMap = new Map(kelahiranList.map((k: any) => [k.individu_anak_id, k]));
  const examSet = new Set(exams.map((e: any) => e.individu_id));

  // Group members by keluarga_id
  const membersByKeluarga = new Map<string, any[]>();
  for (const ind of individuals) {
    if (ind.keluarga_id) {
      if (!membersByKeluarga.has(ind.keluarga_id)) {
        membersByKeluarga.set(ind.keluarga_id, []);
      }
      membersByKeluarga.get(ind.keluarga_id)!.push(ind);
    }
  }

  // Filter balitas (under 5 years or role "Anak")
  const balitaRows = individuals.filter((r: any) => {
    const birthDate = new Date(r.tanggal_lahir);
    const today = new Date();
    let ageYears = today.getFullYear() - birthDate.getFullYear();
    const m = today.getMonth() - birthDate.getMonth();
    if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
      ageYears--;
    }
    return ageYears <= 5 || r.status_keluarga === "Anak";
  });

  return balitaRows.map((row: any) => {
    const keluarga: any = keluargaMap.get(row.keluarga_id) || {};
    const members = membersByKeluarga.get(row.keluarga_id) || [];
    const ayah = members.find((m: any) => m.status_keluarga === "Kepala Keluarga" || m.status_keluarga === "Ayah");
    const ibu = members.find((m: any) => m.status_keluarga === "Istri" || m.status_keluarga === "Ibu");
    const birthRecord: any = kelahiranMap.get(row.id);

    return {
      id: row.id,
      nik: row.nik || "",
      noKk: keluarga.no_kk || "",
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
      hasPemeriksaan: examSet.has(row.id),
    };
  });
}

export async function getBalitaById(id: string): Promise<Balita | null> {
  const individuals = await getBalitas();
  return individuals.find(b => b.id === id || b.nik === id) || null;
}

// ---------------------------------------------------------------------------
// DAFTAR KK (untuk dropdown "Nomor KK")
// ---------------------------------------------------------------------------
export async function getKKs(): Promise<KKOption[]> {
  const keluargaList = await dbQuery("SELECT * FROM keluarga ORDER BY no_kk");
  const individuals = await dbQuery("SELECT * FROM individu");

  const membersByKeluarga = new Map<string, any[]>();
  for (const ind of individuals) {
    if (ind.keluarga_id) {
      if (!membersByKeluarga.has(ind.keluarga_id)) {
        membersByKeluarga.set(ind.keluarga_id, []);
      }
      membersByKeluarga.get(ind.keluarga_id)!.push(ind);
    }
  }

  return keluargaList.map((k: any) => {
    const { alamat, rt, rw } = parseAlamat(k.alamat);
    const members = membersByKeluarga.get(k.id) || [];
    const ayah = members.find((m: any) => m.status_keluarga === "Kepala Keluarga" || m.status_keluarga === "Ayah");
    const ibu = members.find((m: any) => m.status_keluarga === "Istri" || m.status_keluarga === "Ibu");

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

  if (input.caraLahir || input.usiaKehamilanSaatLahirWeeks) {
    const birthId = crypto.randomUUID();
    try {
      await dbQuery(
        `INSERT INTO kelahiran (id, pemeriksaan_ibu_hamil_id, individu_anak_id, cara_kelahiran, usia_kehamilan_minggu, tanggal_kelahiran, tempat_kelahiran)
         VALUES (?, NULL, ?, ?, ?, ?, ?)`,
        [birthId, id, input.caraLahir ?? null, input.usiaKehamilanSaatLahirWeeks ?? null, input.tanggalLahir, input.tempatLahir]
      );
    } catch (err: any) {
      // rollback
      await dbQuery("DELETE FROM individu WHERE id = ?", [id]);
      throw err;
    }
  }

  const balita = await getBalitaById(id);
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
  const isUuid = input.id.length === 36;
  const whereCol = isUuid ? "id" : "nik";
  
  await dbQuery(
    `UPDATE individu SET status_hidup = ?, tanggal_meninggal = ?, keterangan_meninggal = ? WHERE ${whereCol} = ?`,
    [input.statusHidup, input.tanggalMeninggal || null, input.penyebabMeninggal || null, input.id]
  );

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
  let id = input.id;
  if (id.length !== 36) {
    const list = await dbQuery("SELECT id FROM individu WHERE nik = ? LIMIT 1", [id]);
    if (list[0]) id = list[0].id;
  }

  await dbQuery(
    `UPDATE individu SET nama = ?, tempat_lahir = ?, tanggal_lahir = ?, jenis_kelamin = ?, golongan_darah = ? WHERE id = ?`,
    [input.nama, input.tempatLahir, input.tanggalLahir, input.jenisKelamin, input.golonganDarah || null, id]
  );

  if (input.caraLahir || input.usiaKehamilanSaatLahirWeeks) {
    const list = await dbQuery("SELECT id FROM kelahiran WHERE individu_anak_id = ? LIMIT 1", [id]);
    if (list[0]) {
      await dbQuery(
        `UPDATE kelahiran SET cara_kelahiran = ?, usia_kehamilan_minggu = ? WHERE individu_anak_id = ?`,
        [input.caraLahir ?? null, input.usiaKehamilanSaatLahirWeeks ?? null, id]
      );
    } else {
      const birthId = crypto.randomUUID();
      await dbQuery(
        `INSERT INTO kelahiran (id, pemeriksaan_ibu_hamil_id, individu_anak_id, cara_kelahiran, usia_kehamilan_minggu, tanggal_kelahiran, tempat_kelahiran)
         VALUES (?, NULL, ?, ?, ?, ?, ?)`,
        [birthId, id, input.caraLahir ?? null, input.usiaKehamilanSaatLahirWeeks ?? null, input.tanggalLahir, input.tempatLahir]
      );
    }
  }

  const updated = await getBalitaById(id);
  if (!updated) throw new Error("Data tidak ditemukan setelah update");
  return updated;
}

// ---------------------------------------------------------------------------
// HAPUS BALITA
// ---------------------------------------------------------------------------
export async function deleteBalita(id: string): Promise<void> {
  const isUuid = id.length === 36;
  const whereCol = isUuid ? "id" : "nik";
  await dbQuery(`DELETE FROM individu WHERE ${whereCol} = ?`, [id]);
}

// ---------------------------------------------------------------------------
// RIWAYAT PEMERIKSAAN
// ---------------------------------------------------------------------------
export async function getBalitaRecords(
  balitaId: string,
): Promise<BalitaRecord[]> {
  let indId = balitaId;
  if (balitaId.length !== 36) {
    const list = await dbQuery("SELECT id FROM individu WHERE nik = ? LIMIT 1", [balitaId]);
    if (list[0]) indId = list[0].id;
  }

  const list = await dbQuery(
    `SELECT m.id, m.individu_id, m.tanggal_pemeriksaan, 
            p.berat_badan, p.tinggi_badan, p.lingkar_kepala, p.lingkar_lengan, p.imunisasi, p.obat_vitamin, p.imt
     FROM master_pemeriksaan m
     JOIN pemeriksaan_balita p ON m.id = p.pemeriksaan_id
     WHERE m.individu_id = ? AND m.jenis_pemeriksaan = 'Balita'
     ORDER BY m.tanggal_pemeriksaan ASC`,
    [indId]
  );

  return list.map((row: any) => ({
    id: row.id,
    balitaId: row.individu_id,
    tanggalPemeriksaan: row.tanggal_pemeriksaan,
    tinggiBadan: row.tinggi_badan ? Number(row.tinggi_badan) : 0,
    beratBadan: row.berat_badan ? Number(row.berat_badan) : 0,
    lingkarKepala: row.lingkar_kepala ? Number(row.lingkar_kepala) : 0,
    lingkarLengan: row.lingkar_lengan ? Number(row.lingkar_lengan) : 0,
    imunisasi: row.imunisasi ?? "",
    obatVitamin: row.obat_vitamin ?? "",
    imt: row.imt ? Number(row.imt) : 0,
  }));
}

// ---------------------------------------------------------------------------
// BULK FETCH
// ---------------------------------------------------------------------------
export async function getBalitaRecordsForNiks(
  niksOrIds: string[],
): Promise<BalitaRecord[]> {
  if (niksOrIds.length === 0) return [];

  const isUuid = niksOrIds[0].length === 36;
  const placeholders = niksOrIds.map(() => "?").join(",");
  const whereCol = isUuid ? "m.individu_id" : "i.nik";

  const list = await dbQuery(
    `SELECT m.id, m.individu_id, m.tanggal_pemeriksaan, 
            p.berat_badan, p.tinggi_badan, p.lingkar_kepala, p.lingkar_lengan, p.imunisasi, p.obat_vitamin, p.imt
     FROM master_pemeriksaan m
     JOIN pemeriksaan_balita p ON m.id = p.pemeriksaan_id
     JOIN individu i ON m.individu_id = i.id
     WHERE ${whereCol} IN (${placeholders}) AND m.jenis_pemeriksaan = 'Balita'
     ORDER BY m.tanggal_pemeriksaan ASC`,
    niksOrIds
  );

  return list.map((row: any) => ({
    id: row.id,
    balitaId: row.individu_id,
    tanggalPemeriksaan: row.tanggal_pemeriksaan,
    tinggiBadan: row.tinggi_badan ? Number(row.tinggi_badan) : 0,
    beratBadan: row.berat_badan ? Number(row.berat_badan) : 0,
    lingkarKepala: row.lingkar_kepala ? Number(row.lingkar_kepala) : 0,
    lingkarLengan: row.lingkar_lengan ? Number(row.lingkar_lengan) : 0,
    imunisasi: row.imunisasi ?? "",
    obatVitamin: row.obat_vitamin ?? "",
    imt: row.imt ? Number(row.imt) : 0,
  }));
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
  let individuId = input.balitaId;
  if (input.balitaId.length !== 36) {
    const list = await dbQuery("SELECT id FROM individu WHERE nik = ? LIMIT 1", [input.balitaId]);
    if (list[0]) individuId = list[0].id;
  }

  const countList = await dbQuery(
    "SELECT COUNT(*) as count FROM master_pemeriksaan WHERE individu_id = ? AND jenis_pemeriksaan = 'Balita'",
    [individuId]
  );
  const kunjunganKe = (countList[0]?.count || 0) + 1;

  const masterId = crypto.randomUUID();
  await dbQuery(
    `INSERT INTO master_pemeriksaan (id, individu_id, tanggal_pemeriksaan, kunjungan_ke, jenis_pemeriksaan)
     VALUES (?, ?, ?, ?, 'Balita')`,
    [masterId, individuId, input.tanggalPemeriksaan, kunjunganKe]
  );

  const imt = input.tinggiBadan > 0 ? Number((input.beratBadan / Math.pow(input.tinggiBadan / 100, 2)).toFixed(2)) : 0;

  try {
    await dbQuery(
      `INSERT INTO pemeriksaan_balita (pemeriksaan_id, berat_badan, tinggi_badan, lingkar_kepala, lingkar_lengan, imunisasi, obat_vitamin, imt, catatan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, '')`,
      [masterId, input.beratBadan, input.tinggiBadan, input.lingkarKepala, input.lingkarLengan, input.imunisasi, input.obatVitamin, imt]
    );
  } catch (err: any) {
    await dbQuery("DELETE FROM master_pemeriksaan WHERE id = ?", [masterId]);
    throw err;
  }

  return {
    id: masterId,
    balitaId: individuId,
    tanggalPemeriksaan: input.tanggalPemeriksaan,
    tinggiBadan: input.tinggiBadan,
    beratBadan: input.beratBadan,
    lingkarKepala: input.lingkarKepala,
    lingkarLengan: input.lingkarLengan,
    imunisasi: input.imunisasi,
    obatVitamin: input.obatVitamin,
    imt: imt,
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
  await dbQuery(
    `UPDATE master_pemeriksaan SET tanggal_pemeriksaan = ? WHERE id = ?`,
    [input.tanggalPemeriksaan, input.id]
  );

  const imt = input.tinggiBadan > 0 ? Number((input.beratBadan / Math.pow(input.tinggiBadan / 100, 2)).toFixed(2)) : 0;

  await dbQuery(
    `UPDATE pemeriksaan_balita SET berat_badan = ?, tinggi_badan = ?, lingkar_kepala = ?, lingkar_lengan = ?, imunisasi = ?, obat_vitamin = ?, imt = ?
     WHERE pemeriksaan_id = ?`,
    [input.beratBadan, input.tinggiBadan, input.lingkarKepala, input.lingkarLengan, input.imunisasi, input.obatVitamin, imt, input.id]
  );

  const masterList = await dbQuery("SELECT individu_id FROM master_pemeriksaan WHERE id = ? LIMIT 1", [input.id]);
  const balitaId = masterList[0]?.individu_id || "";

  return {
    id: input.id,
    balitaId,
    tanggalPemeriksaan: input.tanggalPemeriksaan,
    tinggiBadan: input.tinggiBadan,
    beratBadan: input.beratBadan,
    lingkarKepala: input.lingkarKepala,
    lingkarLengan: input.lingkarLengan,
    imunisasi: input.imunisasi,
    obatVitamin: input.obatVitamin,
    imt: imt,
  };
}

// ---------------------------------------------------------------------------
// HAPUS SATU DATA PEMERIKSAAN
// ---------------------------------------------------------------------------
export async function deleteBalitaRecord(recordId: string): Promise<void> {
  await dbQuery(`DELETE FROM master_pemeriksaan WHERE id = ?`, [recordId]);
}
