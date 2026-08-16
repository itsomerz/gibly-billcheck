"use client";

// One shared "which province is selected" state for the whole app, so the
// header selector, the upload/confirm/results flow, and the /rates page can
// never disagree about which province's rates are on screen. Persisted to
// localStorage so a refresh (or navigating between / and /rates) keeps the
// user's choice instead of silently resetting to Alberta.

import { createContext, useContext, useEffect, useState } from "react";
import { PROVINCES, PROVINCE_ORDER, getProvince, isProvinceActive } from "./rateTable";

const STORAGE_KEY = "gibly_province";
const DEFAULT_PROVINCE = "AB";

const ProvinceContext = createContext(null);

export function ProvinceProvider({ children }) {
  const [province, setProvinceState] = useState(DEFAULT_PROVINCE);

  // Restore the last choice on mount. Runs client-side only (localStorage
  // isn't available during server render), so the very first paint is
  // always Alberta and then updates if a different province was saved.
  useEffect(() => {
    const saved = window.localStorage.getItem(STORAGE_KEY);
    // Intentional: syncing from localStorage after mount, not derived from
    // props/state, so first paint stays AB on both server and client and
    // avoids a hydration mismatch.
    // eslint-disable-next-line react-hooks/set-state-in-effect
    if (saved && PROVINCES[saved]) setProvinceState(saved);
  }, []);

  function setProvince(code) {
    setProvinceState(code);
    window.localStorage.setItem(STORAGE_KEY, code);
  }

  const value = {
    province,                                            // e.g. "AB"
    setProvince,
    provinceData: getProvince(province),                 // full record, or null if unrecognized
    isActive: isProvinceActive(province),
    provinceList: PROVINCE_ORDER.map((code) => PROVINCES[code]),
  };

  return <ProvinceContext.Provider value={value}>{children}</ProvinceContext.Provider>;
}

export function useProvince() {
  const ctx = useContext(ProvinceContext);
  if (!ctx) throw new Error("useProvince must be used within a ProvinceProvider");
  return ctx;
}
