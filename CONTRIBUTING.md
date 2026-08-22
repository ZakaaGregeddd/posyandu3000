# Contributing to Posyandu 3000 Desktop

Thank you for your interest in contributing to Posyandu 3000 Desktop! Contributions from developers like you help make this application better for community health centers.

Please take a moment to review this document to understand the development workflow, coding standards, and contribution guidelines.

---

## Code of Conduct

By participating in this project, you agree to maintain a respectful, welcoming, and collaborative environment.

## Tech Stack Overview

Before you start writing code, familiarize yourself with the core technologies used in this project:
- **Framework**: Next.js (React)
- **Desktop Shell**: Electron (Preload script isolates main process APIs)
- **Database**: SQLite (managed locally via `better-sqlite3` in the Electron main process)
- **Styling**: Tailwind CSS & Custom CSS
- **Icons**: Google Material Symbols

---

## Development Setup

### 1. Prerequisites
- **Node.js**: v18.0.0 or higher
- **Compiler Tools**: C++ build tools (required to compile native SQLite node bindings).
  - *Windows*: Visual Studio Build Tools (C++ development workload) or `npm install --global windows-build-tools` (run as Administrator).
  - *macOS*: Xcode Command Line Tools (`xcode-select --install`).
  - *Linux*: `build-essential` and library development packages.

### 2. Installation
Clone the repository and install the dependencies:
```bash
git clone https://github.com/your-username/Posyandu3000.git
cd Posyandu3000
npm install
```

### 3. Run Development Server
To launch the Next.js frontend integrated directly inside the Electron window:
```bash
npm run dev:desktop
```
This runs Next.js in development mode and opens the Electron shell pointing to it.

---

## Code Architecture

To keep the application stable and clean, follow our established patterns:

### Database Queries
- **Do not write direct filesystem access or node packages (`fs`, `better-sqlite3`) inside the client components.** Client-side code runs in the browser/renderer context.
- Instead, use the `dbQuery` helper located in `lib/db/db-client.ts`. It invokes IPC channels exposed by Electron's preload script.
- Database migrations and schema updates should be written in `lib/db/sqlite.ts` inside `initDb`.

### Styling Guidelines
- Use Tailwind CSS utility classes for layout and responsiveness.
- Follow the theme palette. Use classes like `bg-tertiary`, `text-on-surface`, `border-outline-variant/30` to match the Material Design token system of the application.
- Ensure components are responsive: use Tailwind responsive prefixes (`sm:`, `md:`, `lg:`) to fit smaller desktop screen views.

---

## Contribution Workflow

### 1. Branch Naming Conventions
Create a branch with a descriptive name starting with the type of change:
- `feature/your-feature-name` (for new features)
- `bugfix/issue-description` (for bug fixes)
- `refactor/component-name` (for code restructuring)
- `docs/update-info` (for documentation changes)

### 2. Committing Changes
Write descriptive, clear commit messages. We recommend using imperative present tense (e.g., "Add import database validation" instead of "Added import database validation").

### 3. Pull Request (PR) Checklist
Before submitting a pull request, please ensure:
- The code builds and runs correctly without compiler errors:
  ```bash
  node node_modules/typescript/bin/tsc --noEmit -p tsconfig.json
  ```
- All changes are clean, documented, and free of commented-out debug code.
- You have updated the corresponding documentation/README if needed.

---

## Building for Production

To compile Next.js standalone and package the application into an installer:
```bash
npm run build:desktop
```
The output installers will be built into the `dist-desktop` directory.
