import type { NextConfig } from "next";
import withPWAInit from "next-pwa";

const withPWA = withPWAInit({
  dest: "public",
  disable: process.env.NODE_ENV === "development",
  register: true,
  skipWaiting: true,
});

const nextConfig: NextConfig = {
  output: process.env.NEXT_PUBLIC_IS_ELECTRON === 'true' ? 'export' : undefined,
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
      {
        protocol: 'http',
        hostname: '**',
      },
    ],
    formats: ["image/avif", "image/webp"],
  },

  typescript: {
    ignoreBuildErrors: true,
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  /* orchids-visual-edits disabled to fix R3F crash */
  // turbopack: {
  //   rules: {
  //     "*.{jsx,tsx}": {
  //       loaders: [loaderPath]
  //     }
  //   }
  // }
};

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export default withPWA(nextConfig as any);
