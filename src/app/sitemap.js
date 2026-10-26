import { getAllPosts } from "@/lib/blogPosts";

// Next.js app-router sitemap route — serves /sitemap.xml automatically.
// Nothing linked this site up for search-engine discovery before; this and
// robots.js are the two files that fix that.
const BASE_URL = "https://billzap.ca";

export default function sitemap() {
  const staticRoutes = ["", "/rates", "/blog", "/privacy", "/terms"].map((path) => ({
    url: `${BASE_URL}${path}`,
    lastModified: new Date(),
  }));

  const postRoutes = getAllPosts().map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: post.updatedAt ?? post.publishedAt,
  }));

  return [...staticRoutes, ...postRoutes];
}
