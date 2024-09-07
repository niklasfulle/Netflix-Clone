/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "http",
        hostname: "192.168.2.196",
        port: "9000",
      },
    ],
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
