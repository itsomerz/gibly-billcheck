// ============================================================================
// UPDATER AGENT — PROPOSE-ONLY
// ----------------------------------------------------------------------------
// For every retailer currently listed in rateTable.js (across active
// provinces), this reads that retailer's configured rate page ONCE, asks an
// OpenAI text model to extract whatever rate plans are on it, matches each
// plan against the retailer's existing offers, and writes ONE proposal row
// per offer to Supabase's rate_proposals table via src/lib/supabase.js.
//
// This never writes to rateTable.js and never changes what the app shows —
// it only produces rows for a human to review. That's the whole point of
// this phase: build confidence in the read pipeline before anything is
// allowed to auto-publish. See src/app/api/admin/run-updater/route.js for
// how this gets triggered locally, and scripts/run-rate-updater.mjs for how
// the weekly GitHub Actions run triggers it.
//
// One fetch + one model call per RETAILER (not per offer) to keep this
// cheap — a retailer with both a fixed and a variable electricity plan on
// the same page still only costs one read. The one exception: a retailer
// whose RETAILER_SOURCES entry declares `tabInteractions` (a utility type
// needs a tab clicked before its rate is visible, e.g. ENMAX's gas tab)
// costs one extra read for that utility — unavoidable since the rate
// genuinely isn't in the page until then, but scoped only to retailers that
// declare it.
//
// LOCAL-ONLY, DO NOT DEPLOY TO VERCEL: this depends on `playwright` (a real
// Chromium download) for retailers whose pages need JS rendering. That
// package is NOT listed in package.json and must never be added there —
// it will not deploy cleanly to Vercel's serverless functions (bundle size
// + native-binary constraints). This file is safe to commit to the repo
// only because nothing reachable from src/app imports it, so Vercel's build
// never tries to resolve `playwright` at all. Its real home is
// .github/workflows/rate-update.yml, which installs playwright fresh in
// that CI job only (never committed) and runs it on a schedule. You can
// still trigger it locally too via `next dev` + curl, same as before.
// ============================================================================

import { chromium } from "playwright";
import { supabase } from "./supabase.js";
import { getAllRetailerOffers } from "./rateTable.js";
import { RETAILER_SOURCES } from "./retailerSources.js";

const UPDATER_MODEL = "gpt-4o-mini"; // text-only extraction — no need for the pricier vision model used for bill photos
const FETCH_TIMEOUT_MS = 10_000;
const RENDER_TIMEOUT_MS = 20_000; // headless render gets more time — real page load + JS execution
const MAX_PAGE_TEXT_CHARS = 30_000; // keeps the prompt (and cost) bounded; rate tables are usually well within this
const THIN_TEXT_THRESHOLD = 200; // below this, a plain fetch is treated as "probably JS-rendered" and retried headless
const RETAILER_CONCURRENCY = 2; // headless renders are heavy — don't run 5 Chromium pages at once locally

const READING_SCHEMA = {
  type: "object",
  properties: {
    page_readable: { type: "boolean" },
    readings: {
      type: "array",
      items: {
        type: "object",
        properties: {
          utility_type: { type: "string", enum: ["electricity", "gas"] },
          plan_label: { type: "string" },
          plan_type: { type: "string", enum: ["fixed", "variable", "regulated", "unknown"] },
          term_months: { type: ["integer", "null"] },
          rate_value: { type: "number" }, // always the ONGOING/standard rate — never a promotional teaser, see instructions
          rate_unit_seen: { type: "string", enum: ["cents_per_kwh", "dollars_per_kwh", "dollars_per_gj", "cents_per_gj", "unknown"] },
          intro_rate_value: { type: ["number", "null"] }, // promotional/introductory rate, if the page advertises one separate from the ongoing rate
          intro_rate_note: { type: ["string", "null"] }, // e.g. "3.59c/kWh for the first 3 months"
          rate_is_average: { type: "boolean" }, // true when rate_value came from a stated period average (variable/floating plans), not a locked-in figure
          rate_average_period: { type: ["string", "null"] }, // e.g. "30-day avg" — the stated period, when rate_is_average is true
          confidence: { type: "string", enum: ["high", "medium", "low"] },
        },
        required: [
          "utility_type",
          "plan_label",
          "plan_type",
          "term_months",
          "rate_value",
          "rate_unit_seen",
          "intro_rate_value",
          "intro_rate_note",
          "rate_is_average",
          "rate_average_period",
          "confidence",
        ],
        additionalProperties: false,
      },
    },
  },
  required: ["page_readable", "readings"],
  additionalProperties: false,
};

