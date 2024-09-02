/** @type {import('next').NextConfig} */
const nextConfig = {
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "upload.wikimedia.org/",
        port: "",
      },
    ],
  },
  reactStrictMode: true,
};

module.exports = nextConfig;
