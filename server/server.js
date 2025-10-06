import express from "express";
import helmet from "helmet";
import { z } from "zod";
import pino from "pino";
import fetch from "node-fetch";
import "dotenv/config";
import nacl from "tweetnacl";
import cors from "cors"; // CORS

const log = pino({ transport: { target: "pino-pretty" } });
const app = express();

// --- security & CORS ---
app.use(helmet());

// Allow your GitHub Pages origin (and localhost for testing). Replace <your-username>.
const allowed = [
  "https://<your-username>.github.io",
  "https://<your-username>.github.io/Quirk-AI-Project-Overview",
  "https://<your-custom-domain>", // optional
  "http://localhost:3000",        // local dev (optional)
  "http://localhost:5173"
];

app.use(cors({
  origin: function (origin, cb) {
    if (!origin) return cb(null, true); // same-origin / server-to-server
    const ok = allowed.some(a => origin === a || origin.startsWith(a));
    cb(ok ? null : new Error("Not allowed by CORS"), ok);
  },
  methods: ["GET", "POST", "OPTIONS"],
  allowedHeaders: ["Content-Type", "Authorization"]
}));

app.use(express.json({ limit: "200kb" }));

// --- crypto helpers (symmetric secretbox; rotate key via env) ---
const key = Buffer.from((process.env.DATA_KEY || "").padEnd(32, "0")).subarray(0, 32);
function seal(obj) {
  const nonce = nacl.randomBytes(24);
  const msg = Buffer.from(JSON.stringify(obj), "utf8");
  const cipher = nacl.secretbox(msg, nonce, key);
  return { n: Buffer.from(nonce).toString("base64"), c: Buffer.from(cipher).toString("base64") };
}

// --- validation schemas ---
const Applicant = z.object({
  first: z.string().min(1),
  last: z.string().min(1),
  dob: z.string().min(1),           // yyyy-mm-dd
  ssn: z.string().min(4),           // last4 ok for demo; full for prod
  phone: z.string().optional(),
  email: z.string().email().optional(),
  employer: z.string().optional(),
  title: z.string().optional(),
  zip: z.string().optional(),
  income: z.number().nonnegative().optional()
});

const CreditPayload = z.object({
  a: Applicant,
  c: z.object({
    first: z.string().optional(),
    last: z.string().optional(),
    dob: z.string().optional(),
    ssn: z.string().optional()
  }).optional(),
  vehicle: z.object({
    vin: z.string().optional(),
    stock: z.string().optional(),
    price: z.number().optional()
  }).optional(),
  consent: z.object({
    fcra: z.boolean(),
    privacy: z.boolean()
  })
});

// --- in-memory queue/state (demo) ---
/**
 * jobs[id] = {
 *   id, vendor, status: 'received'|'processing'|'decisioned'|'error',
 *   decision: 'approved'|'conditional'|'declined'|null,
 *   createdAt, updatedAt
 * }
 */
const jobs = new Map();
let seq = 1;
const TERMINAL = new Set(["decisioned", "error"]);

// --- consent receipts (demo, in-memory) ---
/*
consents[id] = {
  id, fcra:true, privacy:true, timestamp, ip, userAgent, page:'kiosk-credit.html', version:'v1'
}
*/
const consents = new Map();

function enqueue(vendor, payload) {
  const id = `${vendor.toUpperCase()}-${String(seq++).padStart(6, "0")}`;
  const now = new Date().toISOString();
  const job = { id, vendor, status: "received", decision: null, createdAt: now, updatedAt: now };
  jobs.set(id, job);

  // simulate async processing
  setTimeout(() => advance(job, "processing"), 1000);
  setTimeout(() => {
    // random demo decision; replace with real vendor response
    const pick = Math.random();
    const decision = pick < 0.6 ? "approved" : (pick < 0.85 ? "conditional" : "declined");
    advance(job, "decisioned", decision);
  }, 3500);

  // minimal sealed audit blob (do NOT store full PII in logs)
  const sealed = seal({
    a: { dob: payload.a.dob, ssn: payload.a.ssn },
    c: payload.c ? { dob: payload.c.dob, ssn: payload.c.ssn } : undefined
  });
  log.info({ event: "queue.enqueued", id, vendor, sealed });
  return job;
}