const INSTRUCTIONS = `You read the text content of a Canadian energy retailer's website (for Alberta residential customers) and extract every distinct residential electricity or natural gas RATE PLAN mentioned, with its price.

Only extract plans for Alberta / general residential customers — ignore business/commercial plans, other provinces if clearly labeled as such, and unrelated numbers (phone numbers, addresses, years, promo codes).

For each plan found:
- utility_type: "electricity" or "gas"
- plan_label: the plan's name/description exactly as written on the page (e.g. "12-Month Fixed", "Flex Rate")
- plan_type: "fixed", "variable", "regulated", or "unknown" if not stated
- term_months: contract length in months if stated, else null
- rate_value: the energy rate, UNIT-CONVERTED — electricity in CENTS per kWh (if the page shows dollars per kWh, e.g. "$0.0879/kWh", multiply by 100 to get 8.79), gas in DOLLARS per GJ (do not convert this one)
- rate_unit_seen: the unit exactly as printed on the page, BEFORE you converted it
- confidence: "high" if this number is clearly labeled as the current rate, "medium" if reasonably clear but you had to infer something, "low" if you're largely guessing

ONLY extract the ENERGY COMMODITY rate itself. Ignore administrative fees, transaction fees, delivery/distribution charges, and other surcharges shown alongside it — e.g. "+ $0.50/GJ transaction fee" is a FEE, not the rate, even though it's also written as "$X/GJ". Never let a fee end up in rate_value.

Some plans advertise a promotional/introductory rate that reverts to a different ongoing rate after a set period (e.g. "3.59c/kWh for your first 3 months, then 7.99c/kWh after"). When you see this:
- rate_value must ALWAYS be the ONGOING/standard rate — the rate the customer pays for the bulk of the term, after any promotional period ends. NEVER the promotional teaser rate.
- Separately set intro_rate_value to the promotional rate if one exists (else null), and intro_rate_note to a short plain description of its terms, e.g. "3.59c/kWh for the first 3 months" (else null).
- If there's no promotional rate at all, just the one plan price, set both intro_rate_value and intro_rate_note to null.
- To tell the two apart, compare which period is LONGER, don't just default to whichever number appears first in the text: the rate valid for the SHORTER, explicitly bounded period ("until the end of the year", "for the first 3 months") is the intro rate; the rate that takes over for the remainder of the term — often introduced with "then", "after that", or "starting [date], your rate changes to" — is the ongoing one.

WORKED EXAMPLE: the page text "pay just 3.59c/kWh until the end of the year. January 1, your rates change to 7.99c/kWh for the rest of your term" means: rate_value = 7.99 (the ongoing rate — it's what applies for "the rest of your term", the longer remaining period), intro_rate_value = 3.59, intro_rate_note = "3.59c/kWh until the end of the year". Do NOT reverse this just because 3.59 is mentioned first — the number introduced by "your rates change to [date]" and tied to "the rest of your term" is always the ongoing one, regardless of sentence order.

VARIABLE or floating plans don't have one fixed number — never invent one. If the page states the rate only as something like "market price" or "market price + a fee" with no single figure, look instead for a stated period average (e.g. "30-day avg: $2.84/GJ", "90-day rolling average") and use THAT average as rate_value — not the fee, and not the bare words "market price". When you do this, set rate_is_average to true and rate_average_period to the stated period (e.g. "30-day avg"); otherwise set rate_is_average to false and rate_average_period to null. A variable/floating rate is a snapshot that will genuinely read differently next time this page is checked — that's expected, not a mistake.

If this text doesn't actually contain rate plan pricing — a generic homepage with no rates, an error page, a blocked/paywalled page, or only unrelated content — set page_readable to false and return an empty readings array. Never invent a rate that isn't genuinely present in the text.`;

