"use client";

import { useState } from "react";
import { Clock, Check } from "lucide-react";
import { P, F } from "@/lib/theme";

// Shown instead of a comparison whenever the selected province has no real
// rate data yet (status: "coming_soon" in rateTable.js) — reached either by
// picking that province from the header selector, or by uploading a bill
// that auto-detects as that province. Never falls through to a broken/empty
// comparison screen.
//
// The waitlist capture is UI-only for now (no persistence) — wire it to real
// storage (e.g. a Supabase "waitlist" table, same pattern as the analytics
// insert in BillCheck.jsx) once you're ready to actually collect emails.
export default function ComingSoonPanel({ provinceName }) {
  const [email, setEmail] = useState("");
  const [joined, setJoined] = useState(false);

  function handleJoin() {
    if (!email.includes("@")) return;
    setJoined(true);
  }

  return (
    <div
      className="fu"
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${P.plum3} 0%, ${P.plum2} 60%)`,
        border: `1px solid ${P.line}`,
        borderRadius: 28,
        padding: "34px 26px 30px",
        textAlign: "center",
      }}
    >
      <div
        style={{
          width: 60,
          height: 60,
          borderRadius: "50%",
          background: `linear-gradient(135deg, ${P.gold}, ${P.goldDim})`,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          margin: "0 auto 18px",
          boxShadow: `0 8px 24px ${P.gold}55`,
        }}
      >
        <Clock size={26} color={P.plum} />
      </div>
      <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 22, marginBottom: 6 }}>{provinceName} is coming soon</div>
      <p style={{ color: P.lilac, fontSize: 14.5, lineHeight: 1.55, margin: "0 auto 22px", maxWidth: 380 }}>
        We&apos;re still building out verified rate data for {provinceName}. Switch provinces above to try Alberta today, or leave your email and we&apos;ll let you know the moment {provinceName} is live.
        {" "}If this doesn&apos;t look right — say a bill got misread — switch provinces above and try again.
      </p>

      {joined ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: P.mint, fontWeight: 600, fontSize: 14 }}>
          <Check size={16} /> You&apos;re on the list — we&apos;ll email you.
        </div>
      ) : (
        <div style={{ display: "flex", gap: 8, maxWidth: 380, margin: "0 auto" }}>
          <input
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder="you@email.com"
            style={{ flex: 1, border: `1px solid ${P.line}`, background: P.plum, color: P.cream, borderRadius: 12, padding: "13px 15px", fontSize: 15, fontFamily: F.body, outline: "none" }}
          />
          <button
            className="tap"
            onClick={handleJoin}
            style={{ background: `linear-gradient(135deg, ${P.gold}, ${P.goldDim})`, color: P.plum, border: "none", borderRadius: 12, padding: "0 20px", fontWeight: 700, fontFamily: F.body, fontSize: 14, boxShadow: `0 4px 14px ${P.gold}44` }}
          >
            Join waitlist
          </button>
        </div>
      )}
    </div>
  );
}
