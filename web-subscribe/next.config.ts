import type { NextConfig } from 'next';
import path from 'path';

const backendOrigin = (
  process.env.NEXT_PUBLIC_API_URL ||
  'https://streaming-backend-vlfm.onrender.com'
).replace(/\/$/, '');

const nextConfig: NextConfig = {
  turbopack: {
    // Avoid picking a parent lockfile as workspace root (monorepo warning).
    root: path.join(__dirname),
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: `${backendOrigin}/api/:path*`,
      },
    ];
  },
};

export default nextConfig;