// Collapses horizontal whitespace but keeps line breaks as real boundaries
// between adjacent page elements — used by both the fetch and headless
// paths, since running everything into one line is exactly what let a fee
// sitting next to a plan name read as if it were the rate (Get Energy gas).
function normalizeWhitespace(text) {
  return text
    .split("\n")
    .map((line) => line.replace(/[ \t]+/g, " ").trim())
    .filter(Boolean)
    .join("\n")
    .trim();
}

function htmlToText(html) {
  const withLineBreaks = html
    .replace(/<script[\s\S]*?<\/script>/gi, " ")
    .replace(/<style[\s\S]*?<\/style>/gi, " ")
    .replace(/<!--[\s\S]*?-->/g, " ")
    // Turn block/line boundaries into real newlines BEFORE the generic tag
    // strip below erases that structure entirely.
    .replace(/<br\s*\/?>/gi, "\n")
    .replace(/<\/(p|div|li|tr|h[1-6]|section|article|header|footer)\s*>/gi, "\n")
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&#39;/g, "'")
    .replace(/&quot;/g, '"');
  return normalizeWhitespace(withLineBreaks);
}

async function fetchPageText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      redirect: "follow",
      headers: { "User-Agent": "Mozilla/5.0 (compatible; BillZapUpdaterBot/1.0)" },
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    return htmlToText(html).slice(0, MAX_PAGE_TEXT_CHARS);
  } finally {
    clearTimeout(timer);
  }
}

// Real headless render for pages that need their JS to run before the rate
// shows up — a plain fetch() only ever sees the initial HTML. Uses the
// shared browser passed in from runUpdater() rather than launching its own,
// so one run only ever pays for one Chromium process regardless of how many
// retailers need this fallback. When clickText is given (from a retailer's
// tabInteractions config), clicks the matching element before reading —
// e.g. a "Natural gas" tab that isn't visible until clicked.
async function fetchRenderedPageText(url, browser, clickText) {
  const page = await browser.newPage({ userAgent: "Mozilla/5.0 (compatible; BillZapUpdaterBot/1.0)" });
  try {
    await page.goto(url, { waitUntil: "networkidle", timeout: RENDER_TIMEOUT_MS });
    if (clickText) {
      // exact:true matters here — a loose substring match can catch an
      // unrelated (and possibly hidden) nav link that happens to contain
      // the same words, e.g. ENMAX has a nav item "Electricity and natural
      // gas" that a substring match for "Natural gas" would hit instead of
      // the actual visible tab.
      await page.getByText(clickText, { exact: true }).first().click({ timeout: RENDER_TIMEOUT_MS });
      // A tab switch is normally a client-side re-render, not a fresh
      // navigation, so there's no second "networkidle" guaranteed to fire —
      // give the UI a moment to settle instead of waiting on that.
      await page.waitForTimeout(1000);
    }
    const text = await page.evaluate(() => document.body.innerText);
    return normalizeWhitespace(text).slice(0, MAX_PAGE_TEXT_CHARS);
  } finally {
    await page.close();
  }
}

// Runs `limit` items of `fn` at a time instead of all at once — headless
// renders are heavy enough that firing all 5 retailers in full parallel
// would mean 5 concurrent Chromium pages on your machine. Mirrors
// Promise.allSettled's per-item {status, value|reason} shape so callers
// don't need to know this isn't the built-in.
async function mapWithConcurrency(items, limit, fn) {
  const results = new Array(items.length);
  let next = 0;
  async function worker() {
    while (next < items.length) {
      const i = next++;
      try {
        results[i] = { status: "fulfilled", value: await fn(items[i], i) };
      } catch (err) {
        results[i] = { status: "rejected", reason: err };
      }
    }
  }
  await Promise.all(Array.from({ length: Math.min(limit, items.length) }, worker));
  return results;
}

