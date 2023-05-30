const { i18n } = require('./next-i18next.config')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  transpilePackages: ['tauri-settings'],

  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
module.exports = {
  i18n
}
