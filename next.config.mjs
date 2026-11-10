/** @type {import('next').NextConfig} */
const nextConfig = {
  async headers() {
    return [
      {
        // Baseline security headers on every response. No CSP here yet --
        // worth adding later, but it needs real testing against the
        // Vercel Analytics script and Supabase/OpenAI calls first rather
        // than shipping something that silently breaks the app.
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          { key: "X-Frame-Options", value: "DENY" },
          { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
          {
            key: "Permissions-Policy",
            value: "camera=(self), microphone=(), geolocation=()",
          },
          {
            key: "Strict-Transport-Security",
            value: "max-age=63072000; includeSubDomains",
          },
        ],
      },
    ];
  },
};

export default nextConfig;
