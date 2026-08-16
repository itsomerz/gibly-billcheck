import { P, F } from "@/lib/theme";
import GiblyShell from "./GiblyShell";

const CONTACT_EMAIL = "giblyapps@gmail.com";
const LAST_UPDATED = "August 15, 2026";

const pStyle = { color: P.lilac, fontSize: 14.5, lineHeight: 1.65, margin: "0 0 14px" };
const ulStyle = { color: P.lilac, fontSize: 14.5, lineHeight: 1.65, margin: "0 0 14px", paddingLeft: 20, listStyle: "disc" };
const liStyle = { marginBottom: 4 };
const subheadStyle = { fontFamily: F.display, fontWeight: 600, fontSize: 16, color: P.cream, margin: "18px 0 8px" };
const linkStyle = { color: P.gold, textDecoration: "underline" };

// Mirrors the source doc (Downloads/privacy-policy.md) section-for-section —
// don't rephrase the legal content here, just restyle it. If the source doc
// changes, update this file to match rather than drifting from it.
const SECTIONS = [
  {
    heading: "1. Information we collect",
    body: (
      <>
        <h3 style={subheadStyle}>a) Bill information you upload</h3>
        <p style={pStyle}>
          When you upload an energy bill (as a photo or PDF), we send the image to a third-party artificial
          intelligence service (currently OpenAI) to automatically read the relevant details from it. From your
          bill, we extract and use only:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>The type of utility (electricity and/or natural gas)</li>
          <li style={liStyle}>Your energy provider and plan type</li>
          <li style={liStyle}>Your energy rate</li>
          <li style={liStyle}>Your usage amount and billing period</li>
          <li style={liStyle}>The general region/province (to show you the right rates)</li>
        </ul>
        <p style={pStyle}>
          <strong>We do not extract, request, or store your name, street address, or account number.</strong> Our
          extraction is specifically designed to ignore this personal information.
        </p>
        <p style={pStyle}>
          <strong>About your uploaded bill image:</strong> the image is transmitted to our AI processing service to
          read it. We do not retain the uploaded bill image after processing — it is read into memory, sent to the
          AI service to extract the fields above, and discarded once extraction completes. Please review the AI
          provider&apos;s own data handling terms, which govern their processing.
        </p>

        <h3 style={subheadStyle}>b) Anonymized analytics</h3>
        <p style={pStyle}>
          Each time a bill comparison is completed, we store an <strong>anonymized</strong> record to help us
          understand energy pricing and usage trends. This record contains only:
        </p>
        <ul style={ulStyle}>
          <li style={liStyle}>General region/province (not your specific address)</li>
          <li style={liStyle}>Utility type, rate, plan type, and usage amount</li>
          <li style={liStyle}>The comparison result and date</li>
        </ul>
        <p style={pStyle}>
          This information <strong>cannot be used to identify you</strong> — it contains no name, email, address, or
          account number.
        </p>

        <h3 style={subheadStyle}>c) Rate alert sign-ups (optional)</h3>
        <p style={pStyle}>If you choose to sign up for rate alerts, we collect and store:</p>
        <ul style={ulStyle}>
          <li style={liStyle}>Your email address</li>
          <li style={liStyle}>The province, utility type, and rate you want us to watch</li>
          <li style={liStyle}>A record that you consented, and when</li>
        </ul>
        <p style={pStyle}>
          We collect this <strong>only if you actively opt in</strong> by checking the consent box. We use your
          email solely to send you the rate alerts you requested.
        </p>
      </>
    ),
  },
  {
    heading: "2. How we use your information",
    body: (
      <>
        <p style={pStyle}>We use the information described above to:</p>
        <ul style={ulStyle}>
          <li style={liStyle}>Read your bill and show you a personalized rate comparison</li>
          <li style={liStyle}>Show you how your rate compares to other available rates</li>
          <li style={liStyle}>Send you rate alerts, if you signed up for them</li>
          <li style={liStyle}>Understand aggregate, anonymized energy trends to improve the Service</li>
        </ul>
        <p style={pStyle}>
          We do <strong>not</strong> use your information for advertising targeting, and we do <strong>not</strong>{" "}
          allow advertisers to access or target your personal information.
        </p>
      </>
    ),
  },
  {
    heading: "3. How we share information",
    body: (
      <>
        <p style={pStyle}>
          We do <strong>not sell</strong> your personal information.
        </p>
        <p style={pStyle}>We share information only in these limited circumstances:</p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>AI processing provider:</strong> your uploaded bill image is sent to our third-party AI service
            to read it (as described above).
          </li>
          <li style={liStyle}>
            <strong>Service providers:</strong> we use trusted infrastructure providers to run the Service (for
            example, our hosting provider and our database provider, Supabase). They process data on our behalf and
            are bound to protect it.
          </li>
          <li style={liStyle}>
            <strong>Legal requirements:</strong> if required by law, court order, or to protect our legal rights.
          </li>
        </ul>
      </>
    ),
  },
  {
    heading: "4. Rate comparison information — an important note",
    body: (
      <>
        <p style={pStyle}>
          The rates we display for energy providers are drawn from publicly available sources and are provided for{" "}
          <strong>information purposes only</strong>. We rank providers purely by price. We do <strong>not</strong>{" "}
          receive referral fees or commissions for any rate we display, and any advertising on the Service never
          influences our rankings. Rate figures are estimates that may change; always verify current rates with the
          provider directly before making decisions.
        </p>
        <p style={pStyle}>
          Our comparisons and any savings figures are <strong>estimates</strong>, not financial advice. Your actual
          costs may vary.
        </p>
      </>
    ),
  },
  {
    heading: "5. How we protect your information",
    body: (
      <p style={pStyle}>
        We use industry-standard measures to protect your information, including access controls on our database (so
        that stored data cannot be publicly read) and encrypted connections. However, no method of transmission or
        storage is completely secure, and we cannot guarantee absolute security.
      </p>
    ),
  },
  {
    heading: "6. Data retention",
    body: (
      <ul style={ulStyle}>
        <li style={liStyle}>
          <strong>Anonymized analytics:</strong> retained indefinitely, as it cannot identify you.
        </li>
        <li style={liStyle}>
          <strong>Rate alert emails:</strong> retained until you unsubscribe or ask us to delete them.
        </li>
        <li style={liStyle}>
          <strong>Uploaded bill images:</strong> not retained after processing.
        </li>
      </ul>
    ),
  },
  {
    heading: "7. Your rights",
    body: (
      <>
        <p style={pStyle}>Under Canadian privacy law, you have the right to:</p>
        <ul style={ulStyle}>
          <li style={liStyle}>
            <strong>Access</strong> the personal information we hold about you
          </li>
          <li style={liStyle}>
            <strong>Correct</strong> inaccurate information
          </li>
          <li style={liStyle}>
            <strong>Withdraw consent</strong> and ask us to <strong>delete</strong> your information (for example,
            unsubscribe from rate alerts and have your email removed)
          </li>
        </ul>
        <p style={pStyle}>
          To exercise any of these rights, contact us at{" "}
          <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>
            {CONTACT_EMAIL}
          </a>
          . Since our anonymized analytics cannot be linked to you, the main personal information we can act on is
          your rate-alert email.
        </p>
      </>
    ),
  },
  {
    heading: "8. Children",
    body: (
      <p style={pStyle}>
        The Service is not directed at children and is intended for adults responsible for household energy bills.
      </p>
    ),
  },
  {
    heading: "9. Changes to this policy",
    body: (
      <p style={pStyle}>
        We may update this policy from time to time. We&apos;ll post the updated version here with a new &quot;Last
        updated&quot; date.
      </p>
    ),
  },
  {
    heading: "10. Contact us",
    body: (
      <p style={pStyle}>
        Questions about this policy or your information? Contact us at:
        <br />
        <a href={`mailto:${CONTACT_EMAIL}`} style={linkStyle}>
          {CONTACT_EMAIL}
        </a>
        <br />
        Gibly — gibly bill check
        <br />
        Alberta, Canada
      </p>
    ),
  },
];

