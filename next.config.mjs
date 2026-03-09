/** @type {import('next').NextConfig} */
const isGhPages = process.env.GITHUB_PAGES === 'true';
const subPath = process.env.DEPLOY_SUBPATH || '';
const basePath = isGhPages
  ? `/ACKO-Hello-Buy${subPath ? `/${subPath}` : ''}`
  : '';

const nextConfig = {
  reactStrictMode: true,
  output: 'export',
  images: { unoptimized: true },
  env: {
    NEXT_PUBLIC_BASE_PATH: basePath,
    NEXT_PUBLIC_VIDEO_BG: subPath === 'newhomepage' ? 'true' : 'false',
  },
  ...(isGhPages && {
    basePath,
    assetPrefix: `${basePath}/`,
  }),
};

export default nextConfig;
