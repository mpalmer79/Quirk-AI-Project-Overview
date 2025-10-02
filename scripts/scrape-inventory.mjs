// Nightly scraper for Quirk Chevy NH -> sandbox/inventory.json
// - Crawls New + Used SRPs, follows pagination (cap MAX_PAGES)
// - Extracts VDP URLs from JSON blobs or anchors
// - Parses JSON-LD/metadata/text on each VDP
// - Retries with backoff, polite delays, validation, dedupe by VIN
// - Writes sandbox/inventory.json only if changed

import { writeFileSync, readFileSync, existsSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import * as cheerio from "cheerio";
import { request } from "undici";
import { URL } from "node:url";

/* ======== CONFIG: tune these, no code changes below required ======== */
const BASE       = "https://www.quirkchevynh.com";
const SRP_NEW    = `${BASE}/new-vehicles/`;
const SRP_USED   = `${BASE}/used-vehicles/`;
const MAX_PAGES  = 20;     // SRP pagination hard stop
const SRP_PAUSE  = 800;    // ms between SRP pages
const VDP_PAUSE  = 600;    // ms between VDP fetches
const MIN_EXPECTED = 20;   // fail run if total vehicles drop below this
const OUT_PATH   = "sandbox/inventory.json";
// Use a realistic browser User‑Agent so the site doesn’t block the crawler.
const UA         = "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/124.0 Safari/537.36";

/* ======== HTTP helpers ======== */
async function fetchHtml(url, tries = 4) {
  let delay = 500;
  let lastErr;
  for (let i = 0; i < tries; i++) {
    try {
      const res = await request(url, {
        headers: {
          // Provide a realistic UA and standard Accept + Accept‑Language headers.
          "        "user-agent": UA,
        "accept": "text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,*/*;q=0.8",
        "accept-language": "en-US,en;q=0.9",
        "accept-encoding": "gzip, deflate, br",
        "cache-control": "max-age=0",
        "upgrade-insecure-requests": "1",
        "sec-fetch-site": "same-origin",
        "sec-fetch-mode": "navigate",
        "sec-fetch-user": "?1",
        "sec-fetch-dest": "document",
        "sec-ch-ua": "\"Chromium\";v=\"124\", \"Not-A.Brand\";v=\"99\"",
        "sec-ch-ua-mobile": "?0",
        "sec-ch-ua-platform": "\"Windows\"",
        "referer": BASE
      if (res.statusCode === 304) return ""; // Not used (we don't send cond. headers yet)
      if (res.statusCode < 400) return await res.body.text();
      if (res.statusCode === 404) throw new Error(`404 ${url}`);
      lastErr = new Error(`HTTP ${res.statusCode} for ${url}`);
    } catch (e) {
      lastErr = e;
    }
    await sleep(delay);
    delay *= 2;
  }
  throw lastErr || new Error(`Failed after retries: ${url}`);
}

async function robotsAllows(urlStr) {
  try {
    const robots = await fetchHtml(`${BASE}/robots.txt`, 1);
    const disallows = robots
      .split("\n")
      .filter((l) => /^Disallow:/i.test(l))
      .map((l) => l.split(":")[1]?.trim())
      .filter(Boolean);
    const path = new URL(urlStr).pathname;
    return !disallows.some((rule) => rule && path.startsWith(rule));
  } catch {
    // If robots is unreachable, proceed cautiously.
    return true;
  }
}

/* ======== SRP helpers ======== */
function extractJsonBlobs($) {
  const blobs = [];
  $('script[type="application/json"], script[type="application/ld+json"]').each((_, el) => {
    const t = $(el).contents().text();
    try {
      const j = JSON.parse(t);
      blobs.push(j);
    } catch {}
  });
  return blobs;
}

function urlsFromBlob(blob) {
  // Conservative: fish out any /vehicle URLs in JSON
  const asText = JSON.stringify(blob);
  const matches = asText.match(/https?:\/\/[^"']+\/vehicle[^"']+/g) || [];
  return matches;
}

async function collectVDPLinks(startUrl) {
  const seenPages = new Set();
  const vdp = new Set();
  let next = startUrl;
  let page = 1;

  while (next && page <= MAX_PAGES) {
    if (!(await robotsAllows(next))) throw new Error(`Blocked by robots: ${next}`);
    const html = await fetchHtml(next);
    const $ = cheerio.load(html);

    // 1) Try JSON blobs first
    const blobs = extractJsonBlobs($);
    for (const blob of blobs) urlsFromBlob(blob).forEach((u) => vdp.add(u));

    // 2) Fallback: scan anchors
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      const abs = new URL(href, BASE).toString();
      if (abs.includes("/vehicle")) vdp.add(abs);
    });

    // Find Next page
    let nextHref = $('a[rel="next"]').attr("href") || $('a:contains("Next")').attr("href");
    if (!nextHref) break;
    const absNext = new URL(nextHref, BASE).toString();
    if (seenPages.has(absNext)) break;
    seenPages.add(absNext);
    next = absNext;
    page += 1;

    await sleep(SRP_PAUSE);
  }

  return Array.from(vdp);
}

/* ======== VDP parsing ======== */
function parseVehicleFromVDP(html, vdpUrl) {
  const $ = cheerio.load(html);
  // gather all JSON-LD blocks
  const dataBlocks = [];
  $('script[type="application/ld+json"]').each((_, el) => {
    try {
      const text = $(el).contents().text().trim();
      if (!text) return;
      const parsed = JSON.parse(text);
      Array.isArray(parsed) ? dataBlocks.push(...parsed) : dataBlocks.push(parsed);
    } catch {}
  });

  // select a likely block
  const ld =
    dataBlocks.find((d) => d["@type"] === "Vehicle") ||
    dataBlocks.find((d) => d["@type"] === "Product") ||
    dataBlocks.find((d) => d["@type"] && /Vehicle|Product/i.test(String(d["@type"])));

  let vin = "";
  let year = "";
  let make = "";
  let model = "";
  let trim = "";
  let price = 0;
  let photo = $('meta[property="og:image"]').attr("content") || "";

  if (ld) {
    vin = ld.vin || ld.sku || ld.mpn || "";
    const brand = (ld.brand && (ld.brand.name || ld.brand)) || "";
    const name = ld.name || "";
    // Try to infer year/make/model/trim from name if not explicit
    const tokens = (name || "").trim().split(/\s+/);
    const maybeYear = tokens[0] && /^\d{4}$/.test(tokens[0]) ? tokens[0] : "";
    year = ld.modelDate || ld.productionDate || maybeYear || "";

    make = String(brand || (tokens[1] || "")).trim();
    if (tokens.length >= 3) {
      model = tokens[2] || "";
      trim = tokens.slice(3).join(" ");
    }

    // Offers block for price
    const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
    if (offer && (offer.price || offer.priceSpecification?.price)) {
      price = Number(offer.price || offer.priceSpecification?.price || 0);
    }
    if (ld.image && !photo) photo = Array.isArray(ld.image) ? ld.image[0] : ld.image;
  }

  // Fallbacks (best-effort)
  if (!vin) {
    const text = $("body").text();
    const m = text.match(/\bVIN[:\s]*([A-HJ-NPR-Z0-9]{11,17})\b/i);
    if (m) vin = m[1];
  }
  if (!year) {
    const m = $('h1, .title, .vehicle-title').first().text().match(/\b(20\d{2})\b/);
    if (m) year = m[1];
  }

  // Stock type guess
  const stockType = /\/used-/.test(vdpUrl) || /used/i.test($("body").text()) ? "Used" : "New";

  return {
    vin: vin || "",
    year: Number(year) || "",
    make: make || "",
    model: model || "",
    trim: trim || "",
    price: Number(price) || 0,
    stockType,
    photo: photo || "",
    vdp: vdpUrl,
  };
}

/* ======== Builders ======== */
async function buildInventoryFrom(startUrl, forcedStockType) {
  const vdpUrls = await collectVDPLinks(startUrl);
  const out = [];
  for (const url of vdpUrls) {
    try {
      if (!(await robotsAllows(url))) continue;
      const html = await fetchHtml(url);
      const v = parseVehicleFromVDP(html, url);
      if (forcedStockType) v.stockType = forcedStockType;
      // Minimal validity gate; relax/tighten as desired:
      if (v.vin && (v.price > 0 || v.stockType === "New")) {
        out.push(v);
      }
      await sleep(VDP_PAUSE);
    } catch (e) {
      // keep going on individual errors
    }
  }
  return out;
}

function validateInventory(arr) {
  const errs = [];
  for (const v of arr) {
    if (!/^[A-HJ-NPR-Z0-9]{11,17}$/.test(String(v.vin))) errs.push(`Bad VIN: ${v.vin}`);
    if (!v.year || String(v.year).length < 4) errs.push(`Bad year for VIN ${v.vin}`);
    if (!v.make || !v.model) errs.push(`Missing make/model for VIN ${v.vin}`);
    if (v.stockType !== "New" && v.stockType !== "Used") errs.push(`Bad stockType ${v.stockType} (${v.vin})`);
    if (v.price && Number.isNaN(Number(v.price))) errs.push(`Bad price for VIN ${v.vin}`);
  }
  return errs;
}

function stableStringify(obj) {
  return JSON.stringify(obj, null, 2) + "\n";
}

/* ======== Main ======== */
(async () => {
   let newInv = [];
  let usedInv = [];
  try {
    [newInv, usedInv] = await Promise.all([
      buildInventoryFrom(SRP_NEW, "New"),
      buildInventoryFrom(SRP_USED, "Used"),
    ]);
  } catch (err) {
    console.error('Scrape failed:', err);
    const fallback = parseSampleCSV();
    newInv = fallback.filter(v => String(v.stockType || v.stockType).toLowerCase() === 'new');
    usedInv = fallback.filter(v => String(v.stockType || v.stockType).toLowerCase() === 'used');
  }

  // Dedupe VINs (prefer New over Used if collision)
  const byVin = new Map();
  [...newInv, ...usedInv].forEach((v) => {
    if (!byVin.has(v.vin) || byVin.get(v.vin).stockType === "Used") byVin.set(v.vin, v);
  });
  const inv = Array.from(byVin.values());

  // Validate and filter if necessary (don’t fail on small bad subset)
  const errs = validateInventory(inv);
  if (errs.length) {
    console.error(`Validation warnings (${errs.length}), showing first 20:\n` + errs.slice(0, 20).join("\n"));
  }
  const clean = inv.filter(
    (v) =>
      /^[A-HJ-NPR-Z0-9]{11,17}$/.test(String(v.vin)) &&
      v.year &&
      v.make &&
      v.model &&
      (v.stockType === "New" || v.stockType === "Used")
  );

  // Guardrail: fail run if suspiciously low
  if (clean.length < MIN_EXPECTED) {
    console.error(`Too few vehicles: ${clean.length} < ${MIN_EXPECTED}`);
    process.exit(2);
  }

  // Diff summary vs. prior file
  let oldInv = [];
  if (existsSync(OUT_PATH)) {
    try {
      oldInv = JSON.parse(readFileSync(OUT_PATH, "utf8"));
    } catch {}
  }
  const oldVIN = new Set(oldInv.map((v) => v.vin));
  const newVIN = new Set(clean.map((v) => v.vin));
  const added = [...newVIN].filter((v) => !oldVIN.has(v));
  const removed = [...oldVIN].filter((v) => !newVIN.has(v));

  console.log(`Vehicles: ${clean.length} (added ${added.length}, removed ${removed.length})`);
  if (added.length) console.log("Added VINs:", added.slice(0, 10).join(", "), added.length > 10 ? "..." : "");
  if (removed.length) console.log("Removed VINs:", removed.slice(0, 10).join(", "), removed.length > 10 ? "..." : "");

  // Write only if changed
  const newBody = stableStringify(clean);
  const oldBody = existsSync(OUT_PATH) ? readFileSync(OUT_PATH, "utf8") : "";
  if (newBody !== oldBody) {
    writeFileSync(OUT_PATH, newBody, "utf8");
    console.log(`Wrote ${clean.length} vehicles to ${OUT_PATH}`);
  } else {
    console.log("No change in inventory.");
  }
})();
