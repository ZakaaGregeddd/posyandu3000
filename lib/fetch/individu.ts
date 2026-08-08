import { createClient } from "@/lib/supabase/client";

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
    noKk: row.no_kk,
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
  const supabase = createClient();
  const { data, error } = await supabase
    .from("individu")
    .select("*")
    .eq("nik", nik)
    .maybeSingle();

  if (error) throw new Error(error.message);
  return data ? mapRowToIndividu(data) : null;
}

export async function updateIndividu(
  input: UpdateIndividuInput,
): Promise<Individu> {
  const supabase = createClient();
  const identifier = input.id || input.nik;
  if (!identifier) throw new Error("Identifier (id or NIK) is required for update");

  let query = supabase
    .from("individu")
    .update({
      nama: input.nama,
      tempat_lahir: input.tempatLahir,
      tanggal_lahir: input.tanggalLahir,
      jenis_kelamin: input.jenisKelamin,
      status_hidup: input.statusHidup,
      tanggal_meninggal:
        input.statusHidup === "Meninggal" ? input.tanggalMeninggal : null,
      keterangan_meninggal:
        input.statusHidup === "Meninggal" ? input.keteranganMeninggal : null,
      no_telp: input.noTelp,
    });

  if (identifier.length === 36) {
    query = query.eq("id", identifier);
  } else {
    query = query.eq("nik", identifier);
  }

  const { data, error } = await query.select("*").single();

  if (error) throw new Error(error.message);
  return mapRowToIndividu(data);
}

export async function deleteIndividu(nik: string): Promise<void> {
  const supabase = createClient();
  let query = supabase.from("individu").delete();
  if (nik.length === 36) {
    query = query.eq("id", nik);
  } else {
    query = query.eq("nik", nik);
  }
  const { error } = await query;
  if (error) throw new Error(error.message);
}

