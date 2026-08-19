import { dbQuery } from "@/lib/db/db-client";

export interface Individu {
  id: string; // UUID
  nik: string | null;
  noKk: string | null;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  statusHidup: "Hidup" | "Meninggal";
  tanggalMeninggal?: string | null;
  keteranganMeninggal?: string | null;
  noTelp?: string | null;
}

export interface UpdateIndividuInput {
  id?: string; // UUID
  nik?: string; // NIK or UUID (fallback)
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  statusHidup: "Hidup" | "Meninggal";
  tanggalMeninggal?: string | null;
  keteranganMeninggal?: string | null;
  noTelp?: string | null;
}

function mapRowToIndividu(row: any): Individu {
  return {
    id: row.id,
    nik: row.nik,
    noKk: row.no_kk || null,
    nama: row.nama,
    tempatLahir: row.tempat_lahir,
    tanggalLahir: row.tanggal_lahir,
    jenisKelamin: row.jenis_kelamin,
    statusHidup: row.status_hidup,
    tanggalMeninggal: row.tanggal_meninggal,
    keteranganMeninggal: row.keterangan_meninggal,
    noTelp: row.no_telp,
  };
}

export async function getIndividuByNik(nik: string): Promise<Individu | null> {
  const rows = await dbQuery(
    `SELECT i.*, k.no_kk 
     FROM individu i 
     LEFT JOIN keluarga k ON i.keluarga_id = k.id 
     WHERE i.nik = ? OR i.id = ? 
     LIMIT 1`,
    [nik, nik]
  );
  if (rows.length === 0) return null;
  return mapRowToIndividu(rows[0]);
}

export async function updateIndividu(
  input: UpdateIndividuInput,
): Promise<Individu> {
  const identifier = input.id || input.nik;
  if (!identifier) throw new Error("Identifier (id or NIK) is required for update");

  const isUuid = identifier.length === 36;
  const updateQuery = isUuid
    ? `UPDATE individu SET 
         nik = ?, 
         nama = ?, 
         tempat_lahir = ?, 
         tanggal_lahir = ?, 
         jenis_kelamin = ?, 
         status_hidup = ?, 
         tanggal_meninggal = ?, 
         keterangan_meninggal = ?, 
         no_telp = ? 
       WHERE id = ?`
    : `UPDATE individu SET 
         nik = ?, 
         nama = ?, 
         tempat_lahir = ?, 
         tanggal_lahir = ?, 
         jenis_kelamin = ?, 
         status_hidup = ?, 
         tanggal_meninggal = ?, 
         keterangan_meninggal = ?, 
         no_telp = ? 
       WHERE nik = ?`;

  const tanggalMeninggal = input.statusHidup === "Meninggal" ? input.tanggalMeninggal : null;
  const keteranganMeninggal = input.statusHidup === "Meninggal" ? input.keteranganMeninggal : null;

  await dbQuery(updateQuery, [
    input.nik || null,
    input.nama,
    input.tempatLahir,
    input.tanggalLahir,
    input.jenisKelamin,
    input.statusHidup,
    tanggalMeninggal,
    keteranganMeninggal,
    input.noTelp || null,
    identifier
  ]);

  const updated = await getIndividuByNik(identifier);
  if (!updated) throw new Error("Gagal memuat ulang data individu setelah update");
  return updated;
}

export async function deleteIndividu(nik: string): Promise<void> {
  const isUuid = nik.length === 36;
  if (isUuid) {
    await dbQuery("DELETE FROM individu WHERE id = ?", [nik]);
  } else {
    await dbQuery("DELETE FROM individu WHERE nik = ?", [nik]);
  }
}
