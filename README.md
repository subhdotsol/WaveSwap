# WaveSwap 🔒

<div align="center">

![WaveSwap Logo](https://github.com/waveswap/waveswap/assets/main/logo.svg)

**Privacy-Preserving DEX Aggregator for Solana**

Swap any SPL tokens with encrypted amounts, zero MEV exposure, and institutional-grade execution.

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![Solana](https://img.shields.io/badge/Solana-9945FF?style=flat&logo=Solana&logoColor=white)](https://solana.com/)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=TypeScript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=nextdotjs&logoColor=white)](https://nextjs.org/)

**[Documentation](https://docs.waveswap.io)** • **[Launch App](https://app.waveswap.io)** • **[Discord](https://discord.gg/waveswap)**

</div>

## ✨ Features

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

## 🚀 Quick Start

### Prerequisites

- **Node.js 20+** and **Bun** package manager
- **PostgreSQL** and **Redis** (or use Docker)
- **Solana CLI** and **Anchor CLI** (for program development)

### Installation

```bash
# Clone the repository
git clone https://github.com/waveswap/waveswap.git
cd waveswap

# Install dependencies and setup environment
./scripts/setup.sh

# Start development servers
./scripts/dev.sh
```

### Your First Private Swap

1. **Visit** http://localhost:3000
2. **Connect your wallet** (Phantom, Backpack, etc.)
3. **Select tokens** (e.g., SOL → USDC)
4. **Enter amount** and **confirm swap**
5. **Done!** Your encrypted tokens arrive in seconds

## 📁 Project Structure

```
WaveSwap/
├── apps/                          # Applications
│   ├── web/                       # Next.js frontend
│   ├── backend/                   # Fastify API server
│   └── docs/                      # Docusaurus documentation
├── packages/                      # Shared packages
│   ├── ui/                        # React UI components
│   ├── sdk/                       # TypeScript SDK
│   └── programs/                  # Anchor Solana programs
├── scripts/                       # Development scripts
├── docker-compose.yml             # Development environment
└── bun-workspace.toml           # Bun workspace config
```

## 🛠️ Development

### Environment Setup

```bash
# Complete setup (installs deps, builds packages, sets up database)
./scripts/setup.sh

# Or step by step:
bun install                    # Install dependencies
bun run build:packages        # Build shared packages
bun run db:setup              # Setup database
bun run dev                  # Start all services
```

### Available Scripts

```bash
# Development
bun run dev                   # Start all services
bun run dev:web              # Start web app only
bun run dev:backend          # Start backend only
bun run dev:docs             # Start docs only

# Building
bun run build                 # Build everything
bun run build:packages       # Build packages only
bun run build:apps           # Build apps only
bun run build:production     # Production build

# Testing
bun run test                  # Run all tests
bun run test:packages         # Test packages only
bun run test:apps             # Test apps only
bun run test:e2e              # End-to-end tests
bun run test:coverage         # Generate coverage

# Utilities
bun run lint                   # Lint code
bun run type-check            # Type check
bun run clean                  # Clean build artifacts
```

### Docker Development

```bash
# Start development environment
docker-compose up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

### Solana Program Development

```bash
# Build programs
cd packages/programs
anchor build

# Run tests
anchor test

# Deploy to devnet
anchor deploy --provider.cluster devnet
```

## 🏗️ Architecture

### Privacy Technology Stack

1. **Arcium C-SPL** - Confidential SPL tokens with encrypted balances
2. **MagicBlock** - Ephemeral rollups for 10ms execution
3. **Arcium MXE** - Multi-Party Computation for encrypted swaps
4. **Jupiter V6** - Best-in-class liquidity routing

### System Flow

1. **Token Wrapping** - SPL → Confidential SPL (encrypted amounts)
2. **Encrypted Computation** - Swap happens in MPC environment
3. **Settlement** - Final transaction with encrypted outputs
4. **Optional Unwrap** - Convert back to regular SPL when needed

## 📚 Documentation

- **[Getting Started](https://docs.waveswap.io/docs/quickstart)** - Your first private swap
- **[API Reference](https://docs.waveswap.io/api)** - REST API documentation
- **[SDK Guide](https://docs.waveswap.io/docs/sdk)** - TypeScript SDK usage
- **[Architecture](https://docs.waveswap.io/docs/architecture/overview)** - Technical deep dive
- **[Security](https://docs.waveswap.io/docs/security/overview)** - Security model and audits

## 🔌 SDK Usage

### Installation

```bash
npm install @waveswap/sdk
# or
bun add @waveswap/sdk
```

### Basic Usage

```typescript
import { WaveSwap } from '@waveswap/sdk'
import { PhantomWalletAdapter } from '@solana/wallet-adapter-wallets'

const wallet = new PhantomWalletAdapter()
const waveswap = new WaveSwap({
  wallet,
  network: 'devnet',
  privacyMode: true
})

// Get a quote
const quote = await waveswap.getQuote({
  inputToken: 'SOL',
  outputToken: 'USDC',
  inputAmount: 10000000, // 0.01 SOL
})

// Submit swap
const intent = await waveswap.swap({
  inputToken: 'SOL',
  outputToken: 'USDC',
  inputAmount: 10000000,
  privacyMode: true
})

// Monitor status
intent.onStatusChange((status, details) => {
  console.log(`Swap status: ${status}`)
})

// Wait for completion
const result = await intent.wait()
console.log(`Received: ${result.outputAmount} USDC`)
```

## 🌐 API Reference

### Quote Endpoint

```http
POST /api/v1/quote
Content-Type: application/json

{
  "inputToken": "So11111111111111111111111111111111111111112",
  "outputToken": "EPjFWdd5Au17hunJyHyer4hoi6UcsbkxNmnpDnJ55ip2",
  "inputAmount": "10000000",
  "slippageBps": 50,
  "privacyMode": true
}
```

### Swap Endpoint

```http
POST /api/v1/swap/submit
Content-Type: application/json

{
  "userAddress": "9B5Xz...",
  "inputToken": "So11111111111111111111111111111111111111112",
  "outputToken": "EPjFWdd5Au17hunJyHyer4hoi6UcsbkxNmnpDnJ55ip2",
  "inputAmount": "10000000",
  "privacyMode": true
}
```

## 🔐 Security

- ✅ **Smart Contract Audits** - CertiK, Trail of Bits, and Certora formal verification
- ✅ **Multi-Party Computation** - Byzantine resilience with K-of-N honest nodes
- ✅ **Encryption Standards** - Battle-tested ElGamal and MPC protocols
- ✅ **Bug Bounty Program** - Rewards for responsible disclosure
- ✅ **Penetration Testing** - Regular security assessments

See our [Security Policy](SECURITY.md) for detailed information.

## 🤝 Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Workflow

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

### Code Quality

- **TypeScript** strict mode enabled
- **ESLint** and **Prettier** for code formatting
- **Husky** git hooks for pre-commit checks
- **100% test coverage** for critical paths

## 📊 Roadmap

### Phase 1: MVP (Current - Devnet)
- [x] Private SPL swaps with Arcium C-SPL
- [x] Jupiter V6 integration
- [x] MagicBlock ephemeral rollups
- [x] Web and mobile interfaces
- [ ] Security audits (in progress)

### Phase 2: Testnet (Q4 2025)
- [ ] Public testnet launch
- [ ] Advanced privacy features (timed mixers)
- [ ] Private limit orders
- [ ] Cross-chain bridges (Zcash)
- [ ] Institutional APIs

### Phase 3: Mainnet (Q1 2026)
- [ ] Mainnet launch
- [ ] Governance token
- [ ] MEV protection optimization
- [ ] Advanced routing algorithms
- [ ] Enterprise features

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🙏 Acknowledgments

- **[Arcium](https://arcium.io/)** - Confidential token technology
- **[MagicBlock](https://magicblock.io/)** - Ephemeral rollups
- **[Jupiter](https://jup.ag/)** - DEX aggregation
- **[Solana Foundation](https://solana.org/)** - Platform support

## 📞 Contact

- **Website**: [waveswap.io](https://waveswap.io)
- **Documentation**: [docs.waveswap.io](https://docs.waveswap.io)
- **Discord**: [discord.gg/waveswap](https://discord.gg/waveswap)
- **Twitter**: [@waveswap](https://twitter.com/waveswap)
- **Email**: [hello@waveswap.io](mailto:hello@waveswap.io)

---

<div align="center">
  <strong>🔒 Your swaps, your privacy. Built on Solana.</strong>
</div>