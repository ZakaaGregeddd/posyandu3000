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
import {
  getKKByNoKk,
  deleteKK,
  getKKMembers,
  KK,
  KKMember,
} from "@/lib/fetch/keluarga";
import { deleteIndividu } from "@/lib/fetch/individu";
import EditKKModal from "@/components/keluarga/EditKKModal";
import EditIndividuModal from "@/components/keluarga/EditIndividuModal";
import MemberActionsMenu from "@/components/keluarga/MemberActionsMenu";
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
  const [members, setMembers] = useState<KKMember[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  // Modal States - KK
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);

  // Modal States - Anggota (individu)
  const [editingMember, setEditingMember] = useState<KKMember | null>(null);
  const [isEditMemberOpen, setIsEditMemberOpen] = useState(false);

  const [deletingMember, setDeletingMember] = useState<KKMember | null>(null);
  const [isDeleteMemberOpen, setIsDeleteMemberOpen] = useState(false);
  const [isDeletingMember, setIsDeletingMember] = useState(false);
  const [memberDeleteError, setMemberDeleteError] = useState("");

  // Resolve params
  useEffect(() => {
    params.then((p) => setId(p.id));
  }, [params]);

  // Load Data
  const loadMembers = async (noKk: string) => {
    try {
      const memberList = await getKKMembers(noKk);
      setMembers(memberList);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    if (!id) return;
    let active = true;

    (async () => {
      setIsLoading(true);
      try {
        const foundKk = await getKKByNoKk(id);
        if (!active) return;

        if (!foundKk) {
          router.push("/dashboard/kk-terdaftar");
          return;
        }
        setKk(foundKk);

        const memberList = await getKKMembers(id);
        if (active) setMembers(memberList);
      } catch (err) {
        console.error(err);
      } finally {
        if (active) setIsLoading(false);
      }
    })();

    return () => {
      active = false;
    };
  }, [id, router]);

  if (isLoading || !kk) {
    return (
      <div className="flex-1 flex items-center justify-center p-12">
        <div className="text-on-surface-variant animate-pulse">
          Memuat data keluarga...
        </div>
      </div>
    );
  }

  const kepalaKeluarga = members.find(
    (m) => m.hubunganKeluarga === "Kepala Keluarga",
  );

  const handleDelete = async () => {
    setIsDeleting(true);
    try {
      await deleteKK(kk.noKk);
      router.push("/dashboard/kk-terdaftar");
    } catch (err: any) {
      alert(err.message || "Gagal menghapus KK");
      setIsDeleting(false);
    }
  };

  const handleEditSuccess = async (updated: KK) => {
    setKk(updated);
    await loadMembers(updated.noKk);
  };

  const handleEditMemberSuccess = async () => {
    setIsEditMemberOpen(false);
    setEditingMember(null);
    if (kk) await loadMembers(kk.noKk);
  };

  const handleDeleteMember = async () => {
    if (!deletingMember) return;
    setMemberDeleteError("");
    setIsDeletingMember(true);
    try {
      await deleteIndividu(deletingMember.id); // KKMember.id = nik
      setIsDeleteMemberOpen(false);
      setDeletingMember(null);
      if (kk) await loadMembers(kk.noKk);
    } catch (err: any) {
      setMemberDeleteError(err.message || "Gagal menghapus anggota");
    } finally {
      setIsDeletingMember(false);
    }
  };

  return (
    <div className="max-w-[1440px] mx-auto w-full space-y-6 animate-in fade-in duration-300">
      {/* Action Header & Back Button */}
      <div className="flex flex-col md:flex-row md:items-end justify-between gap-4 border-b border-outline-variant/10 pb-4">
        <div>
          <h2 className="font-headline text-3xl font-bold text-on-surface">
            Informasi Keluarga
          </h2>
          <p className="text-sm text-on-surface-variant mt-1">
            Manajemen data kesehatan terpadu untuk keluarga terdaftar.
          </p>
        </div>
        <div className="flex flex-wrap gap-2 w-full md:w-auto">
          <Button
            variant="outline"
            onClick={() => router.push("/dashboard/kk-terdaftar")}
            className="flex items-center justify-center gap-2 flex-1 md:flex-initial"
          >
            <span className="material-symbols-outlined text-sm">
              arrow_back
            </span>
            <span>Kembali</span>
          </Button>
          <Button
            variant="outline"
            onClick={() => setIsEditOpen(true)}
            className="flex items-center justify-center gap-2 font-bold flex-1 md:flex-initial text-tertiary border-tertiary/40 hover:bg-secondary-container"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            <span>Edit</span>
          </Button>
          <Button
            variant="destructive"
            onClick={() => setIsDeleteOpen(true)}
            className="flex items-center justify-center gap-2 font-bold flex-1 md:flex-initial"
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            <span>Hapus KK</span>
          </Button>
        </div>
      </div>

      {/* Family Info Top Card */}
      <div className="bg-surface-container-lowest rounded-xl p-8 border border-outline-variant/20 shadow-[0px_4px_20px_rgba(0,0,0,0.04)] grid grid-cols-1 lg:grid-cols-12 gap-8 relative overflow-hidden">
        <div className="absolute top-0 right-0 w-64 h-64 bg-tertiary/5 rounded-full -mr-20 -mt-20 blur-3xl"></div>

        <div className="lg:col-span-4 flex flex-col items-center text-center lg:items-start lg:text-left border-b lg:border-b-0 lg:border-r border-outline-variant/30 pb-6 lg:pb-0 lg:pr-8">
          <div className="w-20 h-20 bg-secondary-container rounded-full flex items-center justify-center mb-4 text-tertiary">
            <span
              className="material-symbols-outlined text-[40px]"
              style={{ fontVariationSettings: "'FILL' 1" }}
            >
              groups
            </span>
          </div>
          <h3 className="font-headline text-xl font-bold text-on-surface mb-1">
            {kk.namaKepalaKeluarga}
          </h3>
          <p className="text-tertiary font-bold text-xs mb-1">
            {kk.tanggalLahirAyah
              ? `${calculateAge(kk.tanggalLahirAyah).years} Tahun • Ayah`
              : "Kepala Keluarga"}
          </p>
          {kepalaKeluarga && kepalaKeluarga.routePath !== "#" ? (
            <Link
              href={kepalaKeluarga.routePath}
              className="mt-3 flex items-center gap-1.5 text-xs font-bold text-tertiary hover:underline"
            >
              <span className="material-symbols-outlined text-sm">
                visibility
              </span>
              Lihat detail
            </Link>
          ) : (
            <span className="mt-3 inline-flex items-center gap-1 text-xs text-on-surface-variant font-medium opacity-60">
              <span className="material-symbols-outlined text-sm">info</span>
              Belum ada data kunjungan
            </span>
          )}
        </div>

        <div className="lg:col-span-8 grid grid-cols-1 md:grid-cols-2 gap-y-6 gap-x-12">
          <div className="space-y-1">
            <label className="text-xs text-on-surface-variant font-medium">
              Nomor Kartu Keluarga
            </label>
            <p className="font-bold tracking-wider text-on-surface text-lg">
              {kk.noKk}
            </p>
          </div>
          <div className="space-y-1">
            <label className="text-xs text-on-surface-variant font-medium">
              No. Telepon / WhatsApp
            </label>
            <p className="font-medium text-on-surface text-lg">
              {kk.noTelp || "Tidak tersedia"}
            </p>
          </div>
          <div className="space-y-1 md:col-span-2">
            <label className="text-xs text-on-surface-variant font-medium">
              Alamat Domisili
            </label>
            <p className="text-on-surface leading-relaxed text-md">
              {kk.alamat} (RT {kk.rt} / RW {kk.rw})
            </p>
          </div>
        </div>
      </div>

      {/* Member Section (Bento Style) */}
      <div className="space-y-4">
        <div className="flex items-center justify-between border-b border-outline-variant/20 pb-4">
          <h4 className="font-headline text-xl font-bold text-on-surface">
            Anggota Keluarga
          </h4>
          <span className="px-4 py-1 bg-surface-container-high rounded-full text-xs font-bold text-on-surface-variant">
            {members.length} Terdaftar
          </span>
        </div>

        {members.length === 0 ? (
          <div className="bg-surface-container-lowest p-12 rounded-xl text-center border border-outline-variant/20 text-on-surface-variant">
            <span className="material-symbols-outlined text-5xl text-on-surface-variant/40 mb-2">
              person_off
            </span>
            <p>Belum ada anggota keluarga terdaftar.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {members.map((m) => {
              const age = calculateAge(m.tanggalLahir);

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
              } else if (m.role === "Dewasa") {
                borderCol = "border-violet-400";
                bgCol = "bg-violet-50";
                textCol = "text-violet-600";
                icon = "person";
              }

              const statusTag =
                m.statusHidup === "Meninggal"
                  ? "Meninggal"
                  : m.role === "Balita"
                    ? "Gizi Baik"
                    : m.role === "Lansia"
                      ? "Lansia Mandiri"
                      : m.role === "Ibu Hamil"
                        ? "Sedang Hamil"
                        : "Sehat";

              // Kepala keluarga tidak bisa dihapus lewat sini karena akan
              // mempengaruhi struktur KK (namaKepalaKeluarga, referensi
              // ayah/ibu). Kalau memang perlu, arahkan ke flow edit KK.
              const isKepalaKeluarga = m.hubunganKeluarga === "Kepala Keluarga";

              return (
                <div
                  key={m.id}
                  className={`bg-surface-container-lowest p-6 rounded-xl shadow-[0px_4px_20px_rgba(0,0,0,0.04)] border-b-4 ${borderCol} flex flex-col justify-between hover:shadow-lg transition-all hover:-translate-y-1 group ${
                    m.statusHidup === "Meninggal" ? "opacity-70" : ""
                  }`}
                >
                  <div>
                    {/* Header: ikon role + badge role saja (tanpa menu) */}
                    <div className="flex justify-between items-start mb-6">
                      <div className={`p-3 ${bgCol} rounded-xl ${textCol}`}>
                        <span
                          className="material-symbols-outlined"
                          style={{ fontVariationSettings: "'FILL' 1" }}
                        >
                          {icon}
                        </span>
                      </div>

                      <span
                        className={`px-3 py-1 ${bgCol} ${textCol} text-[10px] font-bold rounded-full uppercase tracking-tight`}
                      >
                        {m.role}
                      </span>
                    </div>

                    <h5 className="font-headline font-bold text-md text-on-surface line-clamp-1">
                      {m.nama}
                    </h5>
                    <p className="text-on-surface-variant text-xs mb-3">
                      {age.text} • {m.hubunganKeluarga || m.role}
                    </p>

                    <div
                      className={`inline-flex items-center gap-2 px-3 py-1 ${bgCol} ${textCol} rounded-lg text-xs font-medium mb-8`}
                    >
                      <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse"></span>
                      {statusTag}
                    </div>
                  </div>

                  {/* Baris bawah: tombol aksi utama + menu titik tiga di sampingnya */}
                  <div className="flex items-center gap-2">
                    {m.routePath !== "#" ? (
                      <Button
                        onClick={() => router.push(m.routePath)}
                        className="flex-1 py-2.5 bg-secondary-container text-tertiary hover:bg-tertiary hover:text-white transition-all font-bold"
                      >
                        Lihat Detail
                      </Button>
                    ) : (
                      <div className="flex-1 py-2 text-center text-xs text-on-surface-variant font-medium bg-surface-container-low rounded-lg">
                        Tidak ada riwayat kunjungan
                      </div>
                    )}
                    <MemberActionsMenu
                      disableDelete={isKepalaKeluarga}
                      onEdit={() => {
                        setEditingMember(m);
                        setIsEditMemberOpen(true);
                      }}
                      onDelete={() => {
                        setMemberDeleteError("");
                        setDeletingMember(m);
                        setIsDeleteMemberOpen(true);
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Edit KK Modal */}
      {kk && (
        <EditKKModal
          isOpen={isEditOpen}
          onClose={() => setIsEditOpen(false)}
          kk={kk}
          onSuccess={handleEditSuccess}
        />
      )}

      {/* Delete KK Confirmation Dialog */}
      <Dialog isOpen={isDeleteOpen} onClose={() => setIsDeleteOpen(false)}>
        <DialogHeader>
          <div className="w-12 h-12 bg-red-50 text-error rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <DialogTitle className="text-center text-error">
            Hapus Kartu Keluarga?
          </DialogTitle>
          <DialogDescription className="text-center mt-1">
            Apakah Anda yakin ingin menghapus KK {kk.noKk} (
            {kk.namaKepalaKeluarga})? Semua data anggota keluarga di dalamnya
            akan ikut terhapus. Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        <DialogFooter className="sm:justify-center gap-2">
          <Button variant="outline" onClick={() => setIsDeleteOpen(false)}>
            Batalkan
          </Button>
          <Button
            variant="destructive"
            onClick={handleDelete}
            disabled={isDeleting}
          >
            {isDeleting ? "Menghapus..." : "Ya, Hapus Data"}
          </Button>
        </DialogFooter>
      </Dialog>

      {/* Edit Individu (Anggota) Modal */}
      {editingMember && (
        <EditIndividuModal
          isOpen={isEditMemberOpen}
          onClose={() => {
            setIsEditMemberOpen(false);
            setEditingMember(null);
          }}
          member={editingMember}
          onSuccess={handleEditMemberSuccess}
        />
      )}

      {/* Delete Individu (Anggota) Confirmation Dialog */}
      <Dialog
        isOpen={isDeleteMemberOpen}
        onClose={() => {
          setIsDeleteMemberOpen(false);
          setDeletingMember(null);
        }}
      >
        <DialogHeader>
          <div className="w-12 h-12 bg-red-50 text-error rounded-full flex items-center justify-center mx-auto mb-4 border border-red-200">
            <span className="material-symbols-outlined text-2xl">warning</span>
          </div>
          <DialogTitle className="text-center text-error">
            Hapus Anggota Keluarga?
          </DialogTitle>
          <DialogDescription className="text-center mt-1">
            Apakah Anda yakin ingin menghapus {deletingMember?.nama} dari data
            keluarga ini? Seluruh riwayat pemeriksaan miliknya akan ikut
            terhapus. Tindakan ini tidak dapat dibatalkan.
          </DialogDescription>
        </DialogHeader>
        {memberDeleteError && (
          <div className="text-xs font-semibold text-red-700 bg-red-50 border border-red-200 p-3 rounded-lg mx-6">
            {memberDeleteError}
          </div>
        )}
        <DialogFooter className="sm:justify-center gap-2">
          <Button
            variant="outline"
            onClick={() => {
              setIsDeleteMemberOpen(false);
              setDeletingMember(null);
            }}
          >
            Batalkan
          </Button>
          <Button
            variant="destructive"
            onClick={handleDeleteMember}
            disabled={isDeletingMember}
          >
            {isDeletingMember ? "Menghapus..." : "Ya, Hapus"}
          </Button>
        </DialogFooter>
      </Dialog>
    </div>
  );
}
