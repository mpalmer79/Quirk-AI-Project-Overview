# Quirk AI Project Overview (GenAI Sandbox)

> Central sandbox + reference implementation for AI workflows at Quirk:  
> demo UI (Next.js 14), lightweight orchestrator, secure Kiosk API, and CSV → JSON tooling for sample inventory and lead flows.

---

## 📂 Repository Layout

├── app/ # Next.js 14 demo UI
│ ├── components/ # LeadQue, InventoryPanel, ComposePanel, SmartLibrary
│ └── lib/ # helpers (responses, csv, templates, etc.)
│
├── orchestrator/ # Express stub (quirk-genai-orchestrator)
│ ├── templates.js # Email/SMS templates
│ └── server.js # prototype server
│
├── kiosk-api/ # Secure Express API for credit + MFA
│ ├── routes/ # /mfa, /credit/soft, /credit/submit
│ ├── utils/ # encryption, validation, rate limiting
│ └── server.js
│
├── sandbox/ # csv → json normalize tools (quirk-genai-sandbox-tools)
│ └── normalize.js
│
├── data/ # sample CSV/JSON (inventory, leads, smart responses)
│
├── docs/ # GitHub Pages demo site
│ ├── kiosk.html
│ ├── service.html
│ ├── parts.html
│ ├── quirk-ai-voice.html
│ ├── vin-gen-ai-alternative.html
│ └── project-library.html
│
├── .github/ # PR/issue templates, (optional) CI
├── .env.example
├── CODEOWNERS
└── README.md


---

## 🚀 Quick Start

> Requires **Node.js 20+**

### 1. Clone
```bash
git clone https://github.com/mpalmer79/Quirk-AI-Project-Overview.git
cd Quirk-AI-Project-Overview

cd app
cp .env.example .env    # configure env vars as needed
npm install
npm run dev             # http://localhost:3000

cd app
cp .env.example .env    # configure env vars as needed
npm install
npm run dev             # http://localhost:3000

cd sandbox
npm install
npm run normalize       # builds ./inventory.json from ../data/inventory.sample.csv

cd ../orchestrator
npm install
npm run dev             # http://localhost:4000

cd ../kiosk-api
cp .env.example .env    # see ENV vars below
npm install
npm run dev             # http://localhost:5000

Browser (Docs / Next.js)
         │
         ▼
   [ Orchestrator ]  ←→  Inventory / Templates / LLM
         │
         ▼
   [ Kiosk API ]  ←→  Credit Vendors / MFA / PII Store

Docs site → stakeholder/demo UI (static, GitHub Pages)

Next.js app → sales workflow prototype (LeadQue → InventoryPanel → ComposePanel → SmartLibrary)

Orchestrator → merges templates, slots, and inventory for AI workflows

Kiosk API → secure credit & MFA handling with encryption + rate limiting

Sandbox → utilities to normalize CSV inventory/leads

📖 Key Flows (By Department)

Sales → Lead ingestion → Inventory match → Draft email/SMS → Approve → Send

Sales Kiosk → Discovery → Vehicle → Trade → Credit/F&I → Review/Send (MFA-secured)

Service → Appointment scheduling, status updates, recall lookup

Parts → VIN/part lookup, availability across stores, order/quote flows

Quirk AI Voice → BDC pickup, live call summaries, compliance handling

GenAI Alternative → Draft → Approve → Send sidecar agent
👉 View GitHub Demo of Chrome Extension

📚 Project Library

Central index of artifacts, workflows, and mockups:
Project Library Page

npm test
Template merger
Vehicle matcher
CSV normalization

✅ Roadmap

 Implement LeadQue, InventoryPanel, ComposePanel in Next.js

 Add Zod validation & Jest unit tests

 Add persistence + audit log to Kiosk API

 Add Swagger/OpenAPI docs for APIs

 Improve accessibility on Docs site

 Wire Orchestrator to live inventory + LLM abstraction

 Publish Chrome extension demo to Web Store
📜 License => MIT


---

⚡ This version:  
- Keeps your original **layout tree** but adds **Kiosk API + docs** explicitly.  
- Includes **Quick Start instructions per service**.  
- Adds **env var tables**.  
- Adds **architecture diagram**.  
- Breaks down **department flows** clearly.  
- Includes **roadmap checklist** and the **Chrome extension GitHub link**.  

## 🏗️ Architecture

assets/quirk_ai_architecture.png


