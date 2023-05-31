const { i18n } = require('./next-i18next.config')

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: "undefined",
  
  images: {
    unoptimized: true
  }
}

module.exports = nextConfig
module.exports = {
  i18n
}
