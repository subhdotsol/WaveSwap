#!/usr/bin/env node

/**
 * Simple script to check wallet balance and detect potential Encifher deposits
 * Usage: node scripts/check-wallet-balances.js
 */

const { Connection, PublicKey, ParsedAccountData } = require('@solana/web3.js')

// Your wallet address
const WALLET_ADDRESS = 'vivgdu332GMEk3FaupQa92gQjYd9LX6TMgjMVsLaCu4'

// Common token mint addresses to check
const TOKEN_MINTS = {
  'So11111111111111111111111111111111111111112': 'SOL (Wrapped)',
  'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v': 'USDC',
  'Es9vMFrzaCERmJfrF4H2FYD4KCoNkY11McCe8BenwNYB': 'USDT',
  '4k3Dyjzvzp8eMZWUXbBCjEvwSkkk59S5iCNLY3QrkX6R': 'RAY',
  'orcaEKTdK7LKz57vaAYr9QeNsVEPfiu6QeMU1kektZE': 'ORCA',
  'DezXAZ8z7PnrnRJjz3wXBoRgixCa6xjnB7YaB1pPB263': 'BONK',
  'mSoLzYCxHdYgdzU16g5QSh3i5K3z3KZK7ytfqcJm7So': 'Marinade SOL'
}

async function checkWalletBalances() {
  console.log('🔍 Checking wallet balances for:', WALLET_ADDRESS)
  console.log('=' .repeat(60))

  try {
    // Initialize connection to Solana mainnet
    const connection = new Connection('https://api.mainnet-beta.solana.com')
    const walletPubkey = new PublicKey(WALLET_ADDRESS)

    // Check SOL balance
    const solBalance = await connection.getBalance(walletPubkey)
    const solBalanceSol = solBalance / 1e9
    console.log(`💰 SOL Balance: ${solBalanceSol.toFixed(9)} SOL`)

    // Check token accounts
    console.log('\n🪙 Token Accounts:')
    const tokenAccounts = await connection.getParsedTokenAccountsByOwner(
      walletPubkey,
      { programId: new PublicKey('TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA') }
    )

    let totalTokenValue = 0
    const foundTokens = []

    for (const account of tokenAccounts.value) {
      const parsedData = account.account.data.parsed
      if (parsedData.info && parsedData.info.mint) {
        const mint = parsedData.info.mint
        const amount = parsedData.info.tokenAmount.uiAmount || 0
        const decimals = parsedData.info.tokenAmount.decimals

        if (amount > 0) {
          const tokenName = TOKEN_MINTS[mint] || `Unknown (${mint.slice(0, 8)}...)`
          console.log(`  • ${tokenName}: ${amount}`)

          foundTokens.push({
            mint,
            name: tokenName,
            amount,
            decimals,
            account: account.pubkey.toString()
          })

          // Rough value calculation (this is just for reference)
          if (mint === 'So11111111111111111111111111111111111111112') {
            totalTokenValue += amount
          }
        }
      }
    }

    console.log('\n📊 Summary:')
    console.log(`  • Total token accounts with balance: ${foundTokens.length}`)
    console.log(`  • Total SOL value: ${totalTokenValue.toFixed(9)} SOL`)

    if (foundTokens.length > 0) {
      console.log('\n🎯 Tokens found in wallet:')
      foundTokens.forEach(token => {
        console.log(`  - ${token.name}: ${token.amount}`)
      })
    } else {
      console.log('\n⚠️  No tokens found in wallet!')
      console.log('   This could mean:')
      console.log('   - Tokens were deposited to Encifher (good - they are safe)')
      console.log('   - Tokens were sent elsewhere')
      console.log('   - Wallet never had the tokens')
    }

    console.log('\n🔎 Next Steps:')
    console.log('1. Check transaction history on Solscan: https://solscan.io/account/' + WALLET_ADDRESS)
    console.log('2. Look for large outbound transfers that might be Encifher deposits')
    console.log('3. Try the authentication in the app to see if tokens are in Encifher')

  } catch (error) {
    console.error('❌ Error checking wallet:', error.message)
  }
}

// Run the check
checkWalletBalances()