async function extractRatesFromText(retailer, pageText) {
  const res = await fetch("https://api.openai.com/v1/responses", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      model: UPDATER_MODEL,
      instructions: INSTRUCTIONS,
      input: [
        {
          role: "user",
          content: [{ type: "input_text", text: `Retailer: ${retailer}\n\nPage text:\n${pageText}` }],
        },
      ],
      text: {
        format: { type: "json_schema", name: "rate_readings", schema: READING_SCHEMA, strict: true },
      },
    }),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`OpenAI ${res.status}: ${detail.slice(0, 200)}`);
  }

  const payload = await res.json();
  const outputText = payload.output
    ?.find((item) => item.type === "message")
    ?.content?.find((part) => part.type === "output_text")?.text;
  if (!outputText) throw new Error("no structured output in OpenAI response");

  return JSON.parse(outputText);
}

// Best-effort match of one rateTable.js offer to one of the readings pulled
// off the page: utility_type AND plan_type compatibility are both hard
// requirements (fixed and variable are genuinely different products — a
// reading of one type is never a valid stand-in for an offer of the other),
// then the closest term length breaks ties among what's left. A reading
// with plan_type "unknown" is still allowed through, since that's a real
// ambiguity rather than a confirmed mismatch — matchedRow() flags those so
// they read as weaker matches. Returns null (not a guess) when nothing on
// the page shares both the utility_type and a compatible plan_type.
function matchReading(offer, readings) {
  let best = null;
  let bestScore = -1;
  for (const r of readings) {
    if (r.utility_type !== offer.utility_type) continue;
    if (r.plan_type !== offer.type && r.plan_type !== "unknown") continue;
    let score = 0;
    if (r.plan_type === offer.type) score += 2;
    if (offer.termMonths != null && r.term_months != null) {
      score += Math.max(0, 2 - Math.abs(offer.termMonths - r.term_months) / 12);
    }
    if (score > bestScore) {
      bestScore = score;
      best = r;
    }
  }
  return best;
}

function planLabel(offer) {
  return offer.termMonths ? `${offer.plan} (${offer.termMonths}mo)` : offer.plan;
}

function failureRow(offer, retailer, sourceUrl, reason, runId) {
  return {
    run_id: runId,
    retailer,
    utility_type: offer.utility_type,
    plan: planLabel(offer),
    current_app_rate: offer.rate,
    proposed_rate: null,
    source_url: sourceUrl,
    notes: reason,
    status: "pending",
  };
}

function matchedRow(offer, retailer, sourceUrl, matched, runId, readVia) {
  const introNote =
    matched?.intro_rate_value != null
      ? ` — page also advertises an intro rate of ${matched.intro_rate_value} for ${matched.intro_rate_note || "a promotional period"} (not used as proposed_rate)`
      : "";
  // The reading's plan_type is either offer.type (a confirmed match) or
  // "unknown" (matchReading's only other allowed case) — surface the
  // ambiguous one so a weaker match doesn't read as confidently as a
  // confirmed fixed-to-fixed or variable-to-variable one.
  const planTypeNote = matched?.plan_type === "unknown" ? " — plan type unconfirmed on the page" : "";
  // Variable/floating rates are a moving snapshot, not a locked-in number —
  // say so plainly, and name the averaging period when the model used one
  // (rate_is_average), so this doesn't read as confidently as a fixed rate.
  const floatingNote =
    matched?.plan_type === "variable"
      ? matched.rate_is_average
        ? ` — floating rate, captured as a ${matched.rate_average_period || "period"} average; expect this to move`
        : " — floating rate; expect this to move"
      : "";
  return {
    run_id: runId,
    retailer,
    utility_type: offer.utility_type,
    plan: planLabel(offer),
    current_app_rate: offer.rate,
    proposed_rate: matched ? matched.rate_value : null,
    source_url: sourceUrl,
    notes: matched
      ? `Matched "${matched.plan_label}" — ${matched.confidence} confidence (read via ${readVia}; page showed: ${matched.rate_unit_seen})${planTypeNote}${floatingNote}${introNote}`
      : `No matching ${offer.utility_type} plan found on the page (read via ${readVia})`,
    status: "pending",
  };
}

