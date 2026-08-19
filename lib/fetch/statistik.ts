import { dbQuery } from "@/lib/db/db-client";

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
  const startDate = `${year}-01-01`;
  const endDate = `${year}-12-31`;

  const data = await dbQuery(
    "SELECT tanggal_pemeriksaan FROM master_pemeriksaan WHERE tanggal_pemeriksaan >= ? AND tanggal_pemeriksaan <= ?",
    [startDate, endDate]
  );

  const counts = new Array(12).fill(0);

  (data ?? []).forEach((r: any) => {
    const month = new Date(r.tanggal_pemeriksaan).getMonth(); // 0 = Januari
    if (month >= 0 && month < 12) {
      counts[month]++;
    }
  });

  return BULAN_LABELS.map((label, i) => ({
    name: label,
    kehadiran: counts[i],
  }));
}
