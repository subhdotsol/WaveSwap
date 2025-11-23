import { PrismaClient } from '@prisma/client'
import { logger } from '@/lib/logger'

const prisma = new PrismaClient()

const defaultTokens = [
  {
    mint: 'So11111111111111111111111111111111111111112',
    symbol: 'SOL',
    name: 'Solana',
    decimals: 9,
    logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/So11111111111111111111111111111111111111112/logo.png',
    isVerified: true,
  },
  {
    mint: 'EPjFWdd5Au17hunJyHyer4hoi6UcsbkxNmnpDnJ55ip2',
    symbol: 'USDC',
    name: 'USD Coin',
    decimals: 6,
    logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/EPjFWdd5Au17hunJyHyer4hoi6UcsbkxNmnpDnJ55ip2/logo.png',
    isVerified: true,
  },
  {
    mint: 'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB',
    symbol: 'USDT',
    name: 'Tether USD',
    decimals: 6,
    logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB/logo.png',
    isVerified: true,
  },
  {
    mint: 'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263',
    symbol: 'BONK',
    name: 'Bonk',
    decimals: 5,
    logoUri: 'https://raw.githubusercontent.com/solana-labs/token-list/main/assets/mainnet/DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263/logo.png',
    isVerified: true,
  },
]

const defaultRoutes = [
  {
    name: 'Jupiter Aggregated',
    description: 'Jupiter DEX aggregation with best price routing',
    isActive: true,
    priority: 1,
  },
  {
    name: 'Orca Direct',
    description: 'Direct Orca pool swaps',
    isActive: true,
    priority: 2,
  },
  {
    name: 'Raydium Direct',
    description: 'Direct Raydium pool swaps',
    isActive: true,
    priority: 3,
  },
]

async function main() {
  logger.info('Starting database seeding...')

  try {
    // Clear existing data
    await prisma.swapStage.deleteMany()
    await prisma.swap.deleteMany()
    await prisma.session.deleteMany()
    await prisma.quoteCache.deleteMany()
    await prisma.rateLimit.deleteMany()
    await prisma.route.deleteMany()
    await prisma.tokenMetadata.deleteMany()

    logger.info('Cleared existing data')

    // Seed token metadata
    for (const token of defaultTokens) {
      await prisma.tokenMetadata.upsert({
        where: { mint: token.mint },
        update: token,
        create: token,
      })
    }
    logger.info(`Seeded ${defaultTokens.length} tokens`)

    // Seed routes
    for (const route of defaultRoutes) {
      await prisma.route.upsert({
        where: { name: route.name },
        update: route,
        create: route,
      })
    }
    logger.info(`Seeded ${defaultRoutes.length} routes`)

    logger.info('Database seeding completed successfully')
  } catch (error) {
    logger.error('Database seeding failed', error)
    throw error
  }
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(async () => {
    await prisma.$disconnect()
  })