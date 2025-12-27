import { Connection, PublicKey, Transaction, SystemProgram, TransactionInstruction } from '@solana/web3.js'
import { AnchorProvider, Wallet } from '@coral-xyz/anchor'
import { createHash } from 'crypto'

// WaveStake Program ID (Deployed to Devnet)
export const WAVE_STAKE_PROGRAM_ID = new PublicKey('5fJF7FV29wZG6Azg1GLesEQVnGFdWHkFiauBaLCkqFZJ')

// PDAs
export function getGlobalStatePDA(): [PublicKey, number] {
  return PublicKey.findProgramAddressSync(
    [Buffer.from('global')],
    WAVE_STAKE_PROGRAM_ID
  )
}

export function getPoolPDA(poolId: string): [PublicKey, number] {
  const poolIdBuffer = Buffer.alloc(32)
  Buffer.from(poolId).copy(poolIdBuffer)
  return PublicKey.findProgramAddressSync(
    [Buffer.from('pool'), poolIdBuffer],
    WAVE_STAKE_PROGRAM_ID
  )
}

export function getUserPDA(poolId: string, user: PublicKey): [PublicKey, number] {
  const poolIdBuffer = Buffer.alloc(32)
  Buffer.from(poolId).copy(poolIdBuffer)
  return PublicKey.findProgramAddressSync(
    [Buffer.from('user'), poolIdBuffer, user.toBuffer()],
    WAVE_STAKE_PROGRAM_ID
  )
}

// Lock types
export enum LockType {
  FLEXIBLE = 0,
  LOCKED_30_DAYS = 1,
}

// Helper to create instruction discriminator (8 bytes)
function createDiscriminator(name: string): Buffer {
  const preimage = `global:${name}`
  return createHash('sha256').update(preimage).digest().slice(0, 8)
}

// Helper to encode public key
function encodePublicKey(pubkey: PublicKey): Buffer {
  return Buffer.from(pubkey.toBytes())
}

// Helper to encode u64
function encodeU64(value: number | bigint): Buffer {
  const buf = Buffer.alloc(8)
  const bigValue = BigInt(value)

  // Write little-endian 64-bit unsigned integer
  buf[0] = Number(bigValue & 0xffn)
  buf[1] = Number((bigValue >> 8n) & 0xffn)
  buf[2] = Number((bigValue >> 16n) & 0xffn)
  buf[3] = Number((bigValue >> 24n) & 0xffn)
  buf[4] = Number((bigValue >> 32n) & 0xffn)
  buf[5] = Number((bigValue >> 40n) & 0xffn)
  buf[6] = Number((bigValue >> 48n) & 0xffn)
  buf[7] = Number((bigValue >> 56n) & 0xffn)

  return buf
}

// Helper to encode u16
function encodeU16(value: number): Buffer {
  const buf = Buffer.alloc(2)

  // Write little-endian 16-bit unsigned integer
  buf[0] = value & 0xff
  buf[1] = (value >> 8) & 0xff

  return buf
}

// Helper to encode u8
function encodeU8(value: number): Buffer {
  return Buffer.from([value])
}

// Helper to encode pool ID (32 bytes)
function encodePoolId(poolId: string): Buffer {
  const buf = Buffer.alloc(32)
  Buffer.from(poolId).copy(buf)
  return buf
}

export class WaveStakeClient {
  private connection: Connection
  private provider: AnchorProvider | null = null

  constructor(connection: Connection) {
    this.connection = connection
  }

  setProvider(wallet: Wallet) {
    try {
      console.log('[WaveStake] Initializing provider with wallet:', wallet.publicKey?.toString())

      this.provider = new AnchorProvider(this.connection, wallet, {
        commitment: 'confirmed',
        preflightCommitment: 'confirmed'
      })

      console.log('[WaveStake] Provider initialized successfully (using manual transaction building)')
    } catch (error) {
      console.error('[WaveStake] Error setting provider:', error)
      throw new Error(`Failed to initialize WaveStake provider: ${error instanceof Error ? error.message : 'Unknown error'}`)
    }
  }

  private ensureProvider(): AnchorProvider {
    if (!this.provider) {
      throw new Error('Provider not initialized. Call setProvider() first.')
    }
    return this.provider
  }

  getProgramId(): PublicKey {
    return WAVE_STAKE_PROGRAM_ID
  }

