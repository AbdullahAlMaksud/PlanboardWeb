# 🚀 Planboard AI

Planboard AI is a premium, high-performance project tracker and visual drawing whiteboard built on an infinite canvas, powered by Gemini AI. It combines structural task tracking (Kanban-style cards) with spatial drawing tools (whiteboard sketches, shape annotations, and sticky notes) and AI-assisted status reports to provide an intelligent, visually rich, and interactive workspace.

---

## ✨ Features

- **Infinite Canvas Board**: Smooth panning (middle-click or Space+drag), zoom controls (Ctrl+Scroll), and **Alt+Scroll Horizontal Panning** for fast lateral navigation across a high-resolution, responsive dot-grid backdrop.
- **Interactive Project Cards**:
  - Double-click to edit card title and description.
  - Status tab filters (`All`, `Todo`, `Doing`, `Done`) with progress indicators.
  - Add, reorder (drag-to-reorder), edit, and check off tasks.
  - Date picking, priority tags, blockers tracker, and external links bookmarking.
  - Collapse/Minimize cards to clear up clutter.
- **Drawing Whiteboard (Vector Draw Layer)**:
  - Vector pen drawing with custom strokes, opacity, and custom colors.
  - Draw rectangles, ellipses, and flow arrows with customizable fills.
  - Selected shapes (rectangles and ellipses) render draggable corner corner handles (`TL`, `TR`, `BL`, `BR`) for easy resizing.
  - Smart connection arrows: Resizing shapes dynamically translates snapped arrow endpoints relative to their closest borders.
  - Add text blocks and drag-and-drop color-coded **Sticky Notes**.
  - Select, move, resize, and delete vector drawings on the canvas.
- **Dynamic Pomodoro Focus Timer**: 
  - Toggle-triggered floating card that persists ticking in the background.
  - **Dynamic Island Collapsing**: Running timers morph from full size down to a sleek compact pill widget (`220px` x `56px`) showing time progress percentage and quick pause.
  - **Tactile Audio Engine**: Plays minor tick/click sound feedback on user clicks and a pleasant major arpeggio completion chime (with quick Mute toggle).
  - **Steppers Mode Adjustments**: Set custom durations for `Focus`, `Short Break`, and `Long Break` using custom +/- button steppers.
- **Universal Parent Navigator**: Highly customizable, accessible, div-based navigation component with dynamic styling variants (`filled`, `outline`, `plain`), custom border separators, custom outline/fill SVG mapping, and dynamic sizing support.
- **Today Focus Panel**: Pin up to 3 priority tasks from different cards to stay focused.
- **Quick Inbox**: Capture ideas on the fly and transition them into cards when ready.
- **AI-Powered Automated Work Reports**: Compile daily status updates of all active cards, auto-polish spelling/grammar, rewrite in 4 custom tones (Concise, Professional, Bullets, Executive) using Gemini AI, and batch-export/download files.

---

## 🛠️ Tech Stack & Architecture

- **Framework**: [Next.js](https://nextjs.org) (App Router, Turbopack)
- **Runtime & Package Manager**: [Bun](https://bun.sh)
- **Styling**: Vanilla CSS & TailwindCSS
- **State & Storage**: Client-side reactive state synced automatically to `localStorage`

### Folder Structure
```
planboard
├── public/              # Static public assets
└── src/
    ├── app/             # Next.js App Router (pages and layouts)
    ├── components/
    │   ├── ui/          # Low-level UI primitives (dialogs, buttons, select, etc.)
    │   └── common/      # Shared layout components (navbar, footer)
    ├── shared/
    │   ├── lib/         # Common libraries (storage, seed data, general utils)
    │   └── types/       # Shared TypeScript declaration files
    └── features/        # Core business domains
        ├── draw/        # Whiteboard components, tools, draw layers, and sticky notes
        └── project/     # Kanban board components, project cards, dialogs, and reports
```

---

## 🚀 Getting Started

> [!IMPORTANT]
> This project enforces the **Bun** package manager. Running `npm install`, `yarn`, or `pnpm` will be blocked by a preinstall hook.

### 1. Installation
Install the project dependencies using Bun:
```bash
bun install
```

### 2. Development Server
Start the local Next.js hot-reloaded dev server:
```bash
bun run dev
```
Open [http://localhost:3000](http://localhost:3000) (or the port specified in terminal output) to load the canvas.

### 3. Production Build
Compile the codebase into optimized production bundles:
```bash
bun run build
bun run start
```
