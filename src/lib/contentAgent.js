// ============================================================================
// WEEKLY CONTENT AGENT — generation + guardrails for the autonomous blog
// post job (see .github/workflows/content-agent.yml and
// scripts/run-content-agent.mjs, which calls generatePost() below and
// writes the result straight into blogPosts.js).
//
// Mirrors the OpenAI Responses API + strict JSON schema pattern already
// used in src/app/api/extract-bill/route.js, for consistency with the rest
// of the codebase.
//
// This is fully autonomous (no human review before it lands on the live
// site), so the guardrails here are load-bearing, not decorative:
//   1. A strict JSON schema — the model structurally cannot return a shape
//      we don't expect.
//   2. validatePost() — rejects anything that slips past the prompt alone:
//      a missing/duplicate slug, a missing or wrong closing CTA, retailer-
//      endorsement language.
//   3. Fails closed: if generation or validation fails (even after a
//      retry), generatePost() throws, the workflow step fails, and NOTHING
//      is written or committed that week. A skipped week is fine; a bad
//      post reaching billzap.ca is not.
// ============================================================================

const OPENAI_MODEL = "gpt-4o";

// Retailer-endorsement language is the one thing this content must never
// contain — BillZap's whole regulatory posture rests on being neutral (see
// TermsDisclaimer.jsx, section 2). A retailer name on its own is fine
// (factual context, e.g. "ENMAX is the Regulated Rate Provider in
// Calgary"); these patterns catch the endorsement framing specifically.
const PROMOTIONAL_PATTERNS = [
  /\brecommend(ed|s)?\b/i,
  /\bbest (choice|option|provider|retailer|plan|deal)\b/i,
  /\btop[- ]pick\b/i,
  /\bsign up (with|for)\b/i,
  /\bswitch to\b/i,
  /\bgo with\b/i,
];

const BLOCK_SCHEMA = {
  type: "object",
  properties: {
    type: { type: "string", enum: ["p", "h2", "ul", "cta"] },
    text: { type: ["string", "null"] },
    items: { type: ["array", "null"], items: { type: "string" } },
    href: { type: ["string", "null"] },
    label: { type: ["string", "null"] },
  },
  required: ["type", "text", "items", "href", "label"],
  additionalProperties: false,
};

const POST_SCHEMA = {
  type: "object",
  properties: {
    title: { type: "string" },
    slug: { type: "string" },
    description: { type: "string" },
    tags: { type: "array", items: { type: "string" } },
    blocks: { type: "array", items: BLOCK_SCHEMA },
  },
  required: ["title", "slug", "description", "tags", "blocks"],
  additionalProperties: false,
};

function buildInstructions(existingPosts) {
  const existingTitles = existingPosts.map((p) => `- ${p.title}`).join("\n");
  return `You are drafting ONE new blog post for BillZap, a free, neutral Alberta energy bill comparison tool (billzap.ca). You are writing for real Alberta residents trying to understand their electricity/gas bill and rates — practical, accurate, plain-language content.

HARD RULES (these come from BillZap's own regulatory positioning — breaking them is not acceptable):
- Educational and neutral ONLY. Never recommend, favor, or rank any specific retailer by name (Get Energy, ENMAX, EPCOR/Encor, ATCO Energy, Direct Energy). You may mention a retailer name only as a factual example (e.g. "ENMAX is the Regulated Rate Provider in Calgary"), never as "recommended" or "the best choice."
- Not financial advice. Explain trade-offs and how things work; never tell the reader what they personally should do.
- Be factually careful about Alberta's deregulated energy market, the Rate of Last Resort / Regulated Rate Option, the AUC, and fixed/variable plans. If you are not confident of a specific number, describe it in general terms rather than inventing a precise figure.
- The post MUST end with exactly one block of type "cta" whose href is "/" or "/rates", inviting the reader to compare their rate on BillZap — written plainly, no hype.
- blocks must be 4 to 8 entries: a mix of "p" (paragraph), "h2" (section heading), and "ul" (bullet list), ending with one "cta". Every block needs all four fields present (text, items, href, label) — set whichever don't apply to null (e.g. a "p" block has items=null, href=null, label=null; an "h2" block has items=null, href=null, label=null; a "ul" block has text=null, href=null, label=null).
- Inline emphasis: wrap important terms in **double asterisks** for bold — the only inline formatting supported, nothing else.
- slug: lowercase, hyphen-separated, 3-8 words, no dates, derived from the title, must not duplicate or closely resemble any existing slug below.
- Pick a topic NOT already covered by these existing posts — a genuinely different angle, a different part of the bill, a seasonal angle, a different decision point:
${existingTitles}

Write the full post now: title, slug, description (one sentence, for search results), tags (2-4 short lowercase tags), and blocks.`;
}