export default function PrivacyPolicy() {
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
        <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 28, marginBottom: 6 }}>Privacy Policy</div>
        <div style={{ color: P.lilac, fontSize: 13, marginBottom: 24 }}>Last updated: {LAST_UPDATED}</div>

        <p style={pStyle}>
          This Privacy Policy explains how gibly bill check (&quot;we,&quot; &quot;us,&quot; &quot;our&quot;), a
          service operated by Gibly, handles information when you use our energy bill comparison tool (the
          &quot;Service&quot;). We&apos;ve written it in plain language because we want you to actually understand
          what we do with your information — which, by design, is very little.
        </p>
        <p style={{ ...pStyle, marginBottom: 24 }}>
          We are based in Alberta, Canada, and we handle personal information in a manner consistent with
          Canada&apos;s Personal Information Protection and Electronic Documents Act (PIPEDA) and applicable
          provincial privacy laws.
        </p>

        <div
          style={{
            background: `${P.gold}14`,
            border: `1px solid ${P.gold}44`,
            borderRadius: 16,
            padding: "18px 20px",
            marginBottom: 28,
          }}
        >
          <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 15, color: P.gold, marginBottom: 10 }}>
            The short version
          </div>
          <ul style={{ ...ulStyle, margin: 0 }}>
            <li style={liStyle}>We help you compare your energy rate against other available rates.</li>
            <li style={liStyle}>
              When you upload a bill, we read only the <strong>rate, usage, provider, and plan details</strong> we
              need to compare — we do <strong>not</strong> keep your name, address, or account number.
            </li>
            <li style={liStyle}>We store <strong>anonymized</strong> usage data (no way to identify you) to understand energy trends.</li>
            <li style={liStyle}>
              If you sign up for rate alerts, we store <strong>only your email</strong> and the rate details you want
              us to watch, and only with your explicit consent.
            </li>
            <li style={liStyle}>We do not sell your personal information. Ever.</li>
          </ul>
        </div>

        {SECTIONS.map((section, i) => (
          <div key={section.heading} style={{ borderTop: i === 0 ? "none" : `1px solid ${P.line}`, paddingTop: i === 0 ? 0 : 24, marginTop: i === 0 ? 0 : 24 }}>
            <h2 style={{ fontFamily: F.display, fontWeight: 600, fontSize: 18, margin: "0 0 10px" }}>{section.heading}</h2>
            {section.body}
          </div>
        ))}

        <p style={{ color: P.lilac, fontSize: 12.5, fontStyle: "italic", lineHeight: 1.6, marginTop: 28, borderTop: `1px solid ${P.line}`, paddingTop: 20 }}>
          This policy reflects our current practices. It is provided in good faith and in plain language. It is not
          legal advice, and you may wish to have it reviewed by a qualified professional as the Service grows.
        </p>
      </div>
    </GiblyShell>
  );
}
