## IMPORTANT - NEXT STEPS FOR ROUTEONE AND CUDL INTEGRATION

How to run (locally or in your hosting of choice), how to set env vars, where logs go, how to rotate keys, etc.

Note your compliance stance: FCRA/GLBA notice, retention, incident response, least-privilege access.

Mapping & next steps (so you’re production-ready)

Apply for integrations

RouteOne: complete their integrate form (they’ll share specs after NDA). 
RouteOne

CUDL: create an Origence developer account and request API access for CUDL Connect. 
Origence Connect Developer Portal
+1

Add field mapping docs
Create server/mapping/routeone.md and server/mapping/cudl.md and paste vendor sample payloads → document how your kiosk fields map to each vendor’s schema (names, formats, enums, required/optional).

Auth & tokens
Vendors typically use OAuth2 or signed requests. Implement getRouteOneToken() and getCUDLToken() helpers and never expose these to the browser.

Environment & secrets
Add .gitignore entry for .env. Only store secrets in your hosting provider’s secret manager (e.g., Render/Heroku/Vercel serverless functions).

Data protection

Encrypt SSN/DOB at rest (already scaffolded).

Minimize retention—delete sealed blobs after decisioning if policy allows.

Role-based access; redact PII in logs.

Display FCRA/GLBA notices and capture a timestamped consent flag.

Dealer workflow

Return a status ID that lets your kiosk poll /api/credit/status/:id.

Support “decision received” webhooks if a vendor provides them.

Add optional CUDL Loan Payoff lookup for trades when you get access. 
Origence Connect Developer Portal
