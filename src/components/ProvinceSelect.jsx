"use client";

import { useProvince } from "@/lib/ProvinceContext";
import { P, F } from "@/lib/theme";

// One shared control for picking a province, used both in the header (always
// visible) and on the confirm screen (so a user can see/override what the
// bill upload auto-detected). Both read/write the same ProvinceContext, so
// changing it in either place updates the whole app immediately.
export default function ProvinceSelect({ style }) {
  const { province, setProvince, provinceList } = useProvince();

  return (
    <select
      value={province}
      onChange={(e) => setProvince(e.target.value)}
      style={{
        background: P.plum2,
        border: `1px solid ${P.line}`,
        color: P.cream,
        borderRadius: 10,
        padding: "9px 12px",
        fontSize: 14,
        fontWeight: 600,
        fontFamily: F.body,
        outline: "none",
        cursor: "pointer",
        ...style,
      }}
    >
      {provinceList.map((p) => (
        <option key={p.code} value={p.code}>
          {p.name}
          {p.status !== "active" ? " — coming soon" : ""}
        </option>
      ))}
    </select>
  );
}
