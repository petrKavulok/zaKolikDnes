/** @type {import('next').NextConfig} */
export default {
  experimental: {
    // pdf-parse occasionally trips Next's RSC bundler; keep it external.
    serverComponentsExternalPackages: ['pdf-parse', '@neondatabase/serverless'],
  },
};
