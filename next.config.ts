import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  reactCompiler: true,
  // Enables "use cache" for Google Sheets reads (see lib/data).
  cacheComponents: true,
  partialPrefetching: true,
  // Dev only: lets a phone on the LAN load the dev server (npm run dev -- -H 0.0.0.0).
  allowedDevOrigins: ["192.168.100.10"],
};

export default nextConfig;
