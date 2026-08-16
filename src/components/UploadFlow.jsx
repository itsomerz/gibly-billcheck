"use client";

import { useRef, useState } from "react";
import { Upload, FileText, Image as ImageIcon, Loader2, AlertCircle, AlertTriangle, Info, Check, ChevronLeft, Zap, Flame } from "lucide-react";
import { P, F } from "@/lib/theme";
import ProvinceSelect from "./ProvinceSelect";

const UTILITY_META = {
  electricity: { label: "Electricity", icon: Zap, rateUnit: "¢/kWh", usageUnit: "kWh", ratePlaceholder: "8.79", usagePlaceholder: "1687.5" },
  gas: { label: "Natural gas", icon: Flame, rateUnit: "$/GJ", usageUnit: "GJ", ratePlaceholder: "1.741", usagePlaceholder: "5.01" },
};

// Realistic Alberta ranges, used to warn the user if a rate looks off — a
// common failure mode is the bill printing $/kWh instead of ¢/kWh and the
// extraction not converting it (e.g. 0.0879 instead of 8.79).
const RATE_RANGES = {
  electricity: { min: 4, max: 20, unit: "¢/kWh" },
  gas: { min: 0.3, max: 15, unit: "$/GJ" },
};

function rangeWarning(utilityType, rateValue) {
  const range = RATE_RANGES[utilityType];
  const v = Number(rateValue);
  if (!range || !v) return null;
  if (v < range.min || v > range.max) {
    return `That's outside the typical Alberta range (${range.min}–${range.max} ${range.unit}) for ${utilityType === "gas" ? "gas" : "electricity"}. A common mistake is entering dollars instead of cents per kWh — double-check it against your bill.`;
  }
  return null;
}

const ACCEPT = "application/pdf,image/jpeg,image/png";
const ALLOWED_TYPES = ["application/pdf", "image/jpeg", "image/png"];
const MAX_BYTES = 10 * 1024 * 1024;

export function UploadScreen({ onExtracted }) {
  const [file, setFile] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const inputRef = useRef(null);

  function pickFile(f) {
    setError("");
    if (!f) return;
    if (!ALLOWED_TYPES.includes(f.type)) {
      setError("Please choose a PDF, JPG, or PNG.");
      return;
    }
    if (f.size > MAX_BYTES) {
      setError("That file's a bit large — try one under 10MB.");
      return;
    }
    setFile(f);
  }

  async function handleSubmit() {
    if (!file) return;
    setLoading(true);
    setError("");
    try {
      const formData = new FormData();
      formData.append("file", file);
      const res = await fetch("/api/extract-bill", { method: "POST", body: formData });
      const payload = await res.json();
      if (!res.ok) {
        setError(payload.error || "Something went wrong reading that bill.");
        setLoading(false);
        return;
      }
      onExtracted(payload.data);
    } catch {
      setError("We couldn't reach the server. Check your connection and try again.");
      setLoading(false);
    }
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
      <style>{`.spin { animation: spin 0.9s linear infinite; } @keyframes spin { to { transform: rotate(360deg); } }`}</style>

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
        <Upload size={26} color={P.plum} />
      </div>
      <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 22, marginBottom: 6 }}>Upload your bill</div>
      <p style={{ color: P.lilac, fontSize: 14.5, lineHeight: 1.55, margin: "0 auto 22px", maxWidth: 380 }}>
        A photo or PDF of your electricity or gas bill. We'll pull the rate, usage, and plan type — nothing else.
      </p>

      <input ref={inputRef} type="file" accept={ACCEPT} style={{ display: "none" }} onChange={(e) => pickFile(e.target.files?.[0])} />

      {!file ? (
        <button
          className="tap"
          onClick={() => inputRef.current?.click()}
          style={{
            background: P.plum2,
            border: `1px dashed ${P.line}`,
            borderRadius: 16,
            padding: "26px",
            width: "100%",
            maxWidth: 380,
            margin: "0 auto",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 10,
            color: P.lilac,
            fontFamily: F.body,
            fontSize: 14,
          }}
        >
          <div style={{ display: "flex", gap: 10 }}>
            <FileText size={20} color={P.gold} />
            <ImageIcon size={20} color={P.mint} />
          </div>
          Tap to choose a PDF, JPG, or PNG
        </button>
      ) : (
        <div
          style={{
            background: P.plum2,
            border: `1px solid ${P.line}`,
            borderRadius: 16,
            padding: "16px 18px",
            maxWidth: 380,
            margin: "0 auto",
            display: "flex",
            alignItems: "center",
            gap: 12,
            textAlign: "left",
          }}
        >
          {file.type === "application/pdf" ? <FileText size={20} color={P.gold} /> : <ImageIcon size={20} color={P.mint} />}
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ fontSize: 14, fontWeight: 600, color: P.cream, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}>{file.name}</div>
            <div style={{ fontSize: 12, color: P.lilac }}>{(file.size / 1024 / 1024).toFixed(1)} MB</div>
          </div>
          <button
            className="tap"
            onClick={() => {
              setFile(null);
              if (inputRef.current) inputRef.current.value = "";
            }}
            style={{ background: "transparent", border: "none", color: P.lilac, fontSize: 12.5, fontFamily: F.body, textDecoration: "underline", cursor: "pointer" }}
          >
            change
          </button>
        </div>
      )}

      {error && (
        <div style={{ display: "flex", alignItems: "center", gap: 6, justifyContent: "center", color: P.coral, fontSize: 13, marginTop: 14 }}>
          <AlertCircle size={14} /> {error}
        </div>
      )}

      <button
        className="tap"
        disabled={!file || loading}
        onClick={handleSubmit}
        style={{
          marginTop: 22,
          background: !file || loading ? P.plum3 : `linear-gradient(135deg, ${P.gold}, ${P.goldDim})`,
          color: !file || loading ? P.lilac : P.plum,
          border: "none",
          borderRadius: 14,
          padding: "14px 28px",
          fontWeight: 700,
          fontFamily: F.body,
          fontSize: 15,
          width: "100%",
          maxWidth: 380,
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          gap: 8,
          cursor: !file || loading ? "default" : "pointer",
        }}
      >
        {loading ? (
          <>
            <Loader2 size={17} className="spin" /> Reading your bill…
          </>
        ) : (
          "Extract my bill"
        )}
      </button>

      <p style={{ color: P.lilac, fontSize: 11.5, marginTop: 14, opacity: 0.8 }}>
        We only read the rate, usage, provider, and plan type — never your name, address, or account number.
      </p>
    </div>
  );
}

