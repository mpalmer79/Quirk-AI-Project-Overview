// Nightly scraper for Quirk Chevy NH inventory -> sandbox/inventory.json
// Strategy: crawl SRP pages, collect VDP URLs, parse JSON-LD on each VDP,
// map to kiosk schema. Be polite and resilient.

import { writeFileSync } from "node:fs";
import { readFileSync, existsSync } from "node:fs";
import { setTimeout as sleep } from "node:timers/promises";
import * as cheerio from "cheerio";
import { request } from "undici";
import { URL } from "node:url";

const BASE = "https://www.quirkchevynh.com";
const SRP_START = `${BASE}/new-vehicles/`;          // you can add used later
const UA = "QuirkKioskBot/1.0 (+https://quirkchevynh.com)";

async function fetchHtml(url) {
  const res = await request(url, {
    headers: { "user-agent": UA, "accept": "text/html,application/xhtml+xml" },
  });
  if (res.statusCode >= 400) throw new Error(`HTTP ${res.statusCode} for ${url}`);
  return await res.body.text();
}

// robots.txt check (simple allow for SRP path)
async function robotsAllows(urlStr) {
  try {
    const robots = await fetchHtml(`${BASE}/robots.txt`);
    const disallows = robots
      .split("\n")
      .filter(l => /^Disallow:/i.test(l))
      .map(l => l.split(":")[1].trim());
    const path = new URL(urlStr).pathname;
    return !disallows.some(rule => rule && path.startsWith(rule));
  } catch {
    // If robots unreachable, fail closed or proceed; here we proceed cautiously.
    return true;
  }
}

// Collect all VDP links from SRP (following pagination)
async function collectVDPLinks(startUrl) {
  const seen = new Set();
  const vdp = new Set();
  let next = startUrl;
  let page = 1;

  while (next && page <= 20) { // hard stop to avoid runaway
    if (!(await robotsAllows(next))) throw new Error(`Blocked by robots: ${next}`);
    const html = await fetchHtml(next);
    const $ = cheerio.load(html);

    // Collect vehicle detail links – conservative patterns:
    $("a[href]").each((_, el) => {
      const href = $(el).attr("href");
      if (!href) return;
      const abs = new URL(href, BASE).toString();

      // Heuristics: VDPs usually not paginated list URLs and not filters.
      if (abs.includes("/vehicle") || /\/new-vehicles\/[^?]+\/.+/.test(abs)) {
        vdp.add(abs);
      }
    });

    // Find pagination "next" (rel or text)
    let nextHref = $('a[rel="next"]').attr("href");
    if (!nextHref) {
      nextHref = $('a:contains("Next")').attr("href");
    }
    if (!nextHref) break;

    const absNext = new URL(nextHref, BASE).toString();
    if (seen.has(absNext)) break;
    seen.add(absNext);
    next = absNext;
    page += 1;

    await sleep(800); // politeness delay
  }

  return Array.from(vdp);
}

// Parse JSON-LD Vehicle/Product on a VDP, with fallbacks
function parseVehicleFromVDP(html, vdpUrl) {
  const $ = cheerio.load(html);
  const scripts = $('script[type="application/ld+json"]');
  let dataBlocks = [];

  scripts.each((_, el) => {
    try {
      const text = $(el).contents().text().trim();
      if (!text) return;
      const parsed = JSON.parse(text);
      if (Array.isArray(parsed)) dataBlocks.push(...parsed);
      else dataBlocks.push(parsed);
    } catch {}
  });

  // Pick the best block
  const ld = dataBlocks.find(d => d["@type"] === "Vehicle") ||
             dataBlocks.find(d => d["@type"] === "Product") ||
             dataBlocks.find(d => d["@type"] && /Vehicle|Product/i.test(String(d["@type"])));

  // Extract common fields
  let vin = "";
  let year = "";
  let make = "";
  let model = "";
  let trim = "";
  let price = 0;
  let photo = $('meta[property="og:image"]').attr("content") || "";

  if (ld) {
    // Vehicle fields (schema)
    vin = ld.vin || ld.sku || ld.mpn || "";
    const brand = (ld.brand && (ld.brand.name || ld.brand)) || "";
    const name = ld.name || "";
    // Try to parse year/make/model/trim from name if needed
    const tokens = name.split(/\s+/);
    const maybeYear = tokens[0] && /^\d{4}$/.test(tokens[0]) ? tokens[0] : "";
    year = ld.modelDate || ld.productionDate || maybeYear || "";
    make = String(brand || (tokens[1] || "")).trim();
    // Model/Trim guesses from name fallback
    if (tokens.length >= 3) {
      model = tokens[2] || "";
      trim = tokens.slice(3).join(" ");
    }
    // Offers
    const offer = Array.isArray(ld.offers) ? ld.offers[0] : ld.offers;
    if (offer && (offer.price || offer.priceSpecification?.price)) {
      price = Number(offer.price || offer.priceSpecification?.price || 0);
    }
    if (ld.image && !photo) {
      photo = Array.isArray(ld.image) ? ld.image[0] : ld.image;
    }
  }

  // Fallbacks from page text if needed
  if (!vin) {
    const text = $("body").text();
    const m = text.match(/\bVIN[:\s]*([A-HJ-NPR-Z0-9]{11,17})\b/i);
    if (m) vin = m[1];
  }
  if (!year) {
    const m = $('h1, .title, .vehicle-title').first().text().match(/\b(20\d{2})\b/);
    if (m) year = m[1];
  }

  const stockType = vdpUrl.includes("/used-") || /used/i.test($("body").text()) ? "Used" : "New";

  return {
    vin: vin || "",
    year: Number(year) || "",
    make: make || "",
    model: model || "",
    trim: trim || "",
    price: Number(price) || 0,
    stockType,
    photo: photo || "",
    vdp: vdpUrl
  };
}

async function buildInventory() {
  const vdpUrls = await collectVDPLinks(SRP_START);

  const out = [];
  for (const [i, url] of vdpUrls.entries()) {
    try {
      if (!(await robotsAllows(url))) continue;
      const html = await fetchHtml(url);
      const v = parseVehicleFromVDP(html, url);

      // Minimal validity: need VIN and price>0 (relax as needed)
      if (v.vin && (v.price > 0 || v.stockType === "New")) {
        out.push(v);
      }
      await sleep(600); // politeness
    } catch (e) {
      // continue on errors
    }
  }

  // Deduplicate by VIN
  const byVin = new Map();
  for (const v of out) {
    if (!byVin.has(v.vin)) byVin.set(v.vin, v);
  }
  return Array.from(byVin.values());
}

function stableStringify(obj) {
  return JSON.stringify(obj, null, 2) + "\n";
}

(async () => {
  const inventory = await buildInventory();

  const path = "sandbox/inventory.json";
  const newBody = stableStringify(inventory);

  let oldBody = "";
  if (existsSync(path)) {
    try { oldBody = readFileSync(path, "utf8"); } catch {}
  }

  if (newBody !== oldBody) {
    writeFileSync(path, newBody, "utf8");
    console.log(`Wrote ${inventory.length} vehicles to ${path}`);
  } else {
    console.log("No change in inventory.");
  }
})();
