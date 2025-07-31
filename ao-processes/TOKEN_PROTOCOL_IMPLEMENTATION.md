# Token Protocol Implementation for ZDrive NFTs

## Overview

This document explains the implementation of proper token protocol tags for ZDrive AO processes to ensure NFTs appear as collectibles in wallets like Wander/ArConnect.

## Problem Statement

The current ZDrive AO processes were not appearing as collectibles in wallets because they lacked the proper token protocol tags that wallets use to identify and index tokens/NFTs.

## Solution Implementation

### 1. Enhanced AO Process Files

All AO process files have been updated to include:

#### Token Protocol Tags Documentation
```lua
-- Token Protocol Tags (for wallet recognition)
-- These tags should be included in the spawn transaction:
-- { name: 'Variant', value: 'ao.TKN' }
-- { name: 'Type', value: 'Process' }
-- { name: 'Token-Name', value: 'ZDrive Creator Rights' }
-- { name: 'Token-Symbol', value: 'ZCR' }
-- { name: 'Token-Decimals', value: '0' }
-- { name: 'Token-Total-Supply', value: '100000' }
-- { name: 'Implements', value: 'ANS-110' }
-- { name: 'Data-Protocol', value: 'ao' }
```

#### Updated Files:
- `creator-nft-process.lua` - Creator distribution rights
- `premium-access-nft-process.lua` - Permanent viewing rights  
- `basic-access-nft-process.lua` - Time-limited viewing rights
- `access-control-process.lua` - Access verification

### 2. Enhanced Deployment Script

The `deploy.js` script has been updated to include token protocol tags:

```javascript
const TOKEN_PROTOCOL_TAGS = {
  creator: [
    { name: 'Variant', value: 'ao.TKN' },
    { name: 'Type', value: 'Process' },
    { name: 'Token-Name', value: 'ZDrive Creator Rights' },
    { name: 'Token-Symbol', value: 'ZCR' },
    { name: 'Token-Decimals', value: '0' },
    { name: 'Token-Total-Supply', value: '100000' },
    { name: 'Implements', value: 'ANS-110' },
    { name: 'Data-Protocol', value: 'ao' },
    { name: 'App-Name', value: 'AO-NFT' },
    { name: 'Description', value: 'Creator distribution rights for ZDrive video platform' }
  ],
  // ... similar for other process types
};
```

### 3. Manual Deployment Guide

Updated `MANUAL_DEPLOYMENT.md` with proper deployment commands including token protocol tags.

## Required Token Protocol Tags

### Core Tags (Required for Wallet Recognition)
- `Variant: ao.TKN` - Identifies as AO token
- `Type: Process` - Identifies as AO process
- `Token-Name` - Human-readable token name
- `Token-Symbol` - Short token symbol
- `Token-Decimals: 0` - For NFTs (non-divisible)
- `Token-Total-Supply` - Maximum supply
- `Implements: ANS-110` - ANS-110 standard compliance
- `Data-Protocol: ao` - AO protocol identifier

### Additional Tags (Enhanced UX)
- `App-Name: AO-NFT` - Application identifier
- `Description` - Token description
- `Logo` - Token logo URL (optional)

## Deployment Commands

### Creator NFT Process
```bash
aos creator-nft-process.lua \
  --tag "Variant" "ao.TKN" \
  --tag "Type" "Process" \
  --tag "Token-Name" "ZDrive Creator Rights" \
  --tag "Token-Symbol" "ZCR" \
  --tag "Token-Decimals" "0" \
  --tag "Token-Total-Supply" "100000" \
  --tag "Implements" "ANS-110" \
  --tag "Data-Protocol" "ao" \
  --tag "App-Name" "AO-NFT" \
  --tag "Description" "Creator distribution rights for ZDrive video platform"
```

