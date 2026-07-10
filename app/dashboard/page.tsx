'use client';

import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import { Card, CardContent } from '@/components/ui/card';
import { getBalitas, getIbuHamils, getLansias } from '@/lib/data/db-service';
import { calculateAge } from '@/lib/utils/health';

export default function DashboardOverviewPage() {
  const [stats, setStats] = useState({
    bayi: 0,
    balita: 0,
    ibuHamil: 0,
    pralansia: 0,
    lansia: 0,
    resikoTinggi: 0,
  });

  useEffect(() => {
    const balitas = getBalitas().filter(b => b.statusHidup === 'Hidup');
    const ibuHamils = getIbuHamils().filter(i => i.statusHidup === 'Hidup');
    const lansias = getLansias().filter(l => l.statusHidup === 'Hidup');

    let bayiCount = 0;
    let balitaCount = 0;
    
    balitas.forEach((b) => {
      const age = calculateAge(b.tanggalLahir);
      if (age.totalMonths <= 12) {
        bayiCount++;
      } else if (age.years < 5) {
        balitaCount++;
      }
    });

    let pralansiaCount = 0;
    let lansiaCount = 0;
    let resikoTinggiCount = 0;

    lansias.forEach((l) => {
      const age = calculateAge(l.tanggalLahir);
      if (age.years >= 45 && age.years < 50) {
        pralansiaCount++;
      } else if (age.years >= 50 && age.years < 60) {
        lansiaCount++;
      } else if (age.years >= 60) {
        resikoTinggiCount++;
      }
    });

    setStats({
      bayi: bayiCount,
      balita: balitaCount,
      ibuHamil: ibuHamils.length,
      pralansia: pralansiaCount,
      lansia: lansiaCount,
      resikoTinggi: resikoTinggiCount,
    });
  }, []);

  return (
    <div className="max-w-6xl mx-auto w-full space-y-8 animate-in fade-in duration-300">
      <div>
        <h2 className="font-headline text-3xl font-bold text-on-background">Dashboard Overview</h2>
        <p className="text-sm text-on-surface-variant mt-1">
          Rekapitulasi cepat status dan jumlah keanggotaan Posyandu 3000.
        </p>
      </div>

      {/* Bento Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Card 1: Total Bayi */}
        <Link href="/dashboard/balita" className="block">
          <Card className="p-6 flex flex-col justify-between h-36 cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <span className="font-medium text-sm text-on-surface-variant">Total Bayi (0-12 bln)</span>
              <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                child_care
              </span>
            </div>
            <div className="font-headline text-4xl font-extrabold text-on-background">{stats.bayi}</div>
          </Card>
        </Link>

        {/* Card 2: Total Balita */}
        <Link href="/dashboard/balita" className="block">
          <Card className="p-6 flex flex-col justify-between h-36 cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <span className="font-medium text-sm text-on-surface-variant">Total Balita (1-5 thn)</span>
              <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                accessibility_new
              </span>
            </div>
            <div className="font-headline text-4xl font-extrabold text-on-background">{stats.balita}</div>
          </Card>
        </Link>

        {/* Card 3: Total Ibu Hamil */}
        <Link href="/dashboard/ibu-hamil" className="block">
          <Card className="p-6 flex flex-col justify-between h-36 cursor-pointer">
            <div className="flex justify-between items-start mb-4">
              <span className="font-medium text-sm text-on-surface-variant">Total Ibu Hamil</span>
              <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                pregnant_woman
              </span>
            </div>
            <div className="font-headline text-4xl font-extrabold text-on-background">{stats.ibuHamil}</div>
          </Card>
        </Link>
      </div>

      {/* Lansia section */}
      <div className="space-y-4">
        <h3 className="font-headline text-xl font-bold text-on-background flex items-center gap-2">
          <span className="material-symbols-outlined text-tertiary">elderly</span>
          Kategori Lansia
        </h3>
        
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Pralansia */}
          <Link href="/dashboard/lansia" className="block">
            <Card className="p-6 flex flex-col gap-4 cursor-pointer">
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm text-on-surface-variant">Pralansia</span>
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  person
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-3xl font-extrabold text-on-background">{stats.pralansia}</span>
                <span className="text-xs text-on-surface-variant mt-1">(45-50 tahun)</span>
              </div>
            </Card>
          </Link>

          {/* Lansia */}
          <Link href="/dashboard/lansia" className="block">
            <Card className="p-6 flex flex-col gap-4 cursor-pointer">
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm text-on-surface-variant">Lansia</span>
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  elderly
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-3xl font-extrabold text-on-background">{stats.lansia}</span>
                <span className="text-xs text-on-surface-variant mt-1">(50-60 tahun)</span>
              </div>
            </Card>
          </Link>

          {/* Lanjut Usia Resiko Tinggi */}
          <Link href="/dashboard/lansia" className="block">
            <Card className="p-6 flex flex-col gap-4 cursor-pointer">
              <div className="flex justify-between items-start">
                <span className="font-medium text-sm text-on-surface-variant">Lanjut Usia Resiko Tinggi</span>
                <span className="material-symbols-outlined text-tertiary" style={{ fontVariationSettings: "'FILL' 1" }}>
                  assist_walker
                </span>
              </div>
              <div className="flex flex-col">
                <span className="font-headline text-3xl font-extrabold text-on-background">{stats.resikoTinggi}</span>
                <span className="text-xs text-on-surface-variant mt-1">(60 tahun keatas)</span>
              </div>
            </Card>
          </Link>
        </div>
      </div>
    </div>
  );
}
