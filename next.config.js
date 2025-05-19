// next.config.js
const path = require('path');

/** @type {import('next').NextConfig} */
module.exports = {
  reactStrictMode: true,
  webpack(config) {
    config.resolve.alias = {
      ...config.resolve.alias,
      // Fuerza que cualquier import de 'use-sync-external-store/shim'
      // apunte al shim real instalado
      'use-sync-external-store/shim': path.resolve(
        __dirname,
        'node_modules/use-sync-external-store/shim/index.js'
      ),
    };
    return config;
  },
};
