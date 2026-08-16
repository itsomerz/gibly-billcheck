import { P, F } from "@/lib/theme";
import { safeRedirectPath } from "@/lib/betaAuth";

export const metadata = {
  title: "gibly bill check — private beta",
};

export default async function BetaGatePage({ searchParams }) {
  const params = await searchParams;
  const from = safeRedirectPath(params?.from);
  const hasError = params?.error === "1";

  return (
    <div
      style={{
        fontFamily: F.body,
        background: P.plum,
        minHeight: "100vh",
        color: P.cream,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        padding: 16,
      }}
    >
      <style>{`@import url('https://fonts.googleapis.com/css2?family=Fraunces:opsz,wght@9..144,600&family=Plus+Jakarta+Sans:wght@400;600&display=swap');`}</style>

      <form
        action="/api/beta-auth"
        method="POST"
        style={{
          width: "100%",
          maxWidth: 360,
          background: P.plum2,
          border: `1px solid ${P.line}`,
          borderRadius: 20,
          padding: 28,
        }}
      >
        <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 22, marginBottom: 6 }}>
          gibly bill check
        </div>
        <div style={{ color: P.lilac, fontSize: 14, marginBottom: 20 }}>
          Private beta — enter the access password to continue.
        </div>

        <input type="hidden" name="from" value={from} />

        <input
          type="password"
          name="password"
          placeholder="Access password"
          autoFocus
          required
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            border: `1px solid ${P.line}`,
            background: P.plum,
            color: P.cream,
            fontSize: 15,
            marginBottom: 12,
          }}
        />

        {hasError && (
          <div style={{ color: P.coral, fontSize: 13, marginBottom: 12 }}>
            That password didn&apos;t work. Try again.
          </div>
        )}

        <button
          type="submit"
          className="tap"
          style={{
            width: "100%",
            padding: "12px 14px",
            borderRadius: 12,
            border: "none",
            background: P.gold,
            color: P.plum,
            fontWeight: 600,
            fontSize: 15,
            cursor: "pointer",
          }}
        >
          Enter
        </button>
      </form>
    </div>
  );
}
