---
title: Introduction
sidebar_label: Introduction
---

import { FaShieldAlt, FaExchangeAlt, FaLock, FaRocket } from 'react-icons/fa'

# Welcome to WaveSwap

WaveSwap is a **privacy-preserving DEX aggregator** for Solana that enables users to swap any SPL tokens with **encrypted amounts**, **zero MEV exposure**, and **institutional-grade execution**.

<div className="hero">
  <h1 className="hero__title">Swap Privately on Solana</h1>
  <p className="hero__subtitle">
    Exchange any SPL tokens with encrypted amounts using Arcium C-SPL technology and MagicBlock ephemeral rollups
  </p>
  <div className="hero__buttons">
    <a href="/docs/quickstart" className="button button--primary button--lg">
      Get Started
    </a>
    <a href="https://app.waveswap.io" className="button button--secondary button--lg" target="_blank" rel="noopener noreferrer">
      Launch App
    </a>
  </div>
</div>

## Core Features

### 🔒 Privacy by Default
- **Encrypted swap amounts** using Arcium C-SPL technology
- **MEV protection** - bots cannot see your trade amounts
- **Zero-knowledge** - amounts are only visible to you
- **No opt-in required** - privacy is automatic

### ⚡ Lightning Fast
- **Sub-second execution** with MagicBlock ephemeral rollups
- **Real-time quotes** from Jupiter V6 API
- **Best price routing** across all major Solana DEXs
- **One-click transactions** - no approve → swap dance

### 🏢 Institution Ready
- **Bulk operations** for treasury management
- **Audit trails** with selective disclosure
- **API access** for algorithmic trading
- **Regulatory compliance** features

## How It Works

1. **Select Tokens** - Choose any SPL tokens to swap
2. **Get Quote** - Real-time pricing with privacy fee included
3. **Confirm Swap** - Sign once, no complex approvals needed
4. **Automatic Encryption** - Input tokens are wrapped to confidential SPL
5. **Private Execution** - Swap happens in encrypted environment
6. **Receive Output** - Get encrypted tokens, unwrap when needed

### The Privacy Advantage

Traditional DEXs expose your trading information:

| Feature | Traditional DEX | WaveSwap |
|---------|----------------|----------|
| Trade Amounts | 🔓 Visible | 🔒 Encrypted |
| MEV Exposure | 🔴 High | 🟢 None |
| Price Impact | 📈 Transparent | 🔒 Hidden |
| Trade History | 🔍 Public | 👤 Private |
| Required Action | 💱 Complex | ✅ One-click |

## Architecture Overview

WaveSwap leverages cutting-edge privacy technologies:

- **Arcium C-SPL** - Confidential SPL tokens with encrypted balances
- **MagicBlock** - Ephemeral rollups for 10ms execution
- **Arcium MXE** - Multi-Party Computation for encrypted swaps
- **Jupiter V6** - Best-in-class liquidity routing

<div className="feature-grid">
  <div className="feature-card">
    <div className="feature-card__icon">
      <FaShieldAlt />
    </div>
    <h3 className="feature-card__title">Multi-Party Computation</h3>
    <p className="feature-card__description">
      Your swap is computed across multiple secure nodes without any single party seeing your amounts
    </p>
  </div>
  <div className="feature-card">
    <div className="feature-card__icon">
      <FaExchangeAlt />
    </div>
    <h3 className="feature-card__title">Best Price Routing</h3>
    <p className="feature-card__description">
      Aggregated liquidity from all major Solana DEXs ensures competitive pricing
    </p>
  </div>
  <div className="feature-card">
    <div className="feature-card__icon">
      <FaLock />
    </div>
    <h3 className="feature-card__title">Confidential Tokens</h3>
    <p className="feature-card__description">
      Arcium's C-SPL technology encrypts token amounts while maintaining full compatibility
    </p>
  </div>
  <div className="feature-card">
    <div className="feature-card__icon">
      <FaRocket />
    </div>
    <h3 className="feature-card__title">Ephemeral Execution</h3>
    <p className="feature-card__description">
      MagicBlock's fast execution layer processes swaps in milliseconds with finality on Solana
    </p>
  </div>
</div>

## Quick Start

Ready to start swapping privately?

1. **Connect your wallet** - Phantom, Backpack, or other Solana wallets
2. **Select tokens** - Choose input and output tokens
3. **Confirm swap** - Privacy is enabled by default
4. **Done!** - Your encrypted tokens arrive in seconds

<a href="/docs/quickstart" className="button button--primary button--lg">
  Start Your First Private Swap →
</a>

## Token Support

WaveSwap supports all major SPL tokens:

<div className="privacy-badge">SOL</div>
<div className="privacy-badge">USDC</div>
<div className="privacy-badge">USDT</div>
<div className="privacy-badge">BONK</div>
<div className="privacy-badge">And thousands more...</div>

## Development Status

- ✅ **Devnet Live** - Full functionality on Solana devnet
- 🚧 **Security Audits** - CertiK, Trail of Bits audits in progress
- 🔄 **Testnet Launch** - Coming Q4 2025
- 🎯 **Mainnet Launch** - Expected Q1 2026

## Community

Join our growing community:

- **[Discord](https://discord.gg/waveswap)** - Chat with the team and community
- **[Twitter](https://twitter.com/waveswap)** - Latest updates and announcements
- **[Telegram](https://t.me/waveswap)** - Community discussions
- **[GitHub](https://github.com/waveswap/waveswap)** - Open source development

---

<div className="security-indicator">
  Security & Privacy First
</div>

WaveSwap is built with security and privacy as our highest priorities. All smart contracts undergo rigorous audits, and our privacy model is based on battle-tested cryptographic primitives.