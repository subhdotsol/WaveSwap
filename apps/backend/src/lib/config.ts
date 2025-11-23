import dotenv from 'dotenv'

// Load environment variables
dotenv.config()

export const config = {
  // Server configuration
  NODE_ENV: process.env.NODE_ENV || 'development',
  API_PORT: parseInt(process.env.API_PORT || '3001', 10),
  API_HOST: process.env.API_HOST || '0.0.0.0',
  API_BASE_URL: process.env.API_BASE_URL || 'http://localhost:3001',

  // Security
  JWT_SECRET: process.env.JWT_SECRET || 'your-super-secret-jwt-key-change-in-production',
  CORS_ORIGIN: process.env.CORS_ORIGIN || 'http://localhost:3000',
  API_RATE_LIMIT_REQUESTS_PER_MINUTE: parseInt(
    process.env.API_RATE_LIMIT_REQUESTS_PER_MINUTE || '100',
    10
  ),

  // Database configuration
  DATABASE_URL: process.env.DATABASE_URL || 'postgresql://waveswap:password@localhost:5432/waveswap_dev',

  // Redis configuration
  REDIS_URL: process.env.REDIS_URL || 'redis://localhost:6379',
  REDIS_HOST: process.env.REDIS_HOST || 'localhost',
  REDIS_PORT: parseInt(process.env.REDIS_PORT || '6379', 10),

  // Solana configuration
  SOLANA_RPC_ENDPOINT: process.env.SOLANA_RPC_ENDPOINT || 'https://api.devnet.solana.com',
  SOLANA_COMMITMENT: process.env.SOLANA_COMMITMENT || 'processed',
  SOLANA_NETWORK: process.env.SOLANA_NETWORK || 'devnet',

  // WaveSwap program configuration
  WAVESWAP_PROGRAM_ID: process.env.WAVESWAP_PROGRAM_ID || '11111111111111111111111111111111',
  WAVESWAP_SWAP_REGISTRY_PROGRAM_ID:
    process.env.WAVESWAP_SWAP_REGISTRY_PROGRAM_ID || '11111111111111111111111111111111',

  // Arcium configuration
  ARCIUM_MXE_ENDPOINT: process.env.ARCIUM_MXE_ENDPOINT || 'https://mxe-devnet.arcium.io',
  ARCIUM_PROGRAM_ID: process.env.ARCIUM_PROGRAM_ID || '11111111111111111111111111111111',
  ARCIUM_TOKEN_WRAP_PROGRAM_ID:
    process.env.ARCIUM_TOKEN_WRAP_PROGRAM_ID || '11111111111111111111111111111111',

  // MagicBlock configuration
  MAGICBLOCK_EPHEMERAL_RPC:
    process.env.MAGICBLOCK_EPHEMERAL_RPC || 'https://devnet-ephemeral.magicblock.io',
  MAGICBLOCK_PROGRAM_ID: process.env.MAGICBLOCK_PROGRAM_ID || '11111111111111111111111111111111',
  MAGICBLOCK_VALIDITY_DURATION_SECONDS: parseInt(
    process.env.MAGICBLOCK_VALIDITY_DURATION_SECONDS || '300',
    10
  ),

  // Jupiter API configuration
  JUPITER_API_BASE_URL: process.env.JUPITER_API_BASE_URL || 'https://quote-api.jup.ag/v6',
  JUPITER_API_KEY: process.env.JUPITER_API_KEY,

  // Feature flags
  ENABLE_PRIVACY_FEATURES: process.env.ENABLE_PRIVACY_FEATURES === 'true',
  ENABLE_CROSS_CHAIN_BRIDGES: process.env.ENABLE_CROSS_CHAIN_BRIDGES === 'true',
  ENABLE_LIMIT_ORDERS: process.env.ENABLE_LIMIT_ORDERS === 'true',
  ENABLE_BULK_OPERATIONS: process.env.ENABLE_BULK_OPERATIONS === 'true',

  // Swap configuration
  MAX_SLIPPAGE_BPS: parseInt(process.env.MAX_SLIPPAGE_BPS || '500', 10), // 5%
  MIN_SWAP_AMOUNT: parseInt(process.env.MIN_SWAP_AMOUNT || '1000', 10),
  MAX_SWAP_AMOUNT: parseInt(process.env.MAX_SWAP_AMOUNT || '1000000000', 10),

  // Development flags
  ENABLE_MOCK_QUOTE_API: process.env.ENABLE_MOCK_QUOTE_API === 'true',
  ENABLE_MOCK_SOLANA_CONNECTION: process.env.ENABLE_MOCK_SOLANA_CONNECTION === 'true',
  SKIP_SOLANA_VALIDATION: process.env.SKIP_SOLANA_VALIDATION === 'true',

  // Monitoring
  DATADOG_API_KEY: process.env.DATADOG_API_KEY,
  SENTRY_DSN: process.env.SENTRY_DSN,
  LOG_LEVEL: process.env.LOG_LEVEL || 'info',
}

// Validate required environment variables
const requiredEnvVars = [
  'DATABASE_URL',
  'JWT_SECRET',
  'SOLANA_RPC_ENDPOINT',
]

for (const envVar of requiredEnvVars) {
  if (!process.env[envVar] && config.NODE_ENV === 'production') {
    throw new Error(`Missing required environment variable: ${envVar}`)
  }
}

export default config