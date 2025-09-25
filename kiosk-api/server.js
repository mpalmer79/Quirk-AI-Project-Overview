// server.js
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Twilio } from 'twilio';

dotenv.config();

// ----- ENV + App -----
const {
  PORT = 3000,
  TWILIO_ACCOUNT_SID,
  TWILIO_AUTH_TOKEN,
  TWILIO_VERIFY_SID,
  ENC_MASTER_KEY,
  ALLOWED_ORIGINS // comma-separated, e.g. "https://mpalmer79.github.io,https://your-domain.com"
} = process.env;

if (!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID || !ENC_MASTER_KEY) {
  console.error('Missing required env vars (TWILIO_* and ENC_MASTER_KEY).');
  process.exit(1);
}

const app = express();
app.set('trust proxy', 1); // respect X-Forwarded-* from Render/Heroku/etc.

// Security headers (CSP disabled here because you’re serving static from GH Pages)
app.use(helmet({
  contentSecurityPolicy: false,
  crossOriginOpenerPolicy: { policy: 'same-origin' }
}));

// Body parsing
app.use(express.json({ limit: '256kb' }));

// ----- CORS -----
const allowList = new Set(
  (ALLOWED_ORIGINS || '')
    .split(',')
    .map(s => s.trim())
    .filter(Boolean)
);
const corsCheck = (origin, cb) => {
  // allow no-origin (curl/postman), localhost, or allow-listed origins
  if (!origin || /localhost(:\d+)?$/.test(origin) || allowList.has(origin)) return cb(null, true);
  return cb(new Error('Not allowed by CORS'));
};
app.use(cors({ origin: corsCheck, methods: ['POST', 'GET', 'OPTIONS'] }));
app.options('*', cors({ origin: corsCheck })); // preflight

// ----- Limits -----
const mfaLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 10, standardHeaders: true, legacyHeaders: false });
const submitLimiter = rateLimit({ windowMs: 5 * 60 * 1000, max: 30, standardHeaders: true, legacyHeaders: false });

// ----- Utils -----
const twilio = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

function encField(plain) {
  if (!plain && plain !== 0) return null;
  const key = Buffer.from(ENC_MASTER_KEY, 'base64'); // 32 bytes for AES-256
  if (key.length !== 32) throw new Error('ENC_MASTER_KEY must be base64-encoded 32 bytes');
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64'); // iv|tag|ct
}

function maskPhone(p) {
  const s = String(p || '');
  return s.length < 4 ? '***' : `${'*'.repeat(Math.max(0, s.length - 4))}${s.slice(-4)}`;
}

const asyncHandler = fn => (req, res, next) => Promise.resolve(fn(req, res, next)).catch(next);

// ----- Health -----
app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

// ----- MFA -----
app.post('/mfa/start', mfaLimiter, asyncHandler(async (req, res) => {
  const phone = String(req.body?.phone || '').trim();
  // Basic E.164-ish check; let Twilio do the real validation
  if (!phone || !/^\+?[1-9]\d{6,14}$/.test(phone)) {
    return res.status(400).json({ error: 'valid phone required (E.164 format preferred, e.g. +16175551234)' });
  }

  await twilio.verify.v2.services(TWILIO_VERIFY_SID).verifications.create({ to: phone, channel: 'sms' });
  // Don’t log full phone numbers
  console.info(`[mfa/start] sent code to ${maskPhone(phone)}`);
  res.json({ ok: true });
}));

app.post('/mfa/verify', mfaLimiter, asyncHandler(async (req, res) => {
  const phone = String(req.body?.phone || '').trim();
  const code = String(req.body?.code || '').trim();
  if (!phone || !code) return res.status(400).json({ error: 'phone + code required' });

  const check = await twilio.verify.v2.services(TWILIO_VERIFY_SID).verificationChecks.create({ to: phone, code });
  const verified = check.status === 'approved';
  console.info(`[mfa/verify] ${verified ? 'approved' : 'failed'} for ${maskPhone(phone)}`);

  if (!verified) return res.status(401).json({ verified: false });
  res.json({ verified: true });
}));

// ----- CREDIT (Prototype) -----
app.post('/credit/soft', submitLimiter, asyncHandler(async (req, res) => {
  const { full, email, mobile, zip, income, consent } = req.body || {};
  if (!full || !email || !mobile || !zip || !Number.isFinite(income)) {
    return res.status(400).json({ error: 'missing required fields' });
  }
  if (!consent) return res.status(400).json({ error: 'soft-pull consent required' });

  // Simulate a pre-qualification response
  const appId = crypto.randomUUID();
  res.json({ appId, prequalified: true, maxAmount: 45000 });
}));

app.post('/credit/submit', submitLimiter, asyncHandler(async (req, res) => {
  const appData = req.body || {};
  if (!appData.hardConsent) return res.status(400).json({ error: 'hard-pull authorization required' });

  // Minimal required fields for prototype validation (extend as needed)
  const required = ['full', 'email', 'mobile', 'address', 'dob', 'ssn', 'dl'];
  for (const k of required) {
    if (appData[k] == null || appData[k] === '') {
      return res.status(400).json({ error: `missing field: ${k}` });
    }
  }

  // Field-level encrypt PII before persistence
  const secure = {
    ...appData,
    ssn: encField(appData.ssn),
    dob: encField(appData.dob),
    dl: { number: encField(appData.dl?.number), state: appData.dl?.state },
    mobile: encField(appData.mobile), // optional: encrypt contact fields too
    email: appData.email,             // keep email plaintext if you need ops visibility, otherwise encField
    createdAt: new Date().toISOString(),
    appId: crypto.randomUUID()
  };

  // TODO: persist 'secure' to your DB (e.g., Postgres). DO NOT log PII.
  // await db.insert('credit_apps', secure);

  console.info(`[credit/submit] received application ${secure.appId}`);
  res.json({ ok: true, appId: secure.appId });
}));

// ----- Error handler (hide internals) -----
app.use((err, _req, res, _next) => {
  console.error(err.message || err);
  res.status(500).json({ error: 'internal_error' });
});

// ----- START -----
app.listen(Number(PORT), () => {
  console.log(`API listening on ${PORT}`);
  if (!ALLOWED_ORIGINS) {
    console.warn('CORS: ALLOWED_ORIGINS not set (only localhost allowed). Set ALLOWED_ORIGINS="https://mpalmer79.github.io" for production.');
  }
});