function containsPromotionalLanguage(text) {
  if (!text) return false;
  return PROMOTIONAL_PATTERNS.some((pattern) => pattern.test(text));
}

function validatePost(post, existingPosts) {
  const existingSlugs = new Set(existingPosts.map((p) => p.slug));
  if (existingSlugs.has(post.slug)) {
    throw new Error(`Generated slug "${post.slug}" already exists.`);
  }
  if (!/^[a-z0-9]+(-[a-z0-9]+)*$/.test(post.slug)) {
    throw new Error(`Generated slug "${post.slug}" isn't a clean lowercase-hyphen slug.`);
  }
  if (!Array.isArray(post.blocks) || post.blocks.length < 4 || post.blocks.length > 8) {
    throw new Error(`blocks array has an unexpected length (${post.blocks?.length}).`);
  }

  const ctaBlocks = post.blocks.filter((b) => b.type === "cta");
  if (ctaBlocks.length !== 1) {
    throw new Error(`Post must have exactly one cta block (found ${ctaBlocks.length}).`);
  }
  const lastBlock = post.blocks[post.blocks.length - 1];
  if (lastBlock.type !== "cta" || !["/", "/rates"].includes(lastBlock.href)) {
    throw new Error(`Post must end with a cta block pointing to "/" or "/rates" (got type=${lastBlock.type}, href=${lastBlock.href}).`);
  }

  for (const block of post.blocks) {
    const allText = [block.text, ...(block.items ?? [])].filter(Boolean).join(" ");
    if (containsPromotionalLanguage(allText)) {
      throw new Error(`Promotional language detected in a "${block.type}" block: "${allText.slice(0, 120)}..."`);
    }
  }

  return true;
}

export async function generatePost(existingPosts, { maxAttempts = 2 } = {}) {
  if (!process.env.OPENAI_API_KEY) {
    throw new Error("OPENAI_API_KEY is not set.");
  }

  let lastError;
  for (let attempt = 1; attempt <= maxAttempts; attempt++) {
    try {
      const res = await fetch("https://api.openai.com/v1/responses", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${process.env.OPENAI_API_KEY}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          model: OPENAI_MODEL,
          instructions: buildInstructions(existingPosts),
          input: [{ role: "user", content: [{ type: "input_text", text: "Write the post now, following every rule exactly." }] }],
          text: {
            format: {
              type: "json_schema",
              name: "blog_post",
              schema: POST_SCHEMA,
              strict: true,
            },
          },
        }),
      });

      if (!res.ok) {
        const detail = await res.text().catch(() => "");
        throw new Error(`OpenAI API error ${res.status}: ${detail.slice(0, 300)}`);
      }

      const payload = await res.json();
      const outputText = payload.output
        ?.find((item) => item.type === "message")
        ?.content?.find((part) => part.type === "output_text")?.text;

      if (!outputText) {
        throw new Error("No structured output in OpenAI response.");
      }

      const post = JSON.parse(outputText);
      post.publishedAt = new Date().toISOString().slice(0, 10);
      validatePost(post, existingPosts);
      return post;
    } catch (err) {
      lastError = err;
      console.warn(`Attempt ${attempt} failed: ${err.message}`);
    }
  }
  throw lastError;
}

function jsString(str) {
  return JSON.stringify(str);
}

function serializeBlock(block) {
  switch (block.type) {
    case "h2":
      return `      { type: "h2", text: ${jsString(block.text)} },`;
    case "ul":
      return [
        `      {`,
        `        type: "ul",`,
        `        items: [`,
        ...block.items.map((item) => `          ${jsString(item)},`),
        `        ],`,
        `      },`,
      ].join("\n");
    case "cta":
      return [
        `      {`,
        `        type: "cta",`,
        `        text: ${jsString(block.text)},`,
        `        href: ${jsString(block.href)},`,
        `        label: ${jsString(block.label)},`,
        `      },`,
      ].join("\n");
    case "p":
    default:
      return [`      {`, `        type: "p",`, `        text:`, `          ${jsString(block.text)},`, `      },`].join("\n");
  }
}

// Turns a validated post object into formatted JS source text, matching the
// hand-written entries already in blogPosts.js, ready to splice straight
// into the BLOG_POSTS array.
export function serializePost(post) {
  const lines = [
    `  {`,
    `    slug: ${jsString(post.slug)},`,
    `    title: ${jsString(post.title)},`,
    `    description:`,
    `      ${jsString(post.description)},`,
    `    publishedAt: ${jsString(post.publishedAt)},`,
    `    tags: [${post.tags.map(jsString).join(", ")}],`,
    `    blocks: [`,
    ...post.blocks.map(serializeBlock),
    `    ],`,
    `  },`,
  ];
  return lines.join("\n");
}
