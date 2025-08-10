import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  images: {
    // Allow common external sources used in the app; extend as needed
    remotePatterns: [
      { protocol: "https", hostname: "picsum.photos" },
      { protocol: "http", hostname: "localhost" },
      { protocol: "https", hostname: "iruphyvegochwcbocjil.supabase.co" },
      // If other Supabase projects/hosts are used, add them similarly or switch to a wildcard like "**.supabase.co" if appropriate.
    ],
  },
};

export default nextConfig;
