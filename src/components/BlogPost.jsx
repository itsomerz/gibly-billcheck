import Link from "next/link";
import { P, F } from "@/lib/theme";

// Tiny **bold** inline parser for blog content blocks — intentionally
// minimal (no links, no italics) so content stays simple for a human or an
// agent to generate, and simple to render safely.
function Inline({ text }) {
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, i) =>
    part.startsWith("**") && part.endsWith("**") ? (
      <strong key={i} style={{ color: P.cream }}>
        {part.slice(2, -2)}
      </strong>
    ) : (
      <span key={i}>{part}</span>
    )
  );
}

const pStyle = { color: P.lilac, fontSize: 15.5, lineHeight: 1.7, margin: "0 0 16px" };
const h2Style = { fontFamily: F.display, fontWeight: 600, fontSize: 20, margin: "28px 0 12px", color: P.cream };
const ulStyle = { color: P.lilac, fontSize: 15.5, lineHeight: 1.7, margin: "0 0 16px", paddingLeft: 20, listStyle: "disc" };
const liStyle = { marginBottom: 6 };

function Block({ block }) {
  switch (block.type) {
    case "h2":
      return (
        <h2 style={h2Style}>
          <Inline text={block.text} />
        </h2>
      );
    case "ul":
      return (
        <ul style={ulStyle}>
          {block.items.map((item, i) => (
            <li key={i} style={liStyle}>
              <Inline text={item} />
            </li>
          ))}
        </ul>
      );
    case "cta":
      return (
        <div
          className="fu"
          style={{
            background: P.plum3,
            border: `1px solid ${P.line}`,
            borderRadius: 18,
            padding: "20px 22px",
            margin: "28px 0 8px",
          }}
        >
          <p style={{ ...pStyle, margin: "0 0 12px", color: P.cream }}>{block.text}</p>
          <Link
            href={block.href}
            className="tap"
            style={{
              display: "inline-block",
              background: P.gold,
              color: P.plum,
              fontWeight: 700,
              fontSize: 14,
              padding: "10px 18px",
              borderRadius: 24,
              textDecoration: "none",
            }}
          >
            {block.label}
          </Link>
        </div>
      );
    case "p":
    default:
      return (
        <p style={pStyle}>
          <Inline text={block.text} />
        </p>
      );
  }
}

export default function BlogPost({ post }) {
  return (
    <article
      className="fu"
      style={{
        background: `radial-gradient(120% 100% at 50% 0%, ${P.plum3} 0%, ${P.plum2} 60%)`,
        border: `1px solid ${P.line}`,
        borderRadius: 28,
        padding: "34px 28px 40px",
        marginBottom: 20,
      }}
    >
      <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 26, marginBottom: 8, lineHeight: 1.25 }}>
        {post.title}
      </div>
      <div style={{ color: P.lilac, fontSize: 13, marginBottom: 24 }}>
        {new Date(`${post.publishedAt}T00:00:00`).toLocaleDateString("en-US", {
          year: "numeric",
          month: "long",
          day: "numeric",
        })}
      </div>
      {post.blocks.map((block, i) => (
        <Block key={i} block={block} />
      ))}
    </article>
  );
}