function advance(job, status, decision = null) {
  if (!job || TERMINAL.has(job.status)) return;
  job.status = status;
  if (decision) job.decision = decision;
  job.updatedAt = new Date().toISOString();
  log.info({ event: "queue.advance", id: job.id, status: job.status, decision: job.decision });
}

// --- routes ---
app.post("/api/credit/submit", async (req, res) => {
  const parsed = CreditPayload.safeParse(req.body);
  if (!parsed.success) {
    log.warn({ err: parsed.error.flatten() }, "validation failed");
    return res.status(400).json({ ok: false, error: "Invalid payload" });
  }
  const data = parsed.data;

  // (Step 5B) store a temporary consent receipt immediately after validation
  try {
    const ip = req.headers["x-forwarded-for"]?.toString().split(",")[0]?.trim() || req.socket.remoteAddress || "";
    const ua = req.headers["user-agent"] || "";
    const tempId = `TEMP-${Date.now()}-${Math.random().toString(36).slice(2,8)}`;
    consents.set(tempId, {
      id: tempId,
      fcra: !!data.consent.fcra,
      privacy: !!data.consent.privacy,
      timestamp: new Date().toISOString(),
      ip, userAgent: ua,
      page: "kiosk-credit.html",
      version: "v1"
    });
    // stash so we can re-key to the final job id
    req._consentTempId = tempId;
  } catch (e) {
    log.warn({ e }, "failed to store temporary consent (non-fatal)");
  }

  const target = (req.query.to || "routeone").toString().toLowerCase();
  try {
    // In real life: create job, call vendor, update job by webhook/callback.
    const job = enqueue(target, data);

    // (Step 5C) re-key the consent receipt from TEMP-* to the final job id
    if (req._consentTempId && consents.has(req._consentTempId)) {
      const rec = consents.get(req._consentTempId);
      consents.delete(req._consentTempId);
      rec.id = job.id;
      consents.set(job.id, rec);
    }

    // kick off vendor call stubs (no-op demos)
    if (target === "cudl") await submitToCUDL(data);
    else await submitToRouteOne(data);

    return res.json({ ok: true, vendor: job.vendor, status: job.status, id: job.id });
  } catch (e) {
    log.error(e, "vendor error");
    return res.status(502).json({ ok: false, error: "Upstream error" });
  }
});

app.get("/api/credit/status/:id", (req, res) => {
  const job = jobs.get(req.params.id);
  if (!job) return res.status(404).json({ ok: false, error: "Not found" });
  return res.json({
    ok: true,
    id: job.id,
    vendor: job.vendor,
    status: job.status,        // 'received' | 'processing' | 'decisioned' | 'error'
    decision: job.decision,    // 'approved' | 'conditional' | 'declined' | null
    updatedAt: job.updatedAt
  });
});

// (Step 5D) retrieve consent receipt (useful for staff tools; add auth later)
app.get("/api/credit/receipt/:id", (req, res) => {
  const r = consents.get(req.params.id);
  if (!r) return res.status(404).json({ ok:false, error:"Not found" });
  res.json({ ok:true, receipt: r });
});

app.get("/healthz", (_, res) => res.json({ ok: true }));

// --- Vendor adapters (replace with real specs/creds when issued) ---
async function submitToRouteOne(payload) {
  // TODO: Map payload to RouteOne schema + OAuth/token
  return { vendor: "routeone", status: "queued", id: "RO-STUB" };
}

async function submitToCUDL(payload) {
  // TODO: Map payload to CUDL schema + OAuth/token
  return { vendor: "cudl", status: "queued", id: "CUDL-STUB" };
}

const port = process.env.PORT || 8080;
app.listen(port, () => log.info(`kiosk api listening on :${port}`));
