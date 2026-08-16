"use client";

import React, { useState, useEffect, useRef } from "react";
import { Zap, Flame, ArrowRight, Trophy, ExternalLink } from "lucide-react";
import { P, F } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { useProvince } from "@/lib/ProvinceContext";
import { UploadScreen, ConfirmScreen } from "./UploadFlow";
import GiblyShell from "./GiblyShell";
import ComingSoonPanel from "./ComingSoonPanel";
import RateAlertForm from "./RateAlertForm";

// ============================================================================
// GIBLY · BILL CHECK — redesigned
// Direction: "found money." The feeling is the small thrill of discovering
// dollars leaking out of your house each month. NOT a utility data tool.
//
// Palette deliberately avoids every Alberta utility brand color (ENMAX red,
// ATCO/EPCOR blue-teal, Direct Energy blue): deep PLUM canvas, SUNSHINE GOLD,
// and money-positive MINT. Unmistakably Gibly, echoes no provider.
//
// Honesty rails unchanged: rank by energy rate only, math ranks (no pay-to-
// rank), verification links to official pages (not signup), projections are
// clearly estimates, adaptive list (all-cheaper+self, or top-7).
//
// Flow: upload -> server-side extraction (see app/api/extract-bill) -> user
// confirms/edits the numbers -> this component renders the verdict from the
// confirmed data instead of a hardcoded sample bill.
// ============================================================================

const GAS_SEASON = { Jan: 1.7, Feb: 1.65, Mar: 1.35, Apr: 1.0, May: 0.75, Jun: 0.6, Jul: 0.55, Aug: 0.55, Sep: 0.7, Oct: 1.05, Nov: 1.4, Dec: 1.6 };
const MONTHS = ["Jan","Feb","Mar","Apr","May","Jun","Jul","Aug","Sep","Oct","Nov","Dec"];

const PLAN_LABEL = { fixed: "Fixed", variable: "Variable / floating", regulated: "Regulated default", unknown: "Plan type unclear" };

// The cheapest tracked FIXED rate for a list of offers — used as the "market
// alternative" line in the gas year-ahead chart. Province-scoped by the
// caller (never a hardcoded province's offer list).
function cheapestFixedRate(offers) {
  const fixed = [...offers].filter((o) => o.type === "fixed").sort((a, b) => a.rate - b.rate);
  return fixed.length ? fixed[0].rate : null;
}

// animated count-up hook for the money reveal
function useCountUp(target, duration = 1100, start = false) {
  const [val, setVal] = useState(0);
  const raf = useRef();
  useEffect(() => {
    if (!start) return;
    let t0;
    const tick = (t) => {
      if (!t0) t0 = t;
      const p = Math.min((t - t0) / duration, 1);
      const eased = 1 - Math.pow(1 - p, 3);
      setVal(target * eased);
      if (p < 1) raf.current = requestAnimationFrame(tick);
    };
    raf.current = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf.current);
  }, [target, duration, start]);
  return val;
}

// Anonymized analytics: fire once per verdict shown, never blocks or affects
// what the user sees. Only region/usage/rate/plan/verdict — no personal info,
// and it's sourced from the user's own confirmed numbers, not a guess. Called
// once per utility present, since a bill can cover electricity, gas, or both.
function useAnalyticsLog(utilityType, rateValue, planType, verdict, usageAnnual) {
  const { province } = useProvince();
  const hasLogged = useRef(false);
  useEffect(() => {
    if (hasLogged.current || !supabase) return;
    hasLogged.current = true;
    supabase
      .from("analytics")
      .insert({
        region: province,
        utility_type: utilityType,
        current_rate: rateValue,
        plan_type: planType,
        usage: Math.round(usageAnnual),
        verdict,
      })
      .then(({ error }) => {
        if (error) console.warn("Analytics logging failed:", error.message);
      });
  }, [province, utilityType, rateValue, planType, verdict, usageAnnual]);
}

