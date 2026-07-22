"use client";

import React from "react";

interface PaginationProps {
  currentPage: number;
  totalPages: number;
  onPageChange: (page: number) => void;
}

export default function Pagination({
  currentPage,
  totalPages,
  onPageChange,
}: PaginationProps) {
  if (totalPages <= 1) return null;

  return (
    <div className="flex justify-center items-center gap-6 py-4 text-sm font-medium text-on-surface-variant bg-white/50 rounded-xl border border-outline-variant/10 mt-2">
      <button
        onClick={() => onPageChange(Math.max(currentPage - 1, 1))}
        disabled={currentPage === 1}
        className="flex items-center gap-1 hover:text-tertiary disabled:opacity-40 disabled:hover:text-on-surface-variant cursor-pointer transition-colors"
      >
        <span className="material-symbols-outlined text-sm">chevron_left</span>
        <span>Previous</span>
      </button>

      <span>
        <span className="font-bold text-on-background">{currentPage}</span> dari{" "}
        <span className="font-bold text-on-background">{totalPages}</span>
      </span>

      <button
        onClick={() => onPageChange(Math.min(currentPage + 1, totalPages))}
        disabled={currentPage === totalPages}
        className="flex items-center gap-1 hover:text-tertiary disabled:opacity-40 disabled:hover:text-on-surface-variant cursor-pointer transition-colors"
      >
        <span>Next</span>
        <span className="material-symbols-outlined text-sm">chevron_right</span>
      </button>
    </div>
  );
}
