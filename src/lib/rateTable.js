// ============================================================================
// CANADIAN ENERGY RATE TABLE — structured data module, organized BY PROVINCE
// ----------------------------------------------------------------------------
// This is the data layer the whole comparison tool reads from. In the real
// app this lives in your backend/DB and is refreshed on a schedule; here it's
// a typed module you can drop into the build as the seed dataset.
//
// PROVINCE STRUCTURE (read this before adding a new province):
//   Everything lives under PROVINCES[code], keyed by a two-letter province
//   code ("AB", "ON", ...). Each entry has the same shape:
//     - code, name: identity
//     - status: "active" (real, comparable rate data) or "coming_soon"
//       (the structure exists, no real rates yet — the UI shows a waitlist
//       instead of a comparison for these)
//     - currency, lastReviewed: province-level metadata
//     - defaults: { electricity, gas } — the province's do-nothing/regulated
//       default rate. Alberta calls this the "Rate of Last Resort (RoLR)";
//       other provinces may use a different name or mechanism entirely, so
//       the label/note live in the data (`defaults.electricity.name`) —
//       nothing in the UI should hardcode "RoLR".
//     - electricityOffers / gasOffers: arrays of retailer offers, same shape
//       as before (source/sourceUrl/asOf/verified per row).
//
//   To activate a new province: fill in electricityOffers/gasOffers and
//   defaults with real sourced data, then flip status to "active". Every
//   consumer in the app reads through getProvince() / rankedElectricity() /
//   verificationStatus() — none of them hardcode a province, so no other
//   code should need to change.
//
// SOURCING NOTE (important for trust + accuracy):
//   Every rate below carries `source`, `sourceUrl`, `asOf`, and `verified`.
//   Rates marked verified:true were taken from the retailer's own public rate
//   disclosure or a primary source. Rates marked verified:false are
//   approximate/aggregator-sourced and MUST be confirmed against the
//   retailer's official page before you display them as fact next to a named
//   company. Never show an unverified named rate as if it were confirmed.
//
//   Rates change constantly. `asOf` is the date each figure was captured.
//   Treat anything older than ~2 weeks as stale and re-check.
//
//   Figures below were captured mid-2026 from public sources. They are a
//   realistic SEED, not a live feed — wire real refresh before launch.
// ============================================================================

