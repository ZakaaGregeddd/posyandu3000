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

// Helper to execute DB queries via Electron Bridge
async function dbQuery(sql: string, params: any[] = []): Promise<any> {
  if (typeof window !== "undefined" && window.electronAPI) {
    return window.electronAPI.query(sql, params);
  }
  return [];
}

// ---------------------------------------------------------------------------
// DAFTAR IBU HAMIL
// ---------------------------------------------------------------------------
export async function getIbuHamils(): Promise<IbuHamil[]> {
  const masterExams = await dbQuery(
    `SELECT m.id, m.individu_id, m.tanggal_pemeriksaan, m.kunjungan_ke, m.jenis_pemeriksaan,
            p.tanggal_hpht, p.status_kelahiran
     FROM master_pemeriksaan m
     JOIN pemeriksaan_ibu_hamil p ON m.id = p.pemeriksaan_id
     WHERE m.jenis_pemeriksaan = 'Ibu Hamil'
     ORDER BY m.tanggal_pemeriksaan DESC`
  );

  const individuals = await dbQuery("SELECT * FROM individu");
  const keluargaList = await dbQuery("SELECT * FROM keluarga");
  const kelahiranList = await dbQuery(
    `SELECT k.*, i.nama as child_nama, i.jenis_kelamin as child_jk 
     FROM kelahiran k 
     JOIN individu i ON k.individu_anak_id = i.id`
  );

  const individualMap = new Map(individuals.map((ind: any) => [ind.id, ind]));
  const keluargaMap = new Map(keluargaList.map((k: any) => [k.id, k]));
  const kelahiranMap = new Map(kelahiranList.map((k: any) => [k.pemeriksaan_ibu_hamil_id, k]));

  // Group by episode (individu_id + tanggal_hpht)
  const episodes: Record<string, any> = {};
  for (const row of masterExams) {
    const hpht = row.tanggal_hpht || "";
    const key = `${row.individu_id}_${hpht}`;
    if (!episodes[key]) {
      episodes[key] = row; // Keep the latest exam as representative for this pregnancy episode
    }
  }

  return Object.values(episodes).map((row: any) => {
    const mother: any = individualMap.get(row.individu_id) || {};
    const keluarga: any = keluargaMap.get(mother.keluarga_id) || {};
    const birth: any = kelahiranMap.get(row.id);

    return {
      id: row.id,
      nik: mother.nik || "",
      noKk: keluarga.no_kk || "",
      nama: mother.nama || "",
      tempatLahir: mother.tempat_lahir || "",
      tanggalLahir: mother.tanggal_lahir || "",
      hpht: row.tanggal_hpht || "",
      golonganDarah: mother.golongan_darah || undefined,
      statusHidup: mother.status_hidup || "Hidup",
      tanggalMeninggal: mother.tanggal_meninggal || undefined,
      penyebabMeninggal: mother.keterangan_meninggal || undefined,
      postBirthRecord: birth
        ? {
            nama: birth.child_nama || "",
            tempat: birth.tempat_kelahiran || "",
            tanggalLahir: birth.tanggal_kelahiran || "",
            jenisKelamin: birth.child_jk || "P",
            caraLahir: birth.cara_kelahiran || "Normal",
            usiaKehamilanSaatLahirWeeks: birth.usia_kehamilan_minggu || 40,
          }
        : undefined,
    };
  });
}

export async function getIbuHamilById(id: string): Promise<IbuHamil | null> {
  if (id.length === 36) {
    const list = await getIbuHamils();
    return list.find(b => b.id === id) || null;
  } else {
    // If NIK, find mother first
    const list = await dbQuery("SELECT id FROM individu WHERE nik = ? LIMIT 1", [id]);
    if (!list[0]) return null;
    const motherId = list[0].id;
    const episodes = await getIbuHamils();
    return episodes.find(e => e.id === id || e.nik === id) || null;
  }
}

// ---------------------------------------------------------------------------
// DAFTAR KK
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
  tanggalPemeriksaan?: string;
}

function generateTempNik(): string {
  return `TMP${Date.now()}`.padEnd(16, "0").slice(0, 16);
}

