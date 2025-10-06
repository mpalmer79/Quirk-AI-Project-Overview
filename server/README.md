# Quirk Kiosk Credit API

Minimal Express server providing `/api/credit/submit`. PII is validated with Zod and sealed (TweetNaCl) for audit-at-rest.

## Run (locally or in a host)
1. Copy `.env.example` → `.env` and set `DATA_KEY` (32+ chars).
2. `npm install` (once).
3. `npm start` → listens on `:8080`.

## Deploy
- Works on Render/Heroku/Fly/etc. Set environment variables in the host’s secret manager.
- Add a reverse proxy rule so frontend `/api/*` routes hit this server.

## Next
- Replace vendor adapter stubs with real mappings + OAuth/token exchange.
- Add `/api/credit/status/:id` when vendor supports polling or webhooks.
- Store sealed PII and consent receipts in a DB with short retention.