// Fetch (or headless-render) `url`, then try to extract rates from it.
// "Success" means both the page loaded AND the model actually found a
// usable rate on it — a thin/empty page and a full page with no readable
// rate (e.g. ENMAX: plenty of text, nothing extractable) are both treated
// as failures here, so both trigger the headless retry in readState.
async function attemptRead(retailer, url, sourceLabel, getText) {
  let text;
  try {
    text = await getText();
  } catch (err) {
    return { ok: false, sourceLabel, reason: `fetch_failed: ${err.message}` };
  }

  if (text.length < THIN_TEXT_THRESHOLD) {
    return { ok: false, sourceLabel, reason: "got too little readable text" };
  }

  let extraction;
  try {
    extraction = await extractRatesFromText(retailer, text);
  } catch (err) {
    return { ok: false, sourceLabel, reason: `extraction_failed: ${err.message}` };
  }

  if (!extraction.page_readable || extraction.readings.length === 0) {
    return { ok: false, sourceLabel, reason: "model found no rate plans on the page" };
  }

  return { ok: true, sourceLabel, extraction };
}

// Splits a retailer's offers into the distinct page states needed to read
// all of them, driven entirely by that retailer's tabInteractions config
// (see retailerSources.js) — no retailer-specific code here. Utility types
// not listed in tabInteractions share one default (no-click) state; each
// utility type that IS listed gets its own state carrying the tab text to
// click. A retailer with no tabInteractions at all always gets exactly one
// default state — unchanged from before.
//
// A tabInteractions entry can be:
//   - a string (e.g. ENMAX's `gas: "Natural gas"`): that whole utility type
//     is entirely behind one click — one click-only state, no default state
//     for it.
//   - an array (e.g. Get Energy's `electricity: [null, "Variable Rate"]`):
//     that utility type needs MULTIPLE page states to see all its offers —
//     some plans visible on the default (no-click) view, others only after
//     a click. One state per array entry; `null` means "read this one
//     without clicking anything" (the page's default tab). This is for a
//     retailer whose fixed/variable split is a tab on the SAME utility,
//     rather than a gas/electricity split like ENMAX's.
function buildReadStates(retailer, offers) {
  const tabInteractions = RETAILER_SOURCES[retailer]?.tabInteractions ?? {};
  const utilityTypes = [...new Set(offers.map((o) => o.utility_type))];

  const states = [];
  const defaultUtilities = [];
  for (const u of utilityTypes) {
    const config = tabInteractions[u];
    if (config == null) {
      defaultUtilities.push(u);
    } else if (Array.isArray(config)) {
      for (const clickText of config) {
        states.push({ clickText: clickText ?? null, utilityTypes: [u] });
      }
    } else {
      states.push({ clickText: config, utilityTypes: [u] });
    }
  }
  if (defaultUtilities.length > 0) {
    states.push({ clickText: null, utilityTypes: defaultUtilities });
  }
  return states;
}

// Reads one page state: a plain fetch first for the no-click default state
// (fetch can never perform a click, so a state that needs one skips
// straight to headless), retried headless if that didn't yield a usable
// rate. Tags every reading with which method actually produced it.
async function readState(retailer, url, state, browser) {
  let result;
  if (state.clickText) {
    result = await attemptRead(retailer, url, "headless", () => fetchRenderedPageText(url, browser, state.clickText));
    if (!result.ok) {
      return { ok: false, utilityTypes: state.utilityTypes, reason: `headless (${result.reason}) failed after clicking "${state.clickText}"` };
    }
  } else {
    result = await attemptRead(retailer, url, "fetch", () => fetchPageText(url));
    if (!result.ok) {
      const fetchReason = result.reason;
      result = await attemptRead(retailer, url, "headless", () => fetchRenderedPageText(url, browser, null));
      if (!result.ok) {
        return { ok: false, utilityTypes: state.utilityTypes, reason: `fetch (${fetchReason}) and headless (${result.reason}) both failed to find a usable rate` };
      }
    }
  }

  return { ok: true, utilityTypes: state.utilityTypes, readings: result.extraction.readings.map((r) => ({ ...r, _readVia: result.sourceLabel })) };
}

