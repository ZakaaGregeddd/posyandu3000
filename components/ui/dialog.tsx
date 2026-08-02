"use client";

import * as React from "react";
import { createPortal } from "react-dom";
import { Button } from "./button";

export interface DialogProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

export function Dialog({ isOpen, onClose, children }: DialogProps) {
  // Portal butuh document.body, yang cuma ada di client. mounted dipakai
  // supaya SSR/hydration Next.js tidak error karena document belum ada di
  // server.
  const [mounted, setMounted] = React.useState(false);
  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Simpan referensi terbaru onClose lewat ref, BUKAN lewat dependency
  // useEffect. Kalau onClose (biasanya fungsi inline dari parent) dimasukkan
  // ke dependency array, effect akan cleanup+setup ulang setiap kali parent
  // re-render - misalnya SETIAP KETUKAN KEYBOARD saat mengisi form di dalam
  // modal (karena controlled input men-trigger re-render parent). Itu bikin
  // document.body.style.overflow di-toggle '' -> 'hidden' berkali-kali per
  // detik, scrollbar kedap-kedip, dan seluruh modal (yang di-center via
  // flex) ikut "glitch"/bergeser tiap kali mengetik.
  const onCloseRef = React.useRef(onClose);
  React.useEffect(() => {
    onCloseRef.current = onClose;
  });

  React.useEffect(() => {
    if (!isOpen) return;

    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };

    // Kompensasi lebar scrollbar supaya konten halaman di belakang modal
    // tidak "melompat" horizontal saat scrollbar hilang/muncul.
    const scrollbarWidth =
      window.innerWidth - document.documentElement.clientWidth;
    const previousOverflow = document.body.style.overflow;
    const previousPaddingRight = document.body.style.paddingRight;

    document.body.style.overflow = "hidden";
    if (scrollbarWidth > 0) {
      document.body.style.paddingRight = `${scrollbarWidth}px`;
    }
    window.addEventListener("keydown", handleEscape);

    return () => {
      document.body.style.overflow = previousOverflow;
      document.body.style.paddingRight = previousPaddingRight;
      window.removeEventListener("keydown", handleEscape);
    };
    // Sengaja HANYA bergantung pada isOpen - lihat catatan onCloseRef di atas.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isOpen]);

  if (!isOpen || !mounted) return null;

  const modal = (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-inverse-surface/40 backdrop-blur-sm animate-in fade-in duration-200"
        onClick={onClose}
      />
      {/* Modal Box */}
      <div className="relative bg-[#FFFDFE] w-full max-w-lg rounded-2xl shadow-xl border border-outline-variant/30 flex flex-col max-h-[90vh] z-10 animate-in fade-in zoom-in-95 duration-200 overflow-hidden">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 w-8 h-8 rounded-full flex items-center justify-center hover:bg-secondary-fixed text-on-surface-variant transition-colors cursor-pointer"
        >
          <span className="material-symbols-outlined text-xl">close</span>
        </button>
        {children}
      </div>
    </div>
  );

  // Render langsung sebagai anak <body>, bukan di posisi Dialog dipanggil -
  // supaya tidak terpengaruh ancestor manapun (transform/filter/dll) yang
  // bisa merusak positioning "fixed" dan bikin sidebar/elemen lain tetap
  // "bocor" keluar dari cakupan modal.
  return createPortal(modal, document.body);
}

export function DialogHeader({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-6 pt-6 pb-4 flex flex-col space-y-1.5 ${className}`}
      {...props}
    />
  );
}

export function DialogTitle({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h2
      className={`font-headline text-lg font-bold leading-none tracking-tight text-on-background ${className}`}
      {...props}
    />
  );
}

export function DialogDescription({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLParagraphElement>) {
  return (
    <p className={`text-sm text-on-surface-variant ${className}`} {...props} />
  );
}

export function DialogContent({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-6 pt-2 pb-8 overflow-y-auto flex-1 ${className}`}
      {...props}
    />
  );
}

export function DialogFooter({
  className = "",
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={`px-6 py-4 border-t border-outline-variant/20 flex flex-col-reverse gap-2 sm:flex-row sm:justify-end sm:gap-0 sm:space-x-2 ${className}`}
      {...props}
    />
  );
}
