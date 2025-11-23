---
title: Quick Start
sidebar_label: Quick Start
---

# Quick Start

Get started with WaveSwap in under 5 minutes. This guide will walk you through your first private swap on Solana.

## Prerequisites

Before you begin, make sure you have:

- A **Solana wallet** (Phantom, Backpack, Nightly, or Magic)
- Some **SOL** for gas fees
- **SPL tokens** to swap (USDC, USDT, BONK, etc.)

## Step 1: Connect Your Wallet

1. Visit **[app.waveswap.io](https://app.waveswap.io)**
2. Click **"Connect Wallet"** in the top right
3. Choose your wallet provider
4. Approve the connection request

<div className="privacy-badge">
  <FaShieldAlt /> Your wallet address is the only visible information
</div>

## Step 2: Select Your Swap

1. **Choose input token** - Select the token you want to sell
2. **Enter amount** - Type or use the slider
3. **Choose output token** - Select the token you want to buy
4. **Review quote** - Check the exchange rate and fees

### Understanding the Quote

```
You send: 10 SOL
You receive: ~36,792 USDC
Price Impact: 0.08%
Fee (0.35%): 129.68 USDC
Privacy: 🔒 ENABLED (amounts encrypted)
```

- **Base Fee**: 0.25% - Standard DEX aggregation fee
- **Privacy Fee**: 0.1% - Additional fee for encryption and privacy
- **Total Fee**: 0.35% - Competitive with other DEX aggregators

## Step 3: Confirm Your Swap

1. **Review the details** - Double-check amounts and tokens
2. **Set slippage** - Adjust if needed (default: 0.5%)
3. **Click "Swap Privately"** - Privacy is enabled by default
4. **Sign the transaction** - One signature, no approvals needed

## Step 4: Wait for Execution

Your private swap typically completes in **3-5 seconds**:

1. **Token Wrapping** (~500ms) - SPL → Confidential SPL
2. **Encrypted Computation** (~3 seconds) - MPC processing
3. **Settlement** (~1 second) - Final transaction on Solana

### What Happens Behind the Scenes

- Your input tokens are automatically wrapped to **confidential SPL**
- The swap is executed in **Arcium's MPC environment**
- Output amounts are **encrypted** and only visible to you
- Final transaction settles on **Solana mainnet**

## Step 5: Receive Your Tokens

Once complete:

1. **Check your wallet** - You'll receive encrypted tokens
2. **View balance** - Amounts show as "encrypted"
3. **Unwrap anytime** - Convert back to regular SPL if needed
4. **Keep private** - Or maintain privacy indefinitely

## Advanced Features

### Custom Slippage

Adjust slippage tolerance for different market conditions:

- **Conservative**: 0.1% - Less chance of failure
- **Standard**: 0.5% - Recommended default
- **Aggressive**: 1.0% - Higher chance of success

### Multiple Swaps

WaveSwap supports concurrent swaps:

```bash
# Example: Swap SOL → USDC and USDT → BONK simultaneously
# Both swaps remain private from each other
```

### API Access

For developers and institutional users:

```typescript
import { WaveSwap } from '@waveswap/sdk'

const waveswap = new WaveSwap({
  wallet: phantomWallet,
  network: 'mainnet-beta',
  privacyMode: true
})

const quote = await waveswap.getQuote({
  inputToken: 'SOL',
  outputToken: 'USDC',
  inputAmount: 10000000 // 0.01 SOL
})
```

## Security Tips

### ✅ Do

- **Verify URLs** - Always use `app.waveswap.io`
- **Check amounts** - Double-check before confirming
- **Keep wallet secure** - Use hardware wallets for large amounts
- **Save transaction IDs** - For future reference

### ❌ Don't

- **Share private keys** - Never give anyone your wallet seed
- **Click suspicious links** - Always verify the domain
- **Ignore warnings** - Pay attention to browser security alerts
- **Rush transactions** - Take time to verify details

## Troubleshooting

### Common Issues

**Transaction failed:**
- Check if you have enough SOL for gas fees
- Verify token balances in your wallet
- Try adjusting slippage tolerance

**Swap is taking too long:**
- Network congestion may cause delays
- Privacy swaps take slightly longer than public swaps
- Check transaction status in the interface

**Can't see tokens:**
- Refresh your wallet balance
- Check if tokens need to be added to your wallet
- Verify you're on the correct network (devnet/testnet/mainnet)

### Getting Help

If you encounter issues:

1. **Check [Status Page](https://status.waveswap.io)** - Real-time system status
2. **Join [Discord](https://discord.gg/waveswap)** - Community support
3. **Browse [Issues](https://github.com/waveswap/waveswap/issues)** - Known problems
4. **Contact Support** - help@waveswap.io

## Next Steps

Now that you've completed your first private swap:

- 📖 **[Privacy Model](/docs/privacy-model)** - Learn how privacy works
- 🏗️ **[Architecture](/docs/architecture/overview)** - Understand the technical design
- 🛠️ **[API Reference](/api)** - Integrate WaveSwap into your applications
- 🔒 **[Security](/docs/security/overview)** - Learn about security measures

<div className="security-indicator">
  Your first private swap is complete! Welcome to the future of DeFi privacy.
</div>