  async initializeGlobalState(authority: PublicKey): Promise<Transaction> {
    const provider = this.ensureProvider()
    const [globalState] = getGlobalStatePDA()

    // Build instruction data
    const data = Buffer.concat([
      createDiscriminator('initialize'),
      encodePublicKey(authority),
    ])

    const ix = new TransactionInstruction({
      keys: [
        { pubkey: globalState, isSigner: false, isWritable: true },
        { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: WAVE_STAKE_PROGRAM_ID,
      data,
    })

    return new Transaction().add(ix)
  }

  async createPool(params: {
    poolId: string
    stakeMint: PublicKey
    lstMint: PublicKey
    rewardMint: PublicKey
    rewardPerSecond: number
    lockDuration: number
    lockBonusPercentage: number
  }): Promise<Transaction> {
    const provider = this.ensureProvider()
    const [globalState] = getGlobalStatePDA()
    const [pool] = getPoolPDA(params.poolId)

    // Build instruction data
    const data = Buffer.concat([
      createDiscriminator('createPool'),
      encodePoolId(params.poolId),
      encodePublicKey(params.stakeMint),
      encodePublicKey(params.lstMint),
      encodePublicKey(params.rewardMint),
      encodeU64(params.rewardPerSecond),
      encodeU64(params.lockDuration),
      encodeU16(params.lockBonusPercentage),
    ])

    const ix = new TransactionInstruction({
      keys: [
        { pubkey: globalState, isSigner: false, isWritable: true },
        { pubkey: pool, isSigner: false, isWritable: true },
        { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: false },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: WAVE_STAKE_PROGRAM_ID,
      data,
    })

    return new Transaction().add(ix)
  }

  async stake(poolId: string, amount: number, lockType: LockType): Promise<Transaction> {
    const provider = this.ensureProvider()
    const [pool] = getPoolPDA(poolId)
    const [user] = getUserPDA(poolId, provider.wallet.publicKey)

    // Build instruction data
    const data = Buffer.concat([
      createDiscriminator('stake'),
      encodeU64(amount),
      encodeU8(lockType),
    ])

    const ix = new TransactionInstruction({
      keys: [
        { pubkey: pool, isSigner: false, isWritable: true },
        { pubkey: user, isSigner: false, isWritable: true },
        { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: true },
        { pubkey: SystemProgram.programId, isSigner: false, isWritable: false },
      ],
      programId: WAVE_STAKE_PROGRAM_ID,
      data,
    })

    return new Transaction().add(ix)
  }

  async unstake(poolId: string, amount: number): Promise<Transaction> {
    const provider = this.ensureProvider()
    const [pool] = getPoolPDA(poolId)
    const [user] = getUserPDA(poolId, provider.wallet.publicKey)

    // Build instruction data
    const data = Buffer.concat([
      createDiscriminator('unstake'),
      encodeU64(amount),
    ])

    const ix = new TransactionInstruction({
      keys: [
        { pubkey: pool, isSigner: false, isWritable: true },
        { pubkey: user, isSigner: false, isWritable: true },
        { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: false },
      ],
      programId: WAVE_STAKE_PROGRAM_ID,
      data,
    })

    return new Transaction().add(ix)
  }

  async claimRewards(poolId: string): Promise<Transaction> {
    const provider = this.ensureProvider()
    const [pool] = getPoolPDA(poolId)
    const [user] = getUserPDA(poolId, provider.wallet.publicKey)

    // Build instruction data (no args)
    const data = createDiscriminator('claimRewards')

    const ix = new TransactionInstruction({
      keys: [
        { pubkey: pool, isSigner: false, isWritable: true },
        { pubkey: user, isSigner: false, isWritable: true },
        { pubkey: provider.wallet.publicKey, isSigner: true, isWritable: false },
      ],
      programId: WAVE_STAKE_PROGRAM_ID,
      data,
    })

    return new Transaction().add(ix)
  }

  // Note: updatePool, closeUserAccount, and fetch methods removed since they require Program class
  // These can be added later if needed using manual account deserialization

  async fetchPool(poolId: string): Promise<any> {
    // For now, return null. Account deserialization requires the Program class
    // or manual Borsh deserialization which is complex
    console.log('[WaveStake] fetchPool called - returning null (needs implementation)')
    return null
  }

  async fetchUserStake(poolId: string): Promise<any> {
    // For now, return null. Account deserialization requires the Program class
    // or manual Borsh deserialization which is complex
    console.log('[WaveStake] fetchUserStake called - returning null (needs implementation)')
    return null
  }

  async fetchGlobalState(): Promise<any> {
    // For now, return null. Account deserialization requires the Program class
    // or manual Borsh deserialization which is complex
    console.log('[WaveStake] fetchGlobalState called - returning null (needs implementation)')
    return null
  }
}

// Export singleton instance
export const waveStakeClient = new WaveStakeClient(
  new Connection(process.env.NEXT_PUBLIC_HELIUS_RPC_URL || 'https://api.devnet.solana.com')
)
