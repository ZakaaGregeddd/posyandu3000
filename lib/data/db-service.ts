'use client';

import { KK, Balita, BalitaRecord, IbuHamil, IbuHamilRecord, Lansia, LansiaRecord, PostBirthRecord } from './types';
import {
  initialKKs,
  initialBalita,
  initialBalitaRecords,
  initialIbuHamil,
  initialIbuHamilRecords,
  initialLansia,
  initialLansiaRecords
} from './mock-db';

const isClient = typeof window !== 'undefined';

if (isClient) {
  const DB_VERSION = "v3";
  if (localStorage.getItem("posyandu_db_version") !== DB_VERSION) {
    localStorage.removeItem("posyandu_kks");
    localStorage.removeItem("posyandu_balitas");
    localStorage.removeItem("posyandu_ibu_hamils");
    localStorage.removeItem("posyandu_lansias");
    localStorage.removeItem("posyandu_balita_records");
    localStorage.removeItem("posyandu_ibu_hamil_records");
    localStorage.removeItem("posyandu_lansia_records");
    localStorage.setItem("posyandu_db_version", DB_VERSION);
  }
}

function getStorageItem<T>(key: string, defaultValue: T): T {
  if (!isClient) return defaultValue;
  try {
    const item = localStorage.getItem(key);
    return item ? JSON.parse(item) : defaultValue;
  } catch (error) {
    console.error('Error reading localStorage', error);
    return defaultValue;
  }
}

function setStorageItem<T>(key: string, value: T): void {
  if (!isClient) return;
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    console.error('Error writing localStorage', error);
  }
}

// Getters and Setters
export function getKKs(): KK[] {
  return getStorageItem<KK[]>('posyandu_kks', initialKKs);
}

export function getKKByNoKk(noKk: string): KK | undefined {
  return getKKs().find(item => item.noKk === noKk);
}

export function addKK(kk: KK): void {
  const kks = getKKs();
  if (kks.some(item => item.noKk === kk.noKk)) {
    throw new Error('Nomor KK sudah terdaftar');
  }
  kks.push(kk);
  setStorageItem('posyandu_kks', kks);
}

export function deleteKK(noKk: string): void {
  const kks = getKKs();
  const filtered = kks.filter(item => item.noKk !== noKk);
  setStorageItem('posyandu_kks', filtered);
}

// Balita Services
export function getBalitas(): Balita[] {
  return getStorageItem<Balita[]>('posyandu_balitas', initialBalita);
}

export function getBalitaById(id: string): Balita | undefined {
  return getBalitas().find(b => b.id === id);
}

export function addBalita(data: Omit<Balita, 'id'>): Balita {
  const balitas = getBalitas();
  const newBalita: Balita = {
    ...data,
    id: `balita_${Date.now()}`
  };
  balitas.push(newBalita);
  setStorageItem('posyandu_balitas', balitas);
  return newBalita;
}

export function updateBalita(updated: Balita): void {
  const balitas = getBalitas();
  const idx = balitas.findIndex(b => b.id === updated.id);
  if (idx !== -1) {
    balitas[idx] = updated;
    setStorageItem('posyandu_balitas', balitas);
  }
}

export function getBalitaRecords(balitaId: string): BalitaRecord[] {
  const records = getStorageItem<BalitaRecord[]>('posyandu_balita_records', initialBalitaRecords);
  return records
    .filter(r => r.balitaId === balitaId)
    .sort((a, b) => new Date(a.tanggalPemeriksaan).getTime() - new Date(b.tanggalPemeriksaan).getTime());
}

export function addBalitaRecord(record: Omit<BalitaRecord, 'id'>): BalitaRecord {
  const records = getStorageItem<BalitaRecord[]>('posyandu_balita_records', initialBalitaRecords);
  const newRecord: BalitaRecord = {
    ...record,
    id: `br_${Date.now()}`
  };
  records.push(newRecord);
  setStorageItem('posyandu_balita_records', records);
  return newRecord;
}

// Ibu Hamil Services
export function getIbuHamils(): IbuHamil[] {
  return getStorageItem<IbuHamil[]>('posyandu_ibu_hamils', initialIbuHamil);
}

export function getIbuHamilById(id: string): IbuHamil | undefined {
  return getIbuHamils().find(ih => ih.id === id);
}

export function addIbuHamil(data: Omit<IbuHamil, 'id'>): IbuHamil {
  const ibuHamils = getIbuHamils();
  const newIbu: IbuHamil = {
    ...data,
    id: `ibu_${Date.now()}`
  };
  ibuHamils.push(newIbu);
  setStorageItem('posyandu_ibu_hamils', ibuHamils);
  return newIbu;
}

export function updateIbuHamil(updated: IbuHamil): void {
  const ibuHamils = getIbuHamils();
  const idx = ibuHamils.findIndex(ih => ih.id === updated.id);
  if (idx !== -1) {
    ibuHamils[idx] = updated;
    setStorageItem('posyandu_ibu_hamils', ibuHamils);
  }
}

