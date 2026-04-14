/** @type {import('next').NextConfig} */
export default {
  experimental: {
    serverComponentsExternalPackages: ['pdf-parse', '@neondatabase/serverless'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // Prevent webpack from bundling the neon driver — its tagged-template
      // API breaks silently when the module is compiled into the bundle
      // across file boundaries. Keeping it as a native require() at runtime
      // fixes queries returning empty results.
      config.externals.push('@neondatabase/serverless');
    }
    return config;
  },
};
