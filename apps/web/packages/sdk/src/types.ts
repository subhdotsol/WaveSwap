// WaveSwap SDK Types

export interface Token {
  address: string
  symbol: string
  name: string
  decimals: number
  logoURI?: string
}

export interface SwapParams {
  inputMint: string
  outputMint: string
  amount: string
  slippageBps?: number
  userPublicKey: string
}

export interface SwapQuote {
  inputMint: string
  outputMint: string
  inAmount: string
  outAmount: string
  priceImpact?: string
}
