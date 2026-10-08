/** @type {import('next').NextConfig} */
const nextConfig = {
  // Build output folder. Normally `.next`. Setting NEXT_DIST_DIR (for example
  // to `.next-test`) lets a second dev server or a verification build run
  // beside `npm run dev` without overwriting its files — two processes sharing
  // one `.next` folder break each other. Unset on Vercel, so deploys are
  // unaffected.
  distDir: process.env.NEXT_DIST_DIR || '.next',

  experimental: {
    serverActions: {
      // Provider registration sends its photos (National ID front and back,
      // 2×2 photo, optional certificate) through a Server Action. The default
      // limit is 1 MB, which a single phone photo exceeds. Photos are resized
      // in the browser first; this covers what remains. Vercel itself caps a
      // request body at about 4.5 MB, so the form keeps the total under 4 MB.
      bodySizeLimit: '5mb',
    },
  },
};

export default nextConfig;
