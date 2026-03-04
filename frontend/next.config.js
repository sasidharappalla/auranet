/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "localhost",
        port: "9002",
        pathname: "/auranet-media/**",
      },
      // Production MinIO / S3 — set NEXT_PUBLIC_MEDIA_HOSTNAME in Vercel env vars
      ...(process.env.NEXT_PUBLIC_MEDIA_HOSTNAME
        ? [
            {
              protocol: "https",
              hostname: process.env.NEXT_PUBLIC_MEDIA_HOSTNAME,
              pathname: "/auranet-media/**",
            },
          ]
        : []),
    ],
  },
};

module.exports = nextConfig;
