// Next.js app-router robots route — serves /robots.txt automatically,
// pointing crawlers at sitemap.js.
const BASE_URL = "https://billzap.ca";

export default function robots() {
  return {
    rules: {
      userAgent: "*",
      allow: "/",
    },
    sitemap: `${BASE_URL}/sitemap.xml`,
  };
}