### Premium Access NFT Process
```bash
aos premium-access-nft-process.lua \
  --tag "Variant" "ao.TKN" \
  --tag "Type" "Process" \
  --tag "Token-Name" "ZDrive Premium Access" \
  --tag "Token-Symbol" "ZPA" \
  --tag "Token-Decimals" "0" \
  --tag "Token-Total-Supply" "1000000" \
  --tag "Implements" "ANS-110" \
  --tag "Data-Protocol" "ao" \
  --tag "App-Name" "AO-NFT" \
  --tag "Description" "Permanent video viewing rights on ZDrive"
```

### Basic Access NFT Process
```bash
aos basic-access-nft-process.lua \
  --tag "Variant" "ao.TKN" \
  --tag "Type" "Process" \
  --tag "Token-Name" "ZDrive Basic Access" \
  --tag "Token-Symbol" "ZBA" \
  --tag "Token-Decimals" "0" \
  --tag "Token-Total-Supply" "1000000" \
  --tag "Implements" "ANS-110" \
  --tag "Data-Protocol" "ao" \
  --tag "App-Name" "AO-NFT" \
  --tag "Description" "Time-limited video viewing rights on ZDrive"
```

## Expected Results

### Before Implementation
- ❌ NFTs not appearing in wallet collectibles
- ❌ No wallet recognition of AO processes as tokens
- ❌ Limited discoverability in marketplaces

### After Implementation
- ✅ NFTs appear as collectibles in Wander/ArConnect
- ✅ Proper token metadata and symbols
- ✅ ANS-110 compliance for marketplace integration
- ✅ Enhanced user experience with wallet integration

## Verification Steps

### 1. Deploy with Token Protocol Tags
Use the updated deployment commands or script.

### 2. Check Wallet Display
1. Open Wander/ArConnect wallet
2. Navigate to Collectibles section
3. Look for tokens with names like:
   - "ZDrive Creator Rights" (ZCR)
   - "ZDrive Premium Access" (ZPA)
   - "ZDrive Basic Access" (ZBA)

### 3. Test Token Functions
```bash
# Test info endpoint
aos --dryrun --process <PROCESS_ID> --tag "Action" "Info"

# Test balance endpoint
aos --dryrun --process <PROCESS_ID> --tag "Action" "Balance" --tag "Target" <ADDRESS>
```

## Key Benefits

### 1. Wallet Compatibility
- NFTs now appear in wallet collectibles sections
- Proper token names and symbols for easy identification
- Standard token interface for transfers and management

### 2. Marketplace Integration
- ANS-110 compliance enables marketplace listing
- Proper metadata structure for discovery
- Standard token protocol for interoperability

### 3. Enhanced User Experience
- Users can see their NFTs in familiar wallet interface
- Clear token identification and management
- Standard token operations (transfer, view, etc.)

### 4. Developer Benefits
- Follows established AO token standards
- Compatible with existing AO tooling
- Future-proof for additional wallet integrations

## Next Steps

### Immediate Actions
1. **Deploy updated processes** with token protocol tags
2. **Update frontend configuration** with new process IDs
3. **Test wallet display** in Wander/ArConnect
4. **Verify token functions** work correctly

### Future Enhancements
1. **Add logo URLs** to token metadata
2. **Implement royalty distribution** via token protocol
3. **Add marketplace integration** using ANS-110 metadata
4. **Enhance token metadata** with additional attributes

## Troubleshooting

### NFTs Still Not Appearing
1. **Verify token protocol tags** are present in spawn transaction
2. **Check wallet sync** - may take time to index new tokens
3. **Verify process deployment** using dryrun tests
4. **Check ANS-110 compliance** of token metadata

### Deployment Issues
1. **Ensure AOS CLI** is up to date
2. **Verify wallet connection** and AR balance
3. **Check tag syntax** in deployment commands
4. **Review error messages** for specific issues

## Conclusion

This implementation provides the foundation for proper wallet recognition of ZDrive NFTs. The token protocol tags ensure that wallets can identify and display the NFTs as collectibles, while the ANS-110 compliance enables marketplace integration and enhanced discoverability.

The key is deploying the AO processes with the proper token protocol tags, which tells wallets that these processes are tokens/NFTs that should be displayed in the collectibles section. 