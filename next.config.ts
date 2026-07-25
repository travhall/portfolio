import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  reactCompiler: true,
  // public/admin/index.html only matches Next's static file serving at its
  // exact path — /admin has no directory-index resolution the way a plain
  // static host would give it, so it 404s through the app router without this.
  async rewrites() {
    return [
      { source: "/admin", destination: "/admin/index.html" },
      { source: "/admin/", destination: "/admin/index.html" },
    ];
  },
  async headers() {
    return [
      {
        source: "/:path*",
        headers: [
          { key: "X-Content-Type-Options", value: "nosniff" },
          {
            key: "Referrer-Policy",
            value: "strict-origin-when-cross-origin",
          },
          { key: "X-Frame-Options", value: "DENY" },
          {
            key: "Content-Security-Policy",
            value: "frame-ancestors 'none';",
          },
        ],
      },
      {
        // /admin renders the Sveltia CMS UI (GitHub-backed, local-repo-only
        // usage today — see public/admin/config.yml). No page on this site
        // is meant to be iframed, but /admin specifically gets its own
        // explicit, unambiguous rule since it's the one route where framing
        // would have any real consequence (a clickjacked CMS action) if
        // production auth is ever enabled later.
        source: "/admin/:path*",
        headers: [{ key: "X-Frame-Options", value: "DENY" }],
      },
    ];
  },
};

export default nextConfig;
