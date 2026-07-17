# Catatan Perubahan: Implementasi & Pembaruan Sistem Posyandu Digital

Dokumen ini mencantumkan riwayat perubahan dan peningkatan fitur pada aplikasi Posyandu 3000, dikelompokkan berdasarkan halaman dan sistem.

---

## 1. SISTEM INTI & PERUBAHAN DATABASE (Lokal & Supabase)
* **Tipe Data (`types.ts` & `ibuHamil.ts` & `lansia.ts` & `balita.ts`)**:
  - Memperluas interface `KK` dengan properti: `tanggalLahirAyah`, `tempatLahirAyah`, `telpAyah`, `tanggalLahirIbu`, `tempatLahirIbu`, `telpIbu`.
  - Memperluas interface `Lansia` dengan properti: `namaWali` dan `noTelpWali` (diintegrasikan tanpa memutus relasi database lama).
  - Memperluas objek `KKOption` di file data fetcher agar memiliki tipe yang sama untuk menampung tempat/tanggal lahir orang tua secara dinamis.
* **Database Service (`db-service.ts` & fetchers)**:
  - Menambahkan fungsi helper `getKKByNoKk` dan `deleteKK` untuk mengelola data Kartu Keluarga.
  - Memperbarui fungsi `getKKs` di modul Supabase client agar mengambil data detail orang tua (`nik_ayah`, `nik_ibu`, `nama_ayah`, `nama_ibu`, `tempat_lahir`, `tanggal_lahir`) secara relasional dari tabel `individu` agar data autocomplete selalu sinkron.

---

## 2. HALAMAN REGISTRASI KK (`/dashboard/tambah-kk`)
* **Pembaruan Form Input**:
  - Menambahkan input **Tempat Lahir**, **Tanggal Lahir**, dan **Nomor Telepon/WA** khusus untuk **Ayah** dan **Ibu** secara terpisah di masing-masing kartu identitas orang tua.
  - Menyinkronkan data masukan baru ini saat admin mengklik simpan sehingga data tersimpan utuh di database keluarga.

---

## 3. HALAMAN KK TERDAFTAR (`/dashboard/kk-terdaftar`)
* **Daftar KK (`/dashboard/kk-terdaftar`)**:
  - Menyediakan ringkasan total KK dan total Jiwa terpantau.
  - Mendukung pencarian instan KK berdasarkan nomor KK, nama kepala keluarga, atau alamat.
  - Mengarahkan navigasi langsung ke dynamic route `/dashboard/kk-terdaftar/[id]` saat diklik.
* **Detail KK (`/dashboard/kk-terdaftar/[id]`)**:
  - Menampilkan informasi KK lengkap dalam bento-grid.
  - Menampilkan anggota keluarga yang terdaftar (Balita, Lansia, Ibu Hamil).
  - **Akses Detail Kepala Keluarga**: Menambahkan tombol tautan **"Lihat detail"** pada kartu Kepala Keluarga jika NIK/Namanya terdata aktif di dalam layanan kunjungan Posyandu (Balita/Ibu Hamil/Lansia). Sebaliknya, jika belum terdata, akan menampilkan label status **"Belum ada data kunjungan"**.
  - **Informasi Umur & Peran**: Menampilkan detail umur dan peran langsung pada label status Kepala Keluarga (contoh: `40 Tahun • Ayah`) yang dihitung secara dinamis dari tanggal lahir Ayah.
  - **Validasi Hubungan Keluarga Lansia**: Hubungan keluarga lansia dihitung secara dinamis. Jika namanya sama dengan Kepala Keluarga $\rightarrow$ "Kepala Keluarga"; jika sama dengan Ibu $\rightarrow$ "Istri"; jika di luar itu (dan berusia tua) $\rightarrow$ "Orang Tua / Mertua". Hal ini mencegah kesalahan administratif di mana lansia terdaftar dengan hubungan anak dalam KK kepala keluarga yang lebih muda.

---

## 4. HALAMAN IBU HAMIL (`/dashboard/ibu-hamil`)
* **Autocomplete & Auto-fill Nomor KK**:
  - Dropdown pemilihan KK digantikan dengan input pencarian numerik bertuliskan **"KK Terdaftar"** yang memuat datalist autocomplete nomor KK terdaftar.