export async function addIbuHamil(input: AddIbuHamilInput): Promise<IbuHamil> {
  const kkList = await dbQuery("SELECT id FROM keluarga WHERE no_kk = ? LIMIT 1", [input.noKk]);
  const kk = kkList[0];
  if (!kk) throw new Error("Nomor KK tidak terdaftar");

  let motherId = "";
  const cleanNik = input.nik && input.nik.length === 16 ? input.nik : generateTempNik();

  const existingList = await dbQuery("SELECT id FROM individu WHERE nik = ? LIMIT 1", [cleanNik]);
  const existing = existingList[0];

  if (existing) {
    motherId = existing.id;
  } else {
    motherId = crypto.randomUUID();
    await dbQuery(
      `INSERT INTO individu (id, keluarga_id, nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, status_keluarga, golongan_darah)
       VALUES (?, ?, ?, ?, ?, ?, 'P', 'Istri', ?)`,
      [motherId, kk.id, cleanNik, input.nama, input.tempatLahir, input.tanggalLahir, input.golonganDarah ?? null]
    );
  }

  const masterId = crypto.randomUUID();
  const tglPemeriksaan = input.tanggalPemeriksaan || new Date().toISOString().split("T")[0];

  try {
    await dbQuery(
      `INSERT INTO master_pemeriksaan (id, individu_id, tanggal_pemeriksaan, kunjungan_ke, jenis_pemeriksaan)
       VALUES (?, ?, ?, 1, 'Ibu Hamil')`,
      [masterId, motherId, tglPemeriksaan]
    );

    await dbQuery(
      `INSERT INTO pemeriksaan_ibu_hamil (pemeriksaan_id, tanggal_hpht, catatan)
       VALUES (?, ?, 'Pendaftaran Kehamilan')`,
      [masterId, input.hpht]
    );
  } catch (err: any) {
    await dbQuery("DELETE FROM master_pemeriksaan WHERE id = ?", [masterId]);
    if (!existing) await dbQuery("DELETE FROM individu WHERE id = ?", [motherId]);
    throw err;
  }

  const ibuHamil = await getIbuHamilById(masterId);
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
  const isUuid = input.nik.length === 36;
  const whereCol = isUuid ? "id" : "nik";

  await dbQuery(
    `UPDATE individu SET status_hidup = ?, tanggal_meninggal = ?, keterangan_meninggal = ? WHERE ${whereCol} = ?`,
    [input.statusHidup, input.tanggalMeninggal || null, input.penyebabMeninggal || null, input.nik]
  );

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
  const isUuid = input.nik.length === 36;
  const whereCol = isUuid ? "id" : "nik";

  await dbQuery(
    `UPDATE individu SET nama = ?, tempat_lahir = ?, tanggal_lahir = ?, golongan_darah = ? WHERE ${whereCol} = ?`,
    [input.nama, input.tempatLahir, input.tanggalLahir, input.golonganDarah || null, input.nik]
  );

  // Update HPHT in all examinations under this episode
  const episode = await dbQuery(
    `SELECT individu_id, tanggal_hpht 
     FROM master_pemeriksaan m
     JOIN pemeriksaan_ibu_hamil p ON m.id = p.pemeriksaan_id
     WHERE m.id = ? LIMIT 1`,
    [input.id]
  );

  if (episode[0]) {
    const oldHpht = episode[0].tanggal_hpht;
    const motherId = episode[0].individu_id;

    // Get all examinations for this mother and pregnancy
    const exams = await dbQuery(
      `SELECT m.id FROM master_pemeriksaan m
       JOIN pemeriksaan_ibu_hamil p ON m.id = p.pemeriksaan_id
       WHERE m.individu_id = ? AND m.jenis_pemeriksaan = 'Ibu Hamil' AND p.tanggal_hpht = ?`,
      [motherId, oldHpht]
    );

    const examIds = exams.map((e: any) => e.id);
    if (examIds.length > 0) {
      const placeholders = examIds.map(() => "?").join(",");
      await dbQuery(
        `UPDATE pemeriksaan_ibu_hamil SET tanggal_hpht = ? WHERE pemeriksaan_id IN (${placeholders})`,
        [input.hpht, ...examIds]
      );
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
  const target = await dbQuery(
    `SELECT m.individu_id, p.tanggal_hpht 
     FROM master_pemeriksaan m
     JOIN pemeriksaan_ibu_hamil p ON m.id = p.pemeriksaan_id
     WHERE m.id = ? LIMIT 1`,
    [id]
  );

  if (target[0]) {
    const hpht = target[0].tanggal_hpht;
    const motherId = target[0].individu_id;

    const exams = await dbQuery(
      `SELECT m.id FROM master_pemeriksaan m
       JOIN pemeriksaan_ibu_hamil p ON m.id = p.pemeriksaan_id
       WHERE m.individu_id = ? AND m.jenis_pemeriksaan = 'Ibu Hamil' AND p.tanggal_hpht = ?`,
      [motherId, hpht]
    );

    const examIds = exams.map((e: any) => e.id);
    if (examIds.length > 0) {
      const placeholders = examIds.map(() => "?").join(",");
      await dbQuery(`DELETE FROM master_pemeriksaan WHERE id IN (${placeholders})`, examIds);
    }
  }
}

// ---------------------------------------------------------------------------
// RIWAYAT PEMERIKSAAN (ANC)
// ---------------------------------------------------------------------------
export async function getIbuHamilRecords(
  ibuHamilId: string,
): Promise<IbuHamilRecord[]> {
  const target = await dbQuery(
    `SELECT m.individu_id, p.tanggal_hpht 
     FROM master_pemeriksaan m
     JOIN pemeriksaan_ibu_hamil p ON m.id = p.pemeriksaan_id
     WHERE m.id = ? LIMIT 1`,
    [ibuHamilId]
  );

  if (!target[0]) return [];
  const hpht = target[0].tanggal_hpht;
  const motherId = target[0].individu_id;

  const list = await dbQuery(
    `SELECT m.id, m.individu_id, m.tanggal_pemeriksaan, m.kunjungan_ke,
            p.berat_badan, p.tinggi_badan, p.tekanan_sistolik, p.tekanan_diastolik, p.usia_kehamilan_minggu, p.vitamin
     FROM master_pemeriksaan m
     JOIN pemeriksaan_ibu_hamil p ON m.id = p.pemeriksaan_id
     WHERE m.individu_id = ? AND m.jenis_pemeriksaan = 'Ibu Hamil' AND p.tanggal_hpht = ?
     ORDER BY m.tanggal_pemeriksaan ASC`,
    [motherId, hpht]
  );

  return list
    .filter((row: any) => row.id !== ibuHamilId)
    .map((row: any) => ({
      id: row.id,
      ibuHamilId: ibuHamilId,
      tanggalPemeriksaan: row.tanggal_pemeriksaan,
      beratBadan: row.berat_badan ? Number(row.berat_badan) : 0,
      tinggiBadan: row.tinggi_badan ? Number(row.tinggi_badan) : undefined,
      tekananDarahSistolik: row.tekanan_sistolik ? Number(row.tekanan_sistolik) : 0,
      tekananDarahDiastolik: row.tekanan_diastolik ? Number(row.tekanan_diastolik) : 0,
      usiaKehamilanWeeks: row.usia_kehamilan_minggu ? Number(row.usia_kehamilan_minggu) : 0,
      kunjunganKe: row.kunjungan_ke ? Number(row.kunjungan_ke) : 0,
      vitamin: row.vitamin ?? "",
    }));
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
  const target = await dbQuery(
    `SELECT m.individu_id, p.tanggal_hpht 
     FROM master_pemeriksaan m
     JOIN pemeriksaan_ibu_hamil p ON m.id = p.pemeriksaan_id
     WHERE m.id = ? LIMIT 1`,
    [input.ibuHamilId]
  );

  if (!target[0]) throw new Error("Pregnancy episode not found");
  const hpht = target[0].tanggal_hpht;
  const motherId = target[0].individu_id;

  const masterId = crypto.randomUUID();
  await dbQuery(
    `INSERT INTO master_pemeriksaan (id, individu_id, tanggal_pemeriksaan, kunjungan_ke, jenis_pemeriksaan)
     VALUES (?, ?, ?, ?, 'Ibu Hamil')`,
    [masterId, motherId, input.tanggalPemeriksaan, input.kunjunganKe]
  );

  try {
    await dbQuery(
      `INSERT INTO pemeriksaan_ibu_hamil (pemeriksaan_id, tanggal_hpht, berat_badan, tinggi_badan, tekanan_sistolik, tekanan_diastolik, usia_kehamilan_minggu, vitamin, catatan)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, '')`,
      [masterId, hpht, input.beratBadan, input.tinggiBadan, input.tekananDarahSistolik, input.tekananDarahDiastolik, input.usiaKehamilanWeeks, input.vitamin]
    );
  } catch (err: any) {
    await dbQuery("DELETE FROM master_pemeriksaan WHERE id = ?", [masterId]);
    throw err;
  }

  return {
    id: masterId,
    ibuHamilId: input.ibuHamilId,
    tanggalPemeriksaan: input.tanggalPemeriksaan,
    beratBadan: input.beratBadan,
    tinggiBadan: input.tinggiBadan,
    tekananDarahSistolik: input.tekananDarahSistolik,
    tekananDarahDiastolik: input.tekananDarahDiastolik,
    usiaKehamilanWeeks: input.usiaKehamilanWeeks,
    kunjunganKe: input.kunjunganKe,
    vitamin: input.vitamin,
  };
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
  await dbQuery(
    `UPDATE master_pemeriksaan SET tanggal_pemeriksaan = ?, kunjungan_ke = ? WHERE id = ?`,
    [input.tanggalPemeriksaan, input.kunjunganKe, input.id]
  );

  await dbQuery(
    `UPDATE pemeriksaan_ibu_hamil SET berat_badan = ?, tinggi_badan = ?, tekanan_sistolik = ?, tekanan_diastolik = ?, usia_kehamilan_minggu = ?, vitamin = ?
     WHERE pemeriksaan_id = ?`,
    [input.beratBadan, input.tinggiBadan, input.tekananDarahSistolik, input.tekananDarahDiastolik, input.usiaKehamilanWeeks, input.vitamin, input.id]
  );

  return {
    id: input.id,
    ibuHamilId: input.id,
    tanggalPemeriksaan: input.tanggalPemeriksaan,
    beratBadan: input.beratBadan,
    tinggiBadan: input.tinggiBadan,
    tekananDarahSistolik: input.tekananDarahSistolik,
    tekananDarahDiastolik: input.tekananDarahDiastolik,
    usiaKehamilanWeeks: input.usiaKehamilanWeeks,
    kunjunganKe: input.kunjunganKe,
    vitamin: input.vitamin,
  };
}

// ---------------------------------------------------------------------------
// HAPUS SATU DATA PEMERIKSAAN
// ---------------------------------------------------------------------------
export async function deleteIbuHamilRecord(recordId: string): Promise<void> {
  await dbQuery(`DELETE FROM master_pemeriksaan WHERE id = ?`, [recordId]);
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
  const bumil = await getIbuHamilById(ibuHamilId);
  if (!bumil) throw new Error("Data ibu hamil tidak ditemukan");

  const motherInd = await dbQuery(
    `SELECT keluarga_id FROM individu WHERE nik = ? LIMIT 1`,
    [bumil.nik]
  );

  const keluargaId = motherInd[0]?.keluarga_id;
  if (!keluargaId) throw new Error("Keluarga ID ibu tidak ditemukan");

  const babyNik = generateTempNik();
  const babyId = crypto.randomUUID();

  // 1. Daftarkan bayi
  await dbQuery(
    `INSERT INTO individu (id, keluarga_id, nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, status_keluarga, golongan_darah)
     VALUES (?, ?, ?, ?, ?, ?, ?, 'Anak', ?)`,
    [babyId, keluargaId, babyNik, input.nama, input.tempat, input.tanggalLahir, input.jenisKelamin, input.golonganDarah ?? null]
  );

  // 2. Tandai status_kelahiran di pemeriksaan_ibu_hamil
  await dbQuery(
    `UPDATE pemeriksaan_ibu_hamil SET status_kelahiran = 'Melahirkan' WHERE pemeriksaan_id = ?`,
    [ibuHamilId]
  );

  // 3. Catat di kelahiran
  const birthId = crypto.randomUUID();
  try {
    await dbQuery(
      `INSERT INTO kelahiran (id, pemeriksaan_ibu_hamil_id, individu_anak_id, cara_kelahiran, tanggal_kelahiran, tempat_kelahiran, usia_kehamilan_minggu, berat_badan, tinggi_badan)
       VALUES (?, ?, ?, ?, ?, ?, ?, NULL, NULL)`,
      [birthId, ibuHamilId, babyId, input.caraLahir, input.tanggalLahir, input.tempat, input.usiaKehamilanSaatLahirWeeks]
    );
  } catch (err: any) {
    // rollback baby
    await dbQuery("DELETE FROM individu WHERE id = ?", [babyId]);
    await dbQuery("UPDATE pemeriksaan_ibu_hamil SET status_kelahiran = NULL WHERE pemeriksaan_id = ?", [ibuHamilId]);
    throw err;
  }

  const updated = await getIbuHamilById(ibuHamilId);
  if (!updated) throw new Error("Gagal memuat ulang data setelah kelahiran dicatat");
  return updated;
}
