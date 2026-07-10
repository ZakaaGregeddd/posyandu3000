'use client';

import React, { useState } from 'react';
import { StatusHidup } from '@/lib/data/types';
import { Dialog, DialogHeader, DialogTitle, DialogDescription, DialogContent, DialogFooter } from '../ui/dialog';
import { Button } from '../ui/button';
import { Label } from '../ui/label';
import { Input } from '../ui/input';

interface StatusHidupControlProps {
  currentStatus: StatusHidup;
  tanggalMeninggal?: string;
  penyebabMeninggal?: string;
  onStatusChange: (status: StatusHidup, tanggal?: string, penyebab?: string) => void;
  disabled?: boolean;
}

export default function StatusHidupControl({
  currentStatus,
  tanggalMeninggal,
  penyebabMeninggal,
  onStatusChange,
  disabled = false
}: StatusHidupControlProps) {
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [deathDate, setDeathDate] = useState(new Date().toISOString().split('T')[0]);
  const [cause, setCause] = useState('');
  const [validationError, setValidationError] = useState('');

  const handleToggleClick = () => {
    if (disabled) return;
    if (currentStatus === 'Hidup') {
      setIsModalOpen(true);
    } else {
      // Toggle back to Hidup
      if (confirm('Apakah Anda yakin ingin mengubah status kembali menjadi Hidup? Data kematian sebelumnya akan dihapus.')) {
        onStatusChange('Hidup');
      }
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!deathDate) {
      setValidationError('Tanggal meninggal harus diisi');
      return;
    }
    if (!cause.trim()) {
      setValidationError('Penyebab meninggal harus diisi');
      return;
    }
    
    setValidationError('');
    setIsModalOpen(false);
    onStatusChange('Meninggal', deathDate, cause);
  };

  return (
    <div className="flex flex-col gap-2">
      <div className="flex items-center gap-3">
        <span className="text-sm font-semibold text-on-surface-variant">Status Hidup:</span>
        <button
          type="button"
          onClick={handleToggleClick}
          disabled={disabled}
          className={`px-4 py-1.5 rounded-full text-xs font-bold border transition-all flex items-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed ${
            currentStatus === 'Hidup'
              ? 'bg-teal-50 text-teal-700 border-teal-200 hover:bg-teal-100 hover:border-teal-300'
              : 'bg-red-50 text-red-700 border-red-200 hover:bg-red-100 hover:border-red-300'
          }`}
        >
          <span className={`w-2.5 h-2.5 rounded-full ${currentStatus === 'Hidup' ? 'bg-teal-500' : 'bg-red-500'}`} />
          {currentStatus}
        </button>
      </div>

      {currentStatus === 'Meninggal' && (tanggalMeninggal || penyebabMeninggal) && (
        <div className="text-xs bg-red-50/70 border border-red-100 text-red-800 rounded-xl p-3 max-w-sm mt-1 animate-in fade-in slide-in-from-top-1 duration-200">
          <p className="font-semibold mb-0.5">Detail Kematian:</p>
          {tanggalMeninggal && (
            <p>
              <span className="font-medium text-red-600">Tanggal:</span>{' '}
              {new Date(tanggalMeninggal).toLocaleDateString('id-ID', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
              })}
            </p>
          )}
          {penyebabMeninggal && (
            <p>
              <span className="font-medium text-red-600">Penyebab:</span> {penyebabMeninggal}
            </p>
          )}
        </div>
      )}

      {/* Modal Kematian */}
      <Dialog isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <form onSubmit={handleSubmit}>
          <DialogHeader>
            <DialogTitle className="text-red-700 flex items-center gap-2">
              <span className="material-symbols-outlined text-red-600">warning</span>
              Ubah Status Kematian
            </DialogTitle>
            <DialogDescription>
              Silakan masukkan tanggal dan penyebab kematian anggota ini. Tindakan ini akan membekukan riwayat pemeriksaan selanjutnya.
            </DialogDescription>
          </DialogHeader>

          <DialogContent className="space-y-4">
            {validationError && (
              <div className="text-xs font-semibold text-red-600 bg-red-50 p-2.5 rounded-lg border border-red-100">
                {validationError}
              </div>
            )}
            <div className="space-y-1.5">
              <Label htmlFor="deathDate">Tanggal Meninggal</Label>
              <Input
                id="deathDate"
                type="date"
                value={deathDate}
                max={new Date().toISOString().split('T')[0]}
                onChange={(e) => setDeathDate(e.target.value)}
              />
            </div>

            <div className="space-y-1.5">
              <Label htmlFor="cause">Penyebab Meninggal</Label>
              <textarea
                id="cause"
                value={cause}
                rows={3}
                placeholder="Contoh: Sakit DBD, Usia lanjut, dll."
                className="flex w-full rounded-lg border border-outline-variant bg-white px-3 py-2 text-sm text-on-background placeholder:text-outline focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-tertiary focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 transition-all resize-none"
                onChange={(e) => setCause(e.target.value)}
              />
            </div>
          </DialogContent>

          <DialogFooter>
            <Button
              type="button"
              variant="outline"
              onClick={() => setIsModalOpen(false)}
            >
              Batal
            </Button>
            <Button type="submit" variant="destructive">
              Simpan & Nonaktifkan
            </Button>
          </DialogFooter>
        </form>
      </Dialog>
    </div>
  );
}
