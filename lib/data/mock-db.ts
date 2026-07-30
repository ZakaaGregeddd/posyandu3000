import { KK, Balita, BalitaRecord, IbuHamil, IbuHamilRecord, Lansia, LansiaRecord } from './types';

// Seed KK
export const initialKKs: KK[] = [
  { 
    noKk: '3201010101010001', 
    namaKepalaKeluarga: 'Budi Santoso', 
    alamat: 'Jl. Merdeka No. 10', 
    rt: '01', 
    rw: '05',
    nikAyah: '3201010101010001_A',
    namaAyah: 'Budi Santoso',
    tanggalLahirAyah: '1985-05-12',
    tempatLahirAyah: 'Bogor',
    telpAyah: '081234567891',
    nikIbu: '3201011205980002',
    namaIbu: 'Siti Rahma',
    tanggalLahirIbu: '1998-05-12',
    tempatLahirIbu: 'Bandung',
    telpIbu: '081234567892',
    noTelp: '081234567891'
  },
  { 
    noKk: '3201010101010002', 
    namaKepalaKeluarga: 'Heri Wijaya', 
    alamat: 'Jl. Melati No. 5', 
    rt: '02', 
    rw: '05',
    nikAyah: '3201010101010002_A',
    namaAyah: 'Heri Wijaya',
    tanggalLahirAyah: '1980-04-10',
    tempatLahirAyah: 'Jakarta',
    telpAyah: '081234567893',
    nikIbu: '3201012208950005',
    namaIbu: 'Dewi Lestari',
    tanggalLahirIbu: '1995-08-22',
    tempatLahirIbu: 'Bogor',
    telpIbu: '081234567894',
    noTelp: '081234567893'
  },
  { 
    noKk: '3201010101010003', 
    namaKepalaKeluarga: 'Suryo Kuncoro', 
    alamat: 'Jl. Mawar No. 15', 
    rt: '03', 
    rw: '05',
    nikAyah: '3201010101010003_A',
    namaAyah: 'Suryo Kuncoro',
    tanggalLahirAyah: '1982-12-04',
    tempatLahirAyah: 'Sukabumi',
    telpAyah: '081234567895',
    nikIbu: '3201010412920003',
    namaIbu: 'Rina Astuti',
    tanggalLahirIbu: '1992-12-04',
    tempatLahirIbu: 'Sukabumi',
    telpIbu: '081234567896',
    noTelp: '081234567895'
  },
  { 
    noKk: '3201010101010004', 
    namaKepalaKeluarga: 'Joko Widodo', 
    alamat: 'Jl. Anggrek No. 1', 
    rt: '04', 
    rw: '05',
    nikAyah: '3201010101010004_A',
    namaAyah: 'Joko Widodo',
    tanggalLahirAyah: '1961-06-21',
    tempatLahirAyah: 'Surakarta',
    telpAyah: '081234567897',
    nikIbu: '3201010101010004_I',
    namaIbu: 'Anisa Fitri',
    tanggalLahirIbu: '1963-10-12',
    tempatLahirIbu: 'Solo',
    telpIbu: '081234567898',
    noTelp: '081234567897'
  },
  {
    noKk: '3201010101010005',
    namaKepalaKeluarga: 'Hartono',
    alamat: 'Jl. Merdeka No. 12',
    rt: '01',
    rw: '05',
    nikAyah: '3201010101010005_A',
    namaAyah: 'Hartono',
    tanggalLahirAyah: '1979-04-12',
    tempatLahirAyah: 'Solo',
    telpAyah: '081234567801',
    noTelp: '081234567801'
  },
  {
    noKk: '3201010101010006',
    namaKepalaKeluarga: 'Siti Aminah',
    alamat: 'Jl. Melati No. 8',
    rt: '02',
    rw: '05',
    nikIbu: '3201010101010006_I',
    namaIbu: 'Siti Aminah',
    tanggalLahirIbu: '1970-09-18',
    tempatLahirIbu: 'Yogyakarta',
    telpIbu: '081234567802',
    noTelp: '081234567802'
  },
  {
    noKk: '3201010101010007',
    namaKepalaKeluarga: 'Kusnan',
    alamat: 'Jl. Mawar No. 18',
    rt: '03',
    rw: '05',
    nikAyah: '3201010101010007_A',
    namaAyah: 'Kusnan',
    tanggalLahirAyah: '1961-01-05',
    tempatLahirAyah: 'Surabaya',
    telpAyah: '081234567803',
    noTelp: '081234567803'
  },
  {
    noKk: '3201010101010008',
    namaKepalaKeluarga: 'Siti Khotimah',
    alamat: 'Jl. Anggrek No. 3',
    rt: '04',
    rw: '05',
    nikIbu: '3201010101010008_I',
    namaIbu: 'Siti Khotimah',
    tanggalLahirIbu: '1955-06-15',
    tempatLahirIbu: 'Semarang',
    telpIbu: '081234567804',
    noTelp: '081234567804'
  }
];

