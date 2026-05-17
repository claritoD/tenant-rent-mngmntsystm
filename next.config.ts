import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    // Disable client-side router cache for dynamic pages so auth-gated pages
    // (like the tenant dashboard) always re-fetch from the server.
    // This ensures the unread badge and new announcements are always fresh.
    staleTimes: { dynamic: 0 },
  },
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
  async headers() {
    return [
      {
        source: '/(.*)',
        headers: [
          {
            key: 'X-DNS-Prefetch-Control',
            value: 'on'
          },
          {
            key: 'Strict-Transport-Security',
            value: 'max-age=63072000; includeSubDomains; preload'
          },
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN'
          },
          {
            key: 'X-Content-Type-Options',
            value: 'nosniff'
          },
          {
            key: 'Referrer-Policy',
            value: 'strict-origin-when-cross-origin'
          },
          {
            key: 'Content-Security-Policy',
            value: "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval'; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https://hzqaiccwidolbsjliywg.supabase.co; connect-src 'self' https://hzqaiccwidolbsjliywg.supabase.co wss://hzqaiccwidolbsjliywg.supabase.co https://fcm.googleapis.com https://*.googleapis.com; worker-src 'self'; manifest-src 'self'; frame-ancestors 'none';"
          }
        ],
      },
    ];
  },
};


export default nextConfig;
