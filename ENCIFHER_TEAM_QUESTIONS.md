# Questions for Encifher Team

## Integration Questions

### 1. **Required Transaction Flow**
Based on the SDK documentation, it appears that private swaps require this specific flow:
```
Public Token → getDepositTxn → Private Pool → getSwapTxn → executeSwapTxn → getWithdrawTxn → Public Token
```

**Question**: Is this deposit → swap → withdraw flow mandatory for all private swaps, or can users swap directly from private balances if they already have private tokens?

### 2. **Private Token Creation**
The documentation mentions deposits create "private pool tokens" but doesn't specify if these are:
- Wrapped confidential tokens (e.g., cUSDC, cSOL)
- Internal ledger balances within Encifher's system
- Something else?

**Question**: Does the SDK create wrapped confidential tokens (cUSDC, cSOL) that users hold in their wallets, or are these private balances managed internally by Encifher?

### 3. **Pre-requisites for Private Swaps**
**Question**: What are the exact pre-requisites for a user to perform a private swap?
- Must they always deposit public tokens first?
- Can they use existing private balances?
- Is there a minimum private balance requirement?

### 4. **API Parameter Clarification**
**getWithdrawTxn Parameter Mismatch**:
- **SDK Docs show**: `getWithdrawTxn(withdrawParams)` - no connection parameter
- **Type definitions may require**: connection parameter for transaction construction

**Question**: What are the exact required parameters for `getWithdrawTxn`?

### 5. **Connection Parameter Requirements**
**Question**: Which methods require the Solana `Connection` object to be passed explicitly?
- `getDepositTxn` - requires connection for transaction fees?
- `getWithdrawTxn` - requires connection for token accounts?
- `getSwapTxn` - requires connection for...?
- `executeSwapTxn` - requires connection for...?

### 6. **Balance Queries**
The SDK shows `getBalance` requires message signing with `nacl.sign.detached()`.

**Question**: Is this message signing required every time a user wants to check their private balance, or can we cache the signature for a period of time?

### 7. **Order Status Polling**
**Question**: What is the typical completion time for private swaps, and is there a recommended polling interval? The example shows 3-second intervals with 40 max tries (2 minutes total).

### 8. **Error Scenarios**
**Question**: What happens if:
- A deposit transaction succeeds but the swap fails?
- A user tries to withdraw more than their private balance?
- The swap execution times out?

### 9. **Token Support**
**Question**:
- How do we check which tokens are supported for private operations?
- Is there an endpoint or method to get supported token lists?
- Are there different token pools for different tokens?

### 10. **Configuration**
**Question**:
- Is `encifherKey` the same as `SDK_KEY` in the documentation?
- Are there different API endpoints for mainnet vs devnet?
- What's the recommended RPC URL for optimal performance?

## Technical Implementation Questions

### 11. **CORS and API Endpoints**
**Question**: Are the CORS restrictions on `authority.encrypt.trade` intentional, or should we be calling these from the backend only?

### 12. **Transaction Fees**
**Question**:
- Who pays the Solana transaction fees for deposit/withdrawal/swap operations?
- Are there additional Encifher protocol fees beyond Solana fees?
- How are fees calculated for private swaps?

### 13. **Privacy Model**
**Question**:
- What information is visible on-chain vs kept private?
- Are the deposit/withdrawal transactions visible on-chain?
- How much privacy is actually provided for the swap itself?

## Current Integration Status

We have implemented:
- ✅ SDK initialization with proper configuration
- ✅ All SDK method wrappers with proper TypeScript types
- ✅ CORS proxy for API calls
- ✅ Error handling and retry logic
- ✅ Integration with existing DEX aggregator UI

**Priority Questions**: #1, #2, #3, #4 (these block our core functionality)