* **Autocomplete & Auto-fill Data Diri**:
  - Input **NIK**, **Nama Lengkap**, **Tempat Lahir**, dan **Tanggal Lahir** kini terhubung dengan datalist autocomplete yang merujuk pada data Ibu di KK terpilih.
  - Memilih atau mengetik NIK/Nama Ibu yang sesuai akan secara otomatis mengisi field Nama, Tempat Lahir, dan Tanggal Lahir secara instan.
* **Formulir Kelahiran Bayi**:
  - Mengubah input gestational age saat lahir kembali ke input minggu ("Lahir Pada Usia Kehamilan (Minggu)") untuk akurasi biologis kelahiran bayi.

---

## 5. HALAMAN BALITA / BAYI (`/dashboard/balita`)
* **Autocomplete & Auto-fill Nomor KK**:
  - Dropdown pemilihan KK digantikan dengan input pencarian numerik bertuliskan **"KK Terdaftar"** dengan datalist autocomplete.
* **Input Orang Tua (Ayah & Ibu) Terintegrasi**:
  - Menampilkan input text **Nama Ayah** dan **Nama Ibu** biasa yang terisi otomatis (autofilled) berdasarkan KK terdaftar yang dipilih, di mana admin tetap dapat melihat, memverifikasi, maupun mengubahnya seperti field input biasa.
* **Pembaruan Input Usia**:
  - Mengubah penamaan label input dari "Usia Kehamilan..." menjadi **"Usia"**.
  - Menyediakan unit selector opsi **"minggu"** atau **"tahun"** untuk mempermudah kader saat menginput usia balita yang diukur dalam satuan tahun atau minggu.

---

## 6. HALAMAN LANSIA (`/dashboard/lansia`)
* **Autocomplete & Auto-fill Nomor KK**:
  - Dropdown KK digantikan dengan input pencarian numerik **"KK Terdaftar"** dengan autocomplete datalist.
* **Autocomplete & Auto-fill Data Diri**:
  - Input **NIK**, **Nama Lengkap**, **Tempat Lahir**, dan **Tanggal Lahir** terhubung dengan datalist autocomplete yang mendeteksi data Ayah dan Ibu di KK terpilih.
  - Memilih NIK/Nama salah satu orang tua akan otomatis mengisi Nama, Tempat Lahir, Tanggal Lahir, serta **Jenis Kelamin** (Laki-laki untuk Ayah, Perempuan untuk Ibu) secara otomatis.
* **Perubahan Relasi Wali (Menghapus Ayah & Ibu)**:
  - Menghapus input "Nama Ayah" dan "Nama Ibu" pada formulir pendaftaran Lansia.
  - Menggantinya dengan input **"Nama Wali"** (wajib) dan **"Nomor HP / WA Wali"** (opsional) agar lebih relevan dengan kondisi sosial lansia.
  - Menyesuaikan tampilan detail Lansia (`/dashboard/lansia/[id]`) agar menampilkan informasi Wali & No. Telp Wali.

---

## 7. LAYOUT & NAVIGASI GLOBAL
* **Sidebar Navigasi (`Sidebar.tsx`)**:
  - Menambahkan menu akses baru **"KK Terdaftar"** dengan ikon `folder_shared` di bawah menu Tambah KK.
* **Breadcrumb Navigation (`Header.tsx`)**:
  - Menghapus breadcrumb navigator lokal di dalam halaman detail untuk menghindari redundansi visual.
  - Mengintegrasikan rute detail dinamis `/dashboard/kk-terdaftar/[id]` ke dalam breadcrumb Header global agar melacak rute aktif secara konsisten (contoh: `Home / KK Terdaftar / 3329011904240001`).

---

## 8. PEMBARUAN DUMMY DATA (`mock-db.ts` & `db-service.ts`)
* **Pemisahan KK Lansia/Mertua**:
  - Memisahkan seluruh data Lansia/Mertua dari KK anak mereka menjadi Kartu Keluarga (KK) terpisah agar sesuai dengan ketentuan administratif yang berlaku. **(Temporary)**
  - Menambahkan 4 data KK baru khusus untuk masing-masing Lansia bawaan di dalam database.
* **Auto-reset Cache LocalStorage**:
  - Mengimplementasikan deteksi versi database lokal (`DB_VERSION = "v3"`) pada service data. Apabila terdapat perbedaan versi cache localStorage, sistem akan otomatis melakukan re-seed database baru agar admin langsung melihat dummy data yang telah diperbarui tanpa kendala. **(Temporary)**
