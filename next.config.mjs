/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: '/appvencimento',
  assetPrefix: '/appvencimento/',
  images: {
    unoptimized: true,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'res.cloudinary.com',
        pathname: '/dzjpj67xw/**',
      },
    ],
  },
};

export default nextConfig;