export default function BillCheck() {
  const { province, setProvince, provinceData, isActive } = useProvince();
  const [stage, setStage] = useState("upload"); // "upload" | "confirm" | "results"
  const [extracted, setExtracted] = useState(null);
  const [bill, setBill] = useState(null);

  function startOver() {
    setExtracted(null);
    setBill(null);
    setStage("upload");
  }

  // Selected province has no real rate data yet — show the waitlist instead
  // of a broken/empty comparison. This also catches the case where a bill
  // upload auto-detects an inactive province mid-flow (see onExtracted
  // below): once that happens this check wins on the very next render,
  // regardless of what `stage` was set to.
  if (!isActive) {
    return (
      <GiblyShell>
        <ComingSoonPanel provinceName={provinceData?.name ?? province} />
      </GiblyShell>
    );
  }

  return (
    <GiblyShell>
      {stage === "upload" && (
        <UploadScreen
          onExtracted={(data) => {
            // Auto-detect from the bill and switch provinces if it's
            // confidently a known one — the user can still see/override it
            // via the province selector, including on the confirm screen.
            if (data.province_code && data.province_code !== "unknown" && data.province_code !== province) {
              setProvince(data.province_code);
            }
            setExtracted(data);
            setStage("confirm");
          }}
        />
      )}
      {stage === "confirm" && (
        <ConfirmScreen
          extracted={extracted}
          onCancel={startOver}
          onConfirm={(data) => {
            setBill(data);
            setStage("results");
          }}
        />
      )}
      {stage === "results" && bill && <Reveal bill={bill} onStartOver={startOver} />}
    </GiblyShell>
  );
}

// Seasonal gas rates swing a lot and we only know the billing period's length,
// not which calendar month it covers — so we anchor the seasonal model to
// today's month as a reasonable stand-in.
function seasonalBaseGj(data) {
  const monthlyUsage = (data.usage / data.billing_days) * 30;
  const currentMonth = MONTHS[new Date().getMonth()];
  return monthlyUsage / GAS_SEASON[currentMonth];
}

// bill = { electricity: {...}|null, gas: {...}|null } — a bill can cover one
// utility or both (e.g. a combined ENMAX statement), so each section only
// renders if extraction actually found that utility on the upload.
function Reveal({ bill, onStartOver }) {
  const hasElec = !!bill.electricity;
  const hasGas = !!bill.gas;
  return (
    <div>
      <StartOverLink onClick={onStartOver} />
      {hasElec && <RankedView utilityType="electricity" data={bill.electricity} />}
      {hasGas && <RankedView utilityType="gas" data={bill.gas} />}
      {/* Gas has a seasonal model (electricity doesn't in this app), so the
          year-ahead projection only ever applies when gas data exists —
          hidden entirely, not shown with placeholder data, otherwise. */}
      {hasGas && <GasSeasonView data={bill.gas} />}
      <HonestyNote />
      <RateAlertForm bill={bill} />
    </div>
  );
}

