import { createClient } from "@/lib/supabase/client"; // ASUMSI: sesuaikan path client Supabase kamu

export interface Individu {
  nik: string;
  noKk: string | null;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  statusHidup: "Hidup" | "Meninggal";
  tanggalMeninggal?: string | null;
  keteranganMeninggal?: string | null;
}

export interface UpdateIndividuInput {
  nik: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  jenisKelamin: "L" | "P";
  statusHidup: "Hidup" | "Meninggal";
  tanggalMeninggal?: string | null;
  keteranganMeninggal?: string | null;
}

function mapRowToIndividu(row: any): Individu {
  return {
    nik: row.nik,
    noKk: row.no_kk,
    nama: row.nama,
    tempatLahir: row.tempat_lahir,
    tanggalLahir: row.tanggal_lahir,
    jenisKelamin: row.jenis_kelamin,
    statusHidup: row.status_hidup,
    tanggalMeninggal: row.tanggal_meninggal,
    keteranganMeninggal: row.keterangan_meninggal,
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
  const { data, error } = await supabase
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
    })
    .eq("nik", input.nik)
    .select("*")
    .single();

  if (error) throw new Error(error.message);
  return mapRowToIndividu(data);
}

// PERHATIAN: pastikan foreign key ke tabel individu (mis. dari tabel bayi,
// balita, lansia, ibu_hamil, keluarga.nik_ayah/nik_ibu) sudah diset
// ON DELETE CASCADE atau ditangani manual, kalau tidak query ini akan
// gagal karena constraint.
export async function deleteIndividu(nik: string): Promise<void> {
  const supabase = createClient();
  const { error } = await supabase.from("individu").delete().eq("nik", nik);
  if (error) throw new Error(error.message);
}
