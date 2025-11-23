// WaveSwap SDK - Main entry point

export interface WaveSwapConfig {
  rpcUrl: string
  programId?: string
}

export class WaveSwapSDK {
  private config: WaveSwapConfig

  constructor(config: WaveSwapConfig) {
    this.config = config
  }

  getConfig(): WaveSwapConfig {
    return this.config
  }
}

export * from './types'
