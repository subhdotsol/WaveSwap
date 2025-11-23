import { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  apiSidebar: [
    'api/intro',
    {
      type: 'category',
      label: 'Swap API',
      collapsed: false,
      items: [
        'api/swap/submit-swap',
        'api/swap/get-swap-status',
        'api/swap/get-swap-details',
        'api/swap/cancel-swap',
        'api/swap/get-swap-history',
      ],
    },
    {
      type: 'category',
      label: 'Quote API',
      collapsed: false,
      items: [
        'api/quote/get-quote',
        'api/quote/get-supported-tokens',
        'api/quote/validate-token-pair',
      ],
    },
    {
      type: 'category',
      label: 'WebSocket API',
      collapsed: false,
      items: [
        'api/websocket/connection',
        'api/websocket/swap-updates',
        'api/websocket/message-format',
      ],
    },
    {
      type: 'category',
      label: 'Response Codes',
      collapsed: false,
      items: [
        'api/responses/success-codes',
        'api/responses/error-codes',
        'api/responses/validation-errors',
      ],
    },
  ],
}

export default sidebars