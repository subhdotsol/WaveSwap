// StarkNet Wallet Integration Service for StarkGate

export interface StarkNetWalletInfo {
  address: string
  connected: boolean
  balance?: string
  network: 'mainnet' | 'testnet'
  walletType: 'argent' | 'braavos' | 'webwallet'
}

export interface StarkNetTransaction {
  hash: string
  address: string
  amount: string
  status: 'pending' | 'success' | 'failed'
}

class StarkNetWalletService {
  private isConnected = false
  private currentAccount: StarkNetWalletInfo | null = null
  private network: 'mainnet' | 'testnet' = 'mainnet'
  private walletType: 'argent' | 'braavos' | 'webwallet' = 'webwallet'

  // Initialize StarkNet wallet service
  async initialize(network: 'mainnet' | 'testnet' = 'mainnet'): Promise<void> {
    try {
      if (typeof window === 'undefined') return

      this.network = network

      // Check if StarkNet wallet is available
      if (this.isStarkNetWalletAvailable()) {
        // Try to connect to existing wallet session
        await this.tryReconnect()
      }
    } catch (error) {
      // Error initializing StarkNet wallet
    }
  }

  // Check if StarkNet wallet is available
  private isStarkNetWalletAvailable(): boolean {
    // Check for common StarkNet wallet providers
    if (typeof window !== 'undefined') {
      const win = window as any
      return !!(win.starknet || win.argo?.starknet || win.braavos?.starknet)
    }
    return false
  }

  // Try to reconnect to existing wallet session
  private async tryReconnect(): Promise<void> {
    try {
      const win = window as any
      let starknet = null

      // Detect available wallet
      if (win.starknet) {
        starknet = win.starknet
        this.walletType = 'webwallet'
      } else if (win.argo?.starknet) {
        starknet = win.argo.starknet
        this.walletType = 'argent'
      } else if (win.braavos?.starknet) {
        starknet = win.braavos.starknet
        this.walletType = 'braavos'
      }

      if (starknet && starknet.isConnected) {
        const address = starknet.selectedAddress
        if (address) {
          this.currentAccount = {
            address: address,
            connected: true,
            network: this.network,
            walletType: this.walletType,
            balance: '0'
          }
          this.isConnected = true
        }
      }
    } catch (error) {
      // Error reconnecting to StarkNet wallet
    }
  }

  // Connect to StarkNet wallet
  async connect(): Promise<StarkNetWalletInfo | null> {
    try {
      if (!this.isStarkNetWalletAvailable()) {
        throw new Error('StarkNet wallet not available. Please install a StarkNet wallet extension.')
      }

      const win = window as any
      let starknet = null

      // Detect and prioritize wallet connections
      if (win.argo?.starknet) {
        starknet = win.argo.starknet
        this.walletType = 'argent'
      } else if (win.braavos?.starknet) {
        starknet = win.braavos.starknet
        this.walletType = 'braavos'
      } else if (win.starknet) {
        starknet = win.starknet
        this.walletType = 'webwallet'
      }

      if (!starknet) {
        throw new Error('No StarkNet wallet found')
      }

      // Request wallet connection
      await starknet.enable()

      if (starknet.isConnected) {
        const address = starknet.selectedAddress
        if (address) {
          this.currentAccount = {
            address: address,
            connected: true,
            network: this.network,
            walletType: this.walletType,
            balance: '0'
          }
          this.isConnected = true
          return this.currentAccount
        }
      }

      throw new Error('Failed to connect to StarkNet wallet')
    } catch (error) {
      // Error connecting to StarkNet wallet
      return null
    }
  }

  // Disconnect wallet
  async disconnect(): Promise<void> {
    try {
      const win = window as any
      let starknet = null

      // Find connected wallet
      if (win.argo?.starknet) {
        starknet = win.argo.starknet
      } else if (win.braavos?.starknet) {
        starknet = win.braavos.starknet
      } else if (win.starknet) {
        starknet = win.starknet
      }

      if (starknet && starknet.disconnect) {
        await starknet.disconnect()
      }

      this.currentAccount = null
      this.isConnected = false
    } catch (error) {
      // Error disconnecting StarkNet wallet
    }
  }

