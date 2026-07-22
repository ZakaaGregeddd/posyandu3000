"use client";

import { useState } from "react";

interface DownloadReportButtonProps {
  reportId: string;
  label?: string;
}

export function DownloadReportButton({
  reportId,
  label = "Unduh PDF",
}: DownloadReportButtonProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch(`/api/reports/${reportId}/pdf`);

      if (!res.ok) {
        throw new Error("Gagal mengambil PDF");
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);

      const disposition = res.headers.get("Content-Disposition");
      const fileNameMatch = disposition?.match(/filename="(.+)"/);
      const fileName = fileNameMatch?.[1] ?? `laporan-${reportId}.pdf`;

      const link = document.createElement("a");
      link.href = url;
      link.download = fileName;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error(err);
      setError("Gagal mengunduh laporan. Coba lagi.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleDownload}
        disabled={loading}
        className="inline-flex items-center gap-2 rounded-md bg-black px-4 py-2 text-sm font-medium text-white disabled:opacity-50"
      >
        {loading ? "Membuat PDF..." : label}
      </button>
      {error ? <p className="mt-2 text-sm text-red-600">{error}</p> : null}
    </div>
  );
}
