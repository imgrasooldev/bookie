import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // produce a minimal self-contained server build for Docker/Fly deploys
  output: "standalone",
  // allow phones/other devices on the LAN to load dev resources (HMR, chunks).
  // Next 16 blocks cross-origin dev requests by default; whitelist the LAN host.
  allowedDevOrigins: ["192.168.0.111", "192.168.1.4"],
  images: {
    remotePatterns: [
      { protocol: "https", hostname: "images.unsplash.com" },
    ],
  },
};

export default nextConfig;
