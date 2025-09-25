// server.js
import express from 'express';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import cors from 'cors';
import crypto from 'crypto';
import dotenv from 'dotenv';
import { Twilio } from 'twilio';

dotenv.config();
const app = express();
app.use(helmet({ contentSecurityPolicy: false }));
app.use(express.json({ limit: '256kb' }));
app.use(cors({ origin: [/your-domain\.com$/, /localhost/], methods: ['POST'] }));

// ----- ENV -----
const { TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_VERIFY_SID, ENC_MASTER_KEY } = process.env;
if(!TWILIO_ACCOUNT_SID || !TWILIO_AUTH_TOKEN || !TWILIO_VERIFY_SID || !ENC_MASTER_KEY) {
  console.error('Missing env'); process.exit(1);
}
const twilio = new Twilio(TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN);

// ----- RATE LIMIT -----
const mfaLimiter = rateLimit({ windowMs: 5*60*1000, max: 10 });
const submitLimiter = rateLimit({ windowMs: 5*60*1000, max: 30 });

// ----- SIMPLE KMS-LIKE WRAPPERS -----
function encField(plain) {
  const key = Buffer.from(ENC_MASTER_KEY, 'base64'); // 32 bytes for AES-256
  const iv = crypto.randomBytes(12);
  const cipher = crypto.createCipheriv('aes-256-gcm', key, iv);
  const ct = Buffer.concat([cipher.update(String(plain), 'utf8'), cipher.final()]);
  const tag = cipher.getAuthTag();
  return Buffer.concat([iv, tag, ct]).toString('base64');
}

// ----- MFA -----
app.post('/mfa/start', mfaLimiter, async (req, res) => {
  const phone = String(req.body.phone||'').trim();
  if(!phone) return res.status(400).json({ error: 'phone required' });
  await twilio.verify.v2.services(TWILIO_VERIFY_SID).verifications.create({ to: phone, channel: 'sms' });
  res.json({ ok: true });
});

app.post('/mfa/verify', mfaLimiter, async (req, res) => {
  const { phone, code } = req.body || {};
  if(!phone || !code) return res.status(400).json({ error: 'phone + code required' });
  const check = await twilio.verify.v2.services(TWILIO_VERIFY_SID).verificationChecks.create({ to: phone, code });
  res.json({ verified: check.status === 'approved' });
});

// ----- CREDIT -----
app.post('/credit/soft', submitLimiter, async (req, res) => {
  // Prototype: simulate a prequal result
  res.json({ prequalified: true, maxAmount: 45000 });
});

app.post('/credit/submit', submitLimiter, async (req, res) => {
  const appData = req.body || {};
  // Field-level encrypt PII before persisting
  const secure = {
    ...appData,
    ssn: encField(appData.ssn),
    dob: encField(appData.dob),
    dl: { number: encField(appData.dl?.number), state: appData.dl?.state },
    address: { ...appData.address },
    // you would also encrypt phone, email if desired; balance security vs. operations
    createdAt: new Date().toISOString(),
  };
  // TODO: write to your DB (Postgres) using a service account; avoid logging PII
  // await db.insert('credit_apps', secure);

  res.json({ ok: true });
});

// ----- START -----
app.listen(8443, () => console.log('API listening on 8443 (behind TLS terminator)'));

