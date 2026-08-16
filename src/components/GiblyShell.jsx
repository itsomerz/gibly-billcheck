"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { Sparkles } from "lucide-react";
import { P, F } from "@/lib/theme";
import ProvinceSelect from "./ProvinceSelect";

const NAV_LINKS = [
  { href: "/", label: "Bill check" },
  { href: "/rates", label: "All rates" },
];

export default function GiblyShell({ children }) {
  const pathname = usePathname();

  return (
    <div style={{ fontFamily: F.body, background: P.plum, minHeight: "100vh", color: P.cream, display: "flex", flexDirection: "column", alignItems: "center", padding: "0 16px 48px" }}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,400;9..144,500;9..144,600;9..144,700&family=Plus+Jakarta+Sans:wght@400;500;600;700&display=swap');
        * { box-sizing: border-box; }
        .tap { cursor: pointer; transition: transform .08s ease, background .18s, box-shadow .18s; -webkit-tap-highlight-color: transparent; }
        .tap:active { transform: scale(0.98); }
        .num { font-family: ${F.display}; font-variant-numeric: tabular-nums; letter-spacing: -1px; }
        a { color: inherit; }
        @keyframes floatUp { from { opacity: 0; transform: translateY(14px); } to { opacity: 1; transform: translateY(0); } }
        @keyframes coinPop { 0% { transform: scale(0) rotate(-30deg); opacity: 0; } 60% { transform: scale(1.15) rotate(8deg); } 100% { transform: scale(1) rotate(0); opacity: 1; } }
        @keyframes shimmer { 0% { background-position: -200% center; } 100% { background-position: 200% center; } }
        .fu { animation: floatUp .5s ease both; }
        .fu2 { animation: floatUp .5s ease .12s both; }
        .fu3 { animation: floatUp .5s ease .24s both; }
        .fu4 { animation: floatUp .5s ease .36s both; }
        .coin { animation: coinPop .6s cubic-bezier(.2,1.4,.4,1) .1s both; }
        .shimmer { background: linear-gradient(100deg, ${P.gold} 20%, #FFF0C4 40%, ${P.gold} 60%); background-size: 200% auto; -webkit-background-clip: text; background-clip: text; -webkit-text-fill-color: transparent; animation: shimmer 3s linear infinite; }
        @media (prefers-reduced-motion: reduce) { .tap,.fu,.fu2,.fu3,.fu4,.coin,.shimmer { animation: none !important; transition: none; } .shimmer { -webkit-text-fill-color: ${P.gold}; } }
      `}</style>

      <header style={{ width: "100%", maxWidth: 600, padding: "28px 0 22px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 10, flexWrap: "wrap" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ width: 32, height: 32, borderRadius: 10, background: `linear-gradient(135deg, ${P.gold}, ${P.goldDim})`, display: "flex", alignItems: "center", justifyContent: "center", boxShadow: `0 4px 14px ${P.gold}44` }}>
            <Sparkles size={17} color={P.plum} fill={P.plum} />
          </div>
          <span style={{ fontFamily: F.display, fontWeight: 600, fontSize: 20, letterSpacing: -0.5 }}>
            gibly<span style={{ color: P.lilac, fontWeight: 400, fontStyle: "italic" }}> bill check</span>
          </span>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <nav style={{ display: "flex", gap: 4, background: P.plum2, border: `1px solid ${P.line}`, borderRadius: 24, padding: 3 }}>
            {NAV_LINKS.map((link) => {
              const active = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className="tap"
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    padding: "7px 14px",
                    borderRadius: 20,
                    textDecoration: "none",
                    color: active ? P.plum : P.lilac,
                    background: active ? P.gold : "transparent",
                  }}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
          <ProvinceSelect style={{ borderRadius: 24, padding: "8px 12px" }} />
        </div>
      </header>

      <main style={{ width: "100%", maxWidth: 600 }}>{children}</main>
    </div>
  );
}
