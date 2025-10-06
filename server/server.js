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

// --- crypto helpers (symmetric secretbox; rotate key via env) ---
const key = Buffer.from((process.env.DATA_KEY || "").padEnd(32, "0")).subarray(0, 32);
function seal(obj) {
  const nonce = nacl.randomBytes(24);
  const msg = Buffer.from(JSON.stringify(obj), "utf8");
  const cipher = nacl.secretbox(msg, nonce, key);
  return { n: Buffer.from(nonce).toString("base64"), c: Buffer.from(cipher).toString("base64") };
}

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

app.post("/api/credit/submit", async (req, res) => {
  const parsed = CreditPayload.safeParse(req.body);
  if (!parsed.success) {
    log.warn({ err: parsed.error.flatten() }, "validation failed");
    return res.status(400).json({ ok: false, error: "Invalid payload" });
  }
  const data = parsed.data;

  // seal sensitive bits for audit (in real life, store to DB)
  const sealed = seal({
    a: { dob: data.a.dob, ssn: data.a.ssn },
    c: data.c ? { dob: data.c.dob, ssn: data.c.ssn } : undefined
  });
  log.info({ actor: "kiosk", event: "credit.submit.received", a_last: data.a.last, sealed });

  const target = (req.query.to || "routeone").toString().toLowerCase();
  try {
    const result = target === "cudl" ? await submitToCUDL(data) : await submitToRouteOne(data);
    return res.json({ ok: true, vendor: result.vendor, status: result.status, id: result.id });
  } catch (e) {
    log.error(e, "vendor error");
    return res.status(502).json({ ok: false, error: "Upstream error" });
  }
});

// --- Vendor adapters (replace with real specs/creds when issued) ---
async function submitToRouteOne(payload) {
  // TODO: Map payload to RouteOne schema + OAuth/token
  // const token = await getRouteOneToken();
  // const resp = await fetch(ROUTEONE_URL, { ... });
  return { vendor: "routeone", status: "queued", id: "RO-DEMO-123" };
}

async function submitToCUDL(payload) {
  // TODO: Map payload to CUDL schema + OAuth/token
  // const token = await getCUDLToken();
  // const resp = await fetch(CUDL_URL, { ... });
  return { vendor: "cudl", status: "queued", id: "CUDL-DEMO-456" };
}

app.get("/healthz", (_, res) => res.json({ ok: true }));

const port = process.env.PORT || 8080;
app.listen(port, () => log.info(`kiosk api listening on :${port}`));
