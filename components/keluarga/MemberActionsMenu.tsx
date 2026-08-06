"use client";

import React, { useEffect, useRef, useState } from "react";

interface MemberActionsMenuProps {
  onEdit: () => void;
  onDelete: () => void;
  disableDelete?: boolean;
}

export default function MemberActionsMenu({
  onEdit,
  onDelete,
  disableDelete = false,
}: MemberActionsMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <div className="relative" ref={menuRef}>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          setIsOpen((v) => !v);
        }}
        className="w-8 h-8 flex items-center justify-center rounded-full text-on-surface-variant hover:bg-surface-container-high transition-colors cursor-pointer"
        aria-label="Menu aksi anggota"
      >
        <span className="material-symbols-outlined text-lg">more_vert</span>
      </button>

      {isOpen && (
        // bottom-9 (bukan top-9) supaya dropdown selalu terbuka ke ATAS
        // tombol, aman dari kepotong card di baris paling bawah grid.
        <div className="absolute right-0 bottom-9 z-20 w-44 bg-white rounded-xl shadow-lg border border-outline-variant/20 overflow-hidden py-1">
          <button
            type="button"
            onClick={() => {
              setIsOpen(false);
              onEdit();
            }}
            className="w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-on-surface hover:bg-surface-container-low text-left cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">edit</span>
            Edit Data
          </button>
          <button
            type="button"
            disabled={disableDelete}
            onClick={() => {
              setIsOpen(false);
              onDelete();
            }}
            className={`w-full flex items-center gap-2 px-3 py-2 text-xs font-semibold text-left ${
              disableDelete
                ? "text-on-surface-variant/40 cursor-not-allowed"
                : "text-error hover:bg-red-50 cursor-pointer"
            }`}
          >
            <span className="material-symbols-outlined text-sm">delete</span>
            Hapus Anggota
          </button>
        </div>
      )}
    </div>
  );
}
