import { notFound } from "next/navigation";
import GiblyShell from "@/components/GiblyShell";
import BlogPost from "@/components/BlogPost";
import { getAllSlugs, getPostBySlug } from "@/lib/blogPosts";

export function generateStaticParams() {
  return getAllSlugs().map((slug) => ({ slug }));
}

export async function generateMetadata({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) return { title: "Not found — BillZap" };
  return {
    title: `${post.title} — BillZap`,
    description: post.description,
  };
}

export default async function BlogPostPage({ params }) {
  const { slug } = await params;
  const post = getPostBySlug(slug);
  if (!post) notFound();

  return (
    <GiblyShell>
      <BlogPost post={post} />
    </GiblyShell>
  );
}
