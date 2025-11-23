import { Config } from '@docusaurus/types'
import { themes } from 'prism-react-renderer'

const config: Config = {
  title: 'WaveSwap Documentation',
  tagline: 'Privacy-preserving DEX aggregator for Solana',
  url: 'https://docs.waveswap.io',
  baseUrl: '/',
  onBrokenLinks: 'throw',
  onBrokenMarkdownLinks: 'warn',
  favicon: 'img/favicon.ico',
  organizationName: 'WaveSwap',
  projectName: 'WaveSwap',

  // Even if you don't use internalization, you can use this field to set useful
  // metadata like html lang. For example, if your site is Chinese, you may want
  // to replace "en" with "zh-Hans".
  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        docs: {
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/waveswap/waveswap/tree/main/apps/docs/',
        },
        blog: {
          showReadingTime: true,
          editUrl: 'https://github.com/waveswap/waveswap/tree/main/apps/docs/blog/',
        },
        theme: {
          customCss: './src/css/custom.css',
        },
      },
    ],
  ],

  themeConfig: {
    navbar: {
      title: 'WaveSwap',
      logo: {
        alt: 'WaveSwap Logo',
        src: 'img/logo.svg',
      },
      items: [
        {
          type: 'docSidebar',
          sidebarId: 'docsSidebar',
          position: 'left',
          label: 'Documentation',
        },
        {
          to: '/blog',
          label: 'Blog',
          position: 'left'
        },
        {
          to: '/api',
          label: 'API Reference',
          position: 'left'
        },
        {
          href: 'https://github.com/waveswap/waveswap',
          label: 'GitHub',
          position: 'right',
        },
        {
          href: 'https://app.waveswap.io',
          label: 'Launch App',
          position: 'right',
          className: 'button button--primary',
        },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            {
              label: 'Getting Started',
              to: '/docs/intro',
            },
            {
              label: 'Architecture',
              to: '/docs/architecture/overview',
            },
            {
              label: 'API Reference',
              to: '/api',
            },
          ],
        },
        {
          title: 'Community',
          items: [
            {
              label: 'Discord',
              href: 'https://discord.gg/waveswap',
            },
            {
              label: 'Twitter',
              href: 'https://twitter.com/waveswap',
            },
            {
              label: 'Telegram',
              href: 'https://t.me/waveswap',
            },
          ],
        },
        {
          title: 'More',
          items: [
            {
              label: 'Blog',
              to: '/blog',
            },
            {
              label: 'GitHub',
              href: 'https://github.com/waveswap/waveswap',
            },
          ],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} WaveSwap Team.`,
    },
    prism: {
      theme: themes.oceanicNext,
      darkTheme: themes.oceanicNext,
      additionalLanguages: ['rust', 'solidity', 'javascript', 'typescript'],
    },
  },

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'api',
        path: 'api',
        routeBasePath: 'api',
        sidebarPath: './api-sidebars.ts',
      },
    ],
  ],
}

export default config