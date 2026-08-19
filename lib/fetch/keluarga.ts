import { dbQuery } from "@/lib/db/db-client";

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
  telpAyah?: string;
  golonganDarahAyah?: string;
  nikIbu?: string;
  namaIbu?: string;
  tanggalLahirIbu?: string;
  tempatLahirIbu?: string;
  telpIbu?: string;
  golonganDarahIbu?: string;
  anggotaKeluarga?: AnggotaKeluargaInput[];
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

  const otherMembers = members.filter((m: any) => 
    m.id !== ayah?.id && m.id !== ibu?.id
  );

  const anggotaKeluargaMapped: AnggotaKeluargaInput[] = otherMembers.map((m: any) => ({
    id: m.id,
    nik: m.nik || undefined,
    nama: m.nama,
    tempatLahir: m.tempat_lahir || undefined,
    tanggalLahir: m.tanggal_lahir,
    jenisKelamin: m.jenis_kelamin,
    statusKeluarga: m.status_keluarga || "Anak",
    noTelp: m.no_telp || undefined,
    golonganDarah: m.golongan_darah || undefined,
    isExisting: true,
  }));

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
    telpAyah: ayah?.no_telp ?? undefined,
    golonganDarahAyah: ayah?.golongan_darah ?? undefined,
    nikIbu: ibu?.nik || ibu?.id || undefined,
    namaIbu: ibu?.nama ?? undefined,
    tanggalLahirIbu: ibu?.tanggal_lahir ?? undefined,
    tempatLahirIbu: ibu?.tempat_lahir ?? undefined,
    telpIbu: ibu?.no_telp ?? undefined,
    golonganDarahIbu: ibu?.golongan_darah ?? undefined,
    anggotaKeluarga: anggotaKeluargaMapped,
  };
}

// ---------------------------------------------------------------------------
// DAFTAR KK
// ---------------------------------------------------------------------------
export async function getKKs(): Promise<KK[]> {
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

  return keluargaList.map((row: any) => {
    const members = membersByKeluarga.get(row.id) || [];
    return mapRowToKK({ ...row, members });
  });
}

export async function getKKByNoKk(noKkOrId: string): Promise<KK | null> {
  let keluargaRows: any[] = [];
  if (noKkOrId.length === 36) {
    keluargaRows = await dbQuery("SELECT * FROM keluarga WHERE id = ? LIMIT 1", [noKkOrId]);
  } else {
    keluargaRows = await dbQuery("SELECT * FROM keluarga WHERE no_kk = ? LIMIT 1", [noKkOrId]);
  }
  if (keluargaRows.length === 0) return null;
  const row = keluargaRows[0];
  const members = await dbQuery("SELECT * FROM individu WHERE keluarga_id = ?", [row.id]);
  return mapRowToKK({ ...row, members });
}