// Rank the user's own rate against tracked retailer offers, same "found
// money" hero as before. `data` is one utility's confirmed fields, scoped to
// the currently selected province via useProvince() — never mixes provinces.
function RankedView({ utilityType, data }) {
  const { provinceData } = useProvince();
  const isGas = utilityType === "gas";
  const icon = isGas ? <Flame size={16} color={P.gold} /> : <Zap size={16} color={P.gold} />;
  const unit = isGas ? "$" : "¢";

  const usageAnnual = (data.usage / data.billing_days) * 365;

  const tableRows = (isGas ? provinceData.gasOffers : provinceData.electricityOffers)
    .filter((o) => o.type === "fixed")
    .map((o) => ({ name: o.retailer, rate: o.rate, type: o.plan, note: o.note, officialUrl: o.sourceUrl, isUser: false }));
  const userRow = {
    name: data.provider || "You",
    rate: data.rate_value,
    type: PLAN_LABEL[data.plan_type] || data.plan_type,
    note: data.plan_type !== "fixed" ? "not a locked-in fixed rate" : null,
    officialUrl: null,
    isUser: true,
  };
  const ranked = [...tableRows, userRow].sort((a, b) => a.rate - b.rate);
  const cheapest = ranked[0];
  const userRate = data.rate_value;
  const saveVsBest = isGas ? (userRate - cheapest.rate) * usageAnnual : ((userRate - cheapest.rate) / 100) * usageAnnual;

  const [started, setStarted] = useState(false);
  useEffect(() => { const t = setTimeout(() => setStarted(true), 250); return () => clearTimeout(t); }, []);
  const animated = useCountUp(Math.max(saveVsBest, 0), 1200, started);

  useAnalyticsLog(utilityType, userRate, data.plan_type, userRate <= cheapest.rate ? "good deal" : "room to save", usageAnnual);

  const [showAll, setShowAll] = useState(false);
  const userIndex = ranked.findIndex((r) => r.isUser);
  const TOP_N = 7;
  const userIsTopN = userIndex < TOP_N;
  let visibleRows;
  if (showAll) visibleRows = ranked;
  else if (userIsTopN) visibleRows = ranked.slice(0, TOP_N);
  else visibleRows = [...ranked.slice(0, userIndex), ranked[userIndex]];
  const hiddenCount = ranked.length - visibleRows.length;

  const defaultElec = provinceData.defaults.electricity; // null if the province has no regulated-default data yet

  return (
    <div>
      {/* HERO: the found-money moment */}
      <div className="fu" style={{ background: `radial-gradient(120% 100% at 50% 0%, ${P.plum3} 0%, ${P.plum2} 60%)`, border: `1px solid ${P.line}`, borderRadius: 28, padding: "34px 26px 30px", textAlign: "center", marginBottom: 16, position: "relative", overflow: "hidden" }}>
        <div className="coin" style={{ width: 60, height: 60, borderRadius: "50%", background: `linear-gradient(135deg, ${P.gold}, ${P.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 18px", boxShadow: `0 8px 24px ${P.gold}55, inset 0 2px 6px #FFF4D0` }}>
          <span style={{ fontFamily: F.display, fontWeight: 700, fontSize: 30, color: P.plum }}>$</span>
        </div>
        <div style={{ color: P.lilac, fontSize: 14, marginBottom: 6, fontWeight: 500 }}>You could be keeping about</div>
        <div className="num shimmer" style={{ fontSize: 68, fontWeight: 600, lineHeight: 1, marginBottom: 4 }}>
          ${animated.toFixed(0)}
        </div>
        <div style={{ color: P.lilac, fontSize: 14, marginBottom: 20 }}>a year, on {isGas ? "gas" : "electricity"} alone</div>
        <p style={{ color: P.cream, fontSize: 15.5, lineHeight: 1.55, margin: "0 auto", maxWidth: 400, opacity: 0.9 }}>
          You're on <b style={{ color: P.gold }}>{userRate}{unit === "$" ? " $/GJ" : "¢/kWh"}</b>
          {!isGas && defaultElec && <> — better than {provinceData.name}'s {defaultElec.rate}¢ default, nice</>} — but <b style={{ color: P.mint }}>{cheapest.name}</b> is charging just <b style={{ color: P.mint }}>{unit === "$" ? `$${cheapest.rate}` : `${cheapest.rate}¢`}</b>. That gap is your money.
        </p>
      </div>

      {/* RANKED FIELD */}
      <div className="fu2" style={{ background: P.plum2, border: `1px solid ${P.line}`, borderRadius: 22, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: P.plum3, display: "flex", alignItems: "center", justifyContent: "center" }}>{icon}</div>
          <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 18 }}>Where everyone stands</span>
        </div>
        <p style={{ color: P.lilac, fontSize: 12.5, margin: "0 0 16px", paddingLeft: 39 }}>
          {userIsTopN ? "You're near the top — here's the leading field." : "Everyone cheaper than you, plus your spot."} Ranked by price only. Nobody pays to be here.
        </p>

        {visibleRows.map((r) => {
          const i = ranked.findIndex((x) => x.name === r.name && x.isUser === r.isUser);
          const isBest = i === 0;
          return (
            <div key={`${r.name}-${r.isUser}`} style={{ display: "flex", alignItems: "center", gap: 12, padding: "12px 13px", borderRadius: 14, marginBottom: 7,
              background: r.isUser ? P.plum3 : isBest ? `${P.mint}14` : "transparent",
              border: r.isUser ? `1px solid ${P.gold}66` : isBest ? `1px solid ${P.mint}44` : `1px solid transparent` }}>
              <div className="num" style={{ width: 24, fontSize: 15, fontWeight: 600, color: isBest ? P.mint : P.lilac, textAlign: "center" }}>{i + 1}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
                  <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 15.5 }}>{r.name}</span>
                  {isBest && <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: P.mint, color: P.plum, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, fontFamily: F.body }}><Trophy size={10} /> CHEAPEST</span>}
                  {r.isUser && <span style={{ fontSize: 10, fontWeight: 700, color: P.plum, background: P.gold, padding: "2px 7px", borderRadius: 20 }}>YOU</span>}
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 3 }}>
                  <span style={{ color: P.lilac, fontSize: 12 }}>{r.type}{r.note ? ` · ${r.note}` : ""}</span>
                  {r.officialUrl && (
                    <a href={r.officialUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 3, color: P.gold, fontSize: 11.5, fontWeight: 600, textDecoration: "none" }}>
                      check this rate <ExternalLink size={11} />
                    </a>
                  )}
                </div>
              </div>
              <div className="num" style={{ fontSize: 21, fontWeight: 600, color: isBest ? P.mint : P.cream }}>
                {unit === "$" ? <>${r.rate}<span style={{ fontSize: 13, color: P.lilac }}>/GJ</span></> : <>{r.rate}<span style={{ fontSize: 13, color: P.lilac }}>¢</span></>}
              </div>
            </div>
          );
        })}

        {!isGas && defaultElec && (
          <div style={{ display: "flex", alignItems: "center", gap: 10, padding: "12px 13px", marginTop: 3, borderTop: `1px dashed ${P.line}` }}>
            <div style={{ flex: 1, color: P.lilac, fontSize: 12.5 }}>Do-nothing default — {defaultElec.name}</div>
            <div className="num" style={{ fontSize: 16, fontWeight: 600, color: P.coral }}>{defaultElec.rate}<span style={{ fontSize: 12 }}>¢</span></div>
          </div>
        )}

        {hiddenCount > 0 && !showAll && (
          <button className="tap" onClick={() => setShowAll(true)} style={{ width: "100%", background: "transparent", border: `1px dashed ${P.line}`, borderRadius: 12, padding: "10px", color: P.lilac, fontSize: 13, fontWeight: 500, marginTop: 4, fontFamily: F.body }}>
            Show all {ranked.length} rates ({hiddenCount} pricier than you)
          </button>
        )}
        {showAll && ranked.length > TOP_N && (
          <button className="tap" onClick={() => setShowAll(false)} style={{ width: "100%", background: "transparent", border: `1px dashed ${P.line}`, borderRadius: 12, padding: "10px", color: P.lilac, fontSize: 13, fontWeight: 500, marginTop: 4, fontFamily: F.body }}>Show less</button>
        )}
      </div>
    </div>
  );
}

