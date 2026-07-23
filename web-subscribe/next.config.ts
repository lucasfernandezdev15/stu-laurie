import type { NextConfig } from 'next';
import path from 'path';

const nextConfig: NextConfig = {
  turbopack: {
    // Avoid picking a parent lockfile as workspace root (monorepo warning).
    root: path.join(__dirname),
  },
};

export default nextConfig;