// Reads every page state this retailer needs, merges all their readings
// into one pool, then fans the result out into one row per offer that
// retailer currently has in rateTable.js. Every failure branch is caught
// here so one bad retailer (or one bad state within it) can never crash the
// run or block the others.
async function processRetailer(retailer, offers, runId, browser) {
  const url = RETAILER_SOURCES[retailer]?.url ?? null;

  if (!url) {
    return offers.map((o) => failureRow(o, retailer, null, "needs_url: no official rate page configured yet — add one to src/lib/retailerSources.js", runId));
  }

  const allReadings = [];
  const failuresByUtility = {}; // utility_type -> reason, only set for states that failed outright

  for (const state of buildReadStates(retailer, offers)) {
    const result = await readState(retailer, url, state, browser);
    if (result.ok) {
      allReadings.push(...result.readings);
    } else {
      for (const u of result.utilityTypes) failuresByUtility[u] = result.reason;
    }
  }

  return offers.map((o) => {
    const matched = matchReading(o, allReadings);
    if (matched) return matchedRow(o, retailer, url, matched, runId, matched._readVia);
    if (failuresByUtility[o.utility_type]) {
      return failureRow(o, retailer, url, `page_unreadable: ${failuresByUtility[o.utility_type]}`, runId);
    }
    // That utility's state succeeded — there just wasn't a plan on the page
    // matching THIS offer specifically (see matchReading's hard requirements).
    const anyReadingForUtility = allReadings.find((r) => r.utility_type === o.utility_type);
    return matchedRow(o, retailer, url, null, runId, anyReadingForUtility?._readVia ?? "combined");
  });
}

export async function runUpdater() {
  if (!process.env.OPENAI_API_KEY) throw new Error("OPENAI_API_KEY is not set");
  if (!supabase) throw new Error("Supabase isn't configured (missing NEXT_PUBLIC_SUPABASE_URL / NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY)");

  const runId = crypto.randomUUID();
  const retailerOffers = getAllRetailerOffers();
  const retailers = Object.keys(retailerOffers);

  // One shared browser for the whole run, regardless of how many retailers
  // end up needing the headless fallback — always closed in `finally` so a
  // failed run never leaves an orphaned Chromium process behind. Throttled
  // to RETAILER_CONCURRENCY at a time instead of all 5 in parallel.
  const browser = await chromium.launch({ headless: true });
  let settled;
  try {
    settled = await mapWithConcurrency(retailers, RETAILER_CONCURRENCY, (retailer) =>
      processRetailer(retailer, retailerOffers[retailer], runId, browser)
    );
  } finally {
    await browser.close();
  }

  const rows = [];
  const summary = retailers.map((retailer, i) => {
    const result = settled[i];
    if (result.status === "fulfilled") {
      rows.push(...result.value);
      return { retailer, proposals: result.value.length, ok: true };
    }
    // processRetailer catches its own errors, so this only fires on a truly
    // unexpected failure (e.g. a bug) — still surface it as proposal rows
    // rather than losing that retailer from the run silently.
    const fallback = retailerOffers[retailer].map((o) => failureRow(o, retailer, null, `unexpected_error: ${result.reason?.message ?? "unknown"}`, runId));
    rows.push(...fallback);
    return { retailer, proposals: fallback.length, ok: false };
  });

  const { error } = await supabase.from("rate_proposals").insert(rows);
  if (error) throw new Error(`Failed to write proposals: ${error.message}`);

  return { runId, retailers: summary, rowsWritten: rows.length };
}
