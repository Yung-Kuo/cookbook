// /** @type {import('next').NextConfig} */
// const nextConfig = {};

// export default nextConfig;

// next-frontend/next.config.mjs
import { fileURLToPath } from "url";
import path from "path";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    turbopack: {
      root: __dirname,
    },
  },
};

export default nextConfig;
