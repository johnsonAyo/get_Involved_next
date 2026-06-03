import path from 'path'

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  outputFileTracingRoot: path.resolve(import.meta.dirname),
  turbopack: {},
}

export default nextConfig
