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
 * digabung dari 3 program: Balita, Ibu Hamil, Lansia.
 */
export async function getAttendanceStats(
  year: string,
): Promise<AttendanceDataPoint[]> {
  const supabase = createClient();
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const [balitaRes, lansiaRes, ibuHamilRes] = await Promise.all([
    supabase
      .from("balita_pemeriksaan")
      .select("tanggal_pemeriksaan")
      .gte("tanggal_pemeriksaan", startDate)
      .lte("tanggal_pemeriksaan", endDate),
    supabase
      .from("lansia_pemeriksaan")
      .select("tanggal_pemeriksaan")
      .gte("tanggal_pemeriksaan", startDate)
      .lte("tanggal_pemeriksaan", endDate),
    supabase
      .from("ibu_hamil_pemeriksaan")
      .select("tanggal_pemeriksaan")
      .gte("tanggal_pemeriksaan", startDate)
      .lte("tanggal_pemeriksaan", endDate),
  ]);

  if (balitaRes.error) throw new Error(balitaRes.error.message);
  if (lansiaRes.error) throw new Error(lansiaRes.error.message);
  if (ibuHamilRes.error) throw new Error(ibuHamilRes.error.message);

  const counts = new Array(12).fill(0);

  const tally = (rows: { tanggal_pemeriksaan: string }[] | null) => {
    (rows ?? []).forEach((r) => {
      const month = new Date(r.tanggal_pemeriksaan).getMonth(); // 0 = Januari
      counts[month]++;
    });
  };

  tally(balitaRes.data);
  tally(lansiaRes.data);
  tally(ibuHamilRes.data);

  return BULAN_LABELS.map((label, i) => ({
    name: label,
    kehadiran: counts[i],
  }));
}
