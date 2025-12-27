/**
 * Setup Script for WaveStake Pools on Devnet
 *
 * This script will:
 * 1. Initialize the global state
 * 2. Create pools for WAVE, WEALTH, and SOL
 *
 * Run with: npx tsx scripts/setup-staking-pools.ts
 */

import { Connection, Keypair, PublicKey } from '@solana/web3.js'
import { AnchorProvider, Wallet, Program, Idl } from '@coral-xyz/anchor'
import WAVE_STAKE_IDL from '../apps/web/src/idl/wave_stake.json'

// Program ID
const PROGRAM_ID = new PublicKey('5fJF7FV29wZG6Azg1GLesEQVnGFdWHkFiauBaLCkqFZJ')

// Devnet RPC
const RPC_URL = process.env.RPC_URL || 'https://api.devnet.solana.com'

// Pool configurations
const POOLS = [
  {
    poolId: 'wave',
    stakeMint: new PublicKey('4AGxpKxYnw7g1ofvYDs5Jq2a1ek5kB9jS2NTUaippump'), // WAVE token
    lstMint: new PublicKey('So11111111111111111111111111111111111111112'), // Using SOL as LST for now
    rewardMint: new PublicKey('4AGxpKxYnw7g1ofvYDs5Jq2a1ek5kB9jS2NTUaippump'), // WAVE as reward
    rewardPerSecond: 1000000, // 1 WAVE per second (scaled by 1e6)
    lockDuration: 2592000, // 30 days in seconds
    lockBonusPercentage: 5000, // 50% bonus (scaled by 100)
  },
  {
    poolId: 'wealth',
    stakeMint: new PublicKey('BSxPC3Vu3X6UCtEEAYyhxAEo3rvtS4dgzzrvnERDpump'), // WEALTH token
    lstMint: new PublicKey('So11111111111111111111111111111111111111112'), // Using SOL as LST for now
    rewardMint: new PublicKey('BSxPC3Vu3X6UCtEEAYyhxAEo3rvtS4dgzzrvnERDpump'), // WEALTH as reward
    rewardPerSecond: 1000000, // 1 WEALTH per second
    lockDuration: 2592000, // 30 days
    lockBonusPercentage: 5000, // 50% bonus
  },
  {
    poolId: 'sol',
    stakeMint: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
    lstMint: new PublicKey('So11111111111111111111111111111111111111112'), // SOL
    rewardMint: new PublicKey('So11111111111111111111111111111111111111112'), // SOL as reward
    rewardPerSecond: 1000000, // 1 lamport per second (0.000001 SOL)
    lockDuration: 2592000, // 30 days
    lockBonusPercentage: 5000, // 50% bonus
  },
]

async function setupPools() {
  console.log('🚀 Starting WaveStake Pool Setup on Devnet\n')

  // Connect to devnet
  const connection = new Connection(RPC_URL, 'confirmed')
  console.log(`✅ Connected to ${RPC_URL}`)

  // Load authority keypair from file or environment
  let authority: Keypair

  // Check for authority keypair file
  const fs = require('fs')
  const keypairPath = process.env.AUTHORITY_KEYPAIR_PATH || './authority-keypair.json'

  if (fs.existsSync(keypairPath)) {
    const keypairData = JSON.parse(fs.readFileSync(keypairPath, 'utf-8'))
    authority = Keypair.fromSecretKey(Uint8Array.from(keypairData))
    console.log(`✅ Loaded authority keypair from ${keypairPath}`)
  } else {
    console.log('❌ Authority keypair not found!')
    console.log(`\nPlease create an authority keypair at: ${keypairPath}`)
    console.log('You can generate one with: solana-keygen new --outfile ${keypairPath}\n')
    process.exit(1)
  }

  console.log(`Authority: ${authority.publicKey.toString()}\n`)

  // Create provider
  const provider = new AnchorProvider(
    connection,
    new Wallet(authority),
    { commitment: 'confirmed' }
  )

  // Create program instance
  const program = new Program<Idl>(
    WAVE_STAKE_IDL as Idl,
    PROGRAM_ID,
    provider
  )

  console.log('Program ID:', PROGRAM_ID.toString())
  console.log('')

  // PDAs
  const [globalState] = PublicKey.findProgramAddressSync(
    [Buffer.from('global')],
    PROGRAM_ID
  )

  try {
    // Step 1: Initialize Global State
    console.log('📝 Step 1: Initializing Global State...')

    try {
      const tx = await program.methods
        .initialize(authority.publicKey)
        .accounts({
          globalState,
          payer: authority.publicKey,
        })
        .rpc()

      console.log(`✅ Global state initialized!`)
      console.log(`   Transaction: ${tx}\n`)
    } catch (error: any) {
      if (error.toString().includes('already in use')) {
        console.log('⚠️  Global state already initialized\n')
      } else {
        throw error
      }
    }

    // Step 2: Create Pools
    for (const pool of POOLS) {
      console.log(`📝 Creating pool: ${pool.poolId.toUpperCase()}`)

      // Derive pool PDA
      const poolIdBytes = Array.from(Buffer.alloc(32))
      Buffer.from(pool.poolId).copy(Buffer.from(poolIdBytes))

      const [poolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('pool'), Buffer.from(poolIdBytes)],
        PROGRAM_ID
      )

      try {
        const tx = await program.methods
          .createPool(
            poolIdBytes,
            pool.stakeMint,
            pool.lstMint,
            pool.rewardMint,
            pool.rewardPerSecond,
            pool.lockDuration,
            pool.lockBonusPercentage
          )
          .accounts({
            globalState,
            pool: poolPda,
            payer: authority.publicKey,
            authority: authority.publicKey,
          })
          .rpc()

        console.log(`✅ Pool ${pool.poolId.toUpperCase()} created!`)
        console.log(`   Pool Address: ${poolPda.toString()}`)
        console.log(`   Transaction: ${tx}\n`)
      } catch (error: any) {
        if (error.toString().includes('already in use')) {
          console.log(`⚠️  Pool ${pool.poolId.toUpperCase()} already exists\n`)
        } else {
          console.error(`❌ Error creating pool ${pool.poolId}:`, error.message)
          console.log('')
        }
      }
    }

    console.log('🎉 Pool setup complete!')
    console.log('\n📊 Pool Summary:')
    console.log('─'.repeat(50))

    for (const pool of POOLS) {
      const poolIdBytes = Array.from(Buffer.alloc(32))
      Buffer.from(pool.poolId).copy(Buffer.from(poolIdBytes))

      const [poolPda] = PublicKey.findProgramAddressSync(
        [Buffer.from('pool'), Buffer.from(poolIdBytes)],
        PROGRAM_ID
      )

      console.log(`${pool.poolId.toUpperCase()}:`)
      console.log(`  Address: ${poolPda.toString()}`)
      console.log(`  Stake Mint: ${pool.stakeMint.toString()}`)
      console.log(`  Reward: ${pool.rewardPerSecond / 1e6} per second`)
      console.log(`  Lock Duration: ${pool.lockDuration / 86400} days`)
      console.log(`  Bonus: ${pool.lockBonusPercentage / 100}%`)
      console.log('')
    }

    console.log('✨ You can now use the WaveStake frontend!')

  } catch (error) {
    console.error('❌ Error during setup:', error)
    process.exit(1)
  }
}

// Run the setup
setupPools()
  .then(() => {
    console.log('\n✅ Setup completed successfully!')
    process.exit(0)
  })
  .catch((error) => {
    console.error('\n❌ Setup failed:', error)
    process.exit(1)
  })