export function getIbuHamilRecords(ibuHamilId: string): IbuHamilRecord[] {
  const records = getStorageItem<IbuHamilRecord[]>('posyandu_ibu_hamil_records', initialIbuHamilRecords);
  return records
    .filter(r => r.ibuHamilId === ibuHamilId)
    .sort((a, b) => new Date(a.tanggalPemeriksaan).getTime() - new Date(b.tanggalPemeriksaan).getTime());
}

export function addIbuHamilRecord(record: Omit<IbuHamilRecord, 'id'>): IbuHamilRecord {
  const records = getStorageItem<IbuHamilRecord[]>('posyandu_ibu_hamil_records', initialIbuHamilRecords);
  const newRecord: IbuHamilRecord = {
    ...record,
    id: `ihr_${Date.now()}`
  };
  records.push(newRecord);
  setStorageItem('posyandu_ibu_hamil_records', records);
  return newRecord;
}

export function addPostBirthRecord(ibuHamilId: string, postBirth: PostBirthRecord): void {
  const ibuHamils = getIbuHamils();
  const idx = ibuHamils.findIndex(ih => ih.id === ibuHamilId);
  if (idx !== -1) {
    ibuHamils[idx].postBirthRecord = postBirth;
    setStorageItem('posyandu_ibu_hamils', ibuHamils);

    // Automatically register the child in Balita database if active
    addBalita({
      nama: postBirth.nama,
      tempatLahir: postBirth.tempat,
      tanggalLahir: postBirth.tanggalLahir,
      jenisKelamin: postBirth.jenisKelamin,
      noKk: ibuHamils[idx].noKk,
      namaIbu: ibuHamils[idx].nama,
      namaAyah: '-', // Can be updated later or links to KK
      statusHidup: 'Hidup',
      caraLahir: postBirth.caraLahir,
      usiaKehamilanSaatLahirWeeks: postBirth.usiaKehamilanSaatLahirWeeks
    });
  }
}

// Lansia Services
export function getLansias(): Lansia[] {
  return getStorageItem<Lansia[]>('posyandu_lansias', initialLansia);
}

export function getLansiaById(id: string): Lansia | undefined {
  return getLansias().find(l => l.id === id);
}

export function addLansia(data: Omit<Lansia, 'id'>): Lansia {
  const lansias = getLansias();
  const newLansia: Lansia = {
    ...data,
    id: `lansia_${Date.now()}`
  };
  lansias.push(newLansia);
  setStorageItem('posyandu_lansias', lansias);
  return newLansia;
}

export function updateLansia(updated: Lansia): void {
  const lansias = getLansias();
  const idx = lansias.findIndex(l => l.id === updated.id);
  if (idx !== -1) {
    lansias[idx] = updated;
    setStorageItem('posyandu_lansias', lansias);
  }
}

export function getLansiaRecords(lansiaId: string): LansiaRecord[] {
  const records = getStorageItem<LansiaRecord[]>('posyandu_lansia_records', initialLansiaRecords);
  return records
    .filter(r => r.lansiaId === lansiaId)
    .sort((a, b) => new Date(a.tanggalPemeriksaan).getTime() - new Date(b.tanggalPemeriksaan).getTime());
}

export function addLansiaRecord(record: Omit<LansiaRecord, 'id'>): LansiaRecord {
  const records = getStorageItem<LansiaRecord[]>('posyandu_lansia_records', initialLansiaRecords);
  const newRecord: LansiaRecord = {
    ...record,
    id: `lr_${Date.now()}`
  };
  records.push(newRecord);
  setStorageItem('posyandu_lansia_records', records);
  return newRecord;
}

// Authentication
export function loginUser(username: string): void {
  if (isClient) {
    localStorage.setItem('posyandu_user', JSON.stringify({ username, role: 'kader' }));
  }
}

export function logoutUser(): void {
  if (isClient) {
    localStorage.removeItem('posyandu_user');
  }
}

export function getCurrentUser(): { username: string; role: string } | null {
  return getStorageItem<{ username: string; role: string } | null>('posyandu_user', null);
}

export function deleteBalita(id: string): void {
  const balitas = getBalitas();
  const filtered = balitas.filter(b => b.id !== id);
  setStorageItem('posyandu_balitas', filtered);
}

export function deleteIbuHamil(id: string): void {
  const ibuHamils = getIbuHamils();
  const filtered = ibuHamils.filter(ih => ih.id !== id);
  setStorageItem('posyandu_ibu_hamils', filtered);
}

export function deleteLansia(id: string): void {
  const lansias = getLansias();
  const filtered = lansias.filter(l => l.id !== id);
  setStorageItem('posyandu_lansias', filtered);
}
