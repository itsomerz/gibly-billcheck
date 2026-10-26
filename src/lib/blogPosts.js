// ============================================================================
// BLOG CONTENT — structured data module, same philosophy as rateTable.js:
// plain data in, rendered by src/app/blog/page.js and src/app/blog/[slug]/.
//
// CONTENT RULES (read before adding a post, human or agent):
//   - Educational and neutral ONLY. No retailer-favoring language, no "you
//     should pick X company," nothing that reads as financial advice. This
//     mirrors the stance already locked into TermsDisclaimer.jsx — BillZap is
//     an information service, not a marketer, and the blog has to hold that
//     line too or it undermines the regulatory positioning the whole app
//     depends on.
//   - Every post ends with a `cta` block pointing back to "/" (or "/rates")
//     — never to a specific retailer.
//   - `blocks` is a small set of plain content types, rendered by
//     src/app/blog/[slug]/page.js:
//       { type: "p", text }          — paragraph. **bold** supported inline.
//       { type: "h2", text }         — section heading.
//       { type: "ul", items: [...] } — bullet list. **bold** supported.
//       { type: "cta", text, href, label } — boxed call-to-action.
//   - `publishedAt` / `updatedAt`: "YYYY-MM-DD". Keep facts dated the same
//     way rateTable.js does — energy-market details age quickly.
// ============================================================================

