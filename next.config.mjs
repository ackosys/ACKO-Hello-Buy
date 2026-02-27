/** @type {import('next').NextConfig} */
const isGhPages = process.env.GITHUB_PAGES === 'true';
const basePath = isGhPages ? '/ACKO-Hello-Buy' : '';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
  },
  ...(isGhPages && {
    basePath,
    assetPrefix: '/ACKO-Hello-Buy/',
  }),
};

export default nextConfig;
