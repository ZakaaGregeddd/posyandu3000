import { createClient } from "@/lib/supabase/client";

export interface AttendanceDataPoint {
  name: string; // label bulan singkat, mis. 'Jan', 'Feb'
  kehadiran: number;
}

const BULAN_LABELS = [
  "Jan",
  "Feb",
  "Mar",
  "Apr",
  "Mei",
  "Jun",
  "Jul",
  "Agu",
  "Sep",
  "Okt",
  "Nov",
  "Des",
];

/**
 * Menghitung jumlah pemeriksaan (kehadiran) per bulan untuk tahun tertentu,
 * digabung dari semua program kunjungan menggunakan master_pemeriksaan.
 */
export async function getAttendanceStats(
  year: string,
): Promise<AttendanceDataPoint[]> {
  const supabase = createClient();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const { data, error } = await supabase
    .from("master_pemeriksaan")
    .select("tanggal_pemeriksaan")
    .gte("tanggal_pemeriksaan", startDate)
    .lte("tanggal_pemeriksaan", endDate);

  if (error) throw new Error(error.message);

  const counts = new Array(12).fill(0);

  (data ?? []).forEach((r) => {
    const month = new Date(r.tanggal_pemeriksaan).getMonth(); // 0 = Januari
    counts[month]++;
  });

  return BULAN_LABELS.map((label, i) => ({
    name: label,
    kehadiran: counts[i],
  }));
}