export const BLOG_POSTS = [
  {
    slug: "rate-of-last-resort-alberta-explained",
    title: "What Is the Rate of Last Resort (RoLR) in Alberta — And Should You Be On It?",
    description:
      "Alberta's default electricity rate explained: what the RoLR actually is, how it's set, and how to tell if a competitive fixed-rate plan would cost you less.",
    publishedAt: "2026-10-26",
    tags: ["basics", "electricity", "alberta"],
    blocks: [
      {
        type: "p",
        text:
          "If you've never actively chosen an electricity plan in Alberta, you're very likely on the **Rate of Last Resort (RoLR)** — sometimes also called the Regulated Rate Option (RRO). It's the default rate every Alberta electricity consumer is automatically billed at unless they sign a contract with a competitive retailer. It isn't a bad rate, and it isn't a trap — but it's worth understanding what it is before deciding whether to stay on it.",
      },
      { type: "h2", text: "Where the RoLR comes from" },
      {
        type: "p",
        text:
          "Alberta deregulated its electricity market years ago, which means you get to choose your retailer — but nobody is forced to choose. If you never pick a competitive plan (or if a fixed-term contract ends and you don't renew), you default to the RoLR, set by a Regulated Rate Provider in your service territory (ENMAX in Calgary, EPCOR in Edmonton, and others elsewhere) under rules set by the **Alberta Utilities Commission (AUC)**.",
      },
      { type: "h2", text: "The thing people don't expect: it moves" },
      {
        type: "p",
        text:
          "Unlike a fixed-rate competitive contract, the RoLR is **not locked in**. It's tied to wholesale market pricing and is set on a regular cycle, so it can rise and fall from one period to the next — sometimes by a lot, especially in winter months when Alberta's power market gets volatile. If your bill has felt unpredictable, this is usually why.",
      },
      { type: "h2", text: "RoLR vs. a competitive fixed-rate plan" },
      {
        type: "ul",
        items: [
          "**RoLR**: no contract, no cancellation fee, rate can change with the market — simple, but exposed to price swings.",
          "**Competitive fixed plan**: you lock a rate for a term (often 1–5 years), trading flexibility for predictability — worth it if the locked rate is meaningfully below what the RoLR is likely to average over that term.",
          "**Competitive variable plan**: still floats with the market like the RoLR, but from a different retailer and fee structure — only worth it if the math (including any transaction fees) actually beats the RoLR.",
        ],
      },
      {
        type: "p",
        text:
          "There's no universally \"right\" answer — it depends on your appetite for predictability and what rates are actually available in your territory right now, not on general advice. The only way to know if switching makes sense for you is to compare your *current* rate against *current* competitive offers.",
      },
      {
        type: "cta",
        text: "See exactly how your current rate stacks up against every major Alberta retailer, ranked purely by price.",
        href: "/",
        label: "Compare your rate free →",
      },
    ],
  },
  {
    slug: "fixed-vs-variable-electricity-alberta",
    title: "Fixed vs. Variable Electricity Rates in Alberta: How to Actually Decide",
    description:
      "A plain-language breakdown of fixed vs. variable electricity plans in Alberta — what each one trades off, and the questions worth asking before you lock into either.",
    publishedAt: "2026-10-26",
    tags: ["basics", "electricity", "alberta"],
    blocks: [
      {
        type: "p",
        text:
          "Almost every Alberta electricity plan — whether it's the default RoLR or a competitive retailer's offer — falls into one of two buckets: **fixed** or **variable**. The names are self-explanatory, but the real-world trade-off is worth spelling out.",
      },
      { type: "h2", text: "Fixed-rate plans" },
      {
        type: "p",
        text:
          "A fixed plan locks your per-kWh rate for a set term, commonly 1 to 5 years in Alberta. Your rate doesn't move even if wholesale power prices spike. The trade-off: you're committing to a term, and most fixed plans carry some form of early-termination condition if you leave before it's up — always worth reading before you sign, not after.",
      },
      { type: "h2", text: "Variable-rate plans" },
      {
        type: "p",
        text:
          "A variable plan (including Alberta's RoLR) moves with the wholesale market, usually recalculated monthly. Some months it'll beat a comparable fixed rate; other months — especially cold snaps when Alberta demand spikes — it can swing well above it. No long-term commitment, but no predictability either.",
      },
      { type: "h2", text: "Questions worth asking before you choose" },
      {
        type: "ul",
        items: [
          "**How much does an unpredictable bill actually bother you?** If a $40 swing in a winter month would stress your budget, that alone is a reason to lean fixed.",
          "**What's the fixed rate actually being offered right now, compared to your current rate?** A fixed plan only pays off if the locked-in number beats what you'd likely average on variable over the same term — not just \"fixed sounds safer.\"",
          "**What happens if you need to leave early?** Check the cancellation terms, not just the headline rate.",
          "**Is a \"transaction fee\" or admin fee layered on top?** Some variable plans add a per-kWh or per-GJ fee on top of the market price — that changes the real comparison.",
        ],
      },
      {
        type: "cta",
        text: "BillZap shows both fixed and variable offers side by side, ranked by price, so you can see the actual trade-off instead of guessing.",
        href: "/",
        label: "Compare fixed & variable rates →",
      },
    ],
  },
  {
    slug: "how-to-read-alberta-energy-bill",
    title: "How to Read Your Alberta Energy Bill (and Spot If You're Overpaying)",
    description:
      "A walkthrough of what's actually on an Alberta electricity or gas bill — which number is your real rate, which charges are fixed no matter who you buy from, and how to check yourself against current market offers.",
    publishedAt: "2026-10-26",
    tags: ["basics", "bills", "alberta"],
    blocks: [
      {
        type: "p",
        text:
          "An Alberta energy bill packs a lot onto one page, and the number that actually matters for comparison shopping — your per-kWh or per-GJ **energy rate** — is easy to lose next to delivery charges, riders, and taxes. Here's how to find it.",
      },
      { type: "h2", text: "What's on the bill, roughly" },
      {
        type: "ul",
        items: [
          "**Energy/commodity charge** — the actual price per kWh (electricity) or per GJ (gas) you're paying for the energy itself. This is the number that changes based on who you buy from and which plan you're on — the one worth comparing.",
          "**Distribution / transmission charges** — the cost of the wires and pipes delivering the energy to your home. These are regulated and essentially the same no matter which retailer you choose, so they're not part of a useful rate comparison.",
          "**Riders and local access fees** — smaller regulated charges that vary by utility territory, also not retailer-dependent.",
          "**Admin or transaction fees** — these ARE retailer-dependent, and some variable plans add one on top of the market rate. Worth checking for.",
          "**GST** — applied to the total.",
        ],
      },
      { type: "h2", text: "The number to actually compare" },
      {
        type: "p",
        text:
          "When you're checking whether you're overpaying, the energy/commodity rate is what to compare against current offers — not your total bill, since total bill size is driven mostly by how much energy you used, not by the rate you're paying. Two households with identical rates can have very different total bills just from usage.",
      },
      { type: "h2", text: "The fastest way to check" },
      {
        type: "p",
        text:
          "Rather than manually tracking down current competitive rates across every Alberta retailer, you can upload a photo of your bill and get it read automatically and compared against current market offers in seconds.",
      },
      {
        type: "cta",
        text: "Upload your bill and see exactly how your rate compares — free, no sign-up required to see your result.",
        href: "/",
        label: "Check your bill free →",
      },
    ],
  },
];

export function getAllPosts() {
  return [...BLOG_POSTS].sort((a, b) => (a.publishedAt < b.publishedAt ? 1 : -1));
}

export function getPostBySlug(slug) {
  return BLOG_POSTS.find((p) => p.slug === slug) ?? null;
}

export function getAllSlugs() {
  return BLOG_POSTS.map((p) => p.slug);
}