const PLAN_OPTIONS = [
  { value: "fixed", label: "Fixed" },
  { value: "variable", label: "Variable / floating" },
  { value: "regulated", label: "Regulated default (RoLR / DRT)" },
];

function initSection(raw) {
  if (!raw) return null;
  return {
    provider: raw.provider || "",
    plan_type: raw.plan_type === "unknown" || !raw.plan_type ? "fixed" : raw.plan_type,
    rate_value: raw.rate_value || "",
    usage: raw.usage || "",
    billing_days: raw.billing_days || "",
  };
}

function sectionValid(s) {
  return !!s && !!s.provider.trim() && Number(s.rate_value) > 0 && Number(s.usage) > 0 && Number(s.billing_days) > 0;
}

// The confirmed bill can contain electricity, gas, or both — a section only
// renders (and only ends up in the confirmed result) if extraction actually
// found that utility on the uploaded bill.
export function ConfirmScreen({ extracted, onConfirm, onCancel }) {
  const [elec, setElec] = useState(() => initSection(extracted?.electricity));
  const [gas, setGas] = useState(() => initSection(extracted?.gas));

  const setElecField = (key) => (value) => setElec((s) => ({ ...s, [key]: value }));
  const setGasField = (key) => (value) => setGas((s) => ({ ...s, [key]: value }));

  const valid = (elec ? sectionValid(elec) : true) && (gas ? sectionValid(gas) : true) && (!!elec || !!gas);

  function toBillData(s, utilityType) {
    if (!s) return null;
    return {
      utility_type: utilityType,
      provider: s.provider.trim(),
      plan_type: s.plan_type,
      rate_value: Number(s.rate_value),
      usage: Number(s.usage),
      billing_days: Number(s.billing_days),
    };
  }

  function handleConfirm() {
    if (!valid) return;
    onConfirm({
      electricity: toBillData(elec, "electricity"),
      gas: toBillData(gas, "gas"),
    });
  }

  return (
    <div className="fu" style={{ background: P.plum2, border: `1px solid ${P.line}`, borderRadius: 22, padding: 22 }}>
      <button
        className="tap"
        onClick={onCancel}
        style={{ display: "flex", alignItems: "center", gap: 4, background: "transparent", border: "none", color: P.lilac, fontSize: 12.5, fontFamily: F.body, padding: 0, marginBottom: 16, cursor: "pointer" }}
      >
        <ChevronLeft size={14} /> Start over
      </button>

      <div style={{ display: "flex", alignItems: "center", gap: 9, marginBottom: 3 }}>
        <div style={{ width: 30, height: 30, borderRadius: 9, background: P.plum3, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Check size={16} color={P.mint} />
        </div>
        <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 18 }}>Does this look right?</span>
      </div>
      <p style={{ color: P.lilac, fontSize: 12.5, margin: "0 0 20px", paddingLeft: 39 }}>
        We read these off your bill. Fix anything that's off before we compare rates.
        {elec && gas ? " Your bill covers both electricity and gas, so there are two sections below." : ""}
      </p>

      <Field label="Province (auto-detected from your bill — change it if that's wrong)">
        <ProvinceSelect style={{ width: "100%" }} />
      </Field>

      {elec && (
        <UtilitySection
          utilityType="electricity"
          state={elec}
          onChange={setElecField}
          rateFlag={extracted?.electricity?.rate_flag}
          rateUnitSeen={extracted?.electricity?.rate_unit_seen}
          divider={!!gas}
        />
      )}
      {gas && (
        <UtilitySection
          utilityType="gas"
          state={gas}
          onChange={setGasField}
          rateFlag={extracted?.gas?.rate_flag}
          rateUnitSeen={extracted?.gas?.rate_unit_seen}
          divider={false}
        />
      )}

      <button
        className="tap"
        disabled={!valid}
        onClick={handleConfirm}
        style={{
          marginTop: 8,
          width: "100%",
          background: valid ? `linear-gradient(135deg, ${P.gold}, ${P.goldDim})` : P.plum3,
          color: valid ? P.plum : P.lilac,
          border: "none",
          borderRadius: 14,
          padding: "14px",
          fontWeight: 700,
          fontFamily: F.body,
          fontSize: 15,
          cursor: valid ? "pointer" : "default",
        }}
      >
        Show me my rate check
      </button>
    </div>
  );
}

