<div align="center">
  <img src="https://cdn.phototourl.com/free/2026-08-26-6630f8ee-d016-4ea0-9454-d3f5d4e949d3.png" alt="Posyandu 3000 Logo" width="120" />
  
  # Posyandu 3000 Desktop
  
  [![Latest Release](https://img.shields.io/github/v/release/ZakaaGregeddd/posyandu3000?style=for-the-badge&logo=github&color=blue)](https://github.com/ZakaaGregeddd/posyandu3000/releases/latest)
  [![Download on GitHub](https://img.shields.io/badge/Download_on-GitHub-181717?style=for-the-badge&logo=github)](https://github.com/ZakaaGregeddd/posyandu3000/releases/latest)
</div>

<br />

Posyandu 3000 is a modern, high-performance desktop application designed to streamline the administration and recording of community health services (Posyandu) at the local level. Built with Next.js, Electron, and SQLite, it runs entirely locally on the user's computer, ensuring data privacy and seamless offline performance.

## Preview

<!-- Ganti link/path di bawah dengan path gambar dashboard-mu -->
![Dashboard Posyandu 3000](https://cdn.phototourl.com/free/2026-08-26-37b01047-9e51-4ccd-abec-a0f32193d0ce.png)
*Tampilan Dashboard Analytics Posyandu 3000*

## Key Features

- **Dashboard Analytics**: Visualizes demographic stats and monthly/yearly service tracking.
- **Family Register (KK)**: Efficient registration of family cards, interactive member management, dynamic age calculations, and status logging (Alive/Deceased).
- **Beneficiary (Penerima Manfaat) Logs**: Complete service distribution records, photo attachment, webcam integration with multi-camera support, and drag-and-drop file upload with custom animations.
- **Proof of Service Export**: Generates high-resolution PNG receipt cards directly from popup screens for easy sharing and records.
- **Input Simplifications**: Features modern segmented control pill buttons for blood type selection, custom live-search dropdowns for KK and NIK searches, and automated fields to prevent input errors.
- **Expanded PDF Reports**: Generates landscape PDF reports and tables for Balita, Lansia, Ibu Hamil, and Penerima Manfaat, featuring live preview iframe embedding before downloading.
- **Standalone Settings & Database Management**:
  - **Export (Backup)**: Saves current SQLite data into external `.db` files.
  - **Import & Smart Merge**: Merges data from backup files using `INSERT OR IGNORE` queries, appending new entries without deleting existing local data or causing PK conflicts.
  - **Secure Reset**: Clears all database transaction logs safely, protected by double-verification (password input with visibility toggle + typing "Hapus Database").
- **SQLite Core with Auto-Migration**: Relational database architecture with built-in schema check and automatic migration scripts to upgrade local database structures safely.

## Tech Stack

- **Frontend Framework**: Next.js (React)
- **Desktop Shell**: Electron
- **Database Engine**: SQLite (via `better-sqlite3`)
- **Style System**: Tailwind CSS & Custom CSS
- **Iconography**: Google Material Symbols
- **Utilities**: `html-to-image` (PNG receipt export), `jspdf` & `jspdf-autotable` (PDF exports)

## System Requirements

To run **Posyandu 3000** smoothly, here are the minimum and recommended hardware/software specifications:

| Component | Minimum Requirements | Recommended Specifications |
| :--- | :--- | :--- |
| **Operating System** | Windows 10 (64-bit) | Windows 10/11 (64-bit) |
| **Processor (CPU)** | Intel Core i3 / AMD Ryzen 3 (Dual-core 2.0 GHz) | Intel Core i5 / AMD Ryzen 5 or higher |
| **Memory (RAM)** | 4 GB | 8 GB or higher (recommended for optimal Chromium/Electron performance) |
| **Storage** | 1500 MB free space | 2 GB or more (SSD recommended for faster SQLite database operations) |
| **Screen Resolution** | 1280 x 720 (HD) | 1920 x 1080 (Full HD) |
| **Peripherals** | Built-in webcam/camera (optional, for beneficiary photo capture feature) | External HD webcam (optional) |

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- NPM or Yarn package manager
- C++ compiler tools (required by `better-sqlite3` native bindings)

### Development

To start the development server for the Electron desktop environment, run:

```bash
npm run dev:desktop
