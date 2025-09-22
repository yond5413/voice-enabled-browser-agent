/** @type {import('next').NextConfig} */
const nextConfig = {
  env: {
    DEEPGRAM_API_KEY: process.env.DEEPGRAM_API_KEY,
    OPENROUTER_API_KEY: process.env.OPENROUTER_API_KEY,
    NEXT_PUBLIC_DEEPGRAM_API_KEY: process.env.NEXT_PUBLIC_DEEPGRAM_API_KEY,
    NEXT_PUBLIC_OPENROUTER_API_KEY: process.env.NEXT_PUBLIC_OPENROUTER_API_KEY,
  },
  experimental: {
    // Keep worker-thread based deps external to avoid vendor-chunks worker path issues
    serverComponentsExternalPackages: ['@browserbasehq/stagehand', 'pino', 'thread-stream']
  }
}

module.exports = nextConfig
