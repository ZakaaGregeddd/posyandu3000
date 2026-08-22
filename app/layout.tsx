import type { Metadata } from "next";
import "./globals.css";
import UpdateNotifier from "@/components/shared/UpdateNotifier";

export const metadata: Metadata = {
  title: "Sistem Manajemen Posyandu 3000",
  description: "Aplikasi rekapitulasi data kekeluargaan dan rekam kesehatan Posyandu 3000 untuk kader.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="id" className="h-full antialiased">
      <head>
        {/* Load Google Fonts */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="anonymous" />
        <link 
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&family=Plus+Jakarta+Sans:wght@600;700;800&display=swap" 
          rel="stylesheet" 
        />
        {/* Load Google Material Symbols */}
        <link 
          href="https://fonts.googleapis.com/css2?family=Material+Symbols+Outlined:opsz,wght,FILL,GRAD@20..48,100..700,0..1,-50..200&display=swap" 
          rel="stylesheet" 
        />
      </head>
      <body className="min-h-full flex flex-col bg-background font-sans">
        {children}
        <UpdateNotifier />
      </body>
    </html>
  );
}
