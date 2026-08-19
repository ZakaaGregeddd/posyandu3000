import Database from "better-sqlite3";
import path from "path";
import fs from "fs";

let dbInstance: Database.Database | null = null;

export function getDbPath(appDataPath: string): string {
  const dbDir = path.join(appDataPath, "posyandu3000");
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }
  return path.join(dbDir, "posyandu.db");
}

export function initDb(dbPath: string): Database.Database {
  const db = new Database(dbPath);
  db.pragma("foreign_keys = ON");

  // Schema Migration for Keluarga Table (if it existed without 'id' column)
  try {
    const columns = db.prepare("PRAGMA table_info(keluarga)").all() as any[];
    if (columns.length > 0) {
      const hasId = columns.some(col => col.name === "id");
      if (!hasId) {
        db.exec(`
          ALTER TABLE keluarga RENAME TO keluarga_old;
          CREATE TABLE keluarga (
            id TEXT PRIMARY KEY,
            no_kk TEXT UNIQUE NOT NULL,
            alamat TEXT,
            no_telp TEXT
          );
          INSERT INTO keluarga (id, no_kk, alamat, no_telp)
          SELECT no_kk, no_kk, alamat, no_telp FROM keluarga_old;
          DROP TABLE keluarga_old;
        `);
        console.log("Database Migration: Successfully migrated 'keluarga' table schema.");
      }
    }
  } catch (e) {
    console.error("Migration check for keluarga table failed:", e);
  }

  // Schema Migration for Individu Table (if it existed without 'id' column)
  try {
    const columns = db.prepare("PRAGMA table_info(individu)").all() as any[];
    if (columns.length > 0) {
      const hasId = columns.some(col => col.name === "id");
      if (!hasId) {
        db.exec(`
          ALTER TABLE individu RENAME TO individu_old;
          CREATE TABLE individu (
            id TEXT PRIMARY KEY,
            keluarga_id TEXT,
            nik TEXT UNIQUE NOT NULL,
            nama TEXT NOT NULL,
            tempat_lahir TEXT,
            tanggal_lahir TEXT,
            jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')),
            status_keluarga TEXT,
            golongan_darah TEXT,
            no_telp TEXT,
            status_hidup TEXT DEFAULT 'Hidup' CHECK(status_hidup IN ('Hidup', 'Meninggal')),
            tanggal_meninggal TEXT,
            keterangan_meninggal TEXT,
            FOREIGN KEY (keluarga_id) REFERENCES keluarga(id) ON DELETE CASCADE
          );
          INSERT INTO individu (id, keluarga_id, nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, status_keluarga, golongan_darah, no_telp, status_hidup, tanggal_meninggal, keterangan_meninggal)
          SELECT nik, keluarga_id, nik, nama, tempat_lahir, tanggal_lahir, jenis_kelamin, status_keluarga, golongan_darah, NULL, status_hidup, tanggal_meninggal, keterangan_meninggal FROM individu_old;
          DROP TABLE individu_old;
        `);
        console.log("Database Migration: Successfully migrated 'individu' table schema.");
      }
    }
  } catch (e) {
    console.error("Migration check for individu table failed:", e);
  }

  // Schema Migration to add 'no_telp' to Individu Table if it's missing
  try {
    const columns = db.prepare("PRAGMA table_info(individu)").all() as any[];
    if (columns.length > 0) {
      const hasNoTelp = columns.some(col => col.name === "no_telp");
      if (!hasNoTelp) {
        db.exec("ALTER TABLE individu ADD COLUMN no_telp TEXT;");
        console.log("Database Migration: Successfully added 'no_telp' column to 'individu' table.");
      }
    }
  } catch (e) {
    console.error("Migration check for no_telp in individu failed:", e);
  }

  // Create Keluarga Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS keluarga (
      id TEXT PRIMARY KEY,
      no_kk TEXT UNIQUE NOT NULL,
      alamat TEXT,
      no_telp TEXT
    )
  `);

  // Create Individu Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS individu (
      id TEXT PRIMARY KEY,
      keluarga_id TEXT,
      nik TEXT UNIQUE NOT NULL,
      nama TEXT NOT NULL,
      tempat_lahir TEXT,
      tanggal_lahir TEXT,
      jenis_kelamin TEXT CHECK(jenis_kelamin IN ('L', 'P')),
      status_keluarga TEXT,
      golongan_darah TEXT,
      no_telp TEXT,
      status_hidup TEXT DEFAULT 'Hidup' CHECK(status_hidup IN ('Hidup', 'Meninggal')),
      tanggal_meninggal TEXT,
      keterangan_meninggal TEXT,
      FOREIGN KEY (keluarga_id) REFERENCES keluarga(id) ON DELETE CASCADE
    )
  `);

  // Create Master Pemeriksaan Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS master_pemeriksaan (
      id TEXT PRIMARY KEY,
      individu_id TEXT NOT NULL,
      tanggal_pemeriksaan TEXT NOT NULL,
      kunjungan_ke INTEGER,
      jenis_pemeriksaan TEXT CHECK(jenis_pemeriksaan IN ('Balita', 'Ibu Hamil')),
      FOREIGN KEY (individu_id) REFERENCES individu(id) ON DELETE CASCADE
    )
  `);

  // Create Pemeriksaan Balita Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pemeriksaan_balita (
      pemeriksaan_id TEXT PRIMARY KEY,
      berat_badan REAL,
      tinggi_badan REAL,
      lingkar_kepala REAL,
      lingkar_lengan REAL,
      imunisasi TEXT,
      obat_vitamin TEXT,
      imt REAL,
      catatan TEXT,
      FOREIGN KEY (pemeriksaan_id) REFERENCES master_pemeriksaan(id) ON DELETE CASCADE
    )
  `);

  // Create Pemeriksaan Ibu Hamil Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pemeriksaan_ibu_hamil (
      pemeriksaan_id TEXT PRIMARY KEY,
      tanggal_hpht TEXT,
      berat_badan REAL,
      tinggi_badan REAL,
      tekanan_sistolik REAL,
      tekanan_diastolik REAL,
      usia_kehamilan_minggu REAL,
      vitamin TEXT,
      catatan TEXT,
      status_kelahiran TEXT,
      FOREIGN KEY (pemeriksaan_id) REFERENCES master_pemeriksaan(id) ON DELETE CASCADE
    )
  `);

  // Create Kelahiran Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS kelahiran (
      id TEXT PRIMARY KEY,
      pemeriksaan_ibu_hamil_id TEXT,
      individu_anak_id TEXT UNIQUE,
      cara_kelahiran TEXT CHECK(cara_kelahiran IN ('Normal', 'SC')),
      tanggal_kelahiran TEXT,
      tempat_kelahiran TEXT,
      usia_kehamilan_minggu REAL,
      berat_badan REAL,
      tinggi_badan REAL,
      FOREIGN KEY (pemeriksaan_ibu_hamil_id) REFERENCES master_pemeriksaan(id) ON DELETE SET NULL,
      FOREIGN KEY (individu_anak_id) REFERENCES individu(id) ON DELETE CASCADE
    )
  `);

  // Create Pemeriksaan Lansia Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS pemeriksaan_lansia (
      pemeriksaan_id TEXT PRIMARY KEY,
      nama_wali TEXT,
      penyakit TEXT,
      keterangan TEXT,
      FOREIGN KEY (pemeriksaan_id) REFERENCES master_pemeriksaan(id) ON DELETE CASCADE
    )
  `);

  // Create Penerima Manfaat Table
  db.exec(`
    CREATE TABLE IF NOT EXISTS penerima_manfaat (
      id TEXT PRIMARY KEY,
      individu_id TEXT NOT NULL,
      tanggal_diterima TEXT NOT NULL,
      keterangan TEXT,
      foto_bukti TEXT,
      FOREIGN KEY (individu_id) REFERENCES individu(id) ON DELETE CASCADE
    )
  `);

  dbInstance = db;
  return db;
}

export function executeQuery(sql: string, params: any[] = []): any {
  if (!dbInstance) {
    throw new Error("Database not initialized");
  }

  const stmt = dbInstance.prepare(sql);
  
  // Check if it is a SELECT query
  const isSelect = sql.trim().toUpperCase().startsWith("SELECT");
  
  if (isSelect) {
    return stmt.all(...params);
  } else {
    return stmt.run(...params);
  }
}

export function executeTransaction(callback: () => any): any {
  if (!dbInstance) {
    throw new Error("Database not initialized");
  }
  const transaction = dbInstance.transaction(callback);
  return transaction();
}
