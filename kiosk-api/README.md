# Quirk Kiosk API

Backend service for the Quirk AI Sales Kiosk credit application flow.

- **Purpose:** Phone verification (MFA), soft-pull simulation, and secure intake of full credit application payloads.
- **Front-end:** `docs/kiosk-credit.html` (GitHub Pages)
- **This service:** Node/Express (runs off GitHub Pages; deploy to Render/Railway/Heroku/etc.)

> Old-school rule of thumb: keep the static site static, keep secrets on the server, and encrypt anything you’d be embarrassed to read out loud.

---

## Endpoints (v1)

### `POST /mfa/start`
Start SMS verification via Twilio Verify.

**Request**
```json
{
  "phone": "+16175551234"
}

