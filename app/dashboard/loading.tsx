import React from 'react';

export default function Loading() {
  return (
    <div className="flex-1 flex items-center justify-center bg-[#FFFDFE] min-h-[70vh] w-full">
      <div className="flex flex-col items-center gap-4">
        <span className="material-symbols-outlined text-5xl text-tertiary animate-heartbeat" style={{ fontVariationSettings: "'FILL' 1" }}>
          favorite
        </span>
        <div className="w-28 h-1 bg-tertiary-fixed rounded-full overflow-hidden relative">
          <div className="absolute top-0 left-0 h-full w-full bg-tertiary rounded-full animate-progress-slide" />
        </div>
        <span className="text-sm font-semibold text-tertiary tracking-wide animate-pulse">Memuat halaman...</span>
      </div>
    </div>
  );
}
