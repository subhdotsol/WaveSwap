'use client'

import { CrossChainToken } from '../../lib/services/enhancedBridgeService'

interface TokenSelectorModalProps {
  isOpen: boolean
  onClose: () => void
  onSelectToken: (token: CrossChainToken) => void
  tokens: CrossChainToken[]
  title: string
  selectedChain?: string
}

export function TokenSelectorModal({
  isOpen,
  onClose,
  onSelectToken,
  tokens,
  title,
  selectedChain
}: TokenSelectorModalProps) {
  if (!isOpen) return null

  // Filter tokens by selected chain if provided
  const filteredTokens = selectedChain
    ? tokens.filter(token => token.chain === selectedChain)
    : tokens

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div
        className="relative bg-gray-900 rounded-2xl border border-gray-700 shadow-2xl max-w-md w-full mx-4 max-h-[80vh] overflow-hidden"
        style={{ backdropFilter: 'blur(20px)' }}
      >
        {/* Header */}
        <div className="p-4 border-b border-gray-800">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-white">{title}</h2>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-white transition-colors p-1"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
          {selectedChain && (
            <div className="mt-2 text-sm text-gray-400">
              Showing tokens for {selectedChain}
            </div>
          )}
        </div>

        {/* Token List */}
        <div className="p-2 max-h-96 overflow-y-auto">
          {filteredTokens.length === 0 ? (
            <div className="p-8 text-center text-gray-400">
              <div className="mb-2">
                <svg className="w-12 h-12 mx-auto opacity-50" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
                </svg>
              </div>
              <p>No tokens available</p>
            </div>
          ) : (
            filteredTokens.map((token) => (
              <button
                key={`${token.chain}_${token.address}`}
                onClick={() => {
                  onSelectToken(token)
                  onClose()
                }}
                className="w-full p-4 rounded-xl hover:bg-gray-800 transition-colors flex items-center gap-4 text-left group"
              >
                <div className="relative flex-shrink-0">
                  {token.logoURI ? (
                    <img
                      src={token.logoURI}
                      alt={token.symbol}
                      className="w-10 h-10 rounded-full"
                      onError={(e) => {
                        const target = e.target as HTMLImageElement
                        target.style.display = 'none'
                        target.nextElementSibling?.classList.remove('hidden')
                      }}
                    />
                  ) : null}
                  <div className="w-10 h-10 bg-gray-700 rounded-full flex items-center justify-center">
                    <span className="text-white text-sm font-medium">
                      {token.symbol?.slice(0, 2)}
                    </span>
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-white font-medium text-base">{token.symbol}</div>
                  <div className="text-gray-400 text-sm mt-1 truncate">{token.name}</div>
                  <div className="flex items-center gap-2 mt-2">
                    <span className="text-xs text-gray-500">{token.chain}</span>
                    <div className="flex items-center gap-1">
                      {token.bridgeSupport.nearIntents && (
                        <div className="w-2 h-2 bg-blue-500 rounded-full" title="Near Intents Support"></div>
                      )}
                      {token.bridgeSupport.starkgate && (
                        <div className="w-2 h-2 bg-indigo-500 rounded-full" title="Starkgate Support"></div>
                      )}
                      {token.bridgeSupport.defuse && (
                        <div className="w-2 h-2 bg-green-500 rounded-full" title="Defuse Support"></div>
                      )}
                    </div>
                  </div>
                </div>
                <div className="text-gray-500 group-hover:text-gray-300 transition-colors">
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                  </svg>
                </div>
              </button>
            ))
          )}
        </div>
      </div>
    </div>
  )
}