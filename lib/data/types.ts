export interface KK {
  noKk: string;
  namaKepalaKeluarga: string;
  alamat: string;
  rt: string;
  rw: string;
}

export type StatusHidup = 'Hidup' | 'Meninggal';

export interface BaseMember {
  id: string;
  nama: string;
  tempatLahir: string;
  tanggalLahir: string;
  noKk: string;
  statusHidup: StatusHidup;
  tanggalMeninggal?: string;
  penyebabMeninggal?: string;
  nik?: string;
}

export interface PostBirthRecord {
  nama: string;
  tempat: string;
  tanggalLahir: string;
  jenisKelamin: 'L' | 'P';
  caraLahir: 'SC' | 'Normal';
  usiaKehamilanSaatLahirWeeks: number;
}

export interface IbuHamil extends BaseMember {
  nik: string;
  hpht: string;
  postBirthRecord?: PostBirthRecord;
}

export interface IbuHamilRecord {
  id: string;
  ibuHamilId: string;
  tanggalPemeriksaan: string;
  beratBadan: number;
  tekananDarahSistolik: number;
  tekananDarahDiastolik: number;
  usiaKehamilanWeeks: number;
  kunjunganKe: number; // 1 to 8
  vitamin: string;
}

export interface Balita extends BaseMember {
  jenisKelamin: 'L' | 'P';
  namaIbu: string;
  namaAyah: string;
  caraLahir?: 'SC' | 'Normal';
  usiaKehamilanSaatLahirWeeks?: number;
}

export interface BalitaRecord {
  id: string;
  balitaId: string;
  tanggalPemeriksaan: string;
  tinggiBadan: number; // in cm
  beratBadan: number; // in kg
  lingkarKepala: number; // in cm
  lingkarLengan: number; // in cm
  imunisasi: string;
  obatVitamin: string;
  imt: number; // BB / (TB/100)^2
}

export interface Lansia extends BaseMember {
  jenisKelamin: 'L' | 'P';
  namaIbu: string;
  namaAyah: string;
}

export interface LansiaRecord {
  id: string;
  lansiaId: string;
  tanggalPemeriksaan: string;
  tinggiBadan: number;
  beratBadan: number;
  tekananDarahSistolik: number;
  tekananDarahDiastolik: number;
  riwayatPenyakit: string;
  obat: string;
  penyakitBaru: string;
  imt: number;
}

// User credentials (mock UI only)
export interface UserSession {
  username: string;
  role: 'kader';
}
