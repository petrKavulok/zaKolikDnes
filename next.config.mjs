/** @type {import('next').NextConfig} */
export default {
  // pdf-parse trips the bundler; keep it external.
  serverExternalPackages: ['pdf-parse'],
};
