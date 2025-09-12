.
├── app/                     # Next.js 14 demo UI
│   ├── components/          # LeadQue, InventoryPanel, ComposePanel, SmartLibrary
│   └── lib/                 # helpers (responses, csv, templates, etc.)
├── orchestrator/            # Express stub (quirk-genai-orchestrator)
├── sandbox/                 # csv → json normalize tools (quirk-genai-sandbox-tools)
├── data/                    # sample CSV/JSON (inventory, leads, smart responses)
├── .github/                 # PR/issue templates, (optional) CI
├── .env.example
├── CODEOWNERS
└── README.md

# Quirk AI Project Overview (GenAI Sandbox)

> Central sandbox + reference implementation for AI workflows at Quirk: demo UI (Next.js), lightweight orchestrator, and CSV → JSON tooling for sample inventory and lead flows.

---

## What’s in this repo

- **`app/`** — Next.js 14 demo UI (React 18, Tailwind). Panels include:
  - **Lead Queue** (`LeadQue.tsx`) – staging area for lead handling experiments
  - **Inventory Panel** (`InventoryPanel.tsx`) – sample inventory surface
  - **Compose Panel** (`ComposePanel.tsx`) – canned/smart responses playground
  - **Smart Library** (`SmartLibrary.tsx` + `data/smart_responses.json`)
- **`orchestrator/`** — Tiny Express service to sketch orchestration hooks/templates.
- **`sandbox/`** — CLI utilities for ingest/normalize:
  - `normalize.js` → builds `sandbox/inventory.json` from CSV samples
- **`data/`** — Sample datasets for demos (CSV + JSON).

> Notes: Issue/PR templates and CODEOWNERS are present under `.github/` and root.

---

## Quick Start

> Requires Node 20+

```bash
# 1) Clone
git clone https://github.com/mpalmer79/Quirk-AI-Project-Overview.git
cd Quirk-AI-Project-Overview

# 2) App (Next.js)
cp .env.example .env   # fill in as needed for local experiments
npm install
npm run dev            # http://localhost:3000

# 3) Sandbox tools (optional)
cd sandbox
npm install
npm run normalize      # builds ./inventory.json from ../data/inventory.sample.csv

# 4) Orchestrator (optional)
cd ../orchestrator
npm install
npm run dev            # starts Express stub

