import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  cacheComponents: true,
  partialPrefetching: true,
  images: {
    // Public photos from the Greedy Adventures website, used with credit.
    remotePatterns: [
      new URL("https://www.greedyadventures.com/greedy/**"),
      new URL("https://pub-89f493a2b50b4e43b99552a737bef138.r2.dev/offerings/**"),
    ],
  },
  turbopack: {
    rules: {
      "*.css": {
        loaders: ["@tailwindcss/turbopack"],
        as: "*.css",
      },
    },
  },
};

export default nextConfig;
