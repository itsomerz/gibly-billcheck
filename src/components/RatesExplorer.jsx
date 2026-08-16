"use client";

import { useState } from "react";
import { Zap, Flame, Trophy, ExternalLink } from "lucide-react";
import { P, F } from "@/lib/theme";
import { useProvince } from "@/lib/ProvinceContext";
import GiblyShell from "./GiblyShell";
import ComingSoonPanel from "./ComingSoonPanel";

function formatTerm(offer) {
  return offer.termMonths ? `${offer.termMonths}-mo term` : "No fixed term";
}

function OfferRow({ offer, rank, isElec }) {
  const isBest = rank === 1;
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 12,
        padding: "12px 13px",
        borderRadius: 14,
        marginBottom: 7,
        background: isBest ? `${P.mint}14` : "transparent",
        border: isBest ? `1px solid ${P.mint}44` : "1px solid transparent",
      }}
    >
      <div className="num" style={{ width: 24, fontSize: 15, fontWeight: 600, color: isBest ? P.mint : P.lilac, textAlign: "center" }}>
        {rank}
      </div>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7, flexWrap: "wrap" }}>
          <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 15.5 }}>{offer.retailer}</span>
          {isBest && (
            <span style={{ display: "inline-flex", alignItems: "center", gap: 3, background: P.mint, color: P.plum, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, fontFamily: F.body }}>
              <Trophy size={10} /> CHEAPEST
            </span>
          )}
          {!offer.verified && (
            <span style={{ display: "inline-flex", alignItems: "center", background: `${P.coral}22`, color: P.coral, fontSize: 10, fontWeight: 700, padding: "2px 7px", borderRadius: 20, fontFamily: F.body, border: `1px solid ${P.coral}55` }}>
              confirm rate
            </span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginTop: 3, flexWrap: "wrap" }}>
          <span style={{ color: P.lilac, fontSize: 12 }}>
            {offer.plan} · {formatTerm(offer)}{offer.note ? ` · ${offer.note}` : ""}
          </span>
          <a href={offer.sourceUrl} target="_blank" rel="noopener noreferrer" style={{ display: "inline-flex", alignItems: "center", gap: 3, color: P.gold, fontSize: 11.5, fontWeight: 600, textDecoration: "none" }}>
            check this rate <ExternalLink size={11} />
          </a>
        </div>
      </div>
      <div className="num" style={{ fontSize: 21, fontWeight: 600, color: isBest ? P.mint : P.cream, textAlign: "right", whiteSpace: "nowrap" }}>
        {isElec ? (
          <>{offer.rate}<span style={{ fontSize: 13, color: P.lilac }}>¢</span></>
        ) : (
          <>${offer.rate}<span style={{ fontSize: 13, color: P.lilac }}> /GJ</span></>
        )}
      </div>
    </div>
  );
}

function TabButton({ active, onClick, icon, label }) {
  return (
    <button
      className="tap"
      onClick={onClick}
      style={{
        flex: 1,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: 7,
        background: active ? P.plum3 : "transparent",
        border: `1px solid ${active ? `${P.gold}66` : P.line}`,
        borderRadius: 14,
        padding: "12px 10px",
        fontFamily: F.body,
        fontWeight: 600,
        fontSize: 14,
        color: active ? P.cream : P.lilac,
      }}
    >
      {icon} {label}
    </button>
  );
}

export default function RatesExplorer() {
  const { provinceData, isActive } = useProvince();
  const [tab, setTab] = useState("electricity");
  const isElec = tab === "electricity";

  if (!isActive) {
    return (
      <GiblyShell>
        <ComingSoonPanel provinceName={provinceData?.name ?? "This province"} />
      </GiblyShell>
    );
  }

  const offers = [...(isElec ? provinceData.electricityOffers : provinceData.gasOffers)].sort((a, b) => a.rate - b.rate);

  return (
    <GiblyShell>
      <div className="fu" style={{ background: `radial-gradient(120% 100% at 50% 0%, ${P.plum3} 0%, ${P.plum2} 60%)`, border: `1px solid ${P.line}`, borderRadius: 28, padding: "28px 26px", marginBottom: 16 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 10 }}>
          <div style={{ width: 36, height: 36, borderRadius: 10, background: P.plum3, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Zap size={17} color={P.gold} />
          </div>
          <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 22 }}>Explore all {provinceData.name} rates</span>
        </div>
        <p style={{ color: P.lilac, fontSize: 14, lineHeight: 1.55, margin: 0 }}>
          Every {provinceData.name} electricity and natural gas offer we track, ranked purely by price — cheapest first, no pay-to-rank. Tap a rate to confirm it on the retailer's own page.
        </p>
      </div>

      <div style={{ display: "flex", gap: 8, marginBottom: 16 }}>
        <TabButton active={isElec} onClick={() => setTab("electricity")} icon={<Zap size={16} />} label="Electricity" />
        <TabButton active={!isElec} onClick={() => setTab("gas")} icon={<Flame size={16} />} label="Natural gas" />
      </div>

      <div className="fu2" style={{ background: P.plum2, border: `1px solid ${P.line}`, borderRadius: 22, padding: 20, marginBottom: 16 }}>
        {offers.map((o, i) => (
          <OfferRow key={`${o.retailer}-${o.plan}`} offer={o} rank={i + 1} isElec={isElec} />
        ))}
      </div>

      <div className="fu3" style={{ background: P.plum2, border: `1px solid ${P.line}`, borderRadius: 16, padding: 16, fontSize: 12.5, color: P.lilac, lineHeight: 1.55 }}>
        Ranked by <b style={{ color: P.cream }}>price alone</b> — no retailer pays to rank higher, math does the sorting. We only compare the <b style={{ color: P.cream }}>energy rate</b>, the part you control — delivery and admin fees are the same no matter who you buy from. Every rate is an <b style={{ color: P.cream }}>estimate as of its listed date</b>; rates move often, so confirm on the retailer's official page before you switch. Rows marked <span style={{ color: P.coral, fontWeight: 600 }}>confirm rate</span> haven't been checked against a primary source yet.
      </div>
    </GiblyShell>
  );
}
