import { NextRequest } from "next/server";

// In-memory / file-backed JSON mock database for Web / Maestro testing
// Used only when running in a standard web browser outside Electron
import fs from "fs";
import path from "path";

const WEB_DB_PATH = path.join(process.cwd(), ".maestro-web-db.json");

interface WebDbSchema {
  keluarga: any[];
  individu: any[];
  master_pemeriksaan: any[];
  pemeriksaan_balita: any[];
  pemeriksaan_ibu_hamil: any[];
  kelahiran: any[];
  pemeriksaan_lansia: any[];
  penerima_manfaat: any[];
}

function loadWebDb(): WebDbSchema {
  try {
    if (fs.existsSync(WEB_DB_PATH)) {
      return JSON.parse(fs.readFileSync(WEB_DB_PATH, "utf-8"));
    }
  } catch (e) {
    console.error("Failed to read web db:", e);
  }
  return {
    keluarga: [],
    individu: [],
    master_pemeriksaan: [],
    pemeriksaan_balita: [],
    pemeriksaan_ibu_hamil: [],
    kelahiran: [],
    pemeriksaan_lansia: [],
    penerima_manfaat: [],
  };
}

function saveWebDb(db: WebDbSchema) {
  try {
    fs.writeFileSync(WEB_DB_PATH, JSON.stringify(db, null, 2), "utf-8");
  } catch (e) {
    console.error("Failed to save web db:", e);
  }
}

