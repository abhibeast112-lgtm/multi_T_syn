# Multi-Tab Settings Synchronization (Syn_chi)

A high-performance, real-time user preference synchronization engine built with **TypeScript** and **Vite**. Designed to meet the GDG Tech Wildcard Entry criteria for frontend development, this application ensures seamless, sub-100ms state synchronization across multiple browser tabs without requiring page reloads.

---

## 🚀 Key Features

- **Real-Time Cross-Tab Synchronization:** Instant updates propagated across all open browser tabs in under 100 milliseconds using the native `BroadcastChannel` API.
- **Zero Flash-of-Incorrect-Theme (FOUC):** Synchronous inline head-script execution reads `localStorage` prior to the initial DOM paint, guaranteeing zero visual theme stutter on newly spawned tabs.
- **Robust Persistence:** User preferences (Dark Mode, Language Selection, Font Size) are safely persisted across browser sessions via `localStorage`.
- **Deterministic Conflict Resolution:** Utilizes a **Last-Write-Wins (LWW)** strategy backed by high-precision timestamps (`Date.now()`) and unique client/tab UUID tie-breakers to ensure all concurrent tabs converge onto an identical state.
- **Multi-Language Support:** Dynamic internationalization layer supporting English (`en`), Spanish (`es`), French (`fr`), and German (`de`).

---

## 🛠️ Tech Stack

* **Language:** TypeScript
* **Build Tool:** Vite
* **Core APIs:** BroadcastChannel API, Web Storage API (`localStorage`), Custom Pub/Sub Event Pattern
* **Styling:** Vanilla CSS with CSS Custom Properties (Variables)

---

## 📂 Project Architecture

```text
Syn_chi/
├── index.html            # Entry point with synchronous FOUC prevention script
├── package.json          # Project dependencies & scripts
├── tsconfig.json         # TypeScript compiler configurations
├── vite.config.ts        # Vite build tool configuration
└── src/
    ├── types.ts          # TypeScript interfaces for preferences & sync messages
    ├── storageManager.ts # Core sync engine, BroadcastChannel, & LWW conflict resolution
    ├── style.css         # Dynamic theme styling & responsive layout
    └── main.ts           # UI rendering engine and event bindings
```

---

## ⚙️ Getting Started & Installation

Follow these steps to run the project locally on your machine:

### 1. Prerequisites
Make sure you have **Node.js** (v16 or higher) and **npm** installed.

### 2. Clone the Repository & Install Dependencies
Open your terminal and run:

```bash
git clone https://github.com/YOUR_USERNAME/Syn_chi.git
cd Syn_chi
npm install
```

### 3. Run the Development Server
```bash
npm run dev
```

Vite will start a local server (typically at `http://localhost:5173`). Open this URL in **two or more browser tabs side-by-side** to test real-time multi-tab synchronization!

---

## 🧠 Technical Architecture & Synchronization Strategy

### 1. Real-Time Transport (`BroadcastChannel`)
The application instantiates a dedicated `BroadcastChannel` (`app_settings_sync_channel`). When a user modifies a preference in Tab A, an immediate message payload containing the updated preferences and a unique `senderId` is broadcasted. All listening tabs receive the message instantly ($\ll 10\text{ms}$ latency). A fallback `storage` event listener is also registered to handle edge cases across disparate browser contexts.

### 2. Conflict Resolution (Last-Write-Wins + Tie-Breaker)
To handle race conditions where a user rapidly updates settings across multiple tabs simultaneously:
* Every preference mutation attaches an `updatedAt` timestamp (`Date.now()`) and the `lastModifiedBy` tab UUID.
* When a tab receives an incoming update, it evaluates `isNewer()`:
  1. If incoming `updatedAt` > current `updatedAt`, the update is accepted.
  2. If timestamps match exactly, string comparison on `lastModifiedBy` breaks the tie deterministically so all tabs settle on the exact same value.

### 3. Initialization & FOUC Prevention
Newly opened tabs execute a lightweight blocking script in the `<head>` tag of `index.html` before the browser paints. This reads `localStorage` synchronously and injects the proper theme classes and font size variables instantly.
```

---

Let me know if you need any adjustments to your README or further help with your deployment link!