/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  basePath: process.env.NODE_ENV === 'production' ? '/dodge-ball-chaos' : '',
  assetPrefix: process.env.NODE_ENV === 'production' ? '/dodge-ball-chaos/' : '',
  images: {
    unoptimized: true,
  },
};

module.exports = nextConfig;
