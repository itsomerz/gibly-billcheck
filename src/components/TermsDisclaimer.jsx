import { P, F } from "@/lib/theme";
import GiblyShell from "./GiblyShell";

const CONTACT_EMAIL = "giblyapps@gmail.com";
const LAST_UPDATED = "August 25, 2026";

const pStyle = { color: P.lilac, fontSize: 14.5, lineHeight: 1.65, margin: "0 0 14px" };
const ulStyle = { color: P.lilac, fontSize: 14.5, lineHeight: 1.65, margin: "0 0 14px", paddingLeft: 20, listStyle: "disc" };
const liStyle = { marginBottom: 4 };
const linkStyle = { color: P.gold, textDecoration: "underline" };

// Mirrors the source doc section-for-section — don't rephrase the legal
// content here, just restyle it. If the source doc changes, update this
// file to match rather than drifting from it.
const SECTIONS = [
  {
    heading: "1. What BillZap is",
    body: (
      <p style={pStyle}>
        BillZap is a free, independent information tool. It reads an energy bill you upload, identifies your current
        rate, and shows you how that rate compares to other rates available in your province, drawn from publicly
        available information published by energy retailers and regulators. We are an information service — nothing
        more.
      </p>
    ),
  },
  {
    heading: "2. What BillZap is NOT",
    body: (
      <ul style={ulStyle}>
        <li style={liStyle}>
          <strong>We are not an energy retailer, marketer, or broker.</strong> We do not sell energy, sign you up for
          any plan, or act on any retailer&apos;s behalf.
        </li>
        <li style={liStyle}>
          <strong>We are not affiliated with any energy retailer or provider.</strong> We have no partnership,
          agency, or business relationship with any of the companies whose rates we display.
        </li>
        <li style={liStyle}>
          <strong>We are not paid by anyone we list.</strong> No retailer pays us to appear, to rank higher, or to be
          included. We receive no referral fees, commissions, affiliate payments, or advertising revenue from any
          provider listed.
        </li>
        <li style={liStyle}>
          <strong>We do not recommend or endorse any provider.</strong> Our rankings are generated purely by price,
          applied uniformly to every provider, with no favouritism of any kind.
        </li>
        <li style={liStyle}>
          <strong>We do not facilitate switching.</strong> Any links we provide go to a provider&apos;s own official
          public rate page so you can verify the information yourself. They are provided for verification, uniformly
          for every provider listed, and are not sign-up links, referral links, or tracking links.
        </li>
      </ul>
    ),
  },
  {
    heading: "3. Rate information — sources and accuracy",
    body: (
      <p style={pStyle}>
        Rate information is compiled from publicly available sources, including energy retailers&apos; own published
        rate disclosures and publicly available regulated rates. We present this information neutrally and
        uniformly, ranked only by price. Rates change frequently. While we make reasonable efforts to keep
        information current, we do not guarantee that any rate shown is accurate, complete, or up to date at the
        moment you view it. Always confirm current rates directly with the provider before making any decision. The
        &quot;verified as of&quot; date shown indicates when we last reviewed the information.
      </p>
    ),
  },
  {
    heading: "4. Not financial or professional advice",
    body: (
      <p style={pStyle}>
        BillZap provides information, not advice. Our comparisons, projections, and any savings estimates are
        illustrative estimates only, based on the information available and general assumptions. They are not
        financial advice, and they do not account for your full circumstances. Your actual costs will vary. Any
        decision you make about your energy provider is your own, and you should do your own research and
        verification.
      </p>
    ),
  },
  {
    heading: "5. Estimates and projections",
    body: (
      <p style={pStyle}>
        Where we show projected or future costs, these are modelled estimates based on historical patterns and your
        past usage. They are not predictions or guarantees. Actual costs depend on weather, market prices, your
        usage, and other factors outside our control.
      </p>
    ),
  },
  {
    heading: "6. Your responsibilities",
    body: (
      <p style={pStyle}>
        By using BillZap, you agree that you will use it for your own personal, informational purposes; you will
        independently verify any information before relying on it; and you understand that we are an information
        tool and not a substitute for your own research or professional advice.
      </p>
    ),
  },
  {
    heading: "7. Limitation of liability",
    body: (
      <p style={pStyle}>
        To the fullest extent permitted by law, the Service is provided &quot;as is&quot; and &quot;as
        available,&quot; without warranties of any kind. We are not liable for any loss or damage arising from your
        use of, or reliance on, information provided by the Service, including any decision you make based on rate
        comparisons, estimates, or projections shown.
      </p>
    ),
  },
  {
    heading: "8. Privacy",
    body: (
      <p style={pStyle}>
        Your use of the Service is also governed by our{" "}
        <a href="/privacy" style={linkStyle}>
          Privacy Policy
        </a>
        , which explains how we handle the limited information involved in a bill comparison.
      </p>
    ),
  },
  {
    heading: "9. Changes",
    body: (
      <p style={pStyle}>
        We may update these Terms from time to time. Continued use of the Service after changes means you accept the
        updated Terms.
      </p>
    ),
  },
  {
    heading: "10. Contact",
    body: (
      <p style={pStyle}>
        Questions about these Terms? Contact us at{" "}
        <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>
          {CONTACT_EMAIL}
        </a>
        .
      </p>
    ),
  },
];

export default function TermsDisclaimer() {
  return (
    <GiblyShell>
      <div
        className="fu"
        style={{
          background: `radial-gradient(120% 100% at 50% 0%, ${P.plum3} 0%, ${P.plum2} 60%)`,
          border: `1px solid ${P.line}`,
          borderRadius: 28,
          padding: "34px 28px 40px",
          marginBottom: 20,
        }}
      >
        <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 28, marginBottom: 6 }}>
          Terms of Use &amp; Disclaimer
        </div>
        <div style={{ color: P.lilac, fontSize: 13, marginBottom: 24 }}>Last updated: {LAST_UPDATED}</div>

        <p style={{ ...pStyle, marginBottom: 24 }}>
          Welcome to BillZap (&quot;the Service&quot;), operated by Gibly (&quot;we,&quot; &quot;us,&quot;
          &quot;our&quot;). By using the Service, you agree to these Terms. Please read them — they explain what
          BillZap is, what it isn&apos;t, and the limits of what we provide.
        </p>

        {SECTIONS.map((section, i) => (
          <div key={section.heading} style={{ borderTop: i === 0 ? "none" : `1px solid ${P.line}`, paddingTop: i === 0 ? 0 : 24, marginTop: i === 0 ? 0 : 24 }}>
            <h2 style={{ fontFamily: F.display, fontWeight: 600, fontSize: 18, margin: "0 0 10px" }}>{section.heading}</h2>
            {section.body}
          </div>
        ))}

        <p style={{ color: P.lilac, fontSize: 12.5, fontStyle: "italic", lineHeight: 1.6, marginTop: 28, borderTop: `1px solid ${P.line}`, paddingTop: 20 }}>
          BillZap is an independent information tool operated by Gibly. It is not affiliated with, endorsed by, or
          paid by any energy retailer or provider. Rate rankings are based solely on price and applied uniformly to
          all providers listed.
        </p>
      </div>
    </GiblyShell>
  );
}
