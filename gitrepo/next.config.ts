import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Disable caching in development
  ...(process.env.NODE_ENV === "development" && {
    onDemandEntries: {
      // Period (in ms) where the server will keep pages in the buffer
      maxInactiveAge: 25 * 1000,
      // number of pages that should be kept simultaneously without being disposed
      pagesBufferLength: 2,
    },
    experimental: {
      // Force dynamic rendering in development
      staleTimes: {
        dynamic: 0,
      },
    },
  }),
};

export default nextConfig;
