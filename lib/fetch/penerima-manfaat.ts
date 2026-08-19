import { dbQuery } from "@/lib/db/db-client";

export interface PenerimaManfaatRecord {
  id: string;
  individuId: string;
  nik: string;
  nama: string;
  noKk: string;
  alamat: string;
  tanggalDiterima: string;
  keterangan: string;
  fotoBukti: string;
}

export interface ActiveMemberOption {
  id: string;
  nik: string;
  nama: string;
  noKk: string;
}

export async function getPenerimaManfaatList(): Promise<PenerimaManfaatRecord[]> {
  const rows = await dbQuery(`
    SELECT pm.id, pm.tanggal_diterima as tanggalDiterima, pm.keterangan, pm.foto_bukti as fotoBukti,
           i.id as individuId, i.nik, i.nama,
           k.no_kk as noKk, k.alamat
    FROM penerima_manfaat pm
    JOIN individu i ON pm.individu_id = i.id
    JOIN keluarga k ON i.keluarga_id = k.id
    ORDER BY pm.tanggal_diterima DESC
  `);
  
  return rows || [];
}

export async function getActiveMembers(): Promise<ActiveMemberOption[]> {
  const rows = await dbQuery(`
    SELECT i.id, i.nik, i.nama, k.no_kk as noKk
    FROM individu i
    JOIN keluarga k ON i.keluarga_id = k.id
    WHERE i.status_hidup = 'Hidup'
    ORDER BY k.no_kk, i.nama
  `);
  return rows || [];
}

export async function addPenerimaManfaat(input: {
  individuId: string;
  tanggalDiterima: string;
  keterangan: string;
  fotoBukti: string;
}): Promise<void> {
  const id = crypto.randomUUID();
  await dbQuery(
    "INSERT INTO penerima_manfaat (id, individu_id, tanggal_diterima, keterangan, foto_bukti) VALUES (?, ?, ?, ?, ?)",
    [id, input.individuId, input.tanggalDiterima, input.keterangan, input.fotoBukti]
  );
}

export async function deletePenerimaManfaat(id: string): Promise<void> {
  await dbQuery("DELETE FROM penerima_manfaat WHERE id = ?", [id]);
}

export async function getPenerimaManfaatById(id: string): Promise<PenerimaManfaatRecord | null> {
  const rows = await dbQuery(`
    SELECT pm.id, pm.tanggal_diterima as tanggalDiterima, pm.keterangan, pm.foto_bukti as fotoBukti,
           i.id as individuId, i.nik, i.nama,
           k.no_kk as noKk, k.alamat
    FROM penerima_manfaat pm
    JOIN individu i ON pm.individu_id = i.id
    JOIN keluarga k ON i.keluarga_id = k.id
    WHERE pm.id = ?
    LIMIT 1
  `, [id]);
  return rows.length > 0 ? rows[0] : null;
}

export async function updatePenerimaManfaat(input: {
  id: string;
  individuId: string;
  tanggalDiterima: string;
  keterangan: string;
  fotoBukti: string;
}): Promise<void> {
  await dbQuery(
    "UPDATE penerima_manfaat SET individu_id = ?, tanggal_diterima = ?, keterangan = ?, foto_bukti = ? WHERE id = ?",
    [input.individuId, input.tanggalDiterima, input.keterangan, input.fotoBukti, input.id]
  );
}
