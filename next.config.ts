import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["@prisma/client", "bcryptjs"],
  experimental: {
    serverActions: {
      bodySizeLimit: "2mb",
    },
  },
  webpack: (config, { nextRuntime, webpack }) => {
    // JWT sessions do not need jose's deflate (JWE) path on Edge middleware.
    if (nextRuntime === "edge") {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /jose[/\\]dist[/\\]webapi[/\\]lib[/\\]deflate\.js$/,
        })
      );
    }
    return config;
  },
};

export default nextConfig;