function executeFallbackSql(sql: string, params: any[] = []): any {
  const db = loadWebDb();
  const normalized = sql.replace(/\s+/g, " ").trim();
  const upper = normalized.toUpperCase();

  // --- SELECT QUERIES ---
  if (upper.startsWith("SELECT")) {
    // 0. Penerima Manfaat Queries
    if (upper.includes("FROM PENERIMA_MANFAAT PM")) {
      const joined = db.penerima_manfaat
        .map((pm) => {
          const ind = db.individu.find((i) => i.id === pm.individu_id);
          if (!ind) return null;
          const kel = db.keluarga.find((k) => k.id === ind.keluarga_id);
          if (!kel) return null;
          return {
            id: pm.id,
            tanggalDiterima: pm.tanggal_diterima,
            keterangan: pm.keterangan,
            fotoBukti: pm.foto_bukti,
            individuId: ind.id,
            nik: ind.nik,
            nama: ind.nama,
            noKk: kel.no_kk,
            alamat: kel.alamat,
          };
        })
        .filter(Boolean) as any[];

      if (upper.includes("WHERE PM.ID = ?")) {
        return joined.filter((r) => r.id === params[0]).slice(0, 1);
      }
      return joined.sort((a, b) =>
        (b.tanggalDiterima || "").localeCompare(a.tanggalDiterima || "")
      );
    }

    // Active members for Penerima Manfaat dropdown
    if (
      upper.includes("SELECT I.ID, I.NIK, I.NAMA, K.NO_KK AS NOKK") &&
      upper.includes("WHERE I.STATUS_HIDUP = 'HIDUP'")
    ) {
      return db.individu
        .filter((i) => (i.status_hidup || "Hidup") === "Hidup")
        .map((i) => {
          const kel = db.keluarga.find((k) => k.id === i.keluarga_id);
          return kel
            ? {
                id: i.id,
                nik: i.nik,
                nama: i.nama,
                noKk: kel.no_kk,
              }
            : null;
        })
        .filter(Boolean);
    }

    // 1. SELECT * FROM keluarga WHERE id = ? LIMIT 1
    if (upper.includes("FROM KELUARGA WHERE ID = ?")) {
      return db.keluarga.filter((k) => k.id === params[0]).slice(0, 1);
    }
    // 2. SELECT * FROM keluarga WHERE no_kk = ? LIMIT 1
    if (upper.includes("FROM KELUARGA WHERE NO_KK = ?")) {
      return db.keluarga.filter((k) => k.no_kk === params[0]).slice(0, 1);
    }
    // 3. SELECT * FROM keluarga ORDER BY no_kk
    if (upper.includes("FROM KELUARGA")) {
      return [...db.keluarga].sort((a, b) =>
        (a.no_kk || "").localeCompare(b.no_kk || "")
      );
    }
    // 4. JOIN individu & keluarga for getAnggotaCountMap
    if (upper.includes("FROM INDIVIDU I JOIN KELUARGA K ON I.KELUARGA_ID = K.ID")) {
      return db.individu
        .map((i) => {
          const k = db.keluarga.find((kel) => kel.id === i.keluarga_id);
          return k ? { id: i.id, no_kk: k.no_kk } : null;
        })
        .filter(Boolean);
    }
    // 5. SELECT id FROM individu WHERE keluarga_id = ? AND (status_keluarga = 'Kepala Keluarga' OR status_keluarga = 'Ayah')
    if (
      upper.includes("FROM INDIVIDU WHERE KELUARGA_ID = ?") &&
      upper.includes("KEPALA KELUARGA")
    ) {
      return db.individu
        .filter(
          (i) =>
            i.keluarga_id === params[0] &&
            (i.status_keluarga === "Kepala Keluarga" || i.status_keluarga === "Ayah")
        )
        .slice(0, 1);
    }
    // 6. SELECT id FROM individu WHERE keluarga_id = ? AND (status_keluarga = 'Istri' OR status_keluarga = 'Ibu')
    if (
      upper.includes("FROM INDIVIDU WHERE KELUARGA_ID = ?") &&
      upper.includes("ISTRI")
    ) {
      return db.individu
        .filter(
          (i) =>
            i.keluarga_id === params[0] &&
            (i.status_keluarga === "Istri" || i.status_keluarga === "Ibu")
        )
        .slice(0, 1);
    }
    // 7. SELECT * FROM individu WHERE keluarga_id = ?
    if (upper.includes("FROM INDIVIDU WHERE KELUARGA_ID = ?")) {
      return db.individu.filter((i) => i.keluarga_id === params[0]);
    }
    // 8. SELECT * FROM individu WHERE id = ?
    if (upper.includes("FROM INDIVIDU WHERE ID = ?")) {
      return db.individu.filter((i) => i.id === params[0]);
    }
    // 9. SELECT * FROM individu
    if (upper.includes("FROM INDIVIDU")) {
      return db.individu;
    }
    // Default SELECT empty
    return [];
  }

  // --- INSERT QUERIES ---
  if (upper.startsWith("INSERT INTO PENERIMA_MANFAAT")) {
    const [id, individu_id, tanggal_diterima, keterangan, foto_bukti] = params;
    db.penerima_manfaat.push({
      id,
      individu_id,
      tanggal_diterima,
      keterangan,
      foto_bukti,
    });
    saveWebDb(db);
    return { changes: 1 };
  }

  if (upper.startsWith("INSERT INTO KELUARGA")) {
    const [id, no_kk, alamat, no_telp] = params;
    db.keluarga.push({ id, no_kk, alamat, no_telp });
    saveWebDb(db);
    return { changes: 1 };
  }

  if (upper.startsWith("INSERT INTO INDIVIDU")) {
    // Check if status_keluarga is hardcoded in SQL ('L', 'Kepala Keluarga' or 'P', 'Istri')
    if (normalized.includes("'L', 'Kepala Keluarga'")) {
      const [id, keluarga_id, nik, nama, tempat_lahir, tanggal_lahir, no_telp, golongan_darah] = params;
      db.individu.push({
        id,
        keluarga_id,
        nik,
        nama,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin: "L",
        status_keluarga: "Kepala Keluarga",
        no_telp,
        golongan_darah,
        status_hidup: "Hidup",
      });
    } else if (normalized.includes("'P', 'Istri'")) {
      const [id, keluarga_id, nik, nama, tempat_lahir, tanggal_lahir, no_telp, golongan_darah] = params;
      db.individu.push({
        id,
        keluarga_id,
        nik,
        nama,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin: "P",
        status_keluarga: "Istri",
        no_telp,
        golongan_darah,
        status_hidup: "Hidup",
      });
    } else {
      const [
        id,
        keluarga_id,
        nik,
        nama,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin,
        status_keluarga,
        no_telp,
        golongan_darah,
      ] = params;
      db.individu.push({
        id,
        keluarga_id,
        nik,
        nama,
        tempat_lahir,
        tanggal_lahir,
        jenis_kelamin,
        status_keluarga,
        no_telp,
        golongan_darah,
        status_hidup: "Hidup",
      });
    }
    saveWebDb(db);
    return { changes: 1 };
  }

  // --- UPDATE QUERIES ---
  if (upper.startsWith("UPDATE PENERIMA_MANFAAT")) {
    const [individu_id, tanggal_diterima, keterangan, foto_bukti, id] = params;
    const idx = db.penerima_manfaat.findIndex((pm) => pm.id === id);
    if (idx !== -1) {
      db.penerima_manfaat[idx] = {
        ...db.penerima_manfaat[idx],
        individu_id,
        tanggal_diterima,
        keterangan,
        foto_bukti,
      };
      saveWebDb(db);
    }
    return { changes: idx !== -1 ? 1 : 0 };
  }

  if (upper.startsWith("UPDATE KELUARGA")) {
    const [no_kk, alamat, no_telp, id] = params;
    const idx = db.keluarga.findIndex((k) => k.id === id);
    if (idx !== -1) {
      db.keluarga[idx] = { ...db.keluarga[idx], no_kk, alamat, no_telp };
      saveWebDb(db);
    }
    return { changes: idx !== -1 ? 1 : 0 };
  }

  if (upper.startsWith("UPDATE INDIVIDU")) {
    const id = params[params.length - 1];
    const idx = db.individu.findIndex((i) => i.id === id);
    if (idx !== -1) {
      if (params.length === 7) {
        const [nik, nama, tempat_lahir, tanggal_lahir, no_telp, golongan_darah] = params;
        db.individu[idx] = {
          ...db.individu[idx],
          nik: nik || db.individu[idx].nik,
          nama,
          tempat_lahir,
          tanggal_lahir,
          no_telp,
          golongan_darah,
        };
      } else if (params.length === 6) {
        const [nama, tanggal_lahir, tempat_lahir, no_telp, golongan_darah] = params;
        db.individu[idx] = {
          ...db.individu[idx],
          nama,
          tanggal_lahir,
          tempat_lahir,
          no_telp,
          golongan_darah,
        };
      } else if (params.length === 9) {
        const [
          nik,
          nama,
          tempat_lahir,
          tanggal_lahir,
          jenis_kelamin,
          status_keluarga,
          no_telp,
          golongan_darah,
        ] = params;
        db.individu[idx] = {
          ...db.individu[idx],
          nik: nik || db.individu[idx].nik,
          nama,
          tempat_lahir,
          tanggal_lahir,
          jenis_kelamin,
          status_keluarga,
          no_telp,
          golongan_darah,
        };
      }
      saveWebDb(db);
    }
    return { changes: idx !== -1 ? 1 : 0 };
  }

  // --- DELETE QUERIES ---
  if (upper.startsWith("DELETE FROM PENERIMA_MANFAAT")) {
    const id = params[0];
    db.penerima_manfaat = db.penerima_manfaat.filter((pm) => pm.id !== id);
    saveWebDb(db);
    return { changes: 1 };
  }

  if (upper.startsWith("DELETE FROM KELUARGA")) {
    if (upper.includes("WHERE ID = ?")) {
      const id = params[0];
      db.keluarga = db.keluarga.filter((k) => k.id !== id);
      db.individu = db.individu.filter((i) => i.keluarga_id !== id);
    } else if (upper.includes("WHERE NO_KK = ?")) {
      const noKk = params[0];
      const target = db.keluarga.find((k) => k.no_kk === noKk);
      if (target) {
        db.keluarga = db.keluarga.filter((k) => k.no_kk !== noKk);
        db.individu = db.individu.filter((i) => i.keluarga_id !== target.id);
      }
    }
    saveWebDb(db);
    return { changes: 1 };
  }

  return [];
}

export async function POST(request: NextRequest) {
  try {
    const { sql, params } = await request.json();

    // Try real better-sqlite3 first if compatible with current Node runtime
    try {
      const { initDb, executeQuery, getDbPath } = await import("@/lib/db/sqlite");
      const dbPath = getDbPath(process.cwd());
      initDb(dbPath);
      const result = executeQuery(sql, params || []);
      return Response.json({ ok: true, data: result });
    } catch {
      // Fallback to JSON file DB when better-sqlite3 is compiled for Electron ABI
      const result = executeFallbackSql(sql, params || []);
      return Response.json({ ok: true, data: result });
    }
  } catch (err: any) {
    return Response.json(
      { ok: false, error: err.message || "Database error" },
      { status: 500 }
    );
  }
}