// Year-ahead seasonal projection for gas. Usage genuinely swings with the
// seasons for everyone (more heating in winter), but the RATE only swings
// for variable/regulated customers — a fixed-rate customer's ¢/GJ doesn't
// move, so we only apply the rate-seasonality multiplier when their plan
// actually floats. Showing this for a fixed customer without that guard
// would fabricate a monthly rate swing they don't have.
function GasSeasonView({ data: gasData }) {
  const { provinceData } = useProvince();
  const gasFixedAlt = cheapestFixedRate(provinceData.gasOffers) ?? gasData.rate_value; // no tracked fixed offer to compare against — fall back to their own rate rather than crashing
  const baseGj = seasonalBaseGj(gasData);
  const floatingBase = gasData.rate_value;
  const rateFloats = gasData.plan_type === "variable" || gasData.plan_type === "regulated";
  const data = MONTHS.map((m) => {
    const usage = baseGj * GAS_SEASON[m];
    const rate = rateFloats ? floatingBase * (0.6 + 0.7 * GAS_SEASON[m]) : floatingBase;
    return { m, floatCost: usage * rate, fixedCost: usage * gasFixedAlt };
  });
  const maxCost = Math.max(...data.map((d) => Math.max(d.floatCost, d.fixedCost)));
  const totalFloat = Math.round(data.reduce((s, d) => s + d.floatCost, 0));
  const totalFixed = Math.round(data.reduce((s, d) => s + d.fixedCost, 0));

  const defaultGasName = provinceData.defaults.gas?.name ?? "your default gas rate";
  const planLabel = gasData.plan_type === "regulated" ? `Your ${defaultGasName}` : gasData.plan_type === "fixed" ? "Your fixed plan" : "Your floating plan";

  return (
    <>
      <div className="fu3" style={{ background: P.plum2, border: `1px solid ${P.line}`, borderRadius: 22, padding: 20, marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
          <div style={{ width: 30, height: 30, borderRadius: 9, background: P.plum3, display: "flex", alignItems: "center", justifyContent: "center" }}><Flame size={16} color={P.coral} /></div>
          <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 18 }}>Your gas year ahead</span>
        </div>
        <p style={{ color: P.lilac, fontSize: 12.5, margin: "0 0 18px", paddingLeft: 39 }}>From your own usage + typical {provinceData.name} seasons. Watch the winter climb.</p>

        <div style={{ display: "flex", alignItems: "flex-end", gap: 5, height: 140, marginBottom: 10 }}>
          {data.map((d) => {
            const winter = ["Nov","Dec","Jan","Feb","Mar"].includes(d.m);
            return (
              <div key={d.m} style={{ flex: 1, display: "flex", flexDirection: "column", alignItems: "center", gap: 4, height: "100%", justifyContent: "flex-end" }}>
                <div style={{ position: "relative", width: "100%", display: "flex", justifyContent: "center", alignItems: "flex-end", height: "100%", gap: 2 }}>
                  <div style={{ width: "44%", height: `${(d.floatCost / maxCost) * 100}%`, background: winter ? `linear-gradient(${P.coral}, ${P.coral}bb)` : `linear-gradient(${P.gold}, ${P.goldDim})`, borderRadius: "4px 4px 0 0", minHeight: 3 }} title={`Floating $${d.floatCost.toFixed(0)}`} />
                  <div style={{ width: "44%", height: `${(d.fixedCost / maxCost) * 100}%`, background: `${P.lilac}44`, borderRadius: "4px 4px 0 0", minHeight: 3 }} title={`Fixed $${d.fixedCost.toFixed(0)}`} />
                </div>
                <span style={{ fontSize: 9.5, color: winter ? P.coral : P.lilac, fontWeight: winter ? 700 : 400 }}>{d.m[0]}</span>
              </div>
            );
          })}
        </div>

        <div style={{ display: "flex", gap: 16, justifyContent: "center", marginBottom: 16, fontSize: 12, color: P.lilac }}>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: P.gold, borderRadius: 3 }} /> {planLabel}</span>
          <span style={{ display: "flex", alignItems: "center", gap: 5 }}><span style={{ width: 10, height: 10, background: `${P.lilac}66`, borderRadius: 3 }} /> Fixed ${gasFixedAlt}/GJ</span>
        </div>

        <div style={{ background: `${P.coral}18`, border: `1px solid ${P.coral}33`, borderRadius: 14, padding: 15, fontSize: 13.5, color: P.cream, lineHeight: 1.55 }}>
          Over a year, your plan runs about <b style={{ color: P.gold }}>${totalFloat}</b> vs <b>${totalFixed}</b> {rateFloats ? "if you locked in a fixed rate instead" : "at the cheapest fixed rate we track"}.{" "}
          {totalFixed < totalFloat ? (
            <>{rateFloats ? <>Locking in a fixed rate could save you money overall <b>and</b> cap your worst winter month.</> : <>Switching to that fixed rate could save you money overall.</>}</>
          ) : rateFloats ? (
            <>Floating likely wins overall — but fixed caps your worst month. Your call: save on average, or dodge the winter spike.</>
          ) : (
            <>Your fixed rate already beats it — nice.</>
          )}
        </div>
      </div>
    </>
  );
}

function StartOverLink({ onClick }) {
  return (
    <button className="tap" onClick={onClick} style={{ display: "flex", alignItems: "center", gap: 5, background: "transparent", border: "none", color: P.lilac, fontSize: 12.5, fontFamily: F.body, padding: 0, marginBottom: 14, cursor: "pointer" }}>
      Check another bill <ArrowRight size={12} />
    </button>
  );
}

function HonestyNote() {
  const { provinceData } = useProvince();
  return (
    <div className="fu4" style={{ background: P.plum2, border: `1px solid ${P.line}`, borderRadius: 16, padding: 16, fontSize: 12.5, color: P.lilac, lineHeight: 1.55, marginBottom: 16 }}>
      We only compare the <b style={{ color: P.cream }}>energy rate</b> — the bit you control. Delivery and admin fees are the same no matter who you buy from. Every "check this rate" opens the retailer's <b style={{ color: P.cream }}>official page</b> so you can confirm it — no signup links, no referral fees, and ads never change the ranking. Year-ahead figures are <b style={{ color: P.cream }}>estimates</b> from your usage and typical {provinceData.name} seasons.
    </div>
  );
}