  // Get current account
  getAccount(): StarkNetWalletInfo | null {
    return this.currentAccount
  }

  // Check if wallet is connected
  isConnectedToWallet(): boolean {
    return this.isConnected && this.currentAccount !== null
  }

  // Get account address
  getAccountAddress(): string | null {
    return this.currentAccount?.address || null
  }

  // Send transaction using StarkNet wallet
  async sendTransaction(to: string, amount: string, tokenAddress?: string): Promise<string | null> {
    if (!this.isConnected || !this.currentAccount) {
      throw new Error('StarkNet wallet not connected')
    }

    try {
      const win = window as any
      let starknet = null

      // Find connected wallet
      if (win.argo?.starknet) {
        starknet = win.argo.starknet
      } else if (win.braavos?.starknet) {
        starknet = win.braavos.starknet
      } else if (win.starknet) {
        starknet = win.starknet
      }

      if (!starknet) {
        throw new Error('No StarkNet wallet found')
      }

      // Convert amount to appropriate format (wei for ETH, base units for tokens)
      const amountStr = amount.toString()

      // Transaction calls array
      const calls = []

      if (tokenAddress) {
        // Token transfer
        calls.push({
          contractAddress: tokenAddress,
          entrypoint: 'transfer',
          calldata: [to, amountStr, '0'] // recipient, amount_low, amount_high
        })
      } else {
        // ETH transfer
        calls.push({
          contractAddress: to,
          entrypoint: 'transfer',
          calldata: [amountStr]
        })
      }

      // Execute transaction
      const result = await starknet.signer.addTransaction({
        type: 'INVOKE',
        payload: calls
      })

      return result.transaction_hash || null
    } catch (error) {
      // Error sending StarkNet transaction
      return null
    }
  }

  // Get balance
  async getBalance(tokenAddress?: string): Promise<string | null> {
    if (!this.isConnected || !this.currentAccount) {
      return null
    }

    try {
      // For demo purposes, return mock balance
      // In production, you would use StarkNet RPC to fetch actual balance
      return (Math.random() * 10).toFixed(4) // Mock ETH balance
    } catch (error) {
      // Error getting StarkNet balance
      return this.currentAccount.balance || '0'
    }
  }

  // Get token balance
  async getTokenBalance(tokenAddress: string): Promise<string | null> {
    if (!this.isConnected || !this.currentAccount) {
      return null
    }

    try {
      // For demo purposes, return mock balance
      // In production, you would use StarkNet RPC to fetch actual token balance
      return (Math.random() * 1000).toFixed(2) // Mock token balance
    } catch (error) {
      // Error getting StarkNet token balance
      return '0'
    }
  }

  // Validate StarkNet address format
  validateAddress(address: string): boolean {
    // StarkNet addresses are 0x-prefixed hex
    return /^0x[a-fA-F0-9]{63,64}$/.test(address)
  }

  // Get wallet type
  getWalletType(): string {
    return 'starknet'
  }

  // Get wallet name
  getWalletName(): string {
    switch (this.walletType) {
      case 'argent':
        return 'Argent X'
      case 'braavos':
        return 'Braavos'
      default:
        return 'StarkNet Wallet'
    }
  }

  // Switch network
  async switchNetwork(network: 'mainnet' | 'testnet'): Promise<void> {
    try {
      this.network = network
      await this.disconnect()
      await this.connect()
    } catch (error) {
      // Error switching StarkNet network
    }
  }

  // Get connected wallets array for StarkGate API
  getConnectedWallets(): string[] {
    const address = this.getAccountAddress()
    return address ? [address] : []
  }

  // Get transaction history (placeholder)
  async getTransactionHistory(): Promise<StarkNetTransaction[]> {
    // Placeholder implementation
    return []
  }

  // Get transaction status (placeholder)
  async getTransactionStatus(txHash: string): Promise<string> {
    // Placeholder implementation
    return 'pending'
  }
}

export const starknetWalletService = new StarkNetWalletService()
export { StarkNetWalletService }