// ---------------------------------------------------------------------------
// JUMLAH ANGGOTA per KK
// ---------------------------------------------------------------------------
export async function getAnggotaCountMap(): Promise<Map<string, number>> {
  const data = await dbQuery(`
    SELECT i.id, k.no_kk
    FROM individu i
    JOIN keluarga k ON i.keluarga_id = k.id
  `);
  const map = new Map<string, number>();
  data.forEach((row: any) => {
    const noKk = row.no_kk;
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
  let keluargaRows: any[] = [];
  if (noKkOrId.length === 36) {
    keluargaRows = await dbQuery("SELECT id FROM keluarga WHERE id = ? LIMIT 1", [noKkOrId]);
  } else {
    keluargaRows = await dbQuery("SELECT id FROM keluarga WHERE no_kk = ? LIMIT 1", [noKkOrId]);
  }
  if (keluargaRows.length === 0) return [];
  const keluargaId = keluargaRows[0].id;

  const rows = await dbQuery("SELECT * FROM individu WHERE keluarga_id = ? ORDER BY tanggal_lahir", [keluargaId]);
  
  const masterExams = await dbQuery(`
    SELECT m.id, m.individu_id, m.jenis_pemeriksaan, p.status_kelahiran
    FROM master_pemeriksaan m
    LEFT JOIN pemeriksaan_ibu_hamil p ON m.id = p.pemeriksaan_id
    WHERE m.individu_id IN (SELECT id FROM individu WHERE keluarga_id = ?)
  `, [keluargaId]);

  const examsByIndividu = new Map<string, any[]>();
  masterExams.forEach((me: any) => {
    if (!examsByIndividu.has(me.individu_id)) {
      examsByIndividu.set(me.individu_id, []);
    }
    examsByIndividu.get(me.individu_id)!.push({
      id: me.id,
      jenis_pemeriksaan: me.jenis_pemeriksaan,
      pemeriksaan_ibu_hamil: { status_kelahiran: me.status_kelahiran }
    });
  });

  return rows.map((r: any) => {
    const rExams = examsByIndividu.get(r.id) || [];
    const pregExams = rExams.filter((mp: any) => mp.jenis_pemeriksaan === "Ibu Hamil");
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
      const latestPregExam = pregExams[pregExams.length - 1];
      routePath = `/dashboard/ibu-hamil/${latestPregExam?.id || r.id}`;
    }

    return {
      id: r.id,
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
  id?: string;
  nik?: string;
  nama: string;
  tempatLahir?: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  statusKeluarga: string;
  noTelp?: string;
  golonganDarah?: string;
  isExisting?: boolean;
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
  golonganDarahAyah?: string;
  nikIbu?: string;
  namaIbu?: string;
  tanggalLahirIbu?: string;
  tempatLahirIbu?: string;
  telpIbu?: string;
  golonganDarahIbu?: string;
  anggotaKeluarga?: AnggotaKeluargaInput[];
}

function generateTempNik(): string {
  return `TMP${Date.now()}`.padEnd(16, "0").slice(0, 16);
}

export async function addKK(input: AddKKInput): Promise<KK> {
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

  let keluargaId = null;
  let isExisting = false;

  if (input.noKk) {
    const existingKK = await dbQuery("SELECT id FROM keluarga WHERE no_kk = ? LIMIT 1", [input.noKk]);
    if (existingKK.length > 0) {
      keluargaId = existingKK[0].id;
      isExisting = true;
    }
  }

  if (isExisting && keluargaId) {
    await dbQuery(
      "UPDATE keluarga SET alamat = ?, no_telp = ? WHERE id = ?",
      [combinedAlamat, noTelp, keluargaId]
    );
  } else {
    keluargaId = crypto.randomUUID();
    await dbQuery(
      "INSERT INTO keluarga (id, no_kk, alamat, no_telp) VALUES (?, ?, ?, ?)",
      [keluargaId, input.noKk || null, combinedAlamat, noTelp]
    );
  }

  try {
    if (input.namaAyah) {
      const existingAyah = await dbQuery(
        "SELECT id FROM individu WHERE keluarga_id = ? AND (status_keluarga = 'Kepala Keluarga' OR status_keluarga = 'Ayah') LIMIT 1",
        [keluargaId]
      );

      const nikAyah = input.nikAyah && input.nikAyah.length === 16 ? input.nikAyah : generateTempNik();
      if (existingAyah.length > 0) {
        await dbQuery(
          `UPDATE individu SET nik = ?, nama = ?, tempat_lahir = ?, tanggal_lahir = ?, no_telp = ?, golongan_darah = ? WHERE id = ?`,
          [
            input.nikAyah || null,
            input.namaAyah,
            input.tempatLahirAyah || null,
            input.tanggalLahirAyah,
            input.telpAyah || null,
            input.golonganDarahAyah || null,
            existingAyah[0].id
          ]
        );
      } else {
        const idAyah = crypto.randomUUID();
        await dbQuery(
          `INSERT INTO individu (id, keluarga_id, nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, status_keluarga, no_telp, golongan_darah)
           VALUES (?, ?, ?, ?, ?, ?, 'L', 'Kepala Keluarga', ?, ?)`,
          [
            idAyah,
            keluargaId,
            nikAyah,
            input.namaAyah,
            input.tempatLahirAyah || null,
            input.tanggalLahirAyah,
            input.telpAyah || null,
            input.golonganDarahAyah || null
          ]
        );
      }
    }

    if (input.namaIbu) {
      const existingIbu = await dbQuery(
        "SELECT id FROM individu WHERE keluarga_id = ? AND (status_keluarga = 'Istri' OR status_keluarga = 'Ibu') LIMIT 1",
        [keluargaId]
      );

      const nikIbu = input.nikIbu && input.nikIbu.length === 16 ? input.nikIbu : generateTempNik();
      if (existingIbu.length > 0) {
        await dbQuery(
          `UPDATE individu SET nik = ?, nama = ?, tempat_lahir = ?, tanggal_lahir = ?, no_telp = ?, golongan_darah = ? WHERE id = ?`,
          [
            input.nikIbu || null,
            input.namaIbu,
            input.tempatLahirIbu || null,
            input.tanggalLahirIbu,
            input.telpIbu || null,
            input.golonganDarahIbu || null,
            existingIbu[0].id
          ]
        );
      } else {
        const idIbu = crypto.randomUUID();
        await dbQuery(
          `INSERT INTO individu (id, keluarga_id, nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, status_keluarga, no_telp, golongan_darah)
           VALUES (?, ?, ?, ?, ?, ?, 'P', 'Istri', ?, ?)`,
          [
            idIbu,
            keluargaId,
            nikIbu,
            input.namaIbu,
            input.tempatLahirIbu || null,
            input.tanggalLahirIbu,
            input.telpIbu || null,
            input.golonganDarahIbu || null
          ]
        );
      }
    }

    if (input.anggotaKeluarga && input.anggotaKeluarga.length > 0) {
      for (const member of input.anggotaKeluarga) {
        if (member.id || member.isExisting) {
          await dbQuery(
            `UPDATE individu SET nik = ?, nama = ?, tempat_lahir = ?, tanggal_lahir = ?, jenis_kelamin = ?, status_keluarga = ?, no_telp = ?, golongan_darah = ? WHERE id = ?`,
            [
              member.nik || null,
              member.nama,
              member.tempatLahir || null,
              member.tanggalLahir,
              member.jenisKelamin,
              member.statusKeluarga,
              member.noTelp || null,
              member.golonganDarah || null,
              member.id
            ]
          );
          continue;
        }
        const memberNik = member.nik && member.nik.length === 16 ? member.nik : generateTempNik();
        const memberId = crypto.randomUUID();
        await dbQuery(
          `INSERT INTO individu (id, keluarga_id, nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, status_keluarga, no_telp, golongan_darah)
           VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
          [
            memberId,
            keluargaId,
            memberNik,
            member.nama,
            member.tempatLahir || null,
            member.tanggalLahir,
            member.jenisKelamin,
            member.statusKeluarga,
            member.noTelp || null,
            member.golonganDarah || null
          ]
        );
      }
    }
  } catch (err) {
    if (!isExisting) {
      await dbQuery("DELETE FROM keluarga WHERE id = ?", [keluargaId]);
    }
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
  telpAyah?: string;
  golonganDarahAyah?: string;
  nikIbu?: string;
  namaIbu?: string;
  tanggalLahirIbu?: string;
  tempatLahirIbu?: string;
  telpIbu?: string;
  golonganDarahIbu?: string;
}

export async function updateKK(input: UpdateKKInput): Promise<KK> {
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
  const keluargaId = existingKK.id;
  if (!keluargaId) throw new Error("ID Keluarga tidak valid");

  await dbQuery(
    "UPDATE keluarga SET no_kk = ?, alamat = ?, no_telp = ? WHERE id = ?",
    [input.noKk || null, combinedAlamat, input.noTelp || null, keluargaId]
  );

  const members = await dbQuery("SELECT id, status_keluarga FROM individu WHERE keluarga_id = ?", [keluargaId]);
  const existingAyah = members?.find((m: any) => m.status_keluarga === "Kepala Keluarga" || m.status_keluarga === "Ayah");
  const existingIbu = members?.find((m: any) => m.status_keluarga === "Istri" || m.status_keluarga === "Ibu");

  if (input.namaAyah) {
    if (existingAyah) {
      await dbQuery(
        `UPDATE individu SET nama = ?, tanggal_lahir = ?, tempat_lahir = ?, no_telp = ?, golongan_darah = ? WHERE id = ?`,
        [
          input.namaAyah,
          input.tanggalLahirAyah,
          input.tempatLahirAyah || null,
          input.telpAyah || null,
          input.golonganDarahAyah || null,
          existingAyah.id
        ]
      );
    } else {
      const nikAyah = input.nikAyah && input.nikAyah.length === 16 ? input.nikAyah : generateTempNik();
      const idAyah = crypto.randomUUID();
      await dbQuery(
        `INSERT INTO individu (id, keluarga_id, nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, status_keluarga, no_telp, golongan_darah)
         VALUES (?, ?, ?, ?, ?, ?, 'L', 'Kepala Keluarga', ?, ?)`,
        [
          idAyah,
          keluargaId,
          nikAyah,
          input.namaAyah,
          input.tempatLahirAyah || null,
          input.tanggalLahirAyah,
          input.telpAyah || null,
          input.golonganDarahAyah || null
        ]
      );
    }
  }

  if (input.namaIbu) {
    if (existingIbu) {
      await dbQuery(
        `UPDATE individu SET nama = ?, tanggal_lahir = ?, tempat_lahir = ?, no_telp = ?, golongan_darah = ? WHERE id = ?`,
        [
          input.namaIbu,
          input.tanggalLahirIbu,
          input.tempatLahirIbu || null,
          input.telpIbu || null,
          input.golonganDarahIbu || null,
          existingIbu.id
        ]
      );
    } else {
      const nikIbu = input.nikIbu && input.nikIbu.length === 16 ? input.nikIbu : generateTempNik();
      const idIbu = crypto.randomUUID();
      await dbQuery(
        `INSERT INTO individu (id, keluarga_id, nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, status_keluarga, no_telp, golongan_darah)
         VALUES (?, ?, ?, ?, ?, ?, 'P', 'Istri', ?, ?)`,
        [
          idIbu,
          keluargaId,
          nikIbu,
          input.namaIbu,
          input.tempatLahirIbu || null,
          input.tanggalLahirIbu,
          input.telpIbu || null,
          input.golonganDarahIbu || null
        ]
      );
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
  if (noKkOrId.length === 36) {
    await dbQuery("DELETE FROM keluarga WHERE id = ?", [noKkOrId]);
  } else {
    await dbQuery("DELETE FROM keluarga WHERE no_kk = ?", [noKkOrId]);
  }
}
