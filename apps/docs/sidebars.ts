import { SidebarsConfig } from '@docusaurus/plugin-content-docs'

const sidebars: SidebarsConfig = {
  docsSidebar: [
    'intro',
    {
      type: 'category',
      label: 'Getting Started',
      collapsed: false,
      items: [
        'quickstart',
        'installation',
        'wallet-setup',
      ],
    },
    {
      type: 'category',
      label: 'Core Concepts',
      collapsed: false,
      items: [
        'privacy-model',
        'architecture/overview',
        'architecture/smart-contracts',
        'architecture/backend',
        'architecture/frontend',
      ],
    },
    {
      type: 'category',
      label: 'Guides',
      collapsed: false,
      items: [
        'guides/swapping',
        'guides/privacy-features',
        'guides/token-integration',
        'guides/error-handling',
      ],
    },
    {
      type: 'category',
      label: 'Development',
      collapsed: false,
      items: [
        'development/setup',
        'development/testing',
        'development/deployment',
        'development/contributing',
      ],
    },
    {
      type: 'category',
      label: 'Security',
      collapsed: false,
      items: [
        'security/overview',
        'security/audits',
        'security/bug-bounty',
        'security/responsible-disclosure',
      ],
    },
    {
      type: 'category',
      label: 'Reference',
      collapsed: false,
      items: [
        'reference/smart-contracts',
        'reference/sdk',
        'reference/configuration',
        'reference/troubleshooting',
      ],
    },
  ],
}

export default sidebars