// Seed Balita
export const initialBalita: Balita[] = [
  {
    id: 'b1',
    nama: 'Aditya Pratama',
    tempatLahir: 'Bogor',
    tanggalLahir: '2026-02-15', // ~5 months old (Infant)
    jenisKelamin: 'L',
    noKk: '3201010101010001',
    namaIbu: 'Siti Rahma',
    namaAyah: 'Budi Santoso',
    statusHidup: 'Hidup'
  },
  {
    id: 'b2',
    nama: 'Clara Salsabila',
    tempatLahir: 'Jakarta',
    tanggalLahir: '2025-08-20', // ~10 months old (Infant)
    jenisKelamin: 'P',
    noKk: '3201010101010002',
    namaIbu: 'Dewi Lestari',
    namaAyah: 'Heri Wijaya',
    statusHidup: 'Hidup'
  },
  {
    id: 'b3',
    nama: 'Dafa Alfarizqi',
    tempatLahir: 'Bogor',
    tanggalLahir: '2023-04-10', // ~3 years old (Toddler)
    jenisKelamin: 'L',
    noKk: '3201010101010003',
    namaIbu: 'Rina Astuti',
    namaAyah: 'Suryo Kuncoro',
    statusHidup: 'Hidup'
  },
  {
    id: 'b4',
    nama: 'Evelyn Wijaya',
    tempatLahir: 'Bogor',
    tanggalLahir: '2020-03-01', // ~6 years old (Toddler - Locked!)
    jenisKelamin: 'P',
    noKk: '3201010101010002',
    namaIbu: 'Dewi Lestari',
    namaAyah: 'Heri Wijaya',
    statusHidup: 'Hidup'
  },
  {
    id: 'b5',
    nama: 'Farhan Ramadhan',
    tempatLahir: 'Bogor',
    tanggalLahir: '2022-10-12', // ~3.5 years old (Toddler)
    jenisKelamin: 'L',
    noKk: '3201010101010004',
    namaIbu: 'Anisa Fitri',
    namaAyah: 'Joko Widodo',
    statusHidup: 'Meninggal',
    tanggalMeninggal: '2024-05-10',
    penyebabMeninggal: 'Demam Berdarah Dengue (DBD)'
  }
];

// Seed Balita Records
export const initialBalitaRecords: BalitaRecord[] = [
  // Aditya Pratama (b1) - Growth
  { id: 'br1', balitaId: 'b1', tanggalPemeriksaan: '2026-03-15', tinggiBadan: 58, beratBadan: 4.8, lingkarKepala: 39, lingkarLengan: 11, imunisasi: 'BCG, Polio 1', obatVitamin: 'Vitamin A Merah', imt: 14.27 },
  { id: 'br2', balitaId: 'b1', tanggalPemeriksaan: '2026-04-15', tinggiBadan: 60, beratBadan: 5.5, lingkarKepala: 41, lingkarLengan: 12, imunisasi: 'DPT-HB-Hib 1, Polio 2', obatVitamin: '-', imt: 15.28 },
  { id: 'br3', balitaId: 'b1', tanggalPemeriksaan: '2026-05-15', tinggiBadan: 62, beratBadan: 6.2, lingkarKepala: 42, lingkarLengan: 13, imunisasi: 'DPT-HB-Hib 2, Polio 3', obatVitamin: '-', imt: 16.13 },
  { id: 'br4', balitaId: 'b1', tanggalPemeriksaan: '2026-06-15', tinggiBadan: 64, beratBadan: 7.0, lingkarKepala: 43, lingkarLengan: 13.5, imunisasi: 'DPT-HB-Hib 3, Polio 4', obatVitamin: 'Vitamin A', imt: 17.09 },
  
  // Clara Salsabila (b2)
  { id: 'br5', balitaId: 'b2', tanggalPemeriksaan: '2026-04-20', tinggiBadan: 70, beratBadan: 7.5, lingkarKepala: 44, lingkarLengan: 14, imunisasi: 'Campak-Rubella', obatVitamin: 'Vitamin A', imt: 15.31 },
  { id: 'br6', balitaId: 'b2', tanggalPemeriksaan: '2026-05-20', tinggiBadan: 71, beratBadan: 8.0, lingkarKepala: 44.5, lingkarLengan: 14.2, imunisasi: '-', obatVitamin: '-', imt: 15.87 },

  // Dafa Alfarizqi (b3)
  { id: 'br7', balitaId: 'b3', tanggalPemeriksaan: '2026-05-10', tinggiBadan: 92, beratBadan: 13.5, lingkarKepala: 49, lingkarLengan: 16, imunisasi: 'DPT-HB-Hib Lanjutan', obatVitamin: 'Obat Cacing', imt: 15.95 },
];

