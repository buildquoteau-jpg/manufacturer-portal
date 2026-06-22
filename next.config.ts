import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    return [
      {
        source: '/supplierdirectory/buildquote.com.au',
        destination: '/buildquote-supplier-demo.html',
      },
    ]
  },
};

export default nextConfig;
