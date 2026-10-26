import Link from "next/link";
import GiblyShell from "@/components/GiblyShell";
import { P, F } from "@/lib/theme";
import { getAllPosts } from "@/lib/blogPosts";

export const metadata = {
  title: "Blog — BillZap",
  description:
    "Plain-language guides to Alberta electricity and gas rates — how they work, what to compare, and how to tell if you're overpaying.",
};

export default function BlogIndexPage() {
  const posts = getAllPosts();

  return (
    <GiblyShell>
      <div className="fu" style={{ marginBottom: 20 }}>
        <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 28, marginBottom: 6 }}>
          BillZap Guides
        </div>
        <p style={{ color: P.lilac, fontSize: 14.5, lineHeight: 1.6, margin: 0 }}>
          Plain-language explainers on how Alberta energy rates actually work — no sales pitch, just what you need to
          compare.
        </p>
      </div>

      {posts.map((post) => (
        <Link
          key={post.slug}
          href={`/blog/${post.slug}`}
          className="tap"
          style={{
            display: "block",
            textDecoration: "none",
            background: P.plum2,
            border: `1px solid ${P.line}`,
            borderRadius: 20,
            padding: "20px 22px",
            marginBottom: 14,
          }}
        >
          <div style={{ fontFamily: F.display, fontWeight: 600, fontSize: 18, marginBottom: 6, color: P.cream }}>
            {post.title}
          </div>
          <p style={{ color: P.lilac, fontSize: 14, lineHeight: 1.55, margin: "0 0 10px" }}>{post.description}</p>
          <div style={{ color: P.gold, fontSize: 12.5, fontWeight: 600 }}>
            {new Date(`${post.publishedAt}T00:00:00`).toLocaleDateString("en-US", {
              year: "numeric",
              month: "long",
              day: "numeric",
            })}
          </div>
        </Link>
      ))}
    </GiblyShell>
  );
}