export const PROVINCES = {
  AB: {
    code: "AB",
    name: "Alberta",
    status: "active",
    currency: "CAD",
    lastReviewed: "2026-08-03",

    // The default (do-nothing) rates — official, easy to track.
    defaults: {
      electricity: {
        name: "Rate of Last Resort (RoLR)",
        rate: 12.06,                 // ¢/kWh, Calgary/ENMAX territory
        unit: "cents_per_kwh",
        type: "regulated_fixed",
        note: "Fixed Jan 1 2025 – Dec 31 2026. Varies slightly by service territory.",
        source: "AUC / UCA",
        asOf: "2026-07",
        verified: true,
      },
      gas: {
        name: "Default Rate Tariff (DRT)",
        rate: null,                  // $/GJ — changes MONTHLY, must be pulled live
        unit: "dollars_per_gj",
        type: "regulated_monthly",
        note: "Set monthly by AUC. Pull the current month's value before comparing.",
        source: "AUC / local distributor",
        asOf: null,
        verified: false,
      },
    },

    // --- ELECTRICITY: competitive retailer offers -----------------------------
    // unit = cents per kWh. `adminFeePerDay` in cents/site/day (energy-rate
    // comparisons exclude it, but it's shown for transparency).
    electricityOffers: [
      {
        retailer: "Get Energy",
        plan: "1-Year Fixed",
        rate: 6.97,
        unit: "cents_per_kwh",
        type: "fixed",
        termMonths: 12,
        cancellationFee: false,
        adminFeePerDay: null,
        note: "No cancellation fee. Bundles power/gas/internet.",
        source: "getenergy.ca (retailer disclosure)",
        sourceUrl: "https://getenergy.ca/",
        asOf: "2026-07",
        verified: true,
      },
      {
        retailer: "Get Energy",
        plan: "Variable (30-day avg)",
        rate: 3.17,
        unit: "cents_per_kwh",
        type: "variable",
        termMonths: 0,
        cancellationFee: false,
        note: "30-day rolling avg as of 2026-06-29. Changes DAILY — display with a 'variable, moves daily' flag, never as a locked rate.",
        source: "getenergy.ca",
        sourceUrl: "https://getenergy.ca/",
        asOf: "2026-06-29",
        verified: true,
      },
      {
        retailer: "Encor by EPCOR",
        plan: "2-Year Fixed",
        rate: 8.63,
        unit: "cents_per_kwh",
        type: "fixed",
        termMonths: 24,
        cancellationFee: false,
        adminFeePerDay: 32,            // 32¢/site/day
        note: "No early-termination penalty. Fixed for 2-yr term (to Dec 31 2026).",
        source: "EPCOR rate disclosure / secondary",
        sourceUrl: "https://www.epcor.com/",
        asOf: "2026-05",
        verified: false,              // CONFIRM on EPCOR official page before display
      },
      {
        retailer: "ATCO Energy",
        plan: "2-Year Fixed (bundle promo)",
        rate: 7.68,
        unit: "cents_per_kwh",
        type: "fixed",
        termMonths: 24,
        cancellationFee: null,
        note: "Promo rate when bundling electricity + gas. Gas leg ~$4.38/GJ. Confirm promo still active.",
        source: "secondary aggregator",
        sourceUrl: "https://www.atcoenergy.com/",
        asOf: "2025-12",
        verified: false,              // promo — verify current
      },
      {
        retailer: "Direct Energy",
        plan: "2-Year Fixed",
        rate: 8.77,
        unit: "cents_per_kwh",
        type: "fixed",
        termMonths: 24,
        cancellationFee: null,        // may have exit fees — flag to user
        note: "No enrolment/exit fee on their own switches, but confirm. 20% admin discount when bundling gas.",
        source: "directenergy.ca / secondary",
        sourceUrl: "https://www.directenergy.ca/",
        asOf: "2026-06",
        verified: false,
      },
      {
        retailer: "ENMAX Energy",
        plan: "Easymax Fixed (3-Year)",
        rate: 8.79,
        unit: "cents_per_kwh",
        type: "fixed",
        termMonths: 36,
        cancellationFee: null,        // 3-yr term — check for early-exit terms
        adminFeePerDay: 36,           // ~36¢/site/day
        note: "Reference plan (common). Long 3-yr lock. Check exit terms before advising a switch off it.",
        source: "ENMAX rate disclosure",
        sourceUrl: "https://www.enmax.com/",
        asOf: "2026-07",
        verified: true,
      },
    ],

    // --- NATURAL GAS: competitive retailer offers -------------------------------
    // unit = dollars per GJ.
    gasOffers: [
      {
        retailer: "Get Energy",
        plan: "Variable",
        rate: 3.07,
        unit: "dollars_per_gj",
        type: "variable",
        termMonths: 0,
        transactionFeePerGj: 0.50,
        note: "Avg as of 2026-06-26, + $0.50/GJ transaction fee. Variable — flag as market-tracking.",
        source: "getenergy.ca",
        sourceUrl: "https://getenergy.ca/",
        asOf: "2026-06-26",
        verified: true,
      },
      {
        retailer: "ATCO Energy",
        plan: "2-Year Fixed (bundle)",
        rate: 4.38,
        unit: "dollars_per_gj",
        type: "fixed",
        termMonths: 24,
        note: "Bundle promo with electricity. Confirm current.",
        source: "secondary aggregator",
        sourceUrl: "https://www.atcoenergy.com/",
        asOf: "2025-12",
        verified: false,
      },
      {
        retailer: "ENMAX Energy",
        plan: "Easymax Floating",
        rate: 1.741,
        unit: "dollars_per_gj",
        type: "variable",
        termMonths: 0,
        note: "Reference plan (from sample bill). Floating — summer-low, winter-high.",
        source: "customer bill",
        sourceUrl: "https://www.enmax.com/",
        asOf: "2026-07",
        verified: true,
      },
    ],
  },

  ON: {
    code: "ON",
    name: "Ontario",
    status: "coming_soon",
    currency: "CAD",
    lastReviewed: null,

    // No real data yet — structure only. Fill these in with sourced,
    // verified offers and flip status to "active" when Ontario launches.
    defaults: {
      electricity: null,
      gas: null,
    },
    electricityOffers: [],
    gasOffers: [],
  },
};

// Display order for province pickers — add new provinces here too, in the
// order they should appear in the selector.
export const PROVINCE_ORDER = ["AB", "ON"];

export function getProvince(code) {
  return PROVINCES[code] ?? null;
}

export function isProvinceActive(code) {
  return getProvince(code)?.status === "active";
}

// --- Helper: how many offers still need verification, for one province -----
export function verificationStatus(code) {
  const province = getProvince(code);
  if (!province) return { total: 0, verified: 0, unverifiedCount: 0, needsCheck: [] };
  const all = [...province.electricityOffers, ...province.gasOffers];
  const verified = all.filter((o) => o.verified).length;
  const unverified = all.filter((o) => !o.verified);
  return {
    total: all.length,
    verified,
    unverifiedCount: unverified.length,
    needsCheck: unverified.map((o) => `${o.retailer} — ${o.plan} (${o.source})`),
  };
}

// --- Helper: get sorted, display-ready electricity offers for one province -
// Only returns fixed offers by default (apples-to-apples for a fixed customer);
// variable offers flagged separately so the UI can label their risk.
export function rankedElectricity(code, { includeVariable = false } = {}) {
  const province = getProvince(code);
  if (!province) return [];
  return province.electricityOffers
    .filter((o) => includeVariable || o.type === "fixed")
    .sort((a, b) => a.rate - b.rate);
}
