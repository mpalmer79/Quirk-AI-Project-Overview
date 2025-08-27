# quirk-genai-sandbox
VIN Gen AI Alternative
quirk-genai-sandbox/
├─ app/                         # Next.js (App Router)
│  ├─ layout.tsx
│  ├─ page.tsx                  # Portal home (Lead Queue + Compose)
│  ├─ components/
│  │  ├─ LeadQueue.tsx
│  │  ├─ ComposePanel.tsx
│  │  ├─ InventoryPanel.tsx
│  │  ├─ ColumnMapper.tsx       # CSV mapping + validation
│  │  └─ Diagnostics.tsx
│  ├─ lib/
│  │  ├─ csv.ts                 # PapaParse helpers
│  │  ├─ inventory.ts           # match logic + token utils
│  │  └─ templates.ts           # token replacement engine
│  └─ styles/globals.css
├─ data/
│  ├─ inventory.sample.csv      # 80 New / 20 Used (schema below)
│  ├─ leads.sample.csv          # VIN export sample with common headers
│  └─ smart_responses.json      # BDC Smart Response Library (20–30 scenarios)
├─ public/
│  └─ favicon.ico
├─ scripts/
│  ├─ validate-inventory.ts     # schema checks for CSV
│  └─ seed.ts                   # loads samples into /data for local dev
├─ .github/
│  ├─ ISSUE_TEMPLATE/
│  │  ├─ bug_report.md
│  │  └─ feature_request.md
│  ├─ PULL_REQUEST_TEMPLATE.md
│  └─ workflows/
│     └─ ci.yml                 # typecheck, lint, build
├─ .env.example                 # NEXT_PUBLIC_… flags only
├─ .gitignore
├─ CODEOWNERS
├─ LICENSE
├─ package.json
├─ postcss.config.js
├─ tailwind.config.ts
├─ tsconfig.json
└─ README.md
