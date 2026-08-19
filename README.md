# Posyandu 3000 Desktop

Posyandu 3000 is a modern, high-performance desktop application designed to streamline the administration and recording of community health services (Posyandu) at the local level. Built with Next.js, Electron, and SQLite, it runs entirely locally on the user's computer, ensuring data privacy and seamless offline performance.

## Key Features

- Dashboard Analytics: Visualizes demographic stats and monthly/yearly service tracking.
- Family Register (KK): Efficient registration of family cards, interactive member management, dynamic age calculations, and status logging (Alive/Deceased).
- Beneficiary (Penerima Manfaat) Logs: Complete service distribution records, photo attachment, webcam integration with multi-camera support, and drag-and-drop file upload with custom animations.
- Proof of Service Export: Generates high-resolution PNG receipt cards directly from popup screens for easy sharing and records.
- Input Simplifications: Features modern segmented control pill buttons for blood type selection, custom live-search dropdowns for KK and NIK searches, and automated fields to prevent input errors.
- SQLite Core with Auto-Migration: Relational database architecture with built-in schema check and automatic migration scripts to upgrade local database structures without data loss.

## Tech Stack

- Frontend Framework: Next.js (React)
- Desktop Shell: Electron
- Database Engine: SQLite (via better-sqlite3)
- Style System: Tailwind CSS & Vanilla CSS
- Iconography: Google Material Symbols
- Utilities: html-to-image (PNG receipt export)

## Getting Started

### Prerequisites

- Node.js (version 18 or higher)
- NPM or Yarn package manager
- C++ compiler tools (required by better-sqlite3 native bindings)

### Development

To start the development server for the Electron desktop environment, run:

```bash
npm run dev:desktop
```

This compiles the Electron bundle and launches the Next.js standalone application inside the desktop shell window.

### Production Build

To package the application into a standalone desktop executable, run:

```bash
npm run build:desktop
```

The output build will be generated in the output directory.

## Project Structure

- app/ - Next.js page layouts, routing, and UI views.
- components/ - Reusable React components including bento boxes, tables, modals, and charts.
- electron/ - Main process configurations, preload scripts, and IPC database handlers.
- lib/ - SQLite helper utilities, data fetching logic, and database schemas.
- public/ - Static assets, icons, and local web resources.
