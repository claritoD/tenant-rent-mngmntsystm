import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow HMR from other devices on your local network (e.g. phone, tablet)
  allowedDevOrigins: ['192.168.1.43'],
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'hzqaiccwidolbsjliywg.supabase.co',
        port: '',
        pathname: '/storage/v1/object/public/**',
      },
    ],
  },
};


export default nextConfig;
