#!/usr/bin/env node

// Test script to verify Jupiter Token API V2 integration
const { enrichTokenIcons } = require('./src/lib/tokens.ts');

// Test tokens from COMMON_TOKENS
const testTokens = [
  {
    address: 'So11111111111111111111111111111111111111112',
    chainId: 101,
    decimals: 9,
    name: 'Solana',
    symbol: 'SOL',
    logoURI: '',
    tags: ['native', 'solana'],
    isConfidentialSupported: true,
    isNative: true,
    addressable: true,
  },
  {
    address: 'EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v',
    chainId: 101,
    decimals: 6,
    name: 'USDC',
    symbol: 'USDC',
    logoURI: '',
    tags: ['stablecoin'],
    isConfidentialSupported: true,
    isNative: false,
    addressable: true,
  }
];

async function testJupiterIntegration() {
  console.log('🚀 Testing Jupiter Token API V2 integration...');

  try {
    const enrichedTokens = await enrichTokenIcons(testTokens);

    console.log('✅ Successfully enriched tokens with icons:');
    enrichedTokens.forEach((token, index) => {
      console.log(`\n${index + 1}. ${token.symbol} (${token.name})`);
      console.log(`   Address: ${token.address}`);
      console.log(`   Logo URI: ${token.logoURI}`);
      console.log(`   Has Icon: ${!!token.logoURI}`);
    });

    // Check if tokens have proper Jupiter icon URLs
    const hasJupiterIcons = enrichedTokens.some(token =>
      token.logoURI && token.logoURI.includes('jup.ag')
    );

    if (hasJupiterIcons) {
      console.log('\n✅ SUCCESS: Jupiter Token API V2 integration is working!');
    } else {
      console.log('\n⚠️  WARNING: No Jupiter icons found. Checking API response...');
    }

  } catch (error) {
    console.error('❌ Error testing Jupiter integration:', error.message);
  }
}

testJupiterIntegration();