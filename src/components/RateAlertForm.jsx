"use client";

import { useState } from "react";
import Link from "next/link";
import { Bell, Check, AlertCircle } from "lucide-react";
import { P, F } from "@/lib/theme";
import { supabase } from "@/lib/supabase";
import { useProvince } from "@/lib/ProvinceContext";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Rate-alert signup for the results page — email-only for now (no accounts
// yet; see the rate_alerts SQL migration notes for how this links to a real
// account later). Consent is enforced twice: the checkbox gates the submit
// button here, and the DB has a matching constraint so a row can't exist
// without consent_given + consent_timestamp, even if this component's logic
// ever has a bug.
export default function RateAlertForm({ bill }) {
  const { province } = useProvince();

  const available = [
    bill.electricity ? { utility_type: "electricity", rate: bill.electricity.rate_value, unitLabel: "¢/kWh", displayRate: `${bill.electricity.rate_value}¢` } : null,
    bill.gas ? { utility_type: "gas", rate: bill.gas.rate_value, unitLabel: "$/GJ", displayRate: `$${bill.gas.rate_value}/GJ` } : null,
  ].filter(Boolean);

  const [utilityType, setUtilityType] = useState(available[0]?.utility_type);
  const chosen = available.find((a) => a.utility_type === utilityType) ?? available[0];

  const [email, setEmail] = useState("");
  const [consent, setConsent] = useState(false);
  const [status, setStatus] = useState("idle"); // idle | saving | done
  const [error, setError] = useState("");

  const emailValid = EMAIL_RE.test(email.trim());
  const canSubmit = emailValid && consent && !!chosen && status !== "saving";

  async function handleSubmit() {
    if (!canSubmit) return;
    if (!supabase) {
      setError("Rate alerts aren't set up yet on this server.");
      return;
    }
    setStatus("saving");
    setError("");
    const { error: insertError } = await supabase.from("rate_alerts").insert({
      email: email.trim(),
      province,
      utility_type: chosen.utility_type,
      current_rate: chosen.rate,
      consent_given: true,
      consent_timestamp: new Date().toISOString(),
    });
    if (insertError) {
      console.warn("rate_alerts insert failed:", insertError.message);
      setError("Something went wrong saving that — please try again.");
      setStatus("idle");
      return;
    }
    setStatus("done");
  }

  if (!chosen) return null;

  return (
    <div className="fu4" style={{ background: `linear-gradient(135deg, ${P.plum3}, ${P.plum2})`, border: `1px solid ${P.gold}44`, borderRadius: 22, padding: 24, textAlign: "center" }}>
      <div style={{ width: 44, height: 44, borderRadius: 13, background: `${P.gold}22`, display: "flex", alignItems: "center", justifyContent: "center", margin: "0 auto 12px" }}>
        <Bell size={22} color={P.gold} />
      </div>
      <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, marginBottom: 5 }}>We'll keep watch</div>

      {status === "done" ? (
        <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: P.mint, fontWeight: 600, fontSize: 14, padding: "8px 0" }}>
          <Check size={16} /> You're set — we'll email you when a better rate shows up.
        </div>
      ) : (
        <>
          <p style={{ color: P.lilac, fontSize: 14, margin: "0 0 16px", lineHeight: 1.5 }}>
            Rates move all the time. We'll ping you the second one dips below your {chosen.displayRate} — no more checking.
          </p>

          {available.length > 1 && (
            <div style={{ display: "flex", gap: 8, justifyContent: "center", marginBottom: 12 }}>
              {available.map((a) => (
                <button
                  key={a.utility_type}
                  className="tap"
                  onClick={() => setUtilityType(a.utility_type)}
                  style={{
                    fontSize: 12.5,
                    fontWeight: 600,
                    padding: "6px 14px",
                    borderRadius: 20,
                    border: `1px solid ${a.utility_type === utilityType ? P.gold : P.line}`,
                    background: a.utility_type === utilityType ? `${P.gold}22` : "transparent",
                    color: a.utility_type === utilityType ? P.gold : P.lilac,
                    fontFamily: F.body,
                    cursor: "pointer",
                  }}
                >
                  {a.utility_type === "gas" ? "Natural gas" : "Electricity"}
                </button>
              ))}
            </div>
          )}

          <div style={{ display: "flex", gap: 8, maxWidth: 380, margin: "0 auto 12px" }}>
            <input
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@email.com"
              style={{ flex: 1, border: `1px solid ${P.line}`, background: P.plum, color: P.cream, borderRadius: 12, padding: "13px 15px", fontSize: 15, fontFamily: F.body, outline: "none" }}
            />
            <button
              className="tap"
              disabled={!canSubmit}
              onClick={handleSubmit}
              style={{
                background: canSubmit ? `linear-gradient(135deg, ${P.gold}, ${P.goldDim})` : P.plum3,
                color: canSubmit ? P.plum : P.lilac,
                border: "none",
                borderRadius: 12,
                padding: "0 20px",
                fontWeight: 700,
                fontFamily: F.body,
                fontSize: 14,
                boxShadow: canSubmit ? `0 4px 14px ${P.gold}44` : "none",
                cursor: canSubmit ? "pointer" : "default",
              }}
            >
              {status === "saving" ? "Saving…" : "Watch it"}
            </button>
          </div>

          <label style={{ display: "flex", alignItems: "flex-start", gap: 8, maxWidth: 380, margin: "0 auto", textAlign: "left", fontSize: 12, color: P.lilac, lineHeight: 1.45, cursor: "pointer" }}>
            <input type="checkbox" checked={consent} onChange={(e) => setConsent(e.target.checked)} style={{ marginTop: 2, flexShrink: 0, cursor: "pointer" }} />
            <span>
              I agree to receive rate-alert emails from Gibly and have read the{" "}
              <Link href="/privacy" target="_blank" style={{ color: P.gold, textDecoration: "underline" }}>
                Privacy Policy
              </Link>
              .
            </span>
          </label>

          {error && (
            <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", color: P.coral, fontSize: 12.5, marginTop: 10 }}>
              <AlertCircle size={14} /> {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
