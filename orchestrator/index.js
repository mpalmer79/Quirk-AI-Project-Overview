// orchestrator/index.js
import express from "express";
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import { templates } from "./templates.js";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
app.use(express.json());

// Config
const SANDBOX_PATH = path.join(__dirname, "..", "sandbox", "inventory.json");
const DEFAULT_SLOTS = ["6:15 PM", "10:30 AM"];

// -------- Inventory (cached, safe) --------
let INVENTORY_CACHE = [];
let INVENTORY_MTIME = 0;

function loadInventorySafe() {
  try {
    const stat = fs.statSync(SANDBOX_PATH);
    if (stat.mtimeMs !== INVENTORY_MTIME) {
      INVENTORY_CACHE = JSON.parse(fs.readFileSync(SANDBOX_PATH, "utf-8") || "[]");
      INVENTORY_MTIME = stat.mtimeMs;
    }
  } catch {
    INVENTORY_CACHE = [];
  }
  return INVENTORY_CACHE;
}

// -------- Helpers --------
function pickVehicle(inv, query) {
  if (!query) return inv[0];
  const q = String(query).toLowerCase();
  const exact = inv.find(v =>
    `${v.year} ${v.make} ${v.model}`.toLowerCase().includes(q) ||
    v.model?.toLowerCase().includes(q) ||
    v.trim?.toLowerCase().includes(q) ||
    v.stock_number?.toLowerCase() === q ||
    v.vin?.toLowerCase() === q
  );
  return exact || inv[0];
}

function stockCount(inv, model) {
  if (!model) return inv.length;
  return inv.filter(v => v.model?.toLowerCase() === model.toLowerCase() && v.status !== "sold").length;
}

const fmtModelTrim = v => `${v.year} ${v.make} ${v.model}${v.trim ? " " + v.trim : ""}`;

function incentiveLine(v, incentives) {
  if (!incentives) return "";
  const parts = [];
  if (incentives.cash_rebate) parts.push(`$${incentives.cash_rebate} cash back`);
  if (incentives.apr) parts.push(`${incentives.apr}% APR`);
  return parts.length ? `Right now there’s ${parts.join(" + ")}.` : "";
}

const render = (tpl, vars) => tpl.replace(/\[\[(.+?)\]\]/g, (_, k) => (vars[k] ?? "").toString());

// -------- Routes --------
app.get("/health", (_, res) => res.json({ ok: true }));

/**
 * POST /respond
 * Body: { intent, query, lead, agent, incentives }
 */
app.post("/respond", (req, res) => {
  try {
    const { intent = "new_internet_lead", query = "", lead = {}, agent = {}, incentives = null } = req.body || {};

    const inv = loadInventorySafe();
    if (!inv.length) return res.status(503).json({ error: "Inventory unavailable" });

    const vehicle = pickVehicle(inv, query);
    const count = stockCount(inv, vehicle?.model);

    const [slot1, slot2] = DEFAULT_SLOTS;

    const vars = {
      name: lead.name || "there",
      agent: agent.name || "Your BDC Team",
      store: agent.store || "Quirk",
      model_trim: fmtModelTrim(vehicle),
      stock_count: count,
      primary_photo: vehicle.photo_url_primary || "",
      vin: vehicle.vin,
      stock_number: vehicle.stock_number,
      price: vehicle.price,
      msrp: vehicle.msrp,
      slot1, slot2,
      incentive_line: incentiveLine(vehicle, incentives),
    };

    const tpl = templates[intent] || templates["new_internet_lead"];
    const email = render(tpl.email, vars).trim();
    const sms = render(tpl.sms, vars).trim();

    res.json({
      intent,
      vehicle,
      email,
      sms,
      activity: {
        lead_id: lead.id || null,
        note_html: `<p>${email.replace(/\n/g, "<br/>")}</p>`,
        suggested_times: [slot1, slot2],
      },
    });
  } catch (e) {
    console.error(e);
    res.status(500).json({ error: "Respond failed", details: e.message });
  }
});

// -------- Start --------
const PORT = process.env.PORT || 3030;
app.listen(PORT, () => console.log(`Orchestrator listening on :${PORT}`));