// Seed Ibu Hamil
export const initialIbuHamil: IbuHamil[] = [
  {
    id: 'ih1',
    nama: 'Siti Rahma',
    tempatLahir: 'Bandung',
    tanggalLahir: '1998-05-12', // 28 years old
    nik: '3201011205980002',
    noKk: '3201010101010001',
    hpht: '2025-10-10',
    statusHidup: 'Hidup'
  },
  {
    id: 'ih2',
    nama: 'Dewi Lestari',
    tempatLahir: 'Bogor',
    tanggalLahir: '1995-08-22', // 30 years old
    nik: '3201012208950005',
    noKk: '3201010101010002',
    hpht: '2026-01-05',
    statusHidup: 'Hidup'
  },
  {
    id: 'ih3',
    nama: 'Rina Astuti',
    tempatLahir: 'Sukabumi',
    tanggalLahir: '1992-12-04', // 33 years old
    nik: '3201010412920003',
    noKk: '3201010101010003',
    hpht: '2025-07-15',
    statusHidup: 'Hidup',
    postBirthRecord: {
      nama: 'Bayi Rina Astuti',
      tempat: 'Bogor',
      tanggalLahir: '2026-04-20',
      jenisKelamin: 'L',
      caraLahir: 'Normal',
      usiaKehamilanSaatLahirWeeks: 39
    }
  }
];

// Seed Ibu Hamil Records
export const initialIbuHamilRecords: IbuHamilRecord[] = [
  { id: 'ihr1', ibuHamilId: 'ih1', tanggalPemeriksaan: '2025-11-12', beratBadan: 54, tekananDarahSistolik: 110, tekananDarahDiastolik: 70, usiaKehamilanWeeks: 5, kunjunganKe: 1, vitamin: 'Asam Folat' },
  { id: 'ihr2', ibuHamilId: 'ih1', tanggalPemeriksaan: '2026-01-12', beratBadan: 56, tekananDarahSistolik: 115, tekananDarahDiastolik: 75, usiaKehamilanWeeks: 13, kunjunganKe: 2, vitamin: 'Zat Besi (Fe)' },
  { id: 'ihr3', ibuHamilId: 'ih1', tanggalPemeriksaan: '2026-03-12', beratBadan: 58, tekananDarahSistolik: 120, tekananDarahDiastolik: 80, usiaKehamilanWeeks: 21, kunjunganKe: 3, vitamin: 'Kalsium' },
  
  // Dewi Lestari (ih2)
  { id: 'ihr4', ibuHamilId: 'ih2', tanggalPemeriksaan: '2026-02-10', beratBadan: 60, tekananDarahSistolik: 120, tekananDarahDiastolik: 80, usiaKehamilanWeeks: 5, kunjunganKe: 1, vitamin: 'Asam Folat' }
];

