import express from "express";
import helmet from "helmet";
import { z } from "zod";
import pino from "pino";
import fetch from "node-fetch";
import "dotenv/config";
import nacl from "tweetnacl";

const log = pino({ transport: { target: "pino-pretty" } });
const app = express();
app.use(helmet());
app.use(express.json({ limit: "200kb" }));

// --- crypto helpers (very simple symmetric box using env key) ---
const key = Buffer.from((process.env.DATA_KEY || "").padEnd(32, "0")).subarray(0,32);
function seal(obj) {
  const nonce = nacl.randomBytes(24);
  const msg = Buffer.from(JSON.stringify(obj), "utf8");
  const cipher = nacl.secretbox(msg, nonce, key);
  return { n: Buffer.from(nonce).toString("base64"), c: Buffer.from(cipher).toString("base64") };
}

const Applicant = z.object({
  first: z.string().min(1),
  last: z.string().min(1),
  dob: z.string().min(1),          // yyyy-mm-dd from your <input type="date">
  ssn: z.string().min(4),          // last4 ok for demo; full for real submit
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

// Router
app.post("/api/credit/submit", async (req, res) => {
  const parse = CreditPayload.safeParse(req.body);
  if (!parse.success) {
    log.warn({ err: parse.error.flatten() }, "validation failed");
    return res.status(400).json({ ok: false, error: "Invalid payload" });
  }
  const data = parse.data;

  // Store sealed copy for audit (in real life: database)
  const sealed = seal({
    a: { dob: data.a.dob, ssn: data.a.ssn },
    c: data.c ? { dob: data.c.dob, ssn: data.c.ssn } : undefined
  });
  log.info({ actor: "kiosk", event: "credit.submit.received", a_last: data.a.last, sealed });

  // Simple routing rule: try RouteOne first, fallback to CUDL if requested or if RouteOne says "not eligible"
  const want = req.query.to; // "?to=routeone" or "?to=cudl"
  let result;

  try {
    if (want === "cudl") {
      result = await submitToCUDL(data);
    } else {
      result = await submitToRouteOne(data);
    }
  } catch (e) {
    log.error(e, "vendor error");
    return res.status(502).json({ ok: false, error: "Upstream error" });
  }

  return res.json({ ok: true, vendor: result.vendor, status: result.status, id: result.id });
});

// --- Adapters (stubbed until you receive real creds/specs) ---
async function submitToRouteOne(payload) {
  // TODO: map fields according to RouteOne's spec (provided post-NDA)
  // const token = await getRouteOneToken();
  // await fetch(ROUTEONE_URL, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(mapped) })
  return { vendor: "routeone", status: "queued", id: "RO-DEMO-123" };
}

async function submitToCUDL(payload) {
  // Example structure based on Origence Connect product pages; real schema comes from their docs/portal
  // const token = await getCUDLToken();
  // await fetch(CUDL_URL, { method: "POST", headers: { Authorization: `Bearer ${token}` }, body: JSON.stringify(mapped) })
  return { vendor: "cudl", status: "queued", id: "CUDL-DEMO-456" };
}

app.get("/healthz", (_, res) => res.json({ ok: true }));

const port = process.env.PORT || 8080;
app.listen(port, () => log.info(`kiosk api listening on :${port}`));
