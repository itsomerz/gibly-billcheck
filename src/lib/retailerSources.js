// Confirmed official rate-disclosure page for each retailer, keyed EXACTLY
// as `retailer` appears in rateTable.js. The Updater agent reads only the
// URL configured here — it never guesses one. Leave `url` null until you've
// confirmed the page actually shows current rates (not just a homepage);
// the agent writes a "needs_url" proposal row for that retailer instead of
// silently reading the wrong page.
//
// The commented candidate on each line is the generic homepage already
// present as `sourceUrl` on that retailer's offers in rateTable.js — it's
// there as a starting point to check, not a confirmed rate page.
//
// STATUS NOTES (from research — VERIFY each opens to a page showing the
// current rate before trusting the agent's read):
//   ✅ readable = current rate is visible on the page
//   ⚠️ location-gated / verify = rate may be hidden behind a city picker or
//      calculator; the agent may fetch the page but not find the rate. Expect
//      possible failed reads here on the first run — that's useful info, not
//      a bug.
export const RETAILER_SOURCES = {
  "Get Energy": {
    // ✅ readable — homepage shows summary rates; signup page shows rates with
    // an "as of" date. Good source.
    url: "https://getenergy.ca/",
  },
  "Encor by EPCOR": {
    // ⚠️ location-gated — EPCOR pages say "this page doesn't match your
    // location." May need a city-specific URL or may not expose the rate to a
    // plain fetch. Watch this one.
    url: "https://www.epcor.com/ca/en/ab/other/start-services/home/compare-electricity-rates.html",
  },
  "ATCO Energy": {
    // ✅ readable — plan selector shows the actual fixed/floating rates.
    url: "https://www.atcoenergy.com/home-energy/plan-selector",
  },
  "Direct Energy": {
    // ⚠️ verify readability — confirm the page shows the competitive rate you
    // want (they also do regulated). Adjust URL if the rate isn't visible.
    url: "https://www.directenergy.ca/alberta/electricity-plans",
  },
  "ENMAX Energy": {
    // ⚠️ verify — this is the ENMAX RoLR (regulated default) page. If your
    // rateTable's "ENMAX Energy" entry is a COMPETITIVE rate, you may want the
    // ENMAX competitive plans page instead. Confirm which one matches your table.
    url: "https://www.enmax.com/electricity-and-natural-gas/easymax",
    // This page has Electricity / Natural gas / Solar tabs and loads on
    // Electricity by default — gas isn't in the DOM in a readable state
    // until that tab is clicked. Value is the tab's visible text; the
    // headless reader clicks it before reading gas. Fragile if ENMAX
    // renames the tab, but fine for now (see chat).
    tabInteractions: { gas: "Natural gas" },
  },
};