// Seed Lansia
export const initialLansia: Lansia[] = [
  {
    id: 'l1',
    nama: 'Hartono',
    tempatLahir: 'Solo',
    tanggalLahir: '1979-04-12', // 47 years old (Pralansia)
    jenisKelamin: 'L',
    noKk: '3201010101010005',
    namaIbu: 'Sumarni',
    namaAyah: 'Wahyudi',
    namaWali: 'Sumarni',
    noTelpWali: '081234567801',
    statusHidup: 'Hidup'
  },
  {
    id: 'l2',
    nama: 'Siti Aminah',
    tempatLahir: 'Yogyakarta',
    tanggalLahir: '1970-09-18', // 55 years old (Lansia)
    jenisKelamin: 'P',
    noKk: '3201010101010006',
    namaIbu: 'Kalsum',
    namaAyah: 'Achmad',
    namaWali: 'Kalsum',
    noTelpWali: '081234567802',
    statusHidup: 'Hidup'
  },
  {
    id: 'l3',
    nama: 'Kusnan',
    tempatLahir: 'Surabaya',
    tanggalLahir: '1961-01-05', // 65 years old (Lansia Resiko Tinggi)
    jenisKelamin: 'L',
    noKk: '3201010101010007',
    namaIbu: 'Aminah',
    namaAyah: 'Kartorejo',
    namaWali: 'Aminah',
    noTelpWali: '081234567803',
    statusHidup: 'Hidup'
  },
  {
    id: 'l4',
    nama: 'Siti Khotimah',
    tempatLahir: 'Semarang',
    tanggalLahir: '1955-06-15', // 71 years old (Lansia Resiko Tinggi)
    jenisKelamin: 'P',
    noKk: '3201010101010008',
    namaIbu: 'Fatmawati',
    namaAyah: 'Suwarno',
    namaWali: 'Fatmawati',
    noTelpWali: '081234567804',
    statusHidup: 'Hidup'
  }
];

// Seed Lansia Records
export const initialLansiaRecords: LansiaRecord[] = [
  // Hartono (l1)
  { id: 'lr1', lansiaId: 'l1', tanggalPemeriksaan: '2026-05-12', tinggiBadan: 168, beratBadan: 70, tekananDarahSistolik: 130, tekananDarahDiastolik: 85, riwayatPenyakit: 'Kolesterol Tinggi', obat: 'Simvastatin', penyakitBaru: '-', imt: 24.8 },
  { id: 'lr2', lansiaId: 'l1', tanggalPemeriksaan: '2026-06-12', tinggiBadan: 168, beratBadan: 69, tekananDarahSistolik: 125, tekananDarahDiastolik: 80, riwayatPenyakit: 'Kolesterol Tinggi', obat: 'Simvastatin', penyakitBaru: '-', imt: 24.45 },
  
  // Siti Aminah (l2)
  { id: 'lr3', lansiaId: 'l2', tanggalPemeriksaan: '2026-05-18', tinggiBadan: 155, beratBadan: 62, tekananDarahSistolik: 140, tekananDarahDiastolik: 90, riwayatPenyakit: 'Hipertensi', obat: 'Amlodipine', penyakitBaru: 'Hipertensi', imt: 25.81 },

  // Kusnan (l3)
  { id: 'lr4', lansiaId: 'l3', tanggalPemeriksaan: '2026-05-05', tinggiBadan: 162, beratBadan: 58, tekananDarahSistolik: 150, tekananDarahDiastolik: 95, riwayatPenyakit: 'Asam Urat, Hipertensi', obat: 'Allopurinol, Amlodipine', penyakitBaru: '-', imt: 22.1 },
];

// Seed Data for Attendance Chart
export const attendanceData = {
  "2024": [
    { name: 'Jan', kehadiran: 90 },
    { name: 'Feb', kehadiran: 110 },
    { name: 'Mar', kehadiran: 140 },
    { name: 'Apr', kehadiran: 150 },
    { name: 'Mei', kehadiran: 180 },
    { name: 'Jun', kehadiran: 200 },
    { name: 'Jul', kehadiran: 240 },
    { name: 'Agu', kehadiran: 270 },
    { name: 'Sep', kehadiran: 300 },
    { name: 'Okt', kehadiran: 340 },
    { name: 'Nov', kehadiran: 380 },
    { name: 'Des', kehadiran: 400 },
  ],
  "2025": [
    { name: 'Jan', kehadiran: 120 },
    { name: 'Feb', kehadiran: 150 },
    { name: 'Mar', kehadiran: 180 },
    { name: 'Apr', kehadiran: 220 },
    { name: 'Mei', kehadiran: 210 },
    { name: 'Jun', kehadiran: 280 },
    { name: 'Jul', kehadiran: 310 },
    { name: 'Agu', kehadiran: 350 },
    { name: 'Sep', kehadiran: 420 },
    { name: 'Okt', kehadiran: 650 },
    { name: 'Nov', kehadiran: 1037 },
    { name: 'Des', kehadiran: 850 },
  ]
};
