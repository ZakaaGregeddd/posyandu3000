'use client';

import React, { useState, useEffect, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Input } from '@/components/ui/input';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '@/components/ui/dialog';
import StatusHidupControl from '@/components/shared/StatusHidupControl';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { getBalitaById, updateBalita, getBalitaRecords, addBalitaRecord, getKKs } from '@/lib/data/db-service';
import { Balita, BalitaRecord, StatusHidup } from '@/lib/data/types';
import { calculateAge, calculateIMT, isRecordEntryLocked } from '@/lib/utils/health';

export default function BalitaDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);

  // States
  const [balita, setBalita] = useState<Balita | null>(null);
  const [records, setRecords] = useState<BalitaRecord[]>([]);
  const [alamatKk, setAlamatKk] = useState('ASMIL 400/ BR');
  const [isExamModalOpen, setIsExamModalOpen] = useState(false);
  const [isMenuOpen, setIsMenuOpen] = useState(false);

  // Exam Form States
  const [tanggalPemeriksaan, setTanggalPemeriksaan] = useState(new Date().toISOString().split('T')[0]);
  const [tinggiBadan, setTinggiBadan] = useState('');
  const [beratBadan, setBeratBadan] = useState('');
  const [lingkarKepala, setLingkarKepala] = useState('');
  const [lingkarLengan, setLingkarLengan] = useState('');
  const [imunisasi, setImunisasi] = useState('-');
  const [obatVitamin, setObatVitamin] = useState('-');
  const [formError, setFormError] = useState('');

  useEffect(() => {
    const data = getBalitaById(id);
    if (!data) {
      router.push('/dashboard/balita');
      return;
    }
    setBalita(data);
    
    // Find Alamat from KK
    const kks = getKKs();
    const kk = kks.find(k => k.noKk === data.noKk);
    if (kk) {
      setAlamatKk(`${kk.alamat}, RT ${kk.rt}/RW ${kk.rw}`);
    }

    const recs = getBalitaRecords(id).sort((a, b) => new Date(a.tanggalPemeriksaan).getTime() - new Date(b.tanggalPemeriksaan).getTime());
    setRecords(recs);
  }, [id, router]);

  if (!balita) {
    return (
      <div className="flex-1 flex items-center justify-center">
        <div className="w-10 h-10 border-4 border-tertiary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  const age = calculateAge(balita.tanggalLahir);
  const isLocked = isRecordEntryLocked(balita.tanggalLahir, 'balita');
  const isDeceased = balita.statusHidup === 'Meninggal';
  const canAddRecord = !isLocked && !isDeceased;

  // Handle status update
  const handleStatusChange = (status: StatusHidup, tanggal?: string, penyebab?: string) => {
    const updated = {
      ...balita,
      statusHidup: status,
      tanggalMeninggal: tanggal,
      penyebabMeninggal: penyebab
    };
    updateBalita(updated);
    setBalita(updated);
  };

  // Handle new exam record
  const handleAddExam = (e: React.FormEvent) => {
    e.preventDefault();
    setFormError('');

    if (!tanggalPemeriksaan || !tinggiBadan || !beratBadan || !lingkarKepala || !lingkarLengan) {
      setFormError('Semua parameter vital wajib diisi');
      return;
    }

    const tbNum = parseFloat(tinggiBadan);
    const bbNum = parseFloat(beratBadan);
    const lkNum = parseFloat(lingkarKepala);
    const llNum = parseFloat(lingkarLengan);

    if (isNaN(tbNum) || tbNum <= 0 || isNaN(bbNum) || bbNum <= 0) {
      setFormError('Tinggi dan Berat badan harus bernilai positif');
      return;
    }

    const imtVal = calculateIMT(bbNum, tbNum);

    const newRec = addBalitaRecord({
      balitaId: id,
      tanggalPemeriksaan,
      tinggiBadan: tbNum,
      beratBadan: bbNum,
      lingkarKepala: lkNum,
      lingkarLengan: llNum,
      imunisasi,
      obatVitamin,
      imt: imtVal
    });

    setRecords([...records, newRec].sort((a, b) => new Date(a.tanggalPemeriksaan).getTime() - new Date(b.tanggalPemeriksaan).getTime()));
    setIsExamModalOpen(false);
    resetForm();
  };

  const resetForm = () => {
    setTanggalPemeriksaan(new Date().toISOString().split('T')[0]);
    setTinggiBadan('');
    setBeratBadan('');
    setLingkarKepala('');
    setLingkarLengan('');
    setImunisasi('-');
    setObatVitamin('-');
    setFormError('');
  };

  // Formatting chart data
  const chartData = records.map(r => ({
    tanggal: new Date(r.tanggalPemeriksaan).toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
    'Berat Badan': r.beratBadan,
    'Panjang Badan': r.tinggiBadan,
    'Lingkar Lengan': r.lingkarLengan,
    'Lingkar Kepala': r.lingkarKepala
  }));

  return (
    <div className="max-w-[1200px] mx-auto w-full space-y-8 animate-in fade-in duration-300">
      {/* Profile Card Section */}
      <section className="glass-card rounded-2xl p-8 flex flex-col md:flex-row justify-between items-start gap-6">
        <div className="space-y-4">
          <div>
            <h2 className="font-headline text-2xl font-bold text-on-surface uppercase">{balita.nama}</h2>
            <div className="flex items-center gap-2 mt-1">
              <span className="inline-block px-3 py-1 bg-tertiary-fixed text-black rounded-full text-xs font-bold tracking-wider">
                {age.totalMonths <= 12 ? 'Bayi' : 'Balita'}
              </span>
              <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-bold ${
                balita.statusHidup === 'Hidup' ? 'bg-teal-50 text-teal-700 border border-teal-200' : 'bg-red-50 text-red-700 border border-red-200'
              }`}>
                {balita.statusHidup}
              </span>
            </div>
          </div>
          <div className="flex items-center gap-2 text-sm font-medium text-on-surface-variant">
            <span className="material-symbols-outlined text-tertiary text-sm">location_on</span>
            <p>TTL: {balita.tempatLahir.toUpperCase()}, {new Date(balita.tanggalLahir).toLocaleDateString('id-ID', { day: 'numeric', month: 'long', year: 'numeric' })}</p>
          </div>
        </div>

        <div className="flex items-center gap-3 relative">
          <Button 
            onClick={() => setIsExamModalOpen(true)}
            disabled={!canAddRecord}
            className="flex items-center gap-2 shadow-sm cursor-pointer disabled:opacity-40 disabled:cursor-not-allowed bg-tertiary text-white hover:bg-[#8b224a] px-6 py-3 rounded-xl text-sm font-bold animate-all"
          >
            <span className="material-symbols-outlined text-sm">add_circle</span>
            <span>Update Pemeriksaan</span>
          </Button>

          {/* More options menu */}
          <div className="relative">
            <button 
              onClick={() => setIsMenuOpen(!isMenuOpen)}
              className="p-3 text-outline hover:bg-slate-100 rounded-xl transition-colors cursor-pointer"
            >
              <span className="material-symbols-outlined">more_vert</span>
            </button>
            {isMenuOpen && (
              <div className="absolute right-0 mt-2 w-48 bg-white rounded-xl shadow-lg border border-outline-variant/20 z-10 overflow-hidden">
                <button 
                  onClick={() => {
                    const confirmChange = window.confirm(`Ubah status anggota menjadi ${balita.statusHidup === 'Hidup' ? 'Meninggal' : 'Hidup'}?`);
                    if (confirmChange) {
                      if (balita.statusHidup === 'Hidup') {
                        const penyebab = window.prompt("Masukkan penyebab meninggal (opsional):") || "";
                        const tanggal = window.prompt("Masukkan tanggal meninggal (YYYY-MM-DD):", new Date().toISOString().split('T')[0]) || "";
                        handleStatusChange('Meninggal', tanggal, penyebab);
                      } else {
                        handleStatusChange('Hidup');
                      }
                    }
                    setIsMenuOpen(false);
                  }}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-on-surface hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer border-b border-outline-variant/10"
                >
                  <span className="material-symbols-outlined text-sm">settings_heart</span>
                  <span>Ubah Status Hidup</span>
                </button>
                
                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    alert("Fitur edit profile balita terintegrasi dengan KK.");
                  }}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-on-surface hover:bg-slate-100 transition-colors flex items-center gap-2 cursor-pointer border-b border-outline-variant/10"
                >
                  <span className="material-symbols-outlined text-sm">edit</span> Edit
                </button>

                <button 
                  onClick={() => {
                    setIsMenuOpen(false);
                    const confirmDel = window.confirm("Apakah Anda yakin ingin menghapus data balita ini?");
                    if (confirmDel) {
                      import('@/lib/data/db-service').then(m => {
                        m.deleteBalita(balita.id);
                        router.push('/dashboard/balita');
                      });
                    }
                  }}
                  className="w-full px-4 py-3 text-left text-xs font-bold text-red-600 hover:bg-red-50 transition-colors flex items-center gap-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-red-600">delete</span> Hapus
                </button>
              </div>
            )}
          </div>
        </div>
      </section>

      {/* Warnings */}
      {isLocked && (
        <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl flex gap-2 items-start">
          <span className="material-symbols-outlined text-sm">lock</span>
          <p>Riwayat entri data dibekukan karena balita telah mencapai usia 5 tahun ke atas.</p>
        </div>
      )}
      {isDeceased && (
        <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3.5 rounded-xl flex gap-2 items-start">
          <span className="material-symbols-outlined text-sm">block</span>
          <p>Riwayat entri data dikunci karena status kematian anggota.</p>
        </div>
      )}

      {/* Grid Layout for Data */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Data Individu */}
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <h3 className="font-headline text-lg font-bold text-tertiary">Data Individu</h3>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="font-bold text-outline text-xs mb-1">Jenis Kelamin</p>
              <p className="font-semibold text-on-surface">{balita.jenisKelamin === 'L' ? 'Laki-laki' : 'Perempuan'}</p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">Anak Ke-</p>
              <p className="font-semibold text-on-surface">1</p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">Golongan Darah</p>
              <p className="font-semibold text-on-surface">O</p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">Alamat</p>
              <p className="font-semibold text-on-surface">{alamatKk}</p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">Cara Lahir</p>
              <p className="font-semibold text-on-surface">{balita.caraLahir || '-'}</p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">Usia Kehamilan Saat Lahir</p>
              <p className="font-semibold text-on-surface">
                {balita.usiaKehamilanSaatLahirWeeks ? `${balita.usiaKehamilanSaatLahirWeeks} week` : '-'}
              </p>
            </div>
          </div>
        </div>

        {/* Data Orang Tua */}
        <div className="glass-card rounded-2xl p-8 space-y-6">
          <h3 className="font-headline text-lg font-bold text-tertiary">Data Orang Tua</h3>
          <div className="grid grid-cols-2 gap-y-4 text-sm">
            <div>
              <p className="font-bold text-outline text-xs mb-1">Nama Ayah</p>
              <p className="font-semibold text-on-surface">{balita.namaAyah.toUpperCase()}</p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">Nama Ibu</p>
              <p className="font-semibold text-on-surface">{balita.namaIbu.toUpperCase()}</p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">TTL Ayah</p>
              <p className="font-semibold text-on-surface">30 Mei 1997</p>
            </div>
            <div>
              <p className="font-bold text-outline text-xs mb-1">TTL Ibu</p>
              <p className="font-semibold text-on-surface">9 Januari 2003</p>
            </div>
          </div>
        </div>
      </div>

      {/* Grafik Perkembangan */}
      {records.length > 0 && (
        <section className="space-y-6">
          <h3 className="font-headline text-xl font-bold text-on-surface">Grafik Perkembangan</h3>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Weight Chart */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-bold text-sm text-on-surface mb-4">Berat Badan (kg)</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Berat Badan" stroke="#ab2c5d" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Height Chart */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-bold text-sm text-on-surface mb-4">Panjang Badan (cm)</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Panjang Badan" stroke="#0284c7" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Arm Chart */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-bold text-sm text-on-surface mb-4">Lingkar Lengan (cm)</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Lingkar Lengan" stroke="#10b981" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            {/* Head Chart */}
            <div className="glass-card p-6 rounded-2xl">
              <h4 className="font-bold text-sm text-on-surface mb-4">Lingkar Kepala (cm)</h4>
              <div className="h-[200px] w-full">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                    <XAxis dataKey="tanggal" tick={{ fontSize: 10 }} />
                    <YAxis tick={{ fontSize: 10 }} />
                    <Tooltip />
                    <Line type="monotone" dataKey="Lingkar Kepala" stroke="#f59e0b" strokeWidth={3} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Riwayat Pemeriksaan Section */}
      <section className="space-y-6">
        <h3 className="font-headline text-xl font-bold text-on-surface">Riwayat Pemeriksaan</h3>
        
        <div className="space-y-6">
          {records.length === 0 ? (
            <div className="glass-card p-8 text-center text-on-surface-variant font-medium rounded-2xl">
              Belum ada riwayat pemeriksaan.
            </div>
          ) : (
            records.slice().reverse().map((r, idx) => (
              <div 
                key={r.id} 
                className={`glass-card p-8 rounded-2xl space-y-6 relative ${
                  idx > 0 ? 'opacity-85 hover:opacity-100 transition-opacity' : ''
                }`}
              >
                <div className="flex justify-between items-start">
                  <div className="flex items-center gap-3">
                    <span className="material-symbols-outlined text-tertiary">calendar_month</span>
                    <p className="font-headline font-bold text-on-surface text-lg">
                      {new Date(r.tanggalPemeriksaan).toLocaleDateString('id-ID', {
                        day: 'numeric',
                        month: 'long',
                        year: 'numeric'
                      })}
                    </p>
                    {idx === 0 ? (
                      <span className="px-3 py-1 bg-secondary-container text-tertiary rounded-full text-xs font-bold">Terbaru</span>
                    ) : idx === records.length - 1 ? (
                      <span className="px-3 py-1 bg-secondary-container/50 text-on-surface-variant rounded-full text-xs font-semibold">Lahir</span>
                    ) : null}
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-y-6 gap-x-4">
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-outline">Berat Badan</p>
                    <p className="text-sm font-bold text-on-surface">{r.beratBadan} kg</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-outline">Panjang Badan</p>
                    <p className="text-sm font-bold text-on-surface">{r.tinggiBadan} cm</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-outline">Lingkar Lengan</p>
                    <p className="text-sm font-bold text-on-surface">{r.lingkarLengan} cm</p>
                  </div>
                  <div className="space-y-1">
                    <p className="text-xs font-bold text-outline">Lingkar Kepala</p>
                    <p className="text-sm font-bold text-on-surface">{r.lingkarKepala} cm</p>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <p className="text-xs font-bold text-outline">Imunisasi</p>
                    <p className="text-sm font-semibold text-on-surface">{r.imunisasi || '-'}</p>
                  </div>
                  <div className="col-span-2 space-y-2">
                    <p className="text-xs font-bold text-outline">Pemberian Vitamin/Obat</p>
                    <p className="text-sm font-semibold text-on-surface">{r.obatVitamin || '-'}</p>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </section>

      {/* Add Examination Modal */}
      <Dialog isOpen={isExamModalOpen} onClose={() => setIsExamModalOpen(false)}>
        <form onSubmit={handleAddExam} className="flex flex-col max-h-[85vh] overflow-hidden">
          <DialogHeader>
            <DialogTitle>Update Pemeriksaan Balita</DialogTitle>
            <DialogDescription>
              Masukkan hasil pengukuran antropometri dan pemberian obat/vitamin terbaru.
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-4">
            {formError && (
              <div className="text-xs font-semibold text-red-700 bg-red-50 p-2.5 rounded-lg border border-red-200">
                {formError}
              </div>
            )}
            
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div className="space-y-1.5">
                <Label htmlFor="exam_date">Tanggal Pemeriksaan</Label>
                <Input
                  id="exam_date"
                  type="date"
                  value={tanggalPemeriksaan}
                  max={new Date().toISOString().split('T')[0]}
                  onChange={(e) => setTanggalPemeriksaan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam_tb">Tinggi Badan (cm)</Label>
                <Input
                  id="exam_tb"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 75.5"
                  value={tinggiBadan}
                  onChange={(e) => setTinggiBadan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam_bb">Berat Badan (kg)</Label>
                <Input
                  id="exam_bb"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 9.8"
                  value={beratBadan}
                  onChange={(e) => setBeratBadan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam_lk">Lingkar Kepala (cm)</Label>
                <Input
                  id="exam_lk"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 45.2"
                  value={lingkarKepala}
                  onChange={(e) => setLingkarKepala(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam_ll">Lingkar Lengan Atas (cm)</Label>
                <Input
                  id="exam_ll"
                  type="number"
                  step="0.1"
                  placeholder="Contoh: 14.5"
                  value={lingkarLengan}
                  onChange={(e) => setLingkarLengan(e.target.value)}
                  required
                />
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="exam_imunisasi">Imunisasi Diberikan</Label>
                <Input
                  id="exam_imunisasi"
                  placeholder="BCG / Polio / DPT / dll."
                  value={imunisasi}
                  onChange={(e) => setImunisasi(e.target.value)}
                />
              </div>

              <div className="md:col-span-2 space-y-1.5">
                <Label htmlFor="exam_vitamin">Pemberian Obat / Vitamin</Label>
                <Input
                  id="exam_vitamin"
                  placeholder="Vitamin A Merah / Obat Cacing / dll."
                  value={obatVitamin}
                  onChange={(e) => setObatVitamin(e.target.value)}
                />
              </div>
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => {
                setIsExamModalOpen(false);
                resetForm();
              }}
            >
              Batal
            </Button>
            <Button type="submit">
              Simpan Pemeriksaan
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
