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
};

export default nextConfig;
