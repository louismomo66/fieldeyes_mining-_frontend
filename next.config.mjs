/** @type {import('next').NextConfig} */
const nextConfig = {
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  // Only compile the icons/components you actually import, not the whole library.
  // Big win for dev compile times with lucide-react, recharts and Radix.
  experimental: {
    optimizePackageImports: ["lucide-react", "recharts", "date-fns", "qrcode.react"],
  },
  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://localhost:9006/api/:path*',
      },
    ]
  },
}

export default nextConfig
