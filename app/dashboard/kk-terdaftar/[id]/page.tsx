"use client";

import React, { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogFooter,
} from "@/components/ui/dialog";
import { getKKByNoKk, deleteKK, getBalitas, getIbuHamils, getLansias } from "@/lib/data/db-service";
import { KK, Balita, IbuHamil, Lansia } from "@/lib/data/types";
import { calculateAge } from "@/lib/utils/health";

export default function KKDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const router = useRouter();
  const [id, setId] = useState<string | null>(null);

  // Data States
  const [kk, setKk] = useState<KK | null>(null);
  const [balitas, setBalitas] = useState<Balita[]>([]);
  const [ibuHamils, setIbuHamils] = useState<IbuHamil[]>([]);
  const [lansias, setLansias] = useState<Lansia[]>([]);

  // Modal States
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);

  // Resolve params
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  // Load Data
  const loadData = () => {
    if (!id) return;
    const foundKk = getKKByNoKk(id);
    if (!foundKk) {
      router.push("/dashboard/kk-terdaftar");
      return;
    }
    setKk(foundKk);
    setBalitas(getBalitas());
    setIbuHamils(getIbuHamils());
    setLansias(getLansias());
  };

  useEffect(() => {
    loadData();
  }, [id]);

  if (!kk) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-on-surface-variant animate-pulse">Memuat data keluarga...</div>
      </div>
    );
  }

  // Calculate member list for the KK
  const getKKMembersList = () => {
    const list: { id: string; name: string; role: string; ageText: string; subText: string; statusTag: string; routePath: string }[] = [];

    // Find in Balitas
    balitas
      .filter((b) => b.noKk === kk.noKk)
      .forEach((b) => {
        const age = calculateAge(b.tanggalLahir);
        list.push({
          id: b.id,
          name: b.nama,
          role: "Balita",
          ageText: `${age.totalMonths} Bulan • Anak`,
          subText: `${b.tempatLahir}, ${b.tanggalLahir}`,
          statusTag: "Gizi Baik",
          routePath: `/dashboard/balita/${b.id}`,
        });
      });

    // Find in Ibu Hamils
    ibuHamils
      .filter((i) => i.noKk === kk.noKk)
      .forEach((i) => {
        const age = calculateAge(i.tanggalLahir);
        list.push({
          id: i.id,
          name: i.nama,
          role: "Ibu Hamil",
          ageText: `${age.years} Tahun • Ibu`,
          subText: `HPHT: ${i.hpht}`,
          statusTag: "Trimester 3",
          routePath: `/dashboard/ibu-hamil/${i.id}`,
        });
      });

    // Find in Lansia
    lansias
      .filter((l) => l.noKk === kk.noKk)
      .forEach((l) => {
        const age = calculateAge(l.tanggalLahir);
        let relation = "Orang Tua / Mertua";
        if (l.nama.toLowerCase() === kk.namaKepalaKeluarga.toLowerCase()) {
          relation = "Kepala Keluarga";
        } else if (kk.namaIbu && l.nama.toLowerCase() === kk.namaIbu.toLowerCase()) {
          relation = "Istri";
        }
        list.push({
          id: l.id,
          name: l.nama,
          role: "Lansia",
          ageText: `${age.years} Tahun • ${relation}`,
          subText: `${l.tempatLahir}, ${l.tanggalLahir}`,
          statusTag: "Lansia Mandiri",
          routePath: `/dashboard/lansia/${l.id}`,
        });
      });



    // Add Ibu if present in KK and not already in list
    if (kk.namaIbu && !list.some((m) => m.name.toLowerCase() === kk.namaIbu?.toLowerCase())) {
      list.push({
        id: kk.nikIbu || `ibu_${kk.noKk}`,
        name: kk.namaIbu,
        role: "Ibu",
        ageText: "Istri",
        subText: kk.nikIbu ? `NIK: ${kk.nikIbu}` : "NIK tidak diisi",
        statusTag: "Sehat",
        routePath: "#",
      });
    }

    return list;
  };

  const members = getKKMembersList();

  const handleDelete = () => {
    deleteKK(kk.noKk);
    router.push("/dashboard/kk-terdaftar");
  };

  return (
    <div className="max-w-[1440px] mx-auto w-full space-y-6 animate-in fade-in duration-300">
      {/* Action Header & Back Button */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/10 pb-4">
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-surface">Informasi Keluarga</h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Manajemen data kesehatan terpadu untuk keluarga terdaftar.
          </p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/kk-terdaftar")}
            className="flex items-center gap-2"
          >
            <span className="material-symbols-outlined text-sm">arrow_back</span>
            <span>Kembali</span>
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
            className="flex items-center gap-2 font-bold"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Hapus KK
          </Button>
        </div>
      </div>

      {/* Family Info Top Card */}
      <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/20 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>
        
        <div className="lg:col-span-4 flex flex-col items-center text-center lg:items-start lg:text-left border-b lg:border-b-0 lg:border-r border-outline-variant/30 pb-6 lg:pb-0 lg:pr-8">
          <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mb-4 text-tertiary">
            <span className="material-symbols-outlined text-[40px]" style={{ fontVariationSettings: "'FILL' 1" }}>
              groups
            </span>
          </div>
          <h3 className="font-headline text-xl font-bold text-on-surface mb-1">
            {kk.namaKepalaKeluarga}
          </h3>
          <p className="text-tertiary font-bold text-xs mb-1">
            {kk.tanggalLahirAyah ? `${calculateAge(kk.tanggalLahirAyah).years} Tahun • Ayah` : "Kepala Keluarga"}
          </p>
          {(() => {
            const headNik = kk.nikAyah || '';
            const headName = kk.namaKepalaKeluarga.toLowerCase();
            const matchedBalita = balitas.find(b => (b.nik && b.nik === headNik) || b.nama.toLowerCase() === headName);
            const matchedBumil = ibuHamils.find(i => (i.nik && i.nik === headNik) || i.nama.toLowerCase() === headName);
            const matchedLansia = lansias.find(l => (l.nik && l.nik === headNik) || l.nama.toLowerCase() === headName);

            let route = '';
            if (matchedLansia) route = `/dashboard/lansia/${matchedLansia.id}`;
            else if (matchedBumil) route = `/dashboard/ibu-hamil/${matchedBumil.id}`;
            else if (matchedBalita) route = `/dashboard/balita/${matchedBalita.id}`;

            if (route) {
              return (
                <Link
                  href={route}
                  className="mt-3 flex items-center gap-1.5 text-xs font-bold text-tertiary hover:underline"
                >
                  <span className="material-symbols-outlined text-sm">visibility</span>
                  Lihat detail
                </Link>
              );
            } else {
              return (
                <span className="mt-3 inline-flex items-center gap-1 text-xs text-on-surface-variant font-medium opacity-60">
                  <span className="material-symbols-outlined text-sm">info</span>
                  Belum ada data kunjungan
                </span>
              );
            }
          })()}
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
          <div className="space-y-1">
            <label className="text-xs text-on-surface-variant font-medium">Nomor Kartu Keluarga</label>
            <p className="font-bold tracking-wider text-on-surface text-lg">{kk.noKk}</p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-on-surface-variant font-medium">No. Telepon / WhatsApp</label>
            <p className="font-medium text-on-surface text-lg">
              {kk.noTelp || 'Tidak tersedia'}
            </p>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-on-surface-variant font-medium">Alamat Domisili</label>
            <p className="text-on-surface leading-relaxed text-md">
              {kk.alamat} (RT {kk.rt} / RW {kk.rw})
            </p>
          </div>
        </div>
      </div>

      {/* Member Section (Bento Style) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <h4 className="font-headline text-xl font-bold text-on-surface">Anggota Keluarga</h4>
          <span className="px-4 py-1 bg-surface-container-high rounded-full text-xs font-bold text-on-surface-variant">
            {members.length} Terdaftar
          </span>
        </div>

        {members.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 rounded-xl text-center border border-outline-variant/20 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-2">person_off</span>
            <p>Belum ada anggota keluarga terdaftar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {members.map((m, idx) => {
              // Determine border and icon color based on role
              let borderCol = "border-teal-400";
              let bgCol = "bg-teal-50";
              let textCol = "text-teal-600";
              let icon = "child_care";

              if (m.role === "Lansia") {
                borderCol = "border-blue-400";
                bgCol = "bg-blue-50";
                textCol = "text-blue-600";
                icon = "elderly";
              } else if (m.role === "Ibu Hamil") {
                borderCol = "border-rose-400";
                bgCol = "bg-rose-50";
                textCol = "text-rose-600";
                icon = "pregnant_woman";
              } else if (m.role === "Ayah") {
                borderCol = "border-slate-400";
                bgCol = "bg-slate-50";
                textCol = "text-slate-600";
                icon = "man";
              } else if (m.role === "Ibu") {
                borderCol = "border-pink-400";
                bgCol = "bg-pink-50";
                textCol = "text-pink-600";
                icon = "woman";
              }

              return (
                <div
                  key={idx}
                  className={`bg-surface-container-lowest p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border-b-4 ${borderCol} flex flex-col justify-between hover:shadow-lg transition-all hover:-translate-y-1 group`}
                >
                  <div>
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 ${bgCol} rounded-xl ${textCol}`}>
                        <span className="material-symbols-outlined" style={{ fontVariationSettings: "'FILL' 1" }}>
                          {icon}
                        </span>
                      </div>
                      <span className={`px-3 py-1 ${bgCol} ${textCol} text-[10px] font-bold rounded-full uppercase tracking-tight`}>
                        {m.role}
                      </span>
                    </div>
                    <h5 className="font-headline font-bold text-md text-on-surface line-clamp-1">
                      {m.name}
                    </h5>
                    <p className="text-on-surface-variant text-xs mb-3">{m.ageText}</p>
                    
                    <div className={`inline-flex items-center gap-2 px-3 py-1 ${bgCol} ${textCol} rounded-lg text-xs font-medium mb-8`}>
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                      {m.statusTag}
                    </div>
                  </div>

                  {m.routePath !== "#" ? (
                    <Button
                      onClick={() => router.push(m.routePath)}
                      className="w-full py-2.5 bg-secondary-container text-tertiary hover:bg-tertiary hover:text-white transition-all font-bold"
                    >
                      Lihat Detail
                    </Button>
                  ) : (
                    <div className="w-full py-2 text-center text-xs text-on-surface-variant font-medium bg-surface-container-low rounded-lg">
                      Tidak ada riwayat kunjungan
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Additional Context / Action Footer */}
      <div className="bg-surface-container p-6 rounded-xl flex flex-col md:flex-row items-center justify-between gap-4 border border-outline-variant/10">
        <div className="flex items-center gap-4">
          <div className="p-2.5 bg-white text-tertiary rounded-full shadow-sm">
            <span className="material-symbols-outlined">history</span>
          </div>
          <div>
            <p className="font-bold text-on-surface text-sm">Riwayat Kunjungan Terakhir</p>
            <p className="text-xs text-on-surface-variant">12 Oktober 2024 - Posyandu Balita Melati</p>
          </div>
        </div>
        <button className="text-tertiary font-bold hover:underline text-sm">Lihat Semua Riwayat</button>
      </div>

      {/* Delete Confirmation Dialog */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <DialogHeader>
          <div className="w-12 h-12 bg-red-50 text-error rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <DialogTitle className="text-center text-error">Hapus Kartu Keluarga?</DialogTitle>
          <DialogDescription className="text-center mt-1">
            Apakah Anda yakin ingin menghapus KK {kk.noKk} ({kk.namaKepalaKeluarga})? 
            Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
            Batalkan
          </Button>
          <Button variant="destructive" onClick={handleDelete}>
            Ya, Hapus Data
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