function UtilitySection({ utilityType, state, onChange, rateFlag, rateUnitSeen, divider }) {
  const meta = UTILITY_META[utilityType];
  const Icon = meta.icon;

  // One-time heads-up if the server had to auto-correct the unit (e.g. the
  // bill printed $/kWh and it wasn't converted). Tied to the original
  // extraction, not re-evaluated as the user types.
  const wasAutoCorrected = rateFlag === "auto_corrected" || rateFlag === "corrected_but_unusual";
  // Live sanity check on whatever's currently in the rate field — catches
  // both a bad extraction and a typo the user introduces while editing.
  const liveRateWarning = rangeWarning(utilityType, state.rate_value);

  return (
    <div style={{ marginBottom: 20, paddingBottom: divider ? 18 : 0, borderBottom: divider ? `1px solid ${P.line}` : "none" }}>
      <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 14 }}>
        <div style={{ width: 26, height: 26, borderRadius: 8, background: P.plum3, display: "flex", alignItems: "center", justifyContent: "center" }}>
          <Icon size={14} color={P.gold} />
        </div>
        <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 15 }}>{meta.label}</span>
      </div>

      <Field label="Provider">
        <Input value={state.provider} onChange={onChange("provider")} placeholder="e.g. ENMAX Energy" />
      </Field>
      <Field label="Plan type">
        <Select value={state.plan_type} onChange={onChange("plan_type")} options={PLAN_OPTIONS} />
      </Field>
      <Field label={`Rate (${meta.rateUnit})`}>
        <div style={{ position: "relative" }}>
          <Input
            type="number"
            step="any"
            value={state.rate_value}
            onChange={onChange("rate_value")}
            placeholder={meta.ratePlaceholder}
            style={{ paddingRight: 66 }}
          />
          <span
            style={{
              position: "absolute",
              right: 13,
              top: "50%",
              transform: "translateY(-50%)",
              color: P.lilac,
              fontSize: 12.5,
              fontWeight: 700,
              pointerEvents: "none",
            }}
          >
            {meta.rateUnit}
          </span>
        </div>
        {wasAutoCorrected && (
          <div style={{ display: "flex", gap: 7, alignItems: "flex-start", marginTop: 8, padding: "9px 11px", borderRadius: 10, background: `${P.mint}18`, border: `1px solid ${P.mint}44`, fontSize: 12, color: P.cream, lineHeight: 1.45 }}>
            <Info size={14} color={P.mint} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>
              Your bill looked like it showed {rateUnitSeen === "dollars_per_kwh" ? "dollars per kWh" : "a different unit"}, so we converted it to {meta.rateUnit} automatically. Please confirm it matches your bill.
            </span>
          </div>
        )}
        {liveRateWarning && (
          <div style={{ display: "flex", gap: 7, alignItems: "flex-start", marginTop: 8, padding: "9px 11px", borderRadius: 10, background: `${P.coral}18`, border: `1px solid ${P.coral}44`, fontSize: 12, color: P.cream, lineHeight: 1.45 }}>
            <AlertTriangle size={14} color={P.coral} style={{ flexShrink: 0, marginTop: 1 }} />
            <span>{liveRateWarning}</span>
          </div>
        )}
      </Field>
      <Field label={`Usage this bill (${meta.usageUnit})`}>
        <Input type="number" step="any" value={state.usage} onChange={onChange("usage")} placeholder={meta.usagePlaceholder} />
      </Field>
      <Field label="Billing period (days)">
        <Input type="number" step="1" value={state.billing_days} onChange={onChange("billing_days")} placeholder="30" />
      </Field>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <label style={{ display: "block", color: P.lilac, fontSize: 12, fontWeight: 600, marginBottom: 6 }}>{label}</label>
      {children}
    </div>
  );
}

function Input({ value, onChange, style, ...props }) {
  return (
    <input
      {...props}
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", background: P.plum, border: `1px solid ${P.line}`, borderRadius: 10, padding: "11px 13px", color: P.cream, fontFamily: F.body, fontSize: 15, outline: "none", ...style }}
    />
  );
}

function Select({ value, onChange, options }) {
  return (
    <select
      value={value}
      onChange={(e) => onChange(e.target.value)}
      style={{ width: "100%", background: P.plum, border: `1px solid ${P.line}`, borderRadius: 10, padding: "11px 13px", color: P.cream, fontFamily: F.body, fontSize: 15, outline: "none" }}
    >
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}
