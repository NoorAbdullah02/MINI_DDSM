import type { NextConfig } from "next";

// Fully static site: works on Vercel, GitHub Pages, or any static host.
const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
};

export default nextConfig;
