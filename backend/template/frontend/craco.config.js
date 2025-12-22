// craco.config.js - Simplified for Docker builds
const path = require("path");

// Check if building for tenant
const isTenantBuild = process.env.REACT_APP_ENTRY === 'tenant';

module.exports = {
  webpack: {
    alias: {
      '@': path.resolve(__dirname, 'src'),
    },
    configure: (webpackConfig) => {
      if (isTenantBuild) {
        // Change entry point to TenantApp for tenant builds
        webpackConfig.entry = path.resolve(__dirname, 'src/tenant-index.js');
      }
      return webpackConfig;
    },
